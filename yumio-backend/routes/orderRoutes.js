
const express = require('express');
const pool = require('../config/db');

const { requireRole } =
  require('../middleware/authMiddleware');

const router = express.Router();
const { randomUUID } = require('node:crypto');

// Customer: view their own orders
router.get('/my', requireRole('customer'), async (req, res) => {
  try {
    const [orders] = await pool.execute(
      `SELECT
         o.order_id,
         o.reservation_id,
         o.order_type,
         o.status,
         o.total_amount,
         o.created_at,
         o.served_at
       FROM orders o
       JOIN reservations r
         ON o.reservation_id = r.reservation_id
       WHERE r.customer_id = ?
       ORDER BY o.created_at DESC`,
      [req.session.user.id]
    );

    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Order history error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to retrieve orders'
    });
  }
});


router.post('/', requireRole('customer'), async (req, res) => {
  const {
    reservation_id,
    order_type,
    items,
    idempotency_key
  } = req.body || {};

  const reservationId = Number(reservation_id);

  if (
    !Number.isSafeInteger(reservationId) ||
    reservationId <= 0 ||
    !['preorder', 'regular'].includes(order_type) ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50 ||
    typeof idempotency_key !== 'string' ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(idempotency_key)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order information'
    });
  }

  const quantities = new Map();

  for (const item of items) {
    if (
      !item ||
      !Number.isSafeInteger(item.item_id) ||
      item.item_id <= 0 ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 50
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food item or quantity'
      });
    }

    const newQuantity =
      (quantities.get(item.item_id) || 0) + item.quantity;

    if (newQuantity > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum quantity exceeded'
      });
    }

    quantities.set(item.item_id, newQuantity);
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Serialize order creation for this reservation.
    const [reservations] = await connection.execute(
      `SELECT reservation_id, customer_id, status, reservation_date, reservation_time
       FROM reservations
       WHERE reservation_id = ?
       FOR UPDATE`,
      [reservationId]
    );

    const reservation = reservations[0];

    if (!reservation) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    if (reservation.customer_id !== req.session.user.id) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const requiredStatus =
      order_type === 'preorder' ? 'confirmed' : 'checked_in';

    if (reservation.status !== requiredStatus) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: `Reservation must be ${requiredStatus}`
      });
    }

    // Check for a previous submission with this key.
    const [existing] = await connection.execute(
      `SELECT order_id, reservation_id, order_type, status
       FROM orders
       WHERE idempotency_key = ?`,
      [idempotency_key]
    );

    if (existing.length) {
      await connection.rollback();

      if (
        existing[0].reservation_id !== reservationId ||
        existing[0].order_type !== order_type
      ) {
        return res.status(409).json({
          success: false,
          message: 'Order submission key already used'
        });
      }

      return res.status(200).json({
        success: true,
        duplicate: true,
        message: 'Order already submitted',
        order: existing[0]
      });
    }

    const itemIds = [...quantities.keys()];
    const placeholders = itemIds.map(() => '?').join(',');

    const [menuItems] = await connection.query(
      `SELECT item_id, price, category
       FROM menu_items
       WHERE item_id IN (${placeholders})
         AND is_available = 1`,
      itemIds
    );

    if (menuItems.length !== itemIds.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'One or more items are unavailable'
      });
    }

    // Backend-enforced menu serving windows, including future pre-orders.
    const [schedules] = await connection.execute(
      'SELECT category,start_time,end_time,is_all_day,is_active FROM menu_schedules'
    );
    const scheduleMap = new Map(schedules.map(x => [x.category, x]));
    const clock = order_type === 'preorder'
      ? String(reservation.reservation_time).slice(0, 5)
      : new Intl.DateTimeFormat('en-GB', { timeZone: 'Indian/Maldives', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    const minute = (v) => { const parts = String(v).split(':'); return Number(parts[0]) * 60 + Number(parts[1]); };
    const at = minute(clock);
    const validSchedule = (category) => {
      const rule = scheduleMap.get(category);
      if (!rule || !rule.is_active) return false;
      if (rule.is_all_day) return true;
      if (!rule.start_time || !rule.end_time) return false;
      const start = minute(rule.start_time), end = minute(rule.end_time);
      return start < end ? at >= start && at < end : at >= start || at < end;
    };
    if (menuItems.some(item => !validSchedule(item.category))) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'One or more items are unavailable at the selected serving time' });
    }

    // Work in integer cents to avoid floating point totals.
    const lines = menuItems.map(item => {
      const quantity = quantities.get(item.item_id);
      const unitCents = Math.round(Number(item.price) * 100);

      return {
        item_id: item.item_id,
        quantity,
        unitCents,
        subtotalCents: unitCents * quantity
      };
    });

    const totalCents = lines.reduce(
      (sum, line) => sum + line.subtotalCents, 0
    );

    if (totalCents <= 0 || totalCents > 999999999) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid order total'
      });
    }

    const status =
      order_type === 'preorder'
        ? 'awaiting_payment'
        : 'received';

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
       (reservation_id, order_type, status,
        total_amount, idempotency_key)
       VALUES (?, ?, ?, ?, ?)`,
      [
        reservationId,
        order_type,
        status,
        (totalCents / 100).toFixed(2),
        idempotency_key
      ]
    );

    const orderId = orderResult.insertId;

    for (const line of lines) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, item_id, quantity, unit_price)
         VALUES (?, ?, ?, ?)`,
        [
          orderId,
          line.item_id,
          line.quantity,
          (line.unitCents / 100).toFixed(2)
        ]
      );
    }

    let depositCents = 0;

    if (order_type === 'preorder') {
      depositCents = Math.round(totalCents * 0.4);

      await connection.execute(
        `INSERT INTO payments
         (reservation_id, order_id, payment_type,
          amount, payment_method, payment_status)
         VALUES (?, ?, 'deposit', ?, 'demo', 'pending')`,
        [
          reservationId,
          orderId,
          (depositCents / 100).toFixed(2)
        ]
      );
    }

    await connection.execute(
      `INSERT INTO activity_logs
       (user_id, reservation_id, order_id,
        action, description)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        reservationId,
        orderId,
        'order_created',
        `Customer created ${order_type} order`
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      order_id: orderId,
      status,
      order_type,
      total_amount: (totalCents / 100).toFixed(2),
      deposit_due: (depositCents / 100).toFixed(2),
      message: order_type === 'preorder'
        ? 'Pre-order created. Advance payment required.'
        : 'Order sent to kitchen.'
    });

  } catch (error) {
    if (connection) await connection.rollback();

    console.error('Order creation error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to create order'
    });
  } finally {
    if (connection) connection.release();
  }
});

router.patch(
  '/:id/confirm-deposit',
  requireRole('customer'),
  async (req, res) => {
    const orderId = Number(req.params.id);

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    let connection;
    let transactionStarted = false;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      // Lock the order and check customer ownership.
      const [orders] = await connection.execute(
        `SELECT o.order_id, o.reservation_id,
                o.order_type, o.status, o.total_amount,
                r.customer_id, r.status AS reservation_status
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

      if (order.customer_id !== req.session.user.id) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (order.order_type !== 'preorder') {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'This is not a pre-order'
        });
      }

      // Lock the deposit record.
      const [payments] = await connection.execute(
        `SELECT payment_id, payment_status,
                amount, payment_method, transaction_reference
         FROM payments
         WHERE order_id = ?
           AND payment_type = 'deposit'
         FOR UPDATE`,
        [orderId]
      );

      if (payments.length !== 1) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'A single deposit record is required'
        });
      }

      const payment = payments[0];

      // Repeated confirmation must not charge twice.
      if (
        order.status === 'preordered' &&
        payment.payment_status === 'completed'
      ) {
        await connection.rollback();
        transactionStarted = false;

        return res.json({
          success: true,
          already_confirmed: true,
          message: 'Deposit was already confirmed',
          order_id: orderId,
          payment_id: payment.payment_id
        });
      }

      if (
        order.status !== 'awaiting_payment' ||
        order.reservation_status !== 'confirmed' ||
        payment.payment_status !== 'pending' ||
        payment.payment_method !== 'demo'
      ) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'Order is not eligible for deposit confirmation'
        });
      }

      // Validate 40% against the database order total.
      const totalCents =
        Math.round(Number(order.total_amount) * 100);

      const requiredDepositCents =
        Math.round(totalCents * 0.4);

      const savedDepositCents =
        Math.round(Number(payment.amount) * 100);

      if (
        !Number.isSafeInteger(totalCents) ||
        totalCents <= 0 ||
        savedDepositCents !== requiredDepositCents
      ) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'Deposit amount does not match 40% of order total'
        });
      }

      const transactionReference = `DEMO-${randomUUID()}`;

      // Record simulated payment confirmation.
      await connection.execute(
        `UPDATE payments
         SET payment_status = 'completed',
             transaction_reference = ?,
             paid_at = NOW()
         WHERE payment_id = ?
           AND payment_status = 'pending'`,
        [transactionReference, payment.payment_id]
      );

      // Release the pre-order to the scheduled kitchen list.
      await connection.execute(
        `UPDATE orders
         SET status = 'preordered'
         WHERE order_id = ?
           AND status = 'awaiting_payment'`,
        [orderId]
      );

      // Record the activity.
      await connection.execute(
        `INSERT INTO activity_logs
         (user_id, reservation_id, order_id,
          action, description, old_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          order.reservation_id,
          orderId,
          'preorder_deposit_confirmed',
          '40% simulated pre-order deposit confirmed',
          'awaiting_payment',
          'preordered'
        ]
      );

      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: 'Demo deposit confirmed successfully',
        order_id: orderId,
        payment_id: payment.payment_id,
        order_status: 'preordered',
        payment_status: 'completed',
        deposit_paid: (requiredDepositCents / 100).toFixed(2),
        remaining_balance:
          ((totalCents - requiredDepositCents) / 100).toFixed(2),
        currency: 'MVR',
        transaction_reference: transactionReference
      });

    } catch (error) {
      if (connection && transactionStarted) {
        await connection.rollback();
      }

      console.error('Deposit confirmation error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to confirm demo deposit'
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


module.exports = router;
