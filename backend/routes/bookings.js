const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { validateSlot, getAvailableSlots, minutesToTime } = require('../utils/slotValidation');

const router = express.Router();

// GET /api/bookings/available-slots?date=YYYY-MM-DD&serviceId=N
router.get('/available-slots', async (req, res) => {
  const { date, serviceId } = req.query;
  if (!date || !serviceId) {
    return res.status(400).json({ error: 'date and serviceId are required' });
  }

  try {
    const [services] = await pool.query('SELECT * FROM services WHERE id = ?', [serviceId]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const slots = await getAvailableSlots(date, services[0].duration_minutes);
    res.json({ date, service: services[0], slots });
  } catch (err) {
    console.error('Available slots error:', err);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

// POST /api/bookings/validate — real-time slot validation (no auth required for UX)
router.post(
  '/validate',
  [
    body('date').isDate().withMessage('Valid date required'),
    body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Valid start time required (HH:MM)'),
    body('serviceId').isInt({ min: 1 }).withMessage('Valid service ID required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, startTime, serviceId } = req.body;

    try {
      const [services] = await pool.query('SELECT * FROM services WHERE id = ?', [serviceId]);
      if (services.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const result = await validateSlot(date, startTime, services[0].duration_minutes);
      res.json(result);
    } catch (err) {
      console.error('Validate slot error:', err);
      res.status(500).json({ error: 'Validation failed' });
    }
  }
);

// POST /api/bookings — create a booking (authenticated customer)
router.post(
  '/',
  authenticate,
  [
    body('date').isDate().withMessage('Valid date required'),
    body('startTime').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Valid start time required (HH:MM)'),
    body('serviceId').isInt({ min: 1 }).withMessage('Valid service ID required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, startTime, serviceId, notes } = req.body;

    try {
      // Fetch service
      const [services] = await pool.query('SELECT * FROM services WHERE id = ?', [serviceId]);
      if (services.length === 0) {
        return res.status(404).json({ error: 'Service not found' });
      }

      const service = services[0];

      // Final validation before booking
      const validation = await validateSlot(date, startTime, service.duration_minutes);
      if (!validation.available) {
        return res.status(409).json({
          error: 'Slot unavailable',
          reason: validation.reason,
        });
      }

      // Calculate end time
      const normalizedStart = startTime.length === 5 ? startTime + ':00' : startTime;
      const startParts = normalizedStart.split(':');
      const startMinutes = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
      const endTime = minutesToTime(startMinutes + service.duration_minutes);

      // Insert booking
      const [result] = await pool.query(
        `INSERT INTO bookings (customer_id, service_id, booking_date, start_time, end_time, status, notes)
         VALUES (?, ?, ?, ?, ?, 'confirmed', ?)`,
        [req.user.id, serviceId, date, normalizedStart, endTime, notes || null]
      );

      res.status(201).json({
        message: 'Booking confirmed!',
        booking: {
          id: result.insertId,
          date,
          startTime: normalizedStart.slice(0, 5),
          endTime: endTime.slice(0, 5),
          service: service.name,
          duration: service.duration_minutes,
          status: 'confirmed',
        },
      });
    } catch (err) {
      console.error('Create booking error:', err);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
);

// GET /api/bookings/my — customer's own bookings
router.get('/my', authenticate, async (req, res) => {
  try {
    const [bookings] = await pool.query(
      `SELECT b.*, s.name as service_name, s.duration_minutes, s.price
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.customer_id = ?
       ORDER BY b.booking_date DESC, b.start_time DESC`,
      [req.user.id]
    );
    res.json({ bookings });
  } catch (err) {
    console.error('Fetch bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PUT /api/bookings/:id/cancel — cancel a booking
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const [bookings] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    // Customers can only cancel their own bookings; owner can cancel any
    if (req.user.role !== 'owner' && booking.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
});

module.exports = router;
