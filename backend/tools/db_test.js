#!/usr/bin/env node
// Simple DB connectivity test for SmartServe-AI backend
// Usage: run from repository root: `cd backend && node tools/db_test.js`

require('dotenv').config({ path: __dirname + '/../.env' });

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.DATABASE_URL;

async function main() {
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set in backend/.env or environment');
    process.exit(2);
  }

  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });

  try {
    const client = await pool.connect();
    try {
      const dbRes = await client.query("SELECT current_database() as db, NOW() as now");
      const row = dbRes.rows[0] || {};
      console.log('\n✅ Database Connected Successfully');
      console.log('Database Name:', row.db || '(unknown)');
      console.log('Current Timestamp:', row.now || '(unknown)');
    } finally {
      client.release();
    }
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Database connection failed');
    if (err && err.message) console.error('Error message:', err.message);
    if (err && err.code) console.error('Error code:', err.code);
    console.error(err);
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }
}

main();
