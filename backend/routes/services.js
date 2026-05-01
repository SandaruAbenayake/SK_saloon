const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// GET /api/services — list active services
router.get('/', async (req, res) => {
  try {
    const [services] = await pool.query(
      'SELECT * FROM services WHERE is_active = 1 ORDER BY duration_minutes'
    );
    res.json({ services });
  } catch (err) {
    console.error('Fetch services error:', err);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  try {
    const [services] = await pool.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json({ service: services[0] });
  } catch (err) {
    console.error('Fetch service error:', err);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
});


module.exports = router;
