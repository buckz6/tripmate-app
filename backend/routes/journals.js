const router  = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const pool    = require('../db');
const auth    = require('../middleware/auth');
const upload  = require('../middleware/upload');

// ── Columns returned on every SELECT ─────────────────────────────────────────
const COLS = `id, user_id, title, destination, date,
              description, photo_url, latitude, longitude, created_at`;

// ── Validation rules ──────────────────────────────────────────────────────────
const journalRules = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 255 }),
  body('destination').trim().notEmpty().withMessage('Destination is required.').isLength({ max: 255 }),
  body('date').isDate().withMessage('A valid date (YYYY-MM-DD) is required.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 5000 }),
  body('photo_url').optional({ nullable: true }).isURL().withMessage('photo_url must be a valid URL.'),
  body('latitude').optional({ nullable: true }).isFloat({ min: -90,  max: 90  }).withMessage('latitude must be between -90 and 90.'),
  body('longitude').optional({ nullable: true }).isFloat({ min: -180, max: 180 }).withMessage('longitude must be between -180 and 180.'),
];

const idRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid journal ID.'),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

// ── POST /api/journals/upload ────────────────────────────────────────────────
// Must be declared BEFORE /:id to avoid route collision.
router.post('/upload', auth, (req, res, next) => {
  upload.single('photo')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE')
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    if (err)
      return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: 'No file uploaded.' });

  const baseUrl  = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const photoUrl = `${baseUrl}/uploads/${req.file.filename}`;

  res.status(201).json({
    photo_url: photoUrl,
    filename:  req.file.filename,
    size:      req.file.size,
    mimetype:  req.file.mimetype,
  });
});

// ── GET /api/journals/public ──────────────────────────────────────────────────
// Public — no auth. Must be declared BEFORE /:id to avoid route collision.
router.get('/public', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
  const offset = Math.max(parseInt(req.query.offset) || 0,  0);
  try {
    const [rows] = await pool.execute(
      `SELECT j.${COLS.replace(/\n\s+/g, ', j.')},
              u.name AS author_name
       FROM   journals j
       JOIN   users    u ON u.id = j.user_id
       ORDER BY j.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) AS total FROM journals'
    );
    res.json({ journals: rows, total, limit, offset });
  } catch (err) {
    console.error('[journals:public]', err.message);
    res.status(500).json({ error: 'Failed to fetch public journals.' });
  }
});

// ── GET /api/journals ─────────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${COLS}
       FROM   journals
       WHERE  user_id = ?
       ORDER BY date DESC, created_at DESC`,
      [req.user.id]
    );
    res.json({ journals: rows });
  } catch (err) {
    console.error('[journals:getAll]', err.message);
    res.status(500).json({ error: 'Failed to fetch journals.' });
  }
});

// ── GET /api/journals/:id ─────────────────────────────────────────────────────
router.get('/:id', auth, idRule, validate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ${COLS} FROM journals WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length)
      return res.status(404).json({ error: 'Journal not found.' });
    res.json({ journal: rows[0] });
  } catch (err) {
    console.error('[journals:getOne]', err.message);
    res.status(500).json({ error: 'Failed to fetch journal.' });
  }
});

// ── POST /api/journals ────────────────────────────────────────────────────────
router.post('/', auth, journalRules, validate, async (req, res) => {
  const {
    title, destination, date,
    description = null, photo_url = null,
    latitude = null, longitude = null,
  } = req.body;
  try {
    const [result] = await pool.execute(
      `INSERT INTO journals
         (user_id, title, destination, date, description, photo_url, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, destination, date, description, photo_url, latitude, longitude]
    );

    // Create notification
    await pool.execute(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        req.user.id,
        'Jurnal Berhasil Disimpan 📔',
        `Jurnal '${title}' berhasil disimpan ke koleksi kamu`,
        'info'
      ]
    );

    res.status(201).json({
      journal: {
        id: result.insertId, user_id: req.user.id,
        title, destination, date, description, photo_url, latitude, longitude,
      },
    });
  } catch (err) {
    console.error('[journals:create]', err.message);
    res.status(500).json({ error: 'Failed to create journal.' });
  }
});

// ── PUT /api/journals/:id ─────────────────────────────────────────────────────
router.put('/:id', auth, idRule, journalRules, validate, async (req, res) => {
  const {
    title, destination, date,
    description = null, photo_url = null,
    latitude = null, longitude = null,
  } = req.body;
  try {
    const [result] = await pool.execute(
      `UPDATE journals
       SET title = ?, destination = ?, date = ?,
           description = ?, photo_url = ?, latitude = ?, longitude = ?
       WHERE id = ? AND user_id = ?`,
      [title, destination, date, description, photo_url, latitude, longitude,
       req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Journal not found.' });

    const [updated] = await pool.execute(
      `SELECT ${COLS} FROM journals WHERE id = ?`,
      [req.params.id]
    );
    res.json({ journal: updated[0] });
  } catch (err) {
    console.error('[journals:update]', err.message);
    res.status(500).json({ error: 'Failed to update journal.' });
  }
});

// ── DELETE /api/journals/:id ──────────────────────────────────────────────────
router.delete('/:id', auth, idRule, validate, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM journals WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Journal not found.' });
    res.json({ message: 'Journal deleted successfully.' });
  } catch (err) {
    console.error('[journals:delete]', err.message);
    res.status(500).json({ error: 'Failed to delete journal.' });
  }
});

module.exports = router;
