
const express = require('express');
const pool = require('../config/db');

const { requireRole } =
  require('../middleware/authMiddleware');

const router = express.Router();
const { randomUUID } = require('node:crypto');

// Customer: retrieve final bill
router.get(
  '/reservation/:id/balance',
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

    try {
      // Verify that the reservation belongs to the customer.
      const [reservations] = await pool.execute(
        `SELECT reservation_id, customer_id, status
         FROM reservations
         WHERE reservation_id = ?`,
        [reservationId]
      );

      if (!reservations.length) {
        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      const reservation = reservations[0];

      if (reservation.customer_id !== req.session.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!['dining_done', 'completed'].includes(
        reservation.status
      )) {
        return res.status(409).json({
          success: false,
          message: 'Final bill is available after dining completion'
        });
      }

      // Calculate non-cancelled order totals.
      const [orderTotals] = await pool.execute(
        `SELECT COALESCE(
           SUM(total_amount), 0
         ) AS total
         FROM orders
         WHERE reservation_id = ?
           AND status <> 'cancelled'`,
        [reservationId]
      );

      // Count completed payments only.
      const [paymentTotals] = await pool.execute(
        `SELECT COALESCE(
           SUM(amount), 0
         ) AS total
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
        totalCents < 0 ||
        paidCents < 0 ||
        paidCents > totalCents
      ) {
        return res.status(409).json({
          success: false,
          message: 'Billing records require review'
        });
      }

      const balanceCents = totalCents - paidCents;

      return res.json({
        success: true,
        reservation_id: reservationId,
        reservation_status: reservation.status,
        currency: 'MVR',
        total_amount: (totalCents / 100).toFixed(2),
        already_paid: (paidCents / 100).toFixed(2),
        final_balance: (balanceCents / 100).toFixed(2),
        payment_required: balanceCents > 0
      });

    } catch (error) {
      console.error('Billing error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to calculate final bill'
      });
    }
  }
);

router.post(
  '/reservation/:id/confirm-final',
  requireRole('customer'),
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

      // Lock reservation to serialize billing changes.
      const [reservations] = await connection.execute(
        `SELECT reservation_id, customer_id, status
         FROM reservations
         WHERE reservation_id = ?
         FOR UPDATE`,
        [reservationId]
      );

      if (!reservations.length) {
        await connection.rollback();
        started = false;

        return res.status(404).json({
          success: false,
          message: 'Reservation not found'
        });
      }

      const reservation = reservations[0];

      if (reservation.customer_id !== req.session.user.id) {
        await connection.rollback();
        started = false;

        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (!['dining_done', 'completed'].includes(reservation.status)) {
        await connection.rollback();
        started = false;

        return res.status(409).json({
          success: false,
          message: 'Dining must be completed before final payment'
        });
      }

      // Read all non-cancelled order totals.
      const [orderTotals] = await connection.execute(
        `SELECT COALESCE(SUM(total_amount), 0) AS total
         FROM orders
         WHERE reservation_id = ?
           AND status <> 'cancelled'`,
        [reservationId]
      );

      // Read all completed payments.
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
        totalCents < 0 ||
        paidCents < 0 ||
        paidCents > totalCents
      ) {
        await connection.rollback();
        started = false;

        return res.status(409).json({
          success: false,
          message: 'Billing records require review'
        });
      }

      const balanceCents = totalCents - paidCents;

      // An already-settled bill must not create another payment.
      if (balanceCents === 0) {
        await connection.rollback();
        started = false;

        return res.json({
          success: true,
          already_paid: true,
          message: 'Reservation balance is already settled',
          reservation_id: reservationId,
          final_balance: '0.00'
        });
      }

      if (reservation.status !== 'dining_done') {
        await connection.rollback();
        started = false;

        return res.status(409).json({
          success: false,
          message: 'Reservation is not eligible for final payment'
        });
      }

      const reference = `FINAL-DEMO-${randomUUID()}`;
      const amount = (balanceCents / 100).toFixed(2);

      // Demo-only payment record: no real money is charged.
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments
         (reservation_id, payment_type, amount,
          payment_method, payment_status,
          transaction_reference, paid_at)
         VALUES (?, 'final', ?, 'demo', 'completed', ?, NOW())`,
        [reservationId, amount, reference]
      );

      await connection.execute(
        `INSERT INTO activity_logs
         (user_id, reservation_id, action, description)
         VALUES (?, ?, ?, ?)`,
        [
          req.session.user.id,
          reservationId,
          'final_payment_confirmed',
          `Simulated final payment of MVR ${amount} recorded`
        ]
      );

      await connection.commit();
      started = false;

      return res.json({
        success: true,
        message: 'Simulated final payment completed',
        reservation_id: reservationId,
        payment_id: paymentResult.insertId,
        amount_paid: amount,
        final_balance: '0.00',
        currency: 'MVR',
        transaction_reference: reference,
        reservation_status: 'dining_done'
      });

    } catch (error) {
      if (connection && started) {
        await connection.rollback();
      }

      console.error('Final payment error:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Unable to confirm final payment'
      });
    } finally {
      if (connection) connection.release();
    }
  }
);

module.exports = router;
