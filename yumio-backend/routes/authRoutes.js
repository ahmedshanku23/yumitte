
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

module.exports = router;
