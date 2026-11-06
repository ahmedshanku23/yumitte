require('dotenv').config();

const express = require('express');
const session = require('express-session');

const pool = require('./config/db');
const menuRoutes = require('./routes/menuRoutes');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const orderRoutes = require('./routes/orderRoutes');
const kitchenRoutes = require('./routes/kitchenRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const receiptRoutes = require('./routes/receiptRoutes');
const staffTablesRoutes = require('./routes/staffTablesRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');

const { startNotificationWorker } = require('./services/emailNotifications');

const adminOverviewRoutes = require('./routes/adminOverviewRoutes');

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Parse JSON requests
app.use(express.json());

// Validate session configuration
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is missing');
}

// Authentication sessions
app.use(session({
  name: 'yumio.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // Local development only
    maxAge: 1000 * 60 * 60
  }
}));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [result] = await pool.query(
      'SELECT DATABASE() AS database_name'
    );

    res.json({
      status: 'success',
      message: 'Yumio connected to MySQL!',
      database: result[0].database_name
    });
  } catch (error) {
    console.error('Database error:', error.message);

    res.status(503).json({
      status: 'error',
      message: 'Database connection failed'
    });
  }
});

// API routes
app.use('/api/menu', menuRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminOverviewRoutes);
app.use('/api/test', protectedRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use(
  express.static(
    require('node:path').join(__dirname, 'public')
  )
);
app.use('/api/staff', staffTablesRoutes);
app.use('/api/service-requests', serviceRequestRoutes);


const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Yumio API running on http://localhost:${PORT}`);
  startNotificationWorker();
});

server.on('error', (error) => {
  console.error('Server startup error:', error.message);
  process.exitCode = 1;
});
