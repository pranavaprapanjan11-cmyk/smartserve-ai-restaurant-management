#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(2);
  }
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    const client = await pool.connect();
    try {
      const res = await client.query("SELECT to_regclass('public.users') AS table_name");
      console.log(res.rows[0]);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('ERROR', err.message || err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
