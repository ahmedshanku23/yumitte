
const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/db');

const router = express.Router();

// Public signup creates customer accounts only. Never accept a role from the browser.
router.post('/register', async (req, res) => {
  const { full_name, email, password, confirm_password } = req.body || {};
  const name = typeof full_name === 'string' ? full_name.trim().replace(/\s+/g, ' ') : '';
  const mail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (name.length < 2 || name.length > 150) {
    return res.status(400).json({ success: false, message: 'Full name must be 2–150 characters.' });
  }
  if (mail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
    return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and at most 72 bytes.' });
  }
  if (password !== confirm_password) {
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    await pool.execute(
      `INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'customer')`,
      [name, mail, hash]
    );
    return res.status(201).json({ success: true, message: 'Customer account created. You can now sign in.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
    }
    console.error('Registration error:', error.code || error.message);
    return res.status(500).json({ success: false, message: 'Unable to create account. Check backend logs.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== 'string' ||
    typeof password !== 'string' ||
    !email.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    const [users] = await pool.execute(
      `SELECT user_id, full_name, email,
              password_hash, role
       FROM users
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    const user = users[0];

    const valid = user
      ? await bcrypt.compare(password, user.password_hash)
      : false;

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Unable to create session'
        });
      }

      req.session.user = {
        id: user.user_id,
        name: user.full_name,
        email: user.email,
        role: user.role
      };

      req.session.save((err) => {
        if (err) {
          return res.status(500).json({
            success: false,
            message: 'Unable to save session'
          });
        }

        res.json({
          success: true,
          message: 'Login successful',
          user: req.session.user
        });
      });
    });

  } catch (error) {
    console.error('Login error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated'
    });
  }

  res.json({
    success: true,
    user: req.session.user
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }

    res.clearCookie('yumio.sid');
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  });
});


// Password recovery: emailed, single-use OTP (10-minute expiry).
// Configure SMTP and RESET_OTP_SECRET; never log OTPs or return them in API responses.
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const RESET_TTL_MS = 10 * 60 * 1000;
const RESET_VERIFY_TTL_MS = 10 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const resetRequests = new Map(); // basic per-process IP throttling; use shared limiter for multi-instance deployments.
const GENERIC_RESET_NOTICE = 'If an account exists for that email, we have sent a reset code. Please check your inbox.';
const normalizedEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = value => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const otpDigest = (email, code) => crypto.createHmac('sha256', process.env.RESET_OTP_SECRET).update(`otp:${email}:${code}`).digest('hex');
const tokenDigest = token => crypto.createHmac('sha256', process.env.RESET_OTP_SECRET).update(`verified:${token}`).digest('hex');
const securelyEqual = (a, b) => {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
};
const resetConfigured = () =>
  Boolean(process.env.RESET_OTP_SECRET && process.env.RESET_OTP_SECRET.length >= 32 &&
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SMTP_FROM);
const resetTransport = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT || 587) === 465,
  requireTLS: Number(process.env.SMTP_PORT || 587) !== 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});
const failReset = (res, error) => {
  console.error('Password reset error:', error.code || error.message);
  return res.status(500).json({ success: false, message: 'Password recovery is temporarily unavailable.' });
};

router.post('/password-reset/request', async (req, res) => {
  const email = normalizedEmail(req.body?.email);
  if (!validEmail(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
  if (!resetConfigured()) return res.status(503).json({ success: false, message: 'Email recovery is not configured. Contact the administrator.' });

  const ip = req.ip || 'unknown';
  const now = Date.now();
  const previous = resetRequests.get(ip) || [];
  const recent = previous.filter(t => now - t < 60 * 60 * 1000);
  if (recent.length >= 12) return res.status(429).json({ success: false, message: 'Too many requests. Try again later.' });
  recent.push(now); resetRequests.set(ip, recent);
  if (resetRequests.size > 10000) resetRequests.clear();

  let connection;
  try {
    const [users] = await pool.execute('SELECT user_id FROM users WHERE email = ? LIMIT 1', [email]);
    // Same response for registered and unregistered email addresses.
    if (!users.length) return res.status(404).json({ success: false, message: 'This email is not registered.' });

    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      'SELECT email, sent_at FROM password_reset_challenges WHERE email = ? FOR UPDATE', [email]
    );
    if (existing.length && (now - new Date(existing[0].sent_at).getTime()) < RESET_COOLDOWN_MS) {
      await connection.rollback();
      return res.json({ success: true, message: GENERIC_RESET_NOTICE });
    }

    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const digest = otpDigest(email, otp);
    await connection.execute(
      `INSERT INTO password_reset_challenges
        (email, otp_hash, expires_at, sent_at, attempts, verified_token_hash, verified_expires_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE), UTC_TIMESTAMP(), 0, NULL, NULL)
       ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at),
         sent_at = VALUES(sent_at), attempts = 0, verified_token_hash = NULL, verified_expires_at = NULL`,
      [email, digest]
    );
    await connection.commit();
    connection.release(); connection = null;

    try {
      await resetTransport().sendMail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Yumio password reset code',
        text: `Your Yumio password reset code is ${otp}. It expires in 10 minutes. If you did not request a reset, ignore this message.`,
      });
    } catch (mailError) {
      console.error('Yumio SMTP send failure:', mailError.code || mailError.message);
      await pool.execute('DELETE FROM password_reset_challenges WHERE email = ? AND otp_hash = ?', [email, digest]);
      return res.status(503).json({ success: false, message: 'Unable to send email right now. Please try again.' });
    }
    return res.json({ success: true, message: GENERIC_RESET_NOTICE });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => { });
    return failReset(res, error);
  } finally { if (connection) connection.release(); }
});

router.post('/password-reset/verify', async (req, res) => {
  const email = normalizedEmail(req.body?.email);
  const otp = req.body?.otp;
  if (!validEmail(email) || typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: 'Enter the six-digit code from your email.' });
  }
  if (!process.env.RESET_OTP_SECRET || process.env.RESET_OTP_SECRET.length < 32) {
    return res.status(503).json({ success: false, message: 'Password recovery is unavailable.' });
  }
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT otp_hash, attempts, (expires_at > UTC_TIMESTAMP()) AS valid
       FROM password_reset_challenges WHERE email = ? FOR UPDATE`, [email]
    );
    const record = rows[0];
    if (!record || !record.valid || record.attempts >= MAX_OTP_ATTEMPTS) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Code expired or invalid. Request a new code.' });
    }
    if (!securelyEqual(record.otp_hash, otpDigest(email, otp))) {
      await connection.execute('UPDATE password_reset_challenges SET attempts = attempts + 1 WHERE email = ?', [email]);
      await connection.commit();
      return res.status(400).json({ success: false, message: 'Code expired or invalid. Request a new code.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    await connection.execute(
      `UPDATE password_reset_challenges SET otp_hash = NULL, attempts = ?,
        verified_token_hash = ?, verified_expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE)
       WHERE email = ?`, [MAX_OTP_ATTEMPTS, tokenDigest(resetToken), email]
    );
    await connection.commit();
    return res.json({ success: true, reset_token: resetToken, message: 'Code verified. Choose a new password.' });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => { });
    return failReset(res, error);
  } finally { if (connection) connection.release(); }
});

router.post('/password-reset/complete', async (req, res) => {
  const email = normalizedEmail(req.body?.email);
  const token = req.body?.reset_token;
  const password = req.body?.password;
  const confirmation = req.body?.confirm_password;
  if (!validEmail(email) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ success: false, message: 'Reset session invalid. Request a new code.' });
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters and at most 72 bytes.' });
  }
  if (password !== confirmation) return res.status(400).json({ success: false, message: 'Passwords do not match.' });
  if (!process.env.RESET_OTP_SECRET || process.env.RESET_OTP_SECRET.length < 32) {
    return res.status(503).json({ success: false, message: 'Password recovery is unavailable.' });
  }
  let connection;
  try {
    const hash = await bcrypt.hash(password, 12);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT verified_token_hash, (verified_expires_at > UTC_TIMESTAMP()) AS valid
       FROM password_reset_challenges WHERE email = ? FOR UPDATE`, [email]
    );
    if (!rows.length || !rows[0].valid || !securelyEqual(rows[0].verified_token_hash, tokenDigest(token))) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Reset session expired. Request a new code.' });
    }
    const [result] = await connection.execute('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    if (result.affectedRows !== 1) throw new Error('Reset target account not found');
    await connection.execute('DELETE FROM password_reset_challenges WHERE email = ?', [email]);
    await connection.commit();
    return res.json({ success: true, message: 'Password updated. You can now sign in.' });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => { });
    return failReset(res, error);
  } finally { if (connection) connection.release(); }
});

module.exports = router;
