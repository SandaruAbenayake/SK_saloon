const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/schedule — get full weekly schedule + breaks
router.get('/', async (req, res) => {
  try {
    const [schedules] = await pool.query('SELECT * FROM daily_schedules ORDER BY day_of_week');
    const [breaks] = await pool.query('SELECT * FROM breaks ORDER BY day_of_week, start_time');
    const [closedDates] = await pool.query('SELECT * FROM closed_dates ORDER BY closed_date');
    res.json({ schedules, breaks, closedDates });
  } catch (err) {
    console.error('Fetch schedule error:', err);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

// GET /api/schedule/closed-dates
router.get('/closed-dates', async (req, res) => {
  try {
    const [closedDates] = await pool.query('SELECT * FROM closed_dates ORDER BY closed_date');
    res.json({ closedDates });
  } catch (err) {
    console.error('Fetch closed dates error:', err);
    res.status(500).json({ error: 'Failed to fetch closed dates' });
  }
});

module.exports = router;
