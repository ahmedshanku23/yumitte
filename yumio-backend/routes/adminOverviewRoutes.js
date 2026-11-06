const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/overview', requireRole('admin'), async (req, res) => {
    try {
        const [[customersCount], [pendingCount], [ordersCount], [paymentsTotal], [activeCount], [customers], [servicePending], [serviceTotal], [serviceRows]] = await Promise.all([
            pool.execute("SELECT COUNT(*) AS total FROM users WHERE role = 'customer'"),
            pool.execute("SELECT COUNT(*) AS total FROM reservations WHERE status = 'pending'"),
            pool.execute('SELECT COUNT(*) AS total FROM orders'),
            pool.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'completed' AND payment_type IN ('deposit', 'final')"),
            pool.execute("SELECT COUNT(*) AS total FROM orders WHERE status IN ('received', 'accepted', 'preparing', 'ready')"),
            pool.execute("SELECT user_id, full_name, email FROM users WHERE role = 'customer' ORDER BY user_id DESC LIMIT 200"),
            pool.execute("SELECT COUNT(*) AS total FROM service_requests WHERE status = 'pending'"),
            pool.execute("SELECT COUNT(*) AS total FROM service_requests"),
            pool.execute("SELECT sr.request_id, sr.request_type, sr.status, sr.created_at, rt.table_number FROM service_requests sr JOIN restaurant_tables rt ON rt.table_id = sr.table_id ORDER BY sr.created_at DESC, sr.request_id DESC LIMIT 200")
        ]);
        res.set('Cache-Control', 'no-store');
        res.json({
            success: true,
            registered_customers: Number(customersCount[0].total),
            pending_reservations: Number(pendingCount[0].total),
            total_orders: Number(ordersCount[0].total),
            completed_payments_total: Number(paymentsTotal[0].total).toFixed(2),
            active_kitchen_orders: Number(activeCount[0].total),
            pending_service_requests: Number(servicePending[0].total),
            total_service_requests: Number(serviceTotal[0].total),
            service_requests: serviceRows,
            customers
        });
    } catch (error) {
        console.error('Admin overview error:', error.message);
        res.status(500).json({ success: false, message: 'Unable to load Admin statistics' });
    }
});


router.get('/history', requireRole('admin'), async (_req, res) => {
    try {
        const [[reservations], [orders], [payments]] = await Promise.all([
            pool.execute(`SELECT r.reservation_id, r.status, r.guest_count, DATE_FORMAT(r.reservation_date,'%Y-%m-%d') AS reservation_date, r.reservation_time, u.full_name AS customer_name, t.table_number FROM reservations r JOIN users u ON u.user_id=r.customer_id LEFT JOIN restaurant_tables t ON t.table_id=r.table_id ORDER BY r.reservation_id DESC LIMIT 500`),
            pool.execute(`SELECT o.order_id, o.status, o.order_type, o.total_amount, o.created_at, o.reservation_id, t.table_number, u.full_name AS customer_name FROM orders o JOIN reservations r ON r.reservation_id=o.reservation_id JOIN users u ON u.user_id=r.customer_id LEFT JOIN restaurant_tables t ON t.table_id=r.table_id ORDER BY o.created_at DESC, o.order_id DESC LIMIT 500`),
            pool.execute(`SELECT p.payment_id, p.payment_type, p.payment_status, p.payment_method, p.amount, p.paid_at, p.reservation_id, u.full_name AS customer_name FROM payments p JOIN reservations r ON r.reservation_id=p.reservation_id JOIN users u ON u.user_id=r.customer_id ORDER BY p.payment_id DESC LIMIT 500`)
        ]);
        res.set('Cache-Control', 'no-store');
        res.json({ success: true, reservations, orders, payments });
    } catch (error) {
        console.error('Admin history error:', error.message);
        res.status(500).json({ success: false, message: 'Unable to retrieve Admin history' });
    }
});
module.exports = router;
