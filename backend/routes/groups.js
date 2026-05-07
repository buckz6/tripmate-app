const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const genInviteCode = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase() +
  Math.random().toString(36).substring(2, 6).toUpperCase();

const askGemini = async (prompt) => {
  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json|```/g, '').trim();
  return JSON.parse(text);
};

// POST /api/groups
router.post('/', auth, async (req, res) => {
  const { title, booking_id, parsed_booking } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    let invite_code;
    let unique = false;
    while (!unique) {
      invite_code = genInviteCode();
      const [rows] = await conn.query('SELECT id FROM group_trips WHERE invite_code = ?', [invite_code]);
      if (!rows.length) unique = true;
    }

    const [result] = await conn.query(
      'INSERT INTO group_trips (booking_id, coordinator_id, title, invite_code, parsed_data, status) VALUES (?, ?, ?, ?, ?, ?)',
      [booking_id || null, req.user.id, title, invite_code, parsed_booking ? JSON.stringify(parsed_booking) : null, 'open']
    );
    const groupId = result.insertId;

    const [[user]] = await conn.query('SELECT name FROM users WHERE id = ?', [req.user.id]);
    await conn.query(
      'INSERT INTO group_members (group_trip_id, user_id, name, role) VALUES (?, ?, ?, ?)',
      [groupId, req.user.id, user?.name || 'Coordinator', 'coordinator']
    );

    await conn.commit();
    const [[group]] = await conn.query('SELECT * FROM group_trips WHERE id = ?', [groupId]);
    res.status(201).json({ success: true, data: { ...group, parsed_data: group.parsed_data ? JSON.parse(group.parsed_data) : null } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// POST /api/groups/parse-receipt
router.post('/parse-receipt', auth, async (req, res) => {
  const { receipt_text } = req.body;
  if (!receipt_text) return res.status(400).json({ error: 'receipt_text is required' });

  try {
    const parsed = await askGemini(
      `Ekstrak informasi dari teks bukti booking hotel berikut dan kembalikan HANYA JSON tanpa penjelasan:\n\n${receipt_text}\n\nFormat JSON:\n{"hotel_name":"","check_in":"YYYY-MM-DD","check_out":"YYYY-MM-DD","total_rooms":0,"room_types":[],"facilities":[]}`
    );
    res.json({ success: true, data: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/join/:invite_code  (documented as GET but needs body → using POST)
router.post('/join/:invite_code', auth, async (req, res) => {
  const { name, gender, preferences } = req.body;
  if (!name || !gender) return res.status(400).json({ error: 'name and gender are required' });

  try {
    const [[group]] = await pool.query('SELECT * FROM group_trips WHERE invite_code = ?', [req.params.invite_code]);
    if (!group) return res.status(404).json({ error: 'Invalid invite code' });
    if (group.status !== 'open') return res.status(400).json({ error: 'Group is closed' });

    const [[existing]] = await pool.query(
      'SELECT id FROM group_members WHERE group_trip_id = ? AND user_id = ?',
      [group.id, req.user.id]
    );
    if (existing) return res.status(409).json({ error: 'Already a member of this group' });

    await pool.query(
      'INSERT INTO group_members (group_trip_id, user_id, name, gender, preferences, role) VALUES (?, ?, ?, ?, ?, ?)',
      [group.id, req.user.id, name, gender, preferences || null, 'member']
    );

    res.json({ success: true, data: { group_id: group.id, title: group.title, invite_code: group.invite_code } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [[member]] = await pool.query(
      'SELECT id FROM group_members WHERE group_trip_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const [[group]] = await pool.query('SELECT * FROM group_trips WHERE id = ?', [req.params.id]);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const [members] = await pool.query('SELECT * FROM group_members WHERE group_trip_id = ?', [req.params.id]);
    const [allocations] = await pool.query('SELECT * FROM room_allocations WHERE group_trip_id = ?', [req.params.id]);
    const [checkins] = await pool.query('SELECT * FROM checkin_status WHERE group_trip_id = ?', [req.params.id]);

    res.json({
      success: true,
      data: {
        ...group,
        parsed_data: group.parsed_data ? JSON.parse(group.parsed_data) : null,
        members,
        room_allocations: allocations.map(a => ({ ...a, member_ids: JSON.parse(a.member_ids || '[]') })),
        checkin_status: checkins,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/:id/allocate-rooms
router.post('/:id/allocate-rooms', auth, async (req, res) => {
  try {
    const [[coord]] = await pool.query(
      'SELECT id FROM group_members WHERE group_trip_id = ? AND user_id = ? AND role = ?',
      [req.params.id, req.user.id, 'coordinator']
    );
    if (!coord) return res.status(403).json({ error: 'Only coordinator can allocate rooms' });

    const [[group]] = await pool.query('SELECT parsed_data FROM group_trips WHERE id = ?', [req.params.id]);
    if (!group) return res.status(404).json({ error: 'Group not found' });

    const [members] = await pool.query('SELECT id, name, gender, preferences FROM group_members WHERE group_trip_id = ?', [req.params.id]);
    const parsedData = group.parsed_data ? JSON.parse(group.parsed_data) : {};

    const prompt = `Kamu adalah asisten pembagian kamar hotel. Berdasarkan data berikut, bagi anggota ke dalam kamar yang tersedia.

Info Hotel: ${JSON.stringify(parsedData)}
Anggota: ${JSON.stringify(members)}

Kembalikan HANYA JSON array tanpa penjelasan:
[{"room_number":"101","room_type":"double","member_ids":[1,2],"ai_reason":"alasan singkat"}]`;

    const allocations = await askGemini(prompt);

    await pool.query('DELETE FROM room_allocations WHERE group_trip_id = ?', [req.params.id]);

    const inserted = [];
    for (const alloc of allocations) {
      const [result] = await pool.query(
        'INSERT INTO room_allocations (group_trip_id, room_number, room_type, member_ids, ai_reason) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, alloc.room_number, alloc.room_type, JSON.stringify(alloc.member_ids), alloc.ai_reason]
      );
      inserted.push({ id: result.insertId, ...alloc });
    }

    res.json({ success: true, data: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/groups/:id/checkin/:user_id
router.post('/:id/checkin/:user_id', auth, async (req, res) => {
  const targetUserId = parseInt(req.params.user_id);
  const isCoordinator = async () => {
    const [[r]] = await pool.query(
      'SELECT id FROM group_members WHERE group_trip_id = ? AND user_id = ? AND role = ?',
      [req.params.id, req.user.id, 'coordinator']
    );
    return !!r;
  };

  if (req.user.id !== targetUserId && !(await isCoordinator())) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const { checkin_url } = req.body;
    const [[existing]] = await pool.query(
      'SELECT id FROM checkin_status WHERE group_trip_id = ? AND user_id = ?',
      [req.params.id, targetUserId]
    );

    if (existing) {
      await pool.query(
        'UPDATE checkin_status SET status = ?, checkin_url = ?, completed_at = NOW() WHERE group_trip_id = ? AND user_id = ?',
        ['completed', checkin_url || null, req.params.id, targetUserId]
      );
    } else {
      await pool.query(
        'INSERT INTO checkin_status (group_trip_id, user_id, status, checkin_url, completed_at) VALUES (?, ?, ?, ?, NOW())',
        [req.params.id, targetUserId, 'completed', checkin_url || null]
      );
    }

    const [[updated]] = await pool.query(
      'SELECT * FROM checkin_status WHERE group_trip_id = ? AND user_id = ?',
      [req.params.id, targetUserId]
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/groups/:id/checkin-summary
router.get('/:id/checkin-summary', auth, async (req, res) => {
  try {
    const [[member]] = await pool.query(
      'SELECT id FROM group_members WHERE group_trip_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!member) return res.status(403).json({ error: 'Access denied' });

    const [rows] = await pool.query(
      `SELECT gm.user_id, gm.name, gm.role,
              COALESCE(cs.status, 'pending') AS checkin_status,
              cs.checkin_url, cs.completed_at
       FROM group_members gm
       LEFT JOIN checkin_status cs ON cs.group_trip_id = gm.group_trip_id AND cs.user_id = gm.user_id
       WHERE gm.group_trip_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
