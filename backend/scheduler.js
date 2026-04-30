const pool = require('./db');

const HOUR_MS = 60 * 60 * 1000;

// ── H-1 reminder: runs every hour ────────────────────────────────────────────
async function sendTomorrowReminders() {
  try {
    // Find confirmed bookings where check_in_date = tomorrow
    const [bookings] = await pool.execute(
      `SELECT b.id, b.user_id, d.name AS destination_name
       FROM   bookings b
       JOIN   destinations d ON d.id = b.destination_id
       WHERE  b.check_in_date = DATE(NOW() + INTERVAL 1 DAY)
         AND  b.status = 'confirmed'`
    );

    if (!bookings.length) return;

    for (const booking of bookings) {
      // Skip if a reminder was already sent today for this booking
      const [[existing]] = await pool.execute(
        `SELECT id FROM notifications
         WHERE  user_id = ?
           AND  type    = 'reminder'
           AND  title   = 'Pengingat Perjalanan ✈️ H-1'
           AND  message LIKE ?
           AND  DATE(created_at) = CURDATE()`,
        [booking.user_id, `%${booking.destination_name}%`]
      );

      if (existing) continue;

      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Pengingat Perjalanan ✈️ H-1', ?, 'reminder')`,
        [
          booking.user_id,
          `Besok kamu berangkat ke ${booking.destination_name}! Jangan lupa cek dokumen perjalanan dan packing.`,
        ]
      );

      console.log(
        `[scheduler] Reminder sent → user ${booking.user_id} | ${booking.destination_name}`
      );
    }
  } catch (err) {
    console.error('[scheduler] sendTomorrowReminders failed:', err.message);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────
function start() {
  // Run once immediately on startup, then every hour
  sendTomorrowReminders();
  setInterval(sendTomorrowReminders, HOUR_MS);
  console.log('Scheduler started — H-1 reminders active (interval: 1h).');
}

module.exports = { start };
