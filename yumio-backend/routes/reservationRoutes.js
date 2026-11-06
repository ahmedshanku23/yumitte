const express = require('express');
const pool = require('../config/db');
const { requireRole } =
  require('../middleware/authMiddleware');

const router = express.Router();
const { queueNotification } = require('../services/emailNotifications');


router.post('/', requireRole('customer'), async (req, res) => {
  const { reservation_date, reservation_time, guest_count, special_requests } = req.body || {};
  const guests = Number(guest_count);
  if (!Number.isSafeInteger(guests) || guests < 1 || guests > 10 ||
    typeof reservation_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(reservation_date) ||
    typeof reservation_time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(reservation_time) ||
    (special_requests != null && (typeof special_requests !== 'string' || special_requests.length > 1000))) {
    return res.status(400).json({ success: false, message: 'Enter 1–10 guests, a valid date and time.' });
  }

  const [year, month, day] = reservation_date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    return res.status(400).json({ success: false, message: 'Invalid reservation date.' });
  }
  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Indian/Maldives', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const parts = Object.fromEntries(localParts.filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
  const nowLocal = `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
  if (`${reservation_date} ${reservation_time}` < nowLocal) {
    return res.status(400).json({ success: false, message: 'Choose a future reservation time.' });
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO reservations (customer_id, table_id, reservation_date, reservation_time, guest_count, special_requests)
       VALUES (?, NULL, ?, ?, ?, ?)`,
      [req.session.user.id, reservation_date, reservation_time, guests, special_requests || null]
    );
    return res.status(201).json({
      success: true, reservation_id: result.insertId,
      status: 'pending', message: 'Reservation request submitted. Staff will assign your table.'
    });
  } catch (error) {
    console.error('Reservation creation error:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to create reservation.' });
  }
});

const SLOT_MINUTES = 120;
const MAX_GUESTS = 40;
const MAX_TABLES = 20;
const overlapSql = `(
  (TIMESTAMP(r.reservation_date, r.reservation_time) < DATE_ADD(TIMESTAMP(?, ?), INTERVAL ${SLOT_MINUTES} MINUTE)
   AND DATE_ADD(TIMESTAMP(r.reservation_date, r.reservation_time), INTERVAL ${SLOT_MINUTES} MINUTE) > TIMESTAMP(?, ?))
  OR (r.status IN ('checked_in','dining_done') AND
      TIMESTAMP(?, ?) BETWEEN DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 HOUR)
                          AND DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR))
)`;

const validSlot = (date, time) => {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    typeof time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
};
const slotArgs = (date, time) => [date, time, date, time, date, time];
async function getSlotAvailability(db, date, time, excludedReservationId = 0) {
  const [rows] = await db.execute(`SELECT r.reservation_id, r.table_id, r.guest_count
    FROM reservations r WHERE r.status IN ('confirmed','checked_in','dining_done')
      AND r.reservation_id <> ? AND ${overlapSql}`,
    [excludedReservationId, ...slotArgs(date, time)]);
  const bookedGuests = rows.reduce((total, row) => total + Number(row.guest_count), 0);
  const busyTableIds = [...new Set(rows.map(row => Number(row.table_id)).filter(Boolean))];
  const [tables] = await db.execute('SELECT table_id, table_number, status FROM restaurant_tables ORDER BY table_number');
  return {
    capacity: MAX_GUESTS, booked_guests: bookedGuests,
    remaining_guests: Math.max(0, MAX_GUESTS - bookedGuests),
    maximum_tables: MAX_TABLES, booked_tables: busyTableIds.length,
    remaining_tables: Math.max(0, Math.min(MAX_TABLES, tables.length) - busyTableIds.length),
    tables: tables.map(t => ({
      table_id: t.table_id, table_number: t.table_number,
      available: !busyTableIds.includes(Number(t.table_id))
    }))
  };
}

router.get('/availability', requireRole('staff', 'admin'), async (req, res) => {
  const { date, time } = req.query;
  if (!validSlot(date, time)) return res.status(400).json({ success: false, message: 'Choose a valid date and time.' });
  try {
    return res.json({ success: true, date, time, ...(await getSlotAvailability(pool, date, time)) });
  } catch (error) {
    console.error('Staff availability lookup:', error.message);
    return res.status(500).json({ success: false, message: 'Unable to check availability.' });
  }
});

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
    await db.execute(`UPDATE orders SET status = 'cancelled'
      WHERE reservation_id = ? AND status IN ('awaiting_payment', 'preordered')`, [id]);
    await db.execute(`UPDATE payments SET payment_status = 'failed'
      WHERE reservation_id = ? AND payment_status = 'pending'`, [id]);
    const [updated] = await db.execute(`UPDATE reservations SET status = 'cancelled'
      WHERE reservation_id = ? AND status IN ('pending', 'confirmed')`, [id]);
    if (updated.affectedRows !== 1) throw new Error('Reservation cancellation conflict');
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

