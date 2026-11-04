
const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const { queueNotification } = require('../services/emailNotifications');

// Kitchen: view scheduled, deposit-paid pre-orders
router.get(
  '/scheduled',
  requireRole('kitchen', 'staff', 'admin'),
  async (req, res) => {
    try {
      const [orders] = await pool.execute(
        `SELECT
            o.order_id,
            o.reservation_id,
            o.order_type,
            o.status,
            o.total_amount,
            o.created_at,
            r.reservation_date,
            r.reservation_time,
            r.guest_count,
            u.full_name AS customer_name,
            t.table_number
         FROM orders o
         JOIN reservations r
           ON o.reservation_id = r.reservation_id
         JOIN users u
           ON r.customer_id = u.user_id
         JOIN restaurant_tables t
           ON r.table_id = t.table_id
         WHERE o.order_type = 'preorder'
           AND o.status = 'preordered'
           AND r.status = 'confirmed'
           AND EXISTS (
             SELECT 1
             FROM payments p
             WHERE p.order_id = o.order_id
               AND p.payment_type = 'deposit'
               AND p.payment_status = 'completed'
               AND p.amount = ROUND(o.total_amount * 0.40, 2)
           )
         ORDER BY r.reservation_date,
                  r.reservation_time,
                  o.created_at`
      );

      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (error) {
      console.error('Scheduled orders error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Unable to retrieve scheduled pre-orders'
      });
    }
  }
);

// Kitchen: view active orders after customer check-in
router.get(
  '/active',
  requireRole('kitchen', 'staff', 'admin'),
  async (req, res) => {
    try {
      const [orders] = await pool.execute(
        `SELECT
            o.order_id,
            o.reservation_id,
            o.order_type,
            o.status,
            o.total_amount,
            o.created_at,
            t.table_number
         FROM orders o
         JOIN reservations r
           ON o.reservation_id = r.reservation_id
         JOIN restaurant_tables t
           ON r.table_id = t.table_id
         WHERE r.status = 'checked_in'
           AND o.status IN (
             'received', 'accepted', 'preparing', 'ready'
           )
         ORDER BY o.created_at ASC`
      );

      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (error) {
      console.error('Active orders error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Unable to retrieve active kitchen orders'
      });
    }
  }
);

router.patch(
  '/orders/:id/status',
  requireRole('kitchen', 'admin'),
  async (req, res) => {
    const orderId = Number(req.params.id);
    const newStatus = req.body?.status;

    const nextStatus = {
      received: 'accepted',
      accepted: 'preparing',
      preparing: 'ready',
      ready: 'served'
    };

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    if (!Object.values(nextStatus).includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid kitchen status'
      });
    }

    let connection;
    let transactionStarted = false;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      const [orders] = await connection.execute(
        `SELECT o.order_id, o.reservation_id,
                o.status, r.status AS reservation_status
         FROM orders o
         JOIN reservations r
           ON o.reservation_id = r.reservation_id
         WHERE o.order_id = ?
         FOR UPDATE`,
        [orderId]
      );

      if (!orders.length) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      const order = orders[0];

      // Kitchen can process orders only after check-in.
      if (order.reservation_status !== 'checked_in') {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'Customer must be checked in'
        });
      }

      const expectedStatus = nextStatus[order.status];

      if (expectedStatus !== newStatus) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: `Invalid transition from ${order.status} to ${newStatus}`
        });
      }

      if (newStatus === 'served') {
        await connection.execute(
          `UPDATE orders
           SET status = ?, served_at = NOW()
           WHERE order_id = ?`,
          [newStatus, orderId]
        );
      } else {
        await connection.execute(
          `UPDATE orders
           SET status = ?
           WHERE order_id = ?`,
          [newStatus, orderId]
        );
      }

      await connection.execute(
        `INSERT INTO activity_logs
         (user_id, reservation_id, order_id,
          action, description, old_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          order.reservation_id,
          orderId,
          'kitchen_order_status_updated',
          `Kitchen changed order from ${order.status} to ${newStatus}`,
          order.status,
          newStatus
        ]
      );

      await queueNotification(connection, `order_${newStatus}`, orderId);
      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: 'Kitchen order status updated',
        order_id: orderId,
        previous_status: order.status,
        new_status: newStatus
      });

    } catch (error) {
      if (connection && transactionStarted) {
        await connection.rollback();
      }

      console.error('Kitchen status update error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to update kitchen order'
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


module.exports = router;
