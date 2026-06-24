require('dotenv').config();
const { Pool } = require('pg');

console.log('DATABASE_URL starts with:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 40) : 'undefined');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Connection successful! Database time:', res.rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    await pool.end();
  }
})();
