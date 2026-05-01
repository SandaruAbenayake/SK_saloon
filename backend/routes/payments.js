const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateSlot, minutesToTime } = require('../utils/slotValidation');

const router = express.Router();

function createSecureId(prefix) {
  return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
}

function normalizeTime(time) {
  return time.length === 5 ? `${time}:00` : time;
}

function calculateEndTime(startTime, durationMinutes) {
  const normalizedStart = normalizeTime(startTime);
  const [hours, minutes] = normalizedStart.split(':').map(Number);
  return minutesToTime(hours * 60 + minutes + durationMinutes);
}

function validateWebhookToken(payment, webhookToken) {
  // timingSafeEqual avoids leaking which token characters were correct.
  const stored = Buffer.from(payment.webhook_token);
  const received = Buffer.from(webhookToken || '');
  return stored.length === received.length && crypto.timingSafeEqual(stored, received);
}

async function confirmMockPayment({ sessionId, status, webhookToken, rawEvent }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [payments] = await connection.query(
      'SELECT * FROM payments WHERE session_id = ? FOR UPDATE',
      [sessionId]
    );

    if (payments.length === 0) {
      await connection.rollback();
      return { statusCode: 404, body: { error: 'Payment session not found' } };
    }

    const payment = payments[0];
    if (!validateWebhookToken(payment, webhookToken)) {
      await connection.rollback();
      return { statusCode: 401, body: { error: 'Invalid webhook token' } };
    }

    // Webhooks can be retried, so successful confirmation is intentionally idempotent.
    if (payment.status === 'paid') {
      await connection.commit();
      return {
        statusCode: 200,
        body: {
          message: 'Payment already confirmed',
          bookingId: payment.booking_id,
          paymentStatus: payment.status,
        },
      };
    }

    await connection.query(
      `UPDATE payments
       SET status = ?,
           confirmed_at = CASE WHEN ? = 'paid' THEN NOW() ELSE confirmed_at END,
           raw_event = ?
       WHERE id = ?`,
      [status, status, JSON.stringify(rawEvent), payment.id]
    );

    await connection.query(
      `UPDATE bookings
       SET payment_status = ?,
           payment_confirmed_at = CASE WHEN ? = 'paid' THEN NOW() ELSE payment_confirmed_at END
       WHERE id = ?`,
      [status, status, payment.booking_id]
    );

    await connection.commit();

    return {
      statusCode: 200,
      body: {
        message: status === 'paid' ? 'Mock payment confirmed' : 'Mock payment failed',
        bookingId: payment.booking_id,
        paymentStatus: status,
      },
    };
  } catch (err) {
    await connection.rollback();
    console.error('Mock payment confirmation error:', err);
    return { statusCode: 500, body: { error: 'Webhook processing failed' } };
  } finally {
    connection.release();
  }
}

// POST /api/payments/create-session
// Creates a booking hold and a mock payment session. The amount always comes from the DB.
router.post(
  '/create-session',
  authenticate,
  [
    body('date').isDate().withMessage('Valid date required'),
    body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Valid start time required'),
    body('serviceId').isInt({ min: 1 }).withMessage('Valid service ID required'),
    body('notes').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, startTime, serviceId, notes } = req.body;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [services] = await connection.query(
        'SELECT * FROM services WHERE id = ? AND is_active = 1',
        [serviceId]
      );
      if (services.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Service not found' });
      }

      const service = services[0];
      const validation = await validateSlot(date, startTime, service.duration_minutes);
      if (!validation.available) {
        await connection.rollback();
        return res.status(409).json({ error: 'Slot unavailable', reason: validation.reason });
      }

      const sessionId = createSecureId('mockpay');
      const webhookToken = createSecureId('whsec');
      const normalizedStart = normalizeTime(startTime);
      const endTime = calculateEndTime(startTime, service.duration_minutes);

      const [bookingResult] = await connection.query(
        `INSERT INTO bookings
         (customer_id, service_id, booking_date, start_time, end_time, status,
          payment_status, payment_session_id, notes)
         VALUES (?, ?, ?, ?, ?, 'pending', 'pending', ?, ?)`,
        [req.user.id, serviceId, date, normalizedStart, endTime, sessionId, notes || null]
      );

      const bookingId = bookingResult.insertId;
      await connection.query(
        `INSERT INTO payments
         (booking_id, session_id, amount, currency, status, webhook_token)
         VALUES (?, ?, ?, 'LKR', 'pending', ?)`,
        [bookingId, sessionId, service.price, webhookToken]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Mock payment session created',
        booking: {
          id: bookingId,
          status: 'pending',
          paymentStatus: 'pending',
        },
        payment: {
          sessionId,
          amount: service.price,
          currency: 'LKR',
          status: 'pending',
        },
        // Learning-only helper: a real webhook secret must never be exposed to a browser.
        // The frontend API client already uses /api as its base URL, so keep this relative.
        mockWebhook: {
          url: '/payments/mock-webhook',
          body: {
            sessionId,
            status: 'paid',
            webhookToken,
          },
        },
      });
    } catch (err) {
      await connection.rollback();
      console.error('Create mock payment session error:', err);
      res.status(500).json({ error: 'Failed to create payment session' });
    } finally {
      connection.release();
    }
  }
);

// POST /api/payments/mock-webhook
// Simulates a payment-provider callback. It validates a backend-generated token first.
router.post(
  '/mock-webhook',
  [
    body('sessionId').notEmpty().withMessage('sessionId is required'),
    body('status').isIn(['paid', 'failed']).withMessage('status must be paid or failed'),
    body('webhookToken').notEmpty().withMessage('webhookToken is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await confirmMockPayment({
      sessionId: req.body.sessionId,
      status: req.body.status,
      webhookToken: req.body.webhookToken,
      rawEvent: req.body,
    });

    res.status(result.statusCode).json(result.body);
  }
);

// GET /api/payments/session/:sessionId
// Lets the frontend poll the backend for current payment/booking state.
router.get('/session/:sessionId', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.session_id, p.amount, p.currency, p.status AS payment_status,
              b.id AS booking_id, b.status AS booking_status, b.customer_id
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE p.session_id = ?`,
      [req.params.sessionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const session = rows[0];
    if (req.user.role !== 'owner' && session.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this payment session' });
    }

    res.json({
      sessionId: session.session_id,
      amount: session.amount,
      currency: session.currency,
      paymentStatus: session.payment_status,
      bookingId: session.booking_id,
      bookingStatus: session.booking_status,
    });
  } catch (err) {
    console.error('Fetch payment session error:', err);
    res.status(500).json({ error: 'Failed to fetch payment session' });
  }
});

module.exports = router;