router.get('/my', requireRole('customer'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.reservation_id, r.reservation_date,
              r.reservation_time, r.guest_count,
              r.status, r.special_requests,
              t.table_number
       FROM reservations r
       LEFT JOIN restaurant_tables t ON r.table_id = t.table_id
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

router.get('/pending', requireRole('staff', 'admin'), async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.reservation_id, u.full_name AS customer_name, t.table_number,
             r.reservation_date, r.reservation_time, r.guest_count,
             r.special_requests, r.status
      FROM reservations r JOIN users u ON u.user_id = r.customer_id
      LEFT JOIN restaurant_tables t ON t.table_id = r.table_id
      WHERE r.status = 'pending' ORDER BY r.reservation_date, r.reservation_time`);
    const [tables] = await pool.execute('SELECT table_id, table_number, status FROM restaurant_tables ORDER BY table_number');
    const [[occupied]] = await pool.execute(`SELECT COALESCE(SUM(guest_count),0) AS guests
      FROM reservations WHERE status IN ('checked_in','dining_done')`);
    res.json({ success: true, data: rows, tables, occupancy: { occupied: Number(occupied.guests), capacity: 40 } });
  } catch (error) {
    console.error('Pending reservations:', error.message);
    res.status(500).json({ success: false, message: 'Unable to load pending reservations' });
  }
});

router.patch('/:id/accept', requireRole('staff', 'admin'), async (req, res) => {
  const id = Number(req.params.id), tableId = Number(req.body?.table_id);
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(tableId) || tableId < 1) {
    return res.status(400).json({ success: false, message: 'Choose a table to confirm this booking.' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [tables] = await connection.execute('SELECT table_id, table_number, status FROM restaurant_tables ORDER BY table_id FOR UPDATE');
    const table = tables.find(t => Number(t.table_id) === tableId);
    if (!table) { await connection.rollback(); return res.status(404).json({ success: false, message: 'Selected table not found.' }); }
    const [reservations] = await connection.execute(`
      SELECT reservation_id, guest_count, status,
             DATE_FORMAT(reservation_date, '%Y-%m-%d') AS date_str,
             TIME_FORMAT(reservation_time, '%H:%i') AS time_str
      FROM reservations WHERE reservation_id = ? FOR UPDATE`, [id]);
    const booking = reservations[0];
    if (!booking || booking.status !== 'pending') {
      await connection.rollback(); return res.status(409).json({ success: false, message: 'Reservation is no longer pending.' });
    }
    if (Number(booking.guest_count) < 1 || Number(booking.guest_count) > 10) {
      await connection.rollback(); return res.status(409).json({
        success: false,
        message: 'Each reservation must contain between 1 and 10 guests.'
      });
    }

    const availability = await getSlotAvailability(connection, booking.date_str, booking.time_str, id);
    if (availability.booked_guests + Number(booking.guest_count) > MAX_GUESTS) {
      await connection.rollback(); return res.status(409).json({
        success: false,
        message: `Capacity exceeded: ${availability.booked_guests} of ${MAX_GUESTS} guests already booked at this time.`
      });
    }
    if (availability.booked_tables >= MAX_TABLES) {
      await connection.rollback(); return res.status(409).json({ success: false, message: 'All 20 tables are assigned for this time.' });
    }
    if (!availability.tables.some(t => Number(t.table_id) === tableId && t.available)) {
      await connection.rollback(); return res.status(409).json({ success: false, message: 'This table is occupied or booked for an overlapping time.' });
    }
    if (['occupied', 'awaiting_bill'].includes(String(table.status).toLowerCase())) {
      const localNow = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Indian/Maldives',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
      });
      const values = Object.fromEntries(localNow.formatToParts(new Date()).filter(x => x.type !== 'literal').map(x => [x.type, x.value]));
      if (booking.date_str === `${values.year}-${values.month}-${values.day}` && booking.time_str <= `${values.hour}:${values.minute}`) {
        await connection.rollback(); return res.status(409).json({ success: false, message: 'Selected table is currently occupied.' });
      }
    }
    const [result] = await connection.execute(`UPDATE reservations SET table_id=?, status='confirmed'
      WHERE reservation_id=? AND status='pending'`, [tableId, id]);
    if (result.affectedRows !== 1) throw new Error('Reservation confirmation race');
    await connection.execute(`INSERT INTO activity_logs
      (user_id, reservation_id, action, description, old_status, new_status)
      VALUES (?, ?, 'reservation_accepted', ?, 'pending', 'confirmed')`,
      [req.session.user.id, id, `Staff assigned Table ${table.table_number} and confirmed reservation`]);
    await queueNotification(connection, 'reservation_confirmed', id);
    await connection.commit();
    res.json({
      success: true, reservation_id: id, status: 'confirmed',
      table_number: table.table_number, message: 'Reservation confirmed and table assigned.'
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => { });
    console.error('Accept reservation error:', error.message);
    res.status(500).json({ success: false, message: 'Unable to confirm reservation.' });
  } finally { if (connection) connection.release(); }
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


      const [orderTotals] = await connection.execute(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM orders
         WHERE reservation_id = ?
           AND status <> 'cancelled'`,
        [reservationId]
      );


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
