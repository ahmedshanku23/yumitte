
const express = require('express');
const { requireAuth, requireRole } =
  require('../middleware/authMiddleware');

const router = express.Router();

router.get('/customer', requireRole('customer'), (req, res) => {
  res.json({ success: true, role: 'customer' });
});

router.get('/staff', requireRole('staff'), (req, res) => {
  res.json({ success: true, role: 'staff' });
});

router.get('/kitchen', requireRole('kitchen'), (req, res) => {
  res.json({ success: true, role: 'kitchen' });
});

router.get('/admin', requireRole('admin'), (req, res) => {
  res.json({ success: true, role: 'admin' });
});

router.get('/profile', requireAuth, (req, res) => {
  res.json({ success: true, user: req.session.user });
});

module.exports = router;
