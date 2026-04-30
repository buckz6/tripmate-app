require('dotenv').config();
const mysql = require('mysql2/promise');

// ── Table definitions (order matters — FK dependencies first) ─────────────────
const migrations = [
  {
    name: 'users',
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id         INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100)  NOT NULL,
        email      VARCHAR(255)  NOT NULL UNIQUE,
        password   TEXT          NOT NULL,
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `,
  },
  {
    name: 'journals',
    sql: `
      CREATE TABLE IF NOT EXISTS journals (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id     INT UNSIGNED  NOT NULL,
        title       VARCHAR(255)  NOT NULL,
        destination VARCHAR(255)  NOT NULL,
        date        DATE          NOT NULL,
        description TEXT,
        photo_url   TEXT,
        latitude    DECIMAL(9, 6),
        longitude   DECIMAL(9, 6),
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_journals_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_journals_user_id (user_id)
      )
    `,
  },
  {
    name: 'likes',
    sql: `
      CREATE TABLE IF NOT EXISTS likes (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id     INT UNSIGNED  NOT NULL,
        journal_id  INT UNSIGNED  NOT NULL,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_likes_user
          FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        CONSTRAINT fk_likes_journal
          FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE,
        UNIQUE KEY uq_likes_user_journal (user_id, journal_id)
      )
    `,
  },
  {
    name: 'locations',
    sql: `
      CREATE TABLE IF NOT EXISTS locations (
        id          INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id     INT UNSIGNED  NOT NULL,
        journal_id  INT UNSIGNED  DEFAULT NULL,
        name        VARCHAR(255)  NOT NULL,
        latitude    DECIMAL(9, 6) NOT NULL,
        longitude   DECIMAL(9, 6) NOT NULL,
        created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_locations_user
          FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
        CONSTRAINT fk_locations_journal
          FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE SET NULL,
        INDEX idx_locations_user_id    (user_id),
        INDEX idx_locations_journal_id (journal_id)
      )
    `,
  },
  {
    name: 'destinations',
    sql: `
      CREATE TABLE IF NOT EXISTS destinations (
        id               INT UNSIGNED   NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name             VARCHAR(255)   NOT NULL,
        province         VARCHAR(255)   NOT NULL,
        description      TEXT,
        image_url        TEXT,
        price_per_night  DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        rating           DECIMAL(3, 1)  NOT NULL DEFAULT 0.0,
        category         ENUM('hotel','wisata','tur') NOT NULL DEFAULT 'wisata',
        created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FULLTEXT idx_destinations_search (name, province, description)
      )
    `,
  },
  {
    name: 'bookings',
    sql: `
      CREATE TABLE IF NOT EXISTS bookings (
        id               INT UNSIGNED   NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id          INT UNSIGNED   NOT NULL,
        destination_id   INT UNSIGNED   NOT NULL,
        check_in_date    DATE           NOT NULL,
        check_out_date   DATE           NOT NULL,
        duration_days    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        total_price      DECIMAL(12, 2) NOT NULL,
        status           ENUM('pending','confirmed','cancelled') NOT NULL DEFAULT 'pending',
        payment_method   ENUM('transfer','kartu_kredit','dompet_digital') NOT NULL,
        booking_code     CHAR(8)        NOT NULL UNIQUE,
        created_at       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_bookings_user
          FOREIGN KEY (user_id)        REFERENCES users(id)        ON DELETE CASCADE,
        CONSTRAINT fk_bookings_destination
          FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE RESTRICT,
        INDEX idx_bookings_user_id        (user_id),
        INDEX idx_bookings_destination_id (destination_id),
        INDEX idx_bookings_status         (status)
      )
    `,
  },
  {
    name: 'notifications',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id         INT UNSIGNED  NOT NULL AUTO_INCREMENT PRIMARY KEY,
        user_id    INT UNSIGNED  NOT NULL,
        title      VARCHAR(255)  NOT NULL,
        message    TEXT          NOT NULL,
        type       ENUM('booking','reminder','weather','info') NOT NULL DEFAULT 'info',
        is_read    BOOLEAN       NOT NULL DEFAULT FALSE,
        created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notifications_user
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_notifications_user_id (user_id),
        INDEX idx_notifications_is_read (is_read),
        INDEX idx_notifications_created_at (created_at)
      )
    `,
  },
];

// ── Startup validation ────────────────────────────────────────────────────────
const REQUIRED_ENV = ['DB_HOST', 'DB_NAME', 'DB_USER'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Missing required env variables: ${missing.join(', ')}`);
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function migrate() {
  // Optional: node migrate.js --table=users,journals
  const tableFilter = process.argv
    .find((a) => a.startsWith('--table='))
    ?.split('=')[1]
    ?.split(',')
    .map((t) => t.trim());

  const targets = tableFilter
    ? migrations.filter((m) => tableFilter.includes(m.name))
    : migrations;

  if (tableFilter && !targets.length) {
    console.error(`No matching tables found for: ${tableFilter.join(', ')}`);
    process.exit(1);
  }

  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  console.log(`\nConnected to database "${process.env.DB_NAME}" @ ${process.env.DB_HOST}\n`);

  for (const { name, sql } of targets) {
    await conn.execute(sql);
    console.log(`  ✓  Table "${name}" is ready.`);
  }

  console.log(`\nMigration completed — ${targets.length} table(s) processed.\n`);
  await conn.end();
}

migrate().catch((err) => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
