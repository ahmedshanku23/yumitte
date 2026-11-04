
const express = require('express');
const pool = require('../config/db');
const { requireRole } =
  require('../middleware/authMiddleware');

const router = express.Router();
const { queueNotification } = require('../services/emailNotifications');

// CUSTOMER: CREATE RESERVATION
router.post('/', requireRole('customer'), async (req, res) => {
  const { table_id, reservation_date, reservation_time, guest_count,
    special_requests } = req.body || {};

  const tableId = Number(table_id);
  const guests = Number(guest_count);

  if (!Number.isSafeInteger(tableId) || tableId <= 0 ||
    !Number.isSafeInteger(guests) || guests <= 0 ||
    typeof reservation_date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(reservation_date) ||
    typeof reservation_time !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(reservation_time) ||
    (special_requests != null &&
      (typeof special_requests !== 'string' ||
        special_requests.length > 1000))) {
    return res.status(400).json({
      success: false,
      message: 'Invalid reservation details'
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [tables] = await connection.execute(
      `SELECT table_id, capacity
       FROM restaurant_tables
       WHERE table_id = ?
       FOR UPDATE`,
      [tableId]
    );

    if (!tables.length) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Table not found'
      });
    }

    const [existing] = await connection.execute(
      `SELECT reservation_id
       FROM reservations
       WHERE table_id = ?
         AND reservation_date = ?
         AND reservation_time = ?
         AND status NOT IN ('cancelled', 'completed')
       LIMIT 1`,
      [tableId, reservation_date, reservation_time]
    );

    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'This table is already reserved for that time'
      });
    }

    const [result] = await connection.execute(
      `INSERT INTO reservations
       (customer_id, table_id, reservation_date,
        reservation_time, guest_count, special_requests)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.session.user.id,
        tableId,
        reservation_date,
        reservation_time,
        guests,
        special_requests || null
      ]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Reservation submitted for staff approval',
      reservation_id: result.insertId,
      status: 'pending'
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Reservation error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Unable to create reservation'
    });
  } finally {
    if (connection) connection.release();
  }
});

// CUSTOMER: CANCELLATION QUOTE AND CONFIRMED CANCELLATION
// All amounts are DEMO ledger entries; no external refund/charge is executed.
const maleNow = () => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Indian/Maldives', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date()).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  return Date.UTC(+parts.year, +parts.month - 1, +parts.day,
    +parts.hour, +parts.minute, +parts.second);
};
const cancellationAmounts = (date, time, paidAmount) => {
  const reservationMs = Date.parse(`${date}T${time.slice(0, 8).padEnd(8, '0')}Z`);
  if (!Number.isFinite(reservationMs)) throw new Error('Invalid reservation schedule');
  const remainingMs = reservationMs - maleNow();
  if (remainingMs <= 0) return { tooLate: true };
  const feeCents = remainingMs < 3600000 ? 2500 : 0;
  const paidCents = Math.round(Number(paidAmount) * 100);
  if (!Number.isSafeInteger(paidCents) || paidCents < 0) throw new Error('Invalid paid amount');
  return {
    tooLate: false,
    feeCents,
    refundCents: Math.max(0, paidCents - feeCents),
    feeDueCents: Math.max(0, feeCents - paidCents),
    retainedCents: Math.min(feeCents, paidCents)
  };
};
const decimal = cents => (cents / 100).toFixed(2);

async function getCancellationContext(db, id, userId, lock = false) {
  const [rows] = await db.execute(
    `SELECT r.reservation_id, r.customer_id, r.status,
            DATE_FORMAT(r.reservation_date, '%Y-%m-%d') AS day,
            TIME_FORMAT(r.reservation_time, '%H:%i:%s') AS start_time
     FROM reservations r WHERE r.reservation_id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]);
  if (!rows.length) return { error: [404, 'Reservation not found'] };
  if (Number(rows[0].customer_id) !== Number(userId)) return { error: [403, 'Access denied'] };
  if (!['pending', 'confirmed'].includes(rows[0].status)) {
    return { error: [409, 'Only pending or confirmed reservations can be cancelled before their start time'] };
  }
  const [payments] = await db.execute(
    `SELECT payment_id, amount, payment_status FROM payments
     WHERE reservation_id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]);
  const paid = payments.filter(x => x.payment_status === 'completed')
    .reduce((a, x) => a + Number(x.amount), 0);
  const quote = cancellationAmounts(rows[0].day, rows[0].start_time, paid);
  if (quote.tooLate) return { error: [409, 'Cancellation is unavailable after the reservation start time'] };
  return { reservation: rows[0], payments, ...quote };
}

router.get('/:id/cancellation-quote', requireRole('customer'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid reservation ID' });
  try {
    const c = await getCancellationContext(pool, id, req.session.user.id);
    if (c.error) return res.status(c.error[0]).json({ success: false, message: c.error[1] });
    return res.json({
      success: true, reservation_id: id,
      cancellation_fee: decimal(c.feeCents), refund_amount: decimal(c.refundCents),
      fee_outstanding: decimal(c.feeDueCents),
      message: c.feeCents ? 'Cancellation within one hour: MVR 25 fee applies.' : 'Free cancellation: full refund of any paid deposit.'
    });
  } catch (err) {
    console.error('Cancellation quote:', err);
    return res.status(500).json({ success: false, message: 'Cannot calculate cancellation quote' });
  }
});

router.patch('/:id/cancel', requireRole('customer'), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ success: false, message: 'Invalid reservation ID' });
  if (req.body?.confirm !== true) return res.status(400).json({ success: false, message: 'Explicit cancellation confirmation is required' });
  let db;
  try {
    db = await pool.getConnection();
    await db.beginTransaction();
    const c = await getCancellationContext(db, id, req.session.user.id, true);
    if (c.error) { await db.rollback(); return res.status(c.error[0]).json({ success: false, message: c.error[1] }); }
    // A server-side quote is recalculated under lock, not trusted from the browser.
    await db.execute(`UPDATE orders SET status = 'cancelled'
      WHERE reservation_id = ? AND status IN ('awaiting_payment', 'preordered')`, [id]);
    // Pending deposits were never paid; invalidate them to prevent subsequent confirmation.
    await db.execute(`UPDATE payments SET payment_status = 'failed'
      WHERE reservation_id = ? AND payment_status = 'pending'`, [id]);
    const [updated] = await db.execute(`UPDATE reservations SET status = 'cancelled'
      WHERE reservation_id = ? AND status IN ('pending', 'confirmed')`, [id]);
    if (updated.affectedRows !== 1) throw new Error('Reservation cancellation conflict');
    // Demo refund ledger. Existing payment rows remain for audit and history.
    await db.execute(`INSERT INTO reservation_cancellations
      (reservation_id, customer_id, cancellation_fee, refund_amount, fee_outstanding, refund_status)
      VALUES (?, ?, ?, ?, ?, 'demo_recorded')`, [id, req.session.user.id,
      decimal(c.feeCents), decimal(c.refundCents), decimal(c.feeDueCents)]);
    await db.execute(`INSERT INTO activity_logs
      (user_id, reservation_id, action, description, old_status, new_status)
      VALUES (?, ?, 'reservation_cancelled', ?, ?, 'cancelled')`,
      [req.session.user.id, id, `Demo cancellation: fee MVR ${decimal(c.feeCents)}, refund MVR ${decimal(c.refundCents)}, outstanding fee MVR ${decimal(c.feeDueCents)}`, c.reservation.status]);
    await db.commit();
    return res.json({
      success: true, reservation_id: id, status: 'cancelled',
      cancellation_fee: decimal(c.feeCents), refund_amount: decimal(c.refundCents),
      fee_outstanding: decimal(c.feeDueCents),
      message: 'Reservation cancelled. Demo refund/fee recorded; no actual money transferred.'
    });
  } catch (err) {
    if (db) await db.rollback().catch(() => { });
    console.error('Cancellation:', err);
    return res.status(500).json({ success: false, message: 'Unable to cancel reservation' });
  } finally { if (db) db.release(); }
});

// CUSTOMER: VIEW OWN RESERVATIONS
router.get('/my', requireRole('customer'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.reservation_id, r.reservation_date,
              r.reservation_time, r.guest_count,
              r.status, r.special_requests,
              t.table_number
       FROM reservations r
       JOIN restaurant_tables t ON r.table_id = t.table_id
       WHERE r.customer_id = ?
       ORDER BY r.reservation_date DESC,
                r.reservation_time DESC`,
      [req.session.user.id]
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Reservation listing error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Unable to load reservations'
    });
  }
});


