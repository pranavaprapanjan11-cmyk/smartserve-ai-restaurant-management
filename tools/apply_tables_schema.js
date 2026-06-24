// Script to apply the tables database schema and seed default tables
const fs = require('fs');
const path = require('path');
const { Pool } = require('../backend/node_modules/pg');

// Resolve path to backend .env
const envPath = path.join(__dirname, '../backend/.env');

// Parse .env manually
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

console.log('Connecting to PostgreSQL...');
const pool = new Pool({ connectionString: databaseUrl });

async function runMigration() {
  const schemaPath = path.join(__dirname, '../database/schema/007_create_tables_schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('Executing SQL schema...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    console.log('Schema applied successfully.');

    // Fetch the restaurant owner to assign seeded tables
    const ownerRes = await client.query(
      "SELECT id FROM users WHERE role = 'RESTAURANT_OWNER' ORDER BY created_at ASC LIMIT 1"
    );
    
    if (ownerRes.rows.length === 0) {
      console.warn('Warning: No RESTAURANT_OWNER found in users table. Skipping table seeding.');
      await client.query('COMMIT');
      return;
    }

    const restaurantId = ownerRes.rows[0].id;
    console.log(`Checking if tables exist for restaurant owner: ${restaurantId}`);

    const countRes = await client.query(
      'SELECT COUNT(*) FROM restaurant_tables WHERE restaurant_id = $1',
      [restaurantId]
    );
    const tableCount = parseInt(countRes.rows[0].count, 10);

    if (tableCount === 0) {
      console.log('No tables found. Seeding default 20 tables...');

      const defaultTables = [
        { num: 1, cap: 4, sec: 'Main Hall', shape: 'square', x: 100, y: 100 },
        { num: 2, cap: 6, sec: 'Main Hall', shape: 'rectangle', x: 260, y: 100 },
        { num: 3, cap: 2, sec: 'Main Hall', shape: 'round', x: 420, y: 100 },
        { num: 4, cap: 4, sec: 'Main Hall', shape: 'square', x: 580, y: 100 },
        { num: 5, cap: 2, sec: 'Outdoor', shape: 'round', x: 100, y: 260 },
        { num: 6, cap: 8, sec: 'VIP', shape: 'rectangle', x: 260, y: 260 },
        { num: 7, cap: 4, sec: 'Main Hall', shape: 'square', x: 420, y: 260 },
        { num: 8, cap: 4, sec: 'Main Hall', shape: 'square', x: 580, y: 260 },
        { num: 9, cap: 2, sec: 'Outdoor', shape: 'round', x: 100, y: 420 },
        { num: 10, cap: 6, sec: 'VIP', shape: 'rectangle', x: 260, y: 420 },
        { num: 11, cap: 2, sec: 'Outdoor', shape: 'round', x: 420, y: 420 },
        { num: 12, cap: 4, sec: 'Main Hall', shape: 'square', x: 580, y: 420 },
        { num: 13, cap: 4, sec: 'Main Hall', shape: 'square', x: 100, y: 580 },
        { num: 14, cap: 2, sec: 'Outdoor', shape: 'round', x: 260, y: 580 },
        { num: 15, cap: 6, sec: 'Rooftop', shape: 'rectangle', x: 420, y: 580 },
        { num: 16, cap: 4, sec: 'Main Hall', shape: 'square', x: 580, y: 580 },
        { num: 17, cap: 2, sec: 'Outdoor', shape: 'round', x: 740, y: 100 },
        { num: 18, cap: 8, sec: 'Family Area', shape: 'rectangle', x: 740, y: 260 },
        { num: 19, cap: 4, sec: 'Rooftop', shape: 'square', x: 740, y: 420 },
        { num: 20, cap: 4, sec: 'Family Area', shape: 'square', x: 740, y: 580 }
      ];

      for (const t of defaultTables) {
        await client.query(
          `INSERT INTO restaurant_tables 
           (restaurant_id, table_number, capacity, status, section, shape, position_x, position_y) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [restaurantId, t.num, t.cap, 'AVAILABLE', t.sec, t.shape, t.x, t.y]
        );
      }
      console.log('Seeded 20 tables successfully!');
    } else {
      console.log(`Tables already exist (${tableCount} tables). Skipping seeding.`);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
