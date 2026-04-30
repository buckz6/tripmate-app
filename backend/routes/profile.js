const router = require('express').Router();
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const pool = require('../db');

// ── Validation rules ──────────────────────────────────────────────────────────
const updateRules = [
  body('name')
    .trim().notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be at most 100 characters.'),
  body('email')
    .trim().isEmail().withMessage('A valid email is required.')
    .normalizeEmail(),
];

const passwordRules = [
  body('old_password')
    .notEmpty().withMessage('Current password is required.'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('New password must contain at least one number.')
    .custom((val, { req }) => {
      if (val === req.body.old_password)
        throw new Error('New password must be different from the current password.');
      return true;
    }),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

// ── GET /api/profile ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    console.error('[profile:get]', err.message);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
});

// ── PUT /api/profile ──────────────────────────────────────────────────────────
router.put('/', updateRules, validate, async (req, res) => {
  const { name, email } = req.body;
  try {
    // Check email is not taken by another user
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, req.user.id]
    );
    if (existing.length)
      return res.status(409).json({ error: 'Email is already in use by another account.' });

    await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name, email, req.user.id]
    );

    res.json({ user: { id: req.user.id, name, email } });
  } catch (err) {
    console.error('[profile:update]', err.message);
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email is already in use by another account.' });
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ── PUT /api/profile/password ─────────────────────────────────────────────────
router.put('/password', passwordRules, validate, async (req, res) => {
  const { old_password, new_password } = req.body;
  try {
    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'User not found.' });

    const match = await bcrypt.compare(old_password, rows[0].password);
    if (!match)
      return res.status(401).json({ error: 'Current password is incorrect.' });

    const hash = await bcrypt.hash(new_password, 12);
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hash, req.user.id]
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[profile:password]', err.message);
    res.status(500).json({ error: 'Failed to update password.' });
  }
});

// ── GET /api/profile/stats ────────────────────────────────────────────────────
// IMPORTANT: declared BEFORE /password to ensure correct route matching
router.get('/stats', async (req, res) => {
  try {
    const [[stats]] = await pool.execute(
      `SELECT
         COUNT(*)                          AS total_journals,
         COUNT(DISTINCT destination)       AS total_destinations,
         COALESCE(SUM(
           CASE WHEN photo_url IS NOT NULL THEN 1 ELSE 0 END
         ), 0)                             AS total_photos
       FROM journals
       WHERE user_id = ?`,
      [req.user.id]
    );

    const [[{ member_since }]] = await pool.execute(
      'SELECT created_at AS member_since FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      stats: {
        total_journals:      Number(stats.total_journals),
        total_destinations:  Number(stats.total_destinations),
        total_photos:        Number(stats.total_photos),
        member_since,
      },
    });
  } catch (err) {
    console.error('[profile:stats]', err.message);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

module.exports = router;
