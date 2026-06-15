// Script to apply the orders database schema
const fs = require('fs');
const path = require('path');
const { Pool } = require('../backend/node_modules/pg');

// Resolve path to backend .env
const envPath = path.join(__dirname, '../backend/.env');

// Parse .env manually to avoid dependency issues
let databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl && fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^DATABASE_URL=(.*)$/m);
  if (match) {
    databaseUrl = match[1].trim();
  }
}

if (!databaseUrl) {
  console.error('Error: DATABASE_URL not found in environment or backend/.env');
  process.exit(1);
}

console.log('Connecting to PostgreSQL using database URL...');

const pool = new Pool({ connectionString: databaseUrl });

async function runMigration() {
  const schemaPath = path.join(__dirname, '../database/schema/003_create_orders_schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Executing SQL schema from:', schemaPath);

  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
