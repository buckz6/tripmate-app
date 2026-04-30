require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:             process.env.DB_HOST,
  port:             Number(process.env.DB_PORT) || 3306,
  database:         process.env.DB_NAME,
  user:             process.env.DB_USER,
  password:         process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit:  10,
});

// Verify DB connection on startup — fail fast if .env is misconfigured
pool.getConnection()
  .then((conn) => {
    console.log('Database connected successfully.');
    conn.release();
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

module.exports = pool;
