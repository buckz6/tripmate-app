const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const groupRoutes = require('./routes/groups');

const authRoutes        = require('./routes/auth');
const aiRoutes          = require('./routes/ai');
const journalRoutes     = require('./routes/journals');
const locationRoutes    = require('./routes/locations');
const destinationRoutes = require('./routes/destinations');
const bookingRoutes     = require('./routes/bookings');
const communityRoutes   = require('./routes/community');
const profileRoutes     = require('./routes/profile');
const notificationRoutes = require('./routes/notifications');
const authMiddleware    = require('./middleware/auth');
const scheduler         = require('./scheduler');

const app = express();

// ── Security & logging ────────────────────────────────────────────────────────
app.use(helmet());
// Allow cross-origin access for uploaded images served as static files
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGIN || 'http://localhost:3000').split(','),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many AI requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authLimiter,   authRoutes);
app.use('/api/ai',           aiLimiter,     authMiddleware, aiRoutes);
app.use('/api/journals',                    journalRoutes);
app.use('/api/locations',                   authMiddleware, locationRoutes);
app.use('/api/destinations', publicLimiter, destinationRoutes);
app.use('/api/bookings',                    authMiddleware, bookingRoutes);
app.use('/api/community',                   authMiddleware, communityRoutes);
app.use('/api/profile',                     authMiddleware, profileRoutes);
app.use('/api/notifications',               authMiddleware, notificationRoutes);

app.use('/api/groups', groupRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ message: 'TripMate API is running' });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error.' : err.message,
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  scheduler.start();
});


module.exports = app;