const { requireAuth } =
  require('../middleware/authMiddleware');

// STAFF / ADMIN: VIEW PENDING RESERVATIONS
router.get(
  '/pending',
  requireRole('staff', 'admin'),
  async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT
          r.reservation_id,
          u.full_name AS customer_name,
          t.table_number,
          r.reservation_date,
          r.reservation_time,
          r.guest_count,
          r.special_requests,
          r.status
        FROM reservations r
        JOIN users u ON r.customer_id = u.user_id
        JOIN restaurant_tables t ON r.table_id = t.table_id
        WHERE r.status = 'pending'
        ORDER BY r.reservation_date, r.reservation_time
      `);

      res.json({ success: true, data: rows });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        success: false,
        message: 'Unable to load pending reservations'
      });
    }
  }
);

// STAFF / ADMIN: ACCEPT RESERVATION
router.patch(
  '/:id/accept',
  requireRole('staff', 'admin'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [result] = await connection.execute(
        `UPDATE reservations
         SET status = 'confirmed'
         WHERE reservation_id = ?
           AND status = 'pending'`,
        [id]
      );

      if (result.affectedRows !== 1) {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Reservation is not pending or does not exist'
        });
      }

      await connection.execute(
        `INSERT INTO activity_logs
         (user_id, reservation_id, action,
          description, old_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          id,
          'reservation_accepted',
          'Reservation accepted by service staff or manager',
          'pending',
          'confirmed'
        ]
      );

      await queueNotification(connection, 'reservation_confirmed', id);
      await connection.commit();

      res.json({
        success: true,
        message: 'Reservation confirmed successfully',
        reservation_id: id,
        status: 'confirmed'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Accept reservation error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Unable to accept reservation'
      });
    } finally {
      connection.release();
    }
  }
);
router.get('/pending', requireRole('staff', 'admin'), async (req, res) => {
  // Existing pending reservation code
});

