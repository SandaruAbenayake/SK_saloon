const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const { authenticate, authorizeOwner } = require('../middleware/auth');

const router = express.Router();

// All owner routes require authentication + owner role
router.use(authenticate, authorizeOwner);

// ---------- DAILY SCHEDULE ----------

// PUT /api/owner/schedule/:dayOfWeek
router.put(
  '/schedule/:dayOfWeek',
  [
    body('openTime').matches(/^\d{2}:\d{2}$/).withMessage('Valid open time (HH:MM) required'),
    body('closeTime').matches(/^\d{2}:\d{2}$/).withMessage('Valid close time (HH:MM) required'),
    body('isOpen').isBoolean().withMessage('isOpen must be boolean'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const dayOfWeek = parseInt(req.params.dayOfWeek, 10);
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Day of week must be 0-6' });
    }

    const { openTime, closeTime, isOpen } = req.body;

    try {
      await pool.query(
        `INSERT INTO daily_schedules (day_of_week, open_time, close_time, is_open)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE open_time = VALUES(open_time), close_time = VALUES(close_time), is_open = VALUES(is_open)`,
        [dayOfWeek, openTime + ':00', closeTime + ':00', isOpen ? 1 : 0]
      );
      res.json({ message: 'Schedule updated' });
    } catch (err) {
      console.error('Update schedule error:', err);
      res.status(500).json({ error: 'Failed to update schedule' });
    }
  }
);

// ---------- BREAKS ----------

// GET /api/owner/breaks
router.get('/breaks', async (req, res) => {
  try {
    const [breaks] = await pool.query('SELECT * FROM breaks ORDER BY day_of_week, start_time');
    res.json({ breaks });
  } catch (err) {
    console.error('Fetch breaks error:', err);
    res.status(500).json({ error: 'Failed to fetch breaks' });
  }
});

// POST /api/owner/breaks
router.post(
  '/breaks',
  [
    body('dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('Day of week must be 0-6'),
    body('breakType').isIn(['lunch', 'tea', 'other']).withMessage('Invalid break type'),
    body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Valid start time required'),
    body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('Valid end time required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { dayOfWeek, breakType, startTime, endTime, label } = req.body;

    try {
      const [result] = await pool.query(
        'INSERT INTO breaks (day_of_week, break_type, start_time, end_time, label) VALUES (?, ?, ?, ?, ?)',
        [dayOfWeek, breakType, startTime + ':00', endTime + ':00', label || null]
      );
      res.status(201).json({ message: 'Break added', breakId: result.insertId });
    } catch (err) {
      console.error('Add break error:', err);
      res.status(500).json({ error: 'Failed to add break' });
    }
  }
);

// DELETE /api/owner/breaks/:id
router.delete('/breaks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM breaks WHERE id = ?', [req.params.id]);
    res.json({ message: 'Break removed' });
  } catch (err) {
    console.error('Delete break error:', err);
    res.status(500).json({ error: 'Failed to remove break' });
  }
});

// ---------- CLOSED DATES ----------

// POST /api/owner/closed-dates
router.post(
  '/closed-dates',
  [
    body('date').isDate().withMessage('Valid date required'),
    body('reason').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, reason } = req.body;

    try {
      await pool.query(
        'INSERT INTO closed_dates (closed_date, reason) VALUES (?, ?)',
        [date, reason || null]
      );
      res.status(201).json({ message: 'Closed date added' });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Date already marked as closed' });
      }
      console.error('Add closed date error:', err);
      res.status(500).json({ error: 'Failed to add closed date' });
    }
  }
);

// DELETE /api/owner/closed-dates/:id
router.delete('/closed-dates/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM closed_dates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Closed date removed' });
  } catch (err) {
    console.error('Delete closed date error:', err);
    res.status(500).json({ error: 'Failed to remove closed date' });
  }
});

// ---------- ALL BOOKINGS (Owner View) ----------

// GET /api/owner/bookings?date=YYYY-MM-DD
router.get('/bookings', async (req, res) => {
  try {
    let query = `
      SELECT b.*, s.name as service_name, s.duration_minutes, s.price,
             u.name as customer_name, u.phone as customer_phone, u.email as customer_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.customer_id = u.id
    `;
    const params = [];

    if (req.query.date) {
      query += ' WHERE b.booking_date = ?';
      params.push(req.query.date);
    }

    query += ' ORDER BY b.booking_date DESC, b.start_time ASC';

    const [bookings] = await pool.query(query, params);
    res.json({ bookings });
  } catch (err) {
    console.error('Fetch owner bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// PUT /api/owner/bookings/:id/approve
router.put('/bookings/:id/approve', async (req, res) => {
  try {
    const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bookings can be approved' });
    }
    await pool.query("UPDATE bookings SET status = 'approved' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking approved!' });
  } catch (err) {
    console.error('Approve booking error:', err);
    res.status(500).json({ error: 'Failed to approve booking' });
  }
});

// PUT /api/owner/bookings/:id/reject
router.put('/bookings/:id/reject', async (req, res) => {
  try {
    const [booking] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (booking.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking[0].status !== 'pending') {
      return res.status(400).json({ error: 'Only pending bookings can be rejected' });
    }
    await pool.query("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking rejected!' });
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({ error: 'Failed to reject booking' });
  }
});

// PUT /api/owner/bookings/:id/complete
router.put('/bookings/:id/complete', async (req, res) => {
  try {
    await pool.query("UPDATE bookings SET status = 'completed' WHERE id = ?", [req.params.id]);
    res.json({ message: 'Booking marked as completed' });
  } catch (err) {
    console.error('Complete booking error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ---------- SERVICES MANAGEMENT ----------

// POST /api/owner/services
router.post(
  '/services',
  [
    body('name').trim().notEmpty().withMessage('Service name required'),
    body('durationMinutes').isInt({ min: 10 }).withMessage('Duration must be at least 10 minutes'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be non-negative'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, durationMinutes, price, description } = req.body;

    try {
      const [result] = await pool.query(
        'INSERT INTO services (name, duration_minutes, price, description) VALUES (?, ?, ?, ?)',
        [name, durationMinutes, price, description || null]
      );
      res.status(201).json({ message: 'Service added', serviceId: result.insertId });
    } catch (err) {
      console.error('Add service error:', err);
      res.status(500).json({ error: 'Failed to add service' });
    }
  }
);

// PUT /api/owner/services/:id
router.put('/services/:id', async (req, res) => {
  const { name, durationMinutes, price, description, isActive } = req.body;

  try {
    await pool.query(
      'UPDATE services SET name = ?, duration_minutes = ?, price = ?, description = ?, is_active = ? WHERE id = ?',
      [name, durationMinutes, price, description || null, isActive ? 1 : 0, req.params.id]
    );
    res.json({ message: 'Service updated' });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ error: 'Failed to update service' });
  }
});

module.exports = router;
