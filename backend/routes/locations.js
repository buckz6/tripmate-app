const router = require('express').Router();
const { body, param, query, validationResult } = require('express-validator');
const pool = require('../db');
const verifyToken = require('../middleware/auth');

// ── Validation helpers ────────────────────────────────────────────────────────
const locationRules = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 255 }),
  body('latitude').notEmpty().isFloat({ min: -90,  max: 90  }).withMessage('latitude must be a number between -90 and 90.'),
  body('longitude').notEmpty().isFloat({ min: -180, max: 180 }).withMessage('longitude must be a number between -180 and 180.'),
  body('journal_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('journal_id must be a positive integer.'),
];

const idRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid location ID.'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

// ── GET /api/locations — all locations for the logged-in user ─────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT l.id, l.name, l.latitude, l.longitude, l.journal_id,
              j.title AS journal_title, l.created_at
       FROM   locations l
       LEFT JOIN journals j ON j.id = l.journal_id AND j.user_id = l.user_id
       WHERE  l.user_id = ?
       ORDER BY l.created_at DESC`,
      [req.user.id]
    );
    res.json({ locations: rows });
  } catch (err) {
    console.error('[locations:getAll]', err.message);
    res.status(500).json({ error: 'Failed to fetch locations.' });
  }
});

// ── POST /api/locations — save a new location ─────────────────────────────────
router.post('/', verifyToken, locationRules, validate, async (req, res) => {
  const { name, latitude, longitude, journal_id = null } = req.body;

  try {
    // If journal_id is provided, verify it belongs to the current user
    if (journal_id !== null) {
      const [journal] = await pool.execute(
        'SELECT id FROM journals WHERE id = ? AND user_id = ?',
        [journal_id, req.user.id]
      );
      if (!journal.length)
        return res.status(404).json({ error: 'Journal not found.' });
    }

    const [result] = await pool.execute(
      'INSERT INTO locations (user_id, journal_id, name, latitude, longitude) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, journal_id, name, latitude, longitude]
    );

    res.status(201).json({
      location: { id: result.insertId, user_id: req.user.id, journal_id, name, latitude, longitude },
    });
  } catch (err) {
    console.error('[locations:create]', err.message);
    res.status(500).json({ error: 'Failed to save location.' });
  }
});

// ── DELETE /api/locations/:id — delete a location (owner only) ───────────────
router.delete('/:id', verifyToken, idRule, validate, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM locations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Location not found.' });
    res.json({ message: 'Location deleted successfully.' });
  } catch (err) {
    console.error('[locations:delete]', err.message);
    res.status(500).json({ error: 'Failed to delete location.' });
  }
});

module.exports = router;
