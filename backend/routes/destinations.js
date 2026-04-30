const router = require('express').Router();
const { param, query, validationResult } = require('express-validator');
const pool = require('../db');

// ── Validation helpers ────────────────────────────────────────────────────────
const idRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid destination ID.'),
];

const searchRule = [
  query('q').trim().notEmpty().withMessage('Search query q is required.').isLength({ max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50.'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer.'),
];

const listRule = [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50.'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer.'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

// ── GET /api/destinations/search?q= ─────────────────────────────────────────
// IMPORTANT: must be registered BEFORE /:id to avoid "search" matching as param
router.get('/search', searchRule, validate, async (req, res) => {
  const keyword = `%${req.query.q}%`;
  const limit   = parseInt(req.query.limit  || 10);
  const offset  = parseInt(req.query.offset || 0);

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, province, description, image_url, price_per_night, rating, category
       FROM   destinations
       WHERE  name LIKE ? OR province LIKE ? OR description LIKE ?
       ORDER BY rating DESC, name ASC
       LIMIT ? OFFSET ?`,
      [keyword, keyword, keyword, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM   destinations
       WHERE  name LIKE ? OR province LIKE ? OR description LIKE ?`,
      [keyword, keyword, keyword]
    );

    res.json({ destinations: rows, total, limit, offset });
  } catch (err) {
    console.error('[destinations:search]', err.message);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// ── GET /api/destinations ────────────────────────────────────────────────────
router.get('/', listRule, validate, async (req, res) => {
  const limit  = parseInt(req.query.limit  || 10);
  const offset = parseInt(req.query.offset || 0);

  try {
    const [rows] = await pool.execute(
      `SELECT id, name, province, description, image_url, price_per_night, rating, category
       FROM   destinations
       ORDER BY rating DESC, name ASC
       LIMIT ? OFFSET ?`,

      [limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM destinations'
    );

    res.json({ destinations: rows, total, limit, offset });
  } catch (err) {
    console.error('[destinations:getAll]', err.message);
    res.status(500).json({ error: 'Failed to fetch destinations.' });
  }
});

// ── GET /api/destinations/:id ────────────────────────────────────────────────
router.get('/:id', idRule, validate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, province, description, image_url, price_per_night, rating, category FROM destinations WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Destination not found.' });
    res.json({ destination: rows[0] });
  } catch (err) {
    console.error('[destinations:getOne]', err.message);
    res.status(500).json({ error: 'Failed to fetch destination.' });
  }
});

module.exports = router;
