const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const pool   = require('../db');

// ── Helpers ───────────────────────────────────────────────────────────────────
const BOOKING_COLS = `
  b.id, b.user_id, b.destination_id, b.booking_code,
  b.check_in_date, b.check_out_date, b.duration_days,
  b.total_price, b.status, b.payment_method, b.created_at,
  d.name        AS destination_name,
  d.province    AS destination_province,
  d.image_url   AS destination_image,
  d.category    AS destination_category,
  d.price_per_night`;

function generateBookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function uniqueBookingCode(pool) {
  let code, exists;
  do {
    code = generateBookingCode();
    const [[row]] = await pool.execute(
      'SELECT id FROM bookings WHERE booking_code = ?', [code]
    );
    exists = !!row;
  } while (exists);
  return code;
}

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

const idRule = [param('id').isInt({ min: 1 }).withMessage('Invalid booking ID.')];

const bookingRules = [
  body('destination_id').isInt({ min: 1 }).withMessage('destination_id is required.'),
  body('check_in_date').isDate().withMessage('check_in_date must be YYYY-MM-DD.'),
  body('check_out_date').isDate().withMessage('check_out_date must be YYYY-MM-DD.'),
  body('payment_method')
    .isIn(['transfer', 'kartu_kredit', 'dompet_digital'])
    .withMessage('payment_method must be transfer, kartu_kredit, or dompet_digital.'),
];

// ── GET /api/bookings ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   destinations d ON d.id = b.destination_id
       WHERE  b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ bookings: rows });
  } catch (err) {
    console.error('[bookings:getAll]', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// ── POST /api/bookings ────────────────────────────────────────────────────────
router.post('/', bookingRules, validate, async (req, res) => {
  const { destination_id, check_in_date, check_out_date, payment_method } = req.body;

  const checkIn  = new Date(check_in_date);
  const checkOut = new Date(check_out_date);
  if (checkOut <= checkIn)
    return res.status(400).json({ error: 'check_out_date must be after check_in_date.' });

  const duration_days = Math.round((checkOut - checkIn) / 86_400_000);

  try {
    // Verify destination exists and get price
    const [[dest]] = await pool.execute(
      'SELECT id, price_per_night FROM destinations WHERE id = ?',
      [destination_id]
    );
    if (!dest)
      return res.status(404).json({ error: 'Destination not found.' });

    const total_price   = parseFloat(dest.price_per_night) * duration_days;
    const booking_code  = await uniqueBookingCode(pool);

    const [result] = await pool.execute(
      `INSERT INTO bookings
         (user_id, destination_id, check_in_date, check_out_date,
          duration_days, total_price, status, payment_method, booking_code)
       VALUES (?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`,
      [req.user.id, destination_id, check_in_date, check_out_date,
       duration_days, total_price, payment_method, booking_code]
    );

    const [[booking]] = await pool.execute(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   destinations d ON d.id = b.destination_id
       WHERE  b.id = ?`,
      [result.insertId]
    );

    // Booking confirmed + weather tip notifications
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type) VALUES
         (?, ?, ?, 'booking'),
         (?, ?, ?, 'weather')`,
      [
        req.user.id,
        'Booking Dikonfirmasi! ✈️',
        `Booking ke ${booking.destination_name} berhasil dikonfirmasi. Kode booking: ${booking.booking_code}`,
        req.user.id,
        `Tips Perjalanan ke ${booking.destination_name} 🌤️`,
        `Pastikan cek cuaca sebelum berangkat. Bawa perlengkapan sesuai kondisi cuaca destinasi kamu.`,
      ]
    );

    res.status(201).json({ booking });
  } catch (err) {
    console.error('[bookings:create]', err.message);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
router.get('/:id', idRule, validate, async (req, res) => {
  try {
    const [[booking]] = await pool.execute(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   destinations d ON d.id = b.destination_id
       WHERE  b.id = ? AND b.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!booking)
      return res.status(404).json({ error: 'Booking not found.' });
    res.json({ booking });
  } catch (err) {
    console.error('[bookings:getOne]', err.message);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
});

// ── PUT /api/bookings/:id/cancel ──────────────────────────────────────────────
router.put('/:id/cancel', idRule, validate, async (req, res) => {
  try {
    const [[booking]] = await pool.execute(
      'SELECT id, status FROM bookings WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!booking)
      return res.status(404).json({ error: 'Booking not found.' });
    if (booking.status === 'cancelled')
      return res.status(400).json({ error: 'Booking is already cancelled.' });

    await pool.execute(
      "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
      [req.params.id]
    );
    res.json({ message: 'Booking cancelled successfully.', id: booking.id });
  } catch (err) {
    console.error('[bookings:cancel]', err.message);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
});

// ── GET /api/bookings/code/:bookingCode ────────────────────────────────────────
router.get('/code/:bookingCode', async (req, res) => {
  try {
    const [[booking]] = await pool.execute(
      `SELECT ${BOOKING_COLS}
       FROM   bookings b
       JOIN   destinations d ON d.id = b.destination_id
       WHERE  b.booking_code = ? AND b.user_id = ?`,
      [req.params.bookingCode, req.user.id]
    );
    if (!booking)
      return res.status(404).json({ error: 'Booking not found.' });
    res.json({ booking });
  } catch (err) {
    console.error('[bookings:getByCode]', err.message);
    res.status(500).json({ error: 'Failed to fetch booking.' });
  }
});

module.exports = router;
