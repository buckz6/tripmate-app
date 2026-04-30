const router = require('express').Router();
const { param, query, validationResult } = require('express-validator');
const pool = require('../db');
const auth = require('../middleware/auth');

// ── Shared journal SELECT fragment ────────────────────────────────────────────
// Returns all journal fields + author name + like count + isLiked for current user
const journalSelect = (userId) => ({
  sql: `
    SELECT  j.id, j.title, j.destination, j.date, j.description,
            j.photo_url, j.latitude, j.longitude, j.created_at,
            u.id   AS author_id,
            u.name AS author_name,
            COUNT(DISTINCT l.id)                          AS like_count,
            MAX(l.user_id = ?)                            AS is_liked
    FROM    journals j
    JOIN    users    u ON u.id = j.user_id
    LEFT JOIN likes  l ON l.journal_id = j.id
  `,
  baseParams: [userId],
});

// ── Validation helpers ────────────────────────────────────────────────────────
const journalIdRule = [
  param('journalId').isInt({ min: 1 }).withMessage('Invalid journal ID.'),
];

const searchRule = [
  query('q').trim().notEmpty().withMessage('Search query q is required.').isLength({ max: 100 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50.'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer.'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

// ── GET /api/community/search?q= ─────────────────────────────────────────────
// IMPORTANT: must be declared BEFORE /:journalId to avoid route collision
router.get('/search', auth, searchRule, validate, async (req, res) => {
  const keyword = `%${req.query.q}%`;
  const limit   = parseInt(req.query.limit  || 10);
  const offset  = parseInt(req.query.offset || 0);

  try {
    const { sql, baseParams } = journalSelect(req.user.id);
    const [rows] = await pool.execute(
      `${sql}
       WHERE  (j.title LIKE ? OR j.destination LIKE ?)
       GROUP BY j.id, u.id
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [...baseParams, keyword, keyword, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM journals j WHERE j.title LIKE ? OR j.destination LIKE ?',
      [keyword, keyword]
    );

    res.json({
      journals: rows.map(normalizeRow),
      total: Number(total),
      limit,
      offset,
    });
  } catch (err) {
    console.error('[community:search]', err.message);
    res.status(500).json({ error: 'Search failed.' });
  }
});

// ── GET /api/community ────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
  const offset = Math.max(parseInt(req.query.offset) || 0,  0);

  try {
    const { sql, baseParams } = journalSelect(req.user.id);
    const [rows] = await pool.execute(
      `${sql}
       GROUP BY j.id, u.id
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [...baseParams, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM journals'
    );

    res.json({
      journals: rows.map(normalizeRow),
      total: Number(total),
      limit,
      offset,
    });
  } catch (err) {
    console.error('[community:getAll]', err.message);
    res.status(500).json({ error: 'Failed to fetch community journals.' });
  }
});

// ── POST /api/community/like/:journalId — atomic like toggle ─────────────────
router.post('/like/:journalId', auth, journalIdRule, validate, async (req, res) => {
  const { journalId } = req.params;
  const userId = req.user.id;

  try {
    // Verify journal exists
    const [journal] = await pool.execute(
      'SELECT id FROM journals WHERE id = ?',
      [journalId]
    );
    if (!journal.length)
      return res.status(404).json({ error: 'Journal not found.' });

    // Atomic toggle: try INSERT — if duplicate, DELETE instead
    // UNIQUE constraint on (user_id, journal_id) makes this race-condition safe
    const [existing] = await pool.execute(
      'SELECT id FROM likes WHERE user_id = ? AND journal_id = ?',
      [userId, journalId]
    );

    let liked;
    if (existing.length) {
      await pool.execute(
        'DELETE FROM likes WHERE user_id = ? AND journal_id = ?',
        [userId, journalId]
      );
      liked = false;
    } else {
      await pool.execute(
        'INSERT INTO likes (user_id, journal_id) VALUES (?, ?)',
        [userId, journalId]
      );
      liked = true;
    }

    // Return fresh like count
    const [[{ like_count }]] = await pool.execute(
      'SELECT COUNT(*) AS like_count FROM likes WHERE journal_id = ?',
      [journalId]
    );

    res.json({ liked, like_count: Number(like_count) });
  } catch (err) {
    // Handle race condition: duplicate INSERT from concurrent requests
    if (err.code === 'ER_DUP_ENTRY') {
      await pool.execute(
        'DELETE FROM likes WHERE user_id = ? AND journal_id = ?',
        [userId, journalId]
      );
      const [[{ like_count }]] = await pool.execute(
        'SELECT COUNT(*) AS like_count FROM likes WHERE journal_id = ?',
        [journalId]
      );
      return res.json({ liked: false, like_count: Number(like_count) });
    }
    console.error('[community:like]', err.message);
    res.status(500).json({ error: 'Failed to toggle like.' });
  }
});

// ── Helper: normalise MySQL BigInt fields to JS primitives ───────────────────
function normalizeRow(row) {
  return {
    ...row,
    like_count: Number(row.like_count),
    is_liked:   Boolean(row.is_liked),
  };
}

module.exports = router;
