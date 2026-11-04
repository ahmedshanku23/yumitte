'use strict';

const { randomUUID } = require('node:crypto');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

// Call this INSIDE the same database transaction as the status change.
async function queueNotification(connection, eventType, entityId) {
  if (!Number.isSafeInteger(Number(entityId)) || Number(entityId) <= 0) {
    throw new Error('Invalid notification entity ID');
  }
  const supported = new Set(['reservation_confirmed', 'order_accepted', 'order_preparing', 'order_ready', 'order_served']);
  if (!supported.has(eventType)) throw new Error('Unsupported notification event');
  const eventKey = `${eventType}:${entityId}`;
  await connection.execute(
    `INSERT IGNORE INTO email_notification_outbox (event_key, event_type, entity_id)
     VALUES (?, ?, ?)`,
    [eventKey, eventType, entityId]
  );
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, x =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[x]);

async function getEmailDetails(eventType, entityId) {
  if (eventType === 'reservation_confirmed') {
    const [rows] = await pool.execute(
      `SELECT u.email, u.full_name, r.reservation_id,
              DATE_FORMAT(r.reservation_date, '%Y-%m-%d') AS reservation_date,
              TIME_FORMAT(r.reservation_time, '%H:%i') AS reservation_time,
              r.guest_count, t.table_number
       FROM reservations r
       JOIN users u ON u.user_id = r.customer_id
       JOIN restaurant_tables t ON t.table_id = r.table_id
       WHERE r.reservation_id = ? AND r.status IN ('confirmed','checked_in','dining_done','completed')`,
      [entityId]
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      to: r.email, name: r.full_name,
      subject: `Yumio reservation #${r.reservation_id} confirmed`,
      message: `Your reservation #${r.reservation_id} is confirmed for ${r.reservation_date} at ${r.reservation_time} (Maldives time), Table ${r.table_number}, ${r.guest_count} guest(s). We look forward to seeing you!`
    };
  }
  const [rows] = await pool.execute(
    `SELECT u.email, u.full_name, o.order_id
     FROM orders o
     JOIN reservations r ON r.reservation_id = o.reservation_id
     JOIN users u ON u.user_id = r.customer_id
     WHERE o.order_id = ? AND o.status <> 'cancelled'`,
    [entityId]
  );
  if (!rows.length) return null;
  const r = rows[0];
  const updates = {
    order_accepted: ['accepted', 'Our kitchen has accepted your order.'],
    order_preparing: ['being prepared', 'Our kitchen is preparing your food.'],
    order_ready: ['ready', 'Your order is ready for service.'],
    order_served: ['served', 'Your order has been marked as served. Enjoy your meal!']
  };
  const [label, message] = updates[eventType];
  return {
    to: r.email, name: r.full_name,
    subject: `Yumio order #${r.order_id} — ${label}`,
    message: `Order #${r.order_id}: ${message}`
  };
}

let running = false;
let transport;
function getTransport() {
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 587);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transport;
}

async function processNext() {
  const claim = randomUUID();
  // Lease an individual pending notification atomically, so parallel workers can't claim it.
  const [claimed] = await pool.execute(
    `UPDATE email_notification_outbox
     SET status='sending', claim_token=?, locked_until=DATE_ADD(UTC_TIMESTAMP(), INTERVAL 2 MINUTE), attempts=attempts+1
     WHERE (status='pending' AND next_attempt_at <= UTC_TIMESTAMP())
        OR (status='sending' AND locked_until < UTC_TIMESTAMP())
     ORDER BY notification_id ASC LIMIT 1`,
    [claim]
  );
  if (!claimed.affectedRows) return false;
  const [rows] = await pool.execute(
    `SELECT notification_id, event_type, entity_id, attempts
     FROM email_notification_outbox WHERE claim_token=? AND status='sending'`,
    [claim]
  );
  const job = rows[0];
  if (!job) return true;
  try {
    const details = await getEmailDetails(job.event_type, job.entity_id);
    if (!details || !details.to) {
      // Recipient or underlying entity unavailable; do not leak notification to a wrong account.
      await pool.execute(
        `UPDATE email_notification_outbox SET status='dead', locked_until=NULL, claim_token=NULL, last_error='No eligible recipient'
         WHERE notification_id=? AND claim_token=?`, [job.notification_id, claim]);
      return true;
    }
    const name = String(details.name || 'Customer').slice(0, 100);
    const text = `Hello ${name},\n\n${details.message}\n\nThank you for choosing Yumio.\nThis is an automated update; please do not reply.`;
    const html = `<div style="background:#ece5d6;padding:28px;font-family:Arial,sans-serif;color:#30231a"><div style="max-width:520px;margin:auto;background:#f7f2e8;padding:28px;border:1px solid #e5dac4"><h1 style="color:#073f34">Yumio</h1><hr style="border:0;border-top:2px dashed #d8c4a1"><h2>${escapeHtml(details.subject)}</h2><p>Hello ${escapeHtml(name)},</p><p>${escapeHtml(details.message)}</p><hr style="border:0;border-top:2px dashed #d8c4a1"><p style="color:#88745b;font-size:13px">Thank you for choosing Yumio. This is an automated update.</p></div></div>`;
    await getTransport().sendMail({ from: process.env.SMTP_FROM, to: details.to, subject: details.subject, text, html });
    await pool.execute(
      `UPDATE email_notification_outbox
       SET status='sent', sent_at=UTC_TIMESTAMP(), locked_until=NULL, claim_token=NULL, last_error=NULL
       WHERE notification_id=? AND claim_token=?`, [job.notification_id, claim]);
  } catch (error) {
    const failed = job.attempts >= 5;
    // Backoff in minutes: 1, 2, 4, 8, then dead.
    const delay = Math.min(30, 2 ** Math.max(0, job.attempts - 1));
    await pool.execute(
      `UPDATE email_notification_outbox
       SET status=?, next_attempt_at=DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE),
           locked_until=NULL, claim_token=NULL, last_error=?
       WHERE notification_id=? AND claim_token=?`,
      [failed ? 'dead' : 'pending', delay, String(error.code || error.message || 'Email delivery failed').slice(0, 255), job.notification_id, claim]);
    console.error('Yumio notification delivery failed:', error.code || error.message);
  }
  return true;
}

async function pollNotifications() {
  if (running) return;
  running = true;
  try {
    for (let i = 0; i < 10; i++) {
      if (!await processNext()) break;
    }
  } catch (error) {
    console.error('Yumio notification queue error:', error.code || error.message);
  } finally { running = false; }
}

function startNotificationWorker() {
  if (![process.env.SMTP_HOST, process.env.SMTP_USER, process.env.SMTP_PASS, process.env.SMTP_FROM].every(Boolean)) {
    console.warn('Yumio notifications disabled: SMTP configuration missing.');
    return;
  }
  pollNotifications();
  const interval = setInterval(pollNotifications, 15000);
  interval.unref();
}

module.exports = { queueNotification, startNotificationWorker };
