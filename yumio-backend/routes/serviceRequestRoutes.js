const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/authMiddleware');
const router = express.Router();

const rowSql = `SELECT sr.request_id, sr.reservation_id, sr.customer_id, sr.table_id, rt.table_number, sr.request_type, sr.status, sr.created_at, sr.completed_at, u.full_name AS customer_name FROM service_requests sr JOIN users u ON u.user_id = sr.customer_id JOIN restaurant_tables rt ON rt.table_id = sr.table_id`;

router.get('/', requireRole('staff', 'admin'), async (req, res) => {
    try {
        const [rows] = await pool.execute(`${rowSql} ORDER BY sr.created_at DESC, sr.request_id DESC LIMIT 500`);
        return res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Service request listing error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load service requests' });
    }
});

router.post('/', requireRole('customer'), async (req, res) => {
    const type = String(req.body?.type || '').trim();
    if (!['Water', 'Cutlery', 'Call Staff', 'Other'].includes(type)) {
        return res.status(400).json({ success: false, message: 'Invalid request type' });
    }
    try {
        const [active] = await pool.execute(`SELECT r.reservation_id, r.table_id FROM reservations r WHERE r.customer_id = ? AND r.status = 'checked_in' AND r.table_id IS NOT NULL ORDER BY r.checked_in_at DESC LIMIT 1`, [req.session.user.id]);
        if (!active.length) return res.status(409).json({ success: false, message: 'Check in before requesting service' });
        const reservation = active[0];
        const [result] = await pool.execute(`INSERT INTO service_requests (reservation_id, customer_id, table_id, request_type, status) VALUES (?, ?, ?, ?, 'pending')`, [reservation.reservation_id, req.session.user.id, reservation.table_id, type]);
        return res.status(201).json({ success: true, request_id: result.insertId, type, message: 'Service request sent' });
    } catch (error) {
        console.error('Service request creation error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to send service request' });
    }
});

router.patch('/:id/complete', requireRole('staff', 'admin'), async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid service request ID' });
    try {
        const [result] = await pool.execute(`UPDATE service_requests SET status = 'completed', completed_at = UTC_TIMESTAMP() WHERE request_id = ? AND status = 'pending'`, [id]);
        if (!result.affectedRows) return res.status(409).json({ success: false, message: 'Request is not pending or does not exist' });
        return res.json({ success: true, message: 'Service request completed' });
    } catch (error) {
        console.error('Service request completion error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to complete service request' });
    }
});

module.exports = router;
