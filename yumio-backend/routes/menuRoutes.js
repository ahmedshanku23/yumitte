
const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/schedules', async (req, res) => {
  try { const [rows] = await pool.query('SELECT category, start_time, end_time, is_all_day, is_active FROM menu_schedules ORDER BY schedule_id'); res.json({ success: true, data: rows }); }
  catch (error) { console.error('Schedule API error:', error.message); res.status(500).json({ success: false, message: 'Unable to retrieve serving hours' }); }
});

router.get('/', async (req, res) => {
  try {
    const [items] = await pool.query(`
      SELECT item_id, item_name, description,
             category, price, is_available, image_url
      FROM menu_items
      WHERE is_available = 1
      ORDER BY category, item_name
    `);

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Menu API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve menu items'
    });
  }
});

module.exports = router;
