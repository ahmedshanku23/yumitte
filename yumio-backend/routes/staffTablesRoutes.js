const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/authMiddleware');
const router = express.Router();


router.get('/tables', requireRole('staff', 'admin'), async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.table_id, t.table_number, t.status,
             r.reservation_id, r.status AS reservation_status, r.guest_count AS current_guests,
             CASE WHEN r.reservation_id IS NULL THEN NULL ELSE
               COALESCE((SELECT SUM(o.total_amount) FROM orders o
                 WHERE o.reservation_id = r.reservation_id AND o.status <> 'cancelled'),0)
               - COALESCE((SELECT SUM(p.amount) FROM payments p
                 WHERE p.reservation_id = r.reservation_id AND p.payment_status = 'completed'),0)
             END AS remaining_balance
      FROM restaurant_tables t
      LEFT JOIN reservations r ON r.reservation_id = (
        SELECT r2.reservation_id FROM reservations r2
        WHERE r2.table_id = t.table_id
          AND r2.status IN ('checked_in','dining_done')
        ORDER BY r2.reservation_id DESC LIMIT 1
      )
      ORDER BY t.table_number
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Staff table list:', error.message);
    res.status(500).json({ success: false, message: 'Unable to retrieve staff tables' });
  }
});
module.exports = router;