router.patch(
  '/:id/check-in',
  requireRole('customer', 'staff', 'admin'),
  async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    let connection;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [rows] = await connection.execute(
        `SELECT reservation_id, customer_id, table_id,
                DATE_FORMAT(reservation_date, '%Y-%m-%d') AS checkin_date,
                TIME_FORMAT(reservation_time, '%H:%i') AS checkin_time,
                status
         FROM reservations
         WHERE reservation_id = ?
         FOR UPDATE`,
        [id]
      );

      const reservation = rows[0];

      if (!reservation) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      if (
        req.session.user.role === 'customer' &&
        reservation.customer_id !== req.session.user.id
      ) {
        await connection.rollback();
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (reservation.status !== 'confirmed') {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Only confirmed reservations can check in'
        });
      }

      // Check-in opens 15 minutes before the reservation, using Maldives
      // wall-clock time regardless of the OS or database server time zone.
      const clockParts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Indian/Maldives', year: 'numeric', month: '2-digit',
        day: '2-digit', hour: '2-digit', minute: '2-digit',
        second: '2-digit', hourCycle: 'h23'
      }).formatToParts(new Date());
      const clock = Object.fromEntries(clockParts.map(x => [x.type, x.value]));
      const nowInMaldives = Date.UTC(
        Number(clock.year), Number(clock.month) - 1, Number(clock.day),
        Number(clock.hour), Number(clock.minute), Number(clock.second)
      );
      const day = String(reservation.checkin_date);
      const time = String(reservation.checkin_time);
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
      const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
      if (!match || !timeMatch) {
        throw new Error('Unexpected reservation date/time format');
      }
      const reservedAt = Date.UTC(
        Number(match[1]), Number(match[2]) - 1, Number(match[3]),
        Number(timeMatch[1]), Number(timeMatch[2])
      );
      const opensAt = reservedAt - 15 * 60 * 1000;
      if (nowInMaldives < opensAt) {
        await connection.rollback();
        const availableAt = new Date(opensAt);
        const hh = availableAt.getUTCHours();
        const mm = String(availableAt.getUTCMinutes()).padStart(2, '0');
        const displayHour = String(hh % 12 || 12);
        const period = hh < 12 ? 'AM' : 'PM';
        const displayDate = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric'
        }).format(availableAt);
        return res.status(409).json({
          success: false,
          code: 'CHECK_IN_TOO_EARLY',
          message: `Check-in is only available 15 minutes before your reservation. You can check in from ${displayHour}:${mm} ${period} on ${displayDate} (Maldives time).`
        });
      }

      // Prevent simultaneous occupancy of the same table.
      const [tableRows] = await connection.execute(
        `SELECT status FROM restaurant_tables
         WHERE table_id = ?
         FOR UPDATE`,
        [reservation.table_id]
      );

      if (!tableRows.length || tableRows[0].status === 'occupied') {
        await connection.rollback();
        return res.status(409).json({
          success: false,
          message: 'Table is unavailable for check-in'
        });
      }

      await connection.execute(
        `UPDATE reservations
         SET status = 'checked_in',
             checked_in_at = NOW()
         WHERE reservation_id = ?`,
        [id]
      );

      await connection.execute(
        `UPDATE restaurant_tables
         SET status = 'occupied'
         WHERE table_id = ?`,
        [reservation.table_id]
      );

      // Release scheduled pre-orders to the kitchen.
      const [preorders] = await connection.execute(
        `UPDATE orders
         SET status = 'received'
         WHERE reservation_id = ?
           AND order_type = 'preorder'
           AND status = 'preordered'`,
        [id]
      );

      await connection.execute(
        `INSERT INTO activity_logs
         (user_id, reservation_id, action,
          description, old_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          id,
          'customer_checked_in',
          'Customer checked in and table occupied',
          'confirmed',
          'checked_in'
        ]
      );

      await connection.commit();

      res.json({
        success: true,
        message: 'Check-in successful',
        reservation_id: id,
        status: 'checked_in',
        preorders_released: preorders.affectedRows
      });

    } catch (error) {
      if (connection) await connection.rollback();
      console.error('Check-in error:', error.message);

      res.status(500).json({
        success: false,
        message: 'Unable to check in'
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

router.patch(
  '/:id/dining-done',
  requireRole('customer'),
  async (req, res) => {
    const reservationId = Number(req.params.id);

    if (
      !Number.isSafeInteger(reservationId) ||
      reservationId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    let connection;
    let transactionStarted = false;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      transactionStarted = true;

      // Lock reservation and verify ownership.
      const [reservations] = await connection.execute(
        `SELECT reservation_id, customer_id, status
         FROM reservations
         WHERE reservation_id = ?
         FOR UPDATE`,
        [reservationId]
      );

      if (!reservations.length) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      const reservation = reservations[0];

      if (reservation.customer_id !== req.session.user.id) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (reservation.status !== 'checked_in') {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'Reservation must be checked in'
        });
      }

      // Lock related orders to prevent status changes
      // during the dining completion transaction.
      const [orders] = await connection.execute(
        `SELECT order_id, status
         FROM orders
         WHERE reservation_id = ?
         FOR UPDATE`,
        [reservationId]
      );

      const activeOrders = orders.filter(
        order => order.status !== 'cancelled'
      );

      if (activeOrders.length === 0) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'No food orders found for this reservation'
        });
      }

      const unservedOrders = activeOrders.filter(
        order => order.status !== 'served'
      );

      if (unservedOrders.length > 0) {
        await connection.rollback();
        transactionStarted = false;

        return res.status(409).json({
          success: false,
          message: 'All food must be served before dining completion',
          unserved_order_ids: unservedOrders.map(
            order => order.order_id
          )
        });
      }

      await connection.execute(
        `UPDATE reservations
         SET status = 'dining_done'
         WHERE reservation_id = ?
           AND status = 'checked_in'`,
        [reservationId]
      );

      await connection.execute(
        `INSERT INTO activity_logs
         (user_id, reservation_id, action,
          description, old_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          reservationId,
          'dining_marked_done',
          'Customer marked dining as complete',
          'checked_in',
          'dining_done'
        ]
      );

      await connection.commit();
      transactionStarted = false;

      return res.json({
        success: true,
        message: 'Dining completed. Final payment is now due.',
        reservation_id: reservationId,
        status: 'dining_done',
        payment_required: true
      });

    } catch (error) {
      if (connection && transactionStarted) {
        await connection.rollback();
      }

      console.error('Dining completion error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to complete dining'
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

router.patch(
  '/:id/close',
  requireRole('staff', 'admin'),
  async (req, res) => {
    const reservationId = Number(req.params.id);

    if (!Number.isSafeInteger(reservationId) || reservationId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reservation ID'
      });
    }

    let connection;
    let started = false;

    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
      started = true;

      // Lock reservation before any billing or table changes.
      const [rows] = await connection.execute(
        `SELECT reservation_id, table_id, status
         FROM reservations
         WHERE reservation_id = ?
         FOR UPDATE`,
        [reservationId]
      );

      if (!rows.length) {
        await connection.rollback();
        started = false;
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      const reservation = rows[0];

      if (reservation.status !== 'dining_done') {
        await connection.rollback();
        started = false;
        return res.status(409).json({
          success: false,
          message: 'Reservation must be dining_done before closure'
        });
      }

      // Confirm that every non-cancelled order was served.
      const [orderCheck] = await connection.execute(
        `SELECT
           COUNT(*) AS total_orders,
           SUM(CASE WHEN status NOT IN ('served', 'cancelled')
                    THEN 1 ELSE 0 END) AS unserved
         FROM orders
         WHERE reservation_id = ?`,
        [reservationId]
      );

      if (
        Number(orderCheck[0].total_orders) === 0 ||
        Number(orderCheck[0].unserved) > 0
      ) {
        await connection.rollback();
        started = false;
        return res.status(409).json({
          success: false,
          message: 'All food orders must be served before closure'
        });
      }

      // Calculate order total, excluding cancelled orders.
      const [orderTotals] = await connection.execute(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM orders
         WHERE reservation_id = ?
           AND status <> 'cancelled'`,
        [reservationId]
      );

      // Only completed payments count toward settlement.
      const [paymentTotals] = await connection.execute(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM payments
         WHERE reservation_id = ?
           AND payment_status = 'completed'`,
        [reservationId]
      );

      const totalCents = Math.round(
        Number(orderTotals[0].total) * 100
      );

      const paidCents = Math.round(
        Number(paymentTotals[0].total) * 100
      );

      if (
        !Number.isSafeInteger(totalCents) ||
        !Number.isSafeInteger(paidCents) ||
        totalCents <= 0 ||
        paidCents !== totalCents
      ) {
        await connection.rollback();
        started = false;
        return res.status(409).json({
          success: false,
          message: 'Customer bill is not fully settled'
        });
      }

      // Serialize table-state changes.
      const [tables] = await connection.execute(
        `SELECT table_id, status
         FROM restaurant_tables
         WHERE table_id = ?
         FOR UPDATE`,
        [reservation.table_id]
      );

      if (!tables.length || tables[0].status !== 'occupied') {
        await connection.rollback();
        started = false;
        return res.status(409).json({
          success: false,
          message: 'Table is not currently occupied'
        });
      }

      await connection.execute(
        `UPDATE reservations
         SET status = 'completed'
         WHERE reservation_id = ?
           AND status = 'dining_done'`,
        [reservationId]
      );

      await connection.execute(
        `UPDATE restaurant_tables
         SET status = 'available'
         WHERE table_id = ?`,
        [reservation.table_id]
      );

      await connection.execute(
        `INSERT INTO activity_logs
         (user_id, reservation_id, action, description,
          old_status, new_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.session.user.id,
          reservationId,
          'table_closed',
          'Staff closed settled reservation and released table',
          'dining_done',
          'completed'
        ]
      );

      await connection.commit();
      started = false;

      return res.json({
        success: true,
        message: 'Reservation completed and table released',
        reservation_id: reservationId,
        status: 'completed',
        table_id: reservation.table_id,
        table_status: 'available',
        final_balance: '0.00'
      });

    } catch (error) {
      if (connection && started) {
        await connection.rollback();
      }

      console.error('Table closure error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to close reservation'
      });
    } finally {
      if (connection) connection.release();
    }
  }
);


module.exports = router;
