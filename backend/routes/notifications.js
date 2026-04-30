const router = require('express').Router();
const { body, param, validationResult } = require('express-validator');
const pool = require('../db');

// ── Helpers ───────────────────────────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array().map(e => e.msg) });
  next();
};

const idRule = [param('id').isInt({ min: 1 }).withMessage('Invalid notification ID.')];

// ── GET /api/notifications ────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, title, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.user.id]
    );
    res.json({ notifications: rows });
  } catch (err) {
    console.error('[notifications:getAll]', err.message);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// ── PUT /api/notifications/:id/read ────────────────────────────────────────────
router.put('/:id/read', idRule, validate, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Notification not found.' });
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('[notifications:markRead]', err.message);
    res.status(500).json({ error: 'Failed to mark notification as read.' });
  }
});

// ── PUT /api/notifications/read-all ───────────────────────────────────────────
router.put('/read-all', async (req, res) => {
  try {
    await pool.execute(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('[notifications:markAllRead]', err.message);
    res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
});

// ── DELETE /api/notifications/:id ─────────────────────────────────────────────
router.delete('/:id', idRule, validate, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: 'Notification not found.' });
    res.json({ message: 'Notification deleted.' });
  } catch (err) {
    console.error('[notifications:delete]', err.message);
    res.status(500).json({ error: 'Failed to delete notification.' });
  }
});

// ── GET /api/notifications/unread-count ───────────────────────────────────────
router.get('/unread-count', async (req, res) => {
  try {
    const [[row]] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [req.user.id]
    );
    res.json({ count: row.count });
  } catch (err) {
    console.error('[notifications:unreadCount]', err.message);
    res.status(500).json({ error: 'Failed to get unread count.' });
  }
});

module.exports = router;