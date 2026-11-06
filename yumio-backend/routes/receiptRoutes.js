'use strict';
const express = require('express');
const pool = require('../config/db');
const { requireRole } = require('../middleware/authMiddleware');
const router = express.Router();
router.use(requireRole('customer'));
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

const escapeHtml = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const payNumber = id => `YUM-PAY-${String(id).padStart(6, '0')}`;
const refundNumber = id => `YUM-REF-${String(id).padStart(6, '0')}`;

router.get('/my', async (req, res) => {
    try {
        const [payments] = await pool.execute(`
      SELECT p.payment_id AS id, p.reservation_id, p.amount,
             p.paid_at AS created_at, p.payment_type
      FROM payments p JOIN reservations r ON r.reservation_id = p.reservation_id
      WHERE r.customer_id = ? AND p.payment_status = 'completed'`, [req.session.user.id]);
        const [refunds] = await pool.execute(`
      SELECT c.cancellation_id AS id, c.reservation_id, c.refund_amount AS amount,
             c.cancelled_at AS created_at
      FROM reservation_cancellations c WHERE c.customer_id = ? AND c.refund_status = 'demo_recorded'`, [req.session.user.id]);
        const data = [
            ...payments.map(x => ({
                id: x.id, type: 'payment', receipt_number: payNumber(x.id),
                reservation_id: x.reservation_id, amount: Number(x.amount).toFixed(2), created_at: x.created_at
            })),
            ...refunds.map(x => ({
                id: x.id, type: 'refund', receipt_number: refundNumber(x.id),
                reservation_id: x.reservation_id, amount: Number(x.amount).toFixed(2), created_at: x.created_at
            }))
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Receipt list error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load receipts.' });
    }
});

router.get('/:type/:id', async (req, res) => {
    const id = Number(req.params.id), type = req.params.type;
    if (!['payment', 'refund'].includes(type) || !Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ success: false, message: 'Invalid receipt.' });
    }
    try {
        let details;
        if (type === 'payment') {
            const [rows] = await pool.execute(`
        SELECT p.payment_id, p.reservation_id, p.order_id, p.payment_type,
               p.amount, p.payment_method, p.payment_status, p.transaction_reference, p.paid_at,
               u.full_name, u.email
        FROM payments p JOIN reservations r ON r.reservation_id = p.reservation_id
        JOIN users u ON u.user_id = r.customer_id
        WHERE p.payment_id = ? AND r.customer_id = ? AND p.payment_status = 'completed'`,
                [id, req.session.user.id]);
            if (!rows.length) return res.status(404).send('Receipt not found.');
            const row = rows[0];
            details = {
                number: payNumber(id), heading: 'Payment Receipt', name: row.full_name,
                email: row.email, reservation: row.reservation_id, order: row.order_id,
                event: row.payment_type === 'deposit' ? 'Pre-order deposit (40%)' : 'Final payment',
                amount: Number(row.amount).toFixed(2), fee: null,
                timestamp: row.paid_at, reference: row.transaction_reference || 'Demo ledger',
                method: row.payment_method, status: 'Completed (Demo)'
            };
        } else {
            const [rows] = await pool.execute(`
        SELECT c.cancellation_id, c.reservation_id, c.cancellation_fee,
               c.refund_amount, c.fee_outstanding, c.cancelled_at,
               u.full_name, u.email
        FROM reservation_cancellations c
        JOIN users u ON u.user_id = c.customer_id
        WHERE c.cancellation_id = ? AND c.customer_id = ? AND c.refund_status = 'demo_recorded'`,
                [id, req.session.user.id]);
            if (!rows.length) return res.status(404).send('Receipt not found.');
            const row = rows[0];
            details = {
                number: refundNumber(id), heading: 'Refund / Cancellation Receipt',
                name: row.full_name, email: row.email, reservation: row.reservation_id,
                event: 'Cancellation adjustment', amount: Number(row.refund_amount).toFixed(2),
                fee: Number(row.cancellation_fee).toFixed(2), outstanding: Number(row.fee_outstanding).toFixed(2),
                timestamp: row.cancelled_at, reference: `Cancellation #${row.cancellation_id}`,
                method: 'Demo ledger', status: 'Recorded (Demo)'
            };
        }
        const line = (k, v) => `<div class="line"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v ?? '—')}</strong></div>`;
        const markup = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${escapeHtml(details.number)} · Yumio</title><style>
      body{font:16px/1.5 Arial,sans-serif;background:#ece5d6;color:#2e2218;margin:0;padding:32px 14px}
      main{max-width:520px;background:#f7f2e8;margin:auto;padding:32px;border:1px solid #d8c4a1}
      h1{font:36px Georgia,serif;color:#073f34;margin:0}h2{font:25px Georgia,serif;margin:18px 0}
      .sub{color:#8c785b;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
      hr{border:0;border-top:2px dashed #d8c4a1;margin:20px 0}.line{display:flex;justify-content:space-between;gap:20px;padding:8px 0;border-bottom:1px dotted #d8c4a1}
      .line strong{text-align:right;overflow-wrap:anywhere}.total{font-size:24px;color:#073f34}.note{font-size:13px;color:#6b6052}
      button{background:#2e2218;color:#fff;border:0;padding:12px 20px;cursor:pointer;margin:22px 0 0}
      @media print{body{padding:0;background:#fff}main{border:0;max-width:none}button{display:none}}
      </style></head><body><main><div class="sub">Yumio · Reserve · Order · Enjoy</div><h1>Yumio</h1><hr>
      <h2>${escapeHtml(details.heading)}</h2><div class="sub">${escapeHtml(details.number)}</div>
      ${line('Customer', details.name)}${line('Email', details.email)}${line('Reservation', `#${details.reservation}`)}
      ${details.order ? line('Order', `#${details.order}`) : ''}${line('Transaction', details.event)}
      ${line('Date', details.timestamp ? new Date(details.timestamp).toLocaleString('en-GB', { timeZone: 'Indian/Maldives', dateStyle: 'medium', timeStyle: 'short' }) + ' Maldives time' : '—')}
      ${line('Reference', details.reference)}${line('Method', details.method)}${line('Status', details.status)}
      ${details.fee != null ? line('Cancellation fee', `MVR ${details.fee}`) : ''}
      ${details.outstanding != null ? line('Fee outstanding', `MVR ${details.outstanding}`) : ''}
      <div class="line total"><span>${type === 'refund' ? 'Refund amount' : 'Amount paid'}</span><strong>MVR ${escapeHtml(details.amount)}</strong></div>
      <p class="note">This receipt records a simulated Yumio demo transaction. It is not proof of a real payment or bank refund.</p>
      <button onclick="window.print()">Print / Save as PDF</button></main></body></html>`;
        res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
        res.set('X-Content-Type-Options', 'nosniff');
        res.type('html').send(markup);
    } catch (error) {
        console.error('Receipt rendering error:', error.message);
        return res.status(500).send('Unable to generate receipt.');
    }
});
module.exports = router;
