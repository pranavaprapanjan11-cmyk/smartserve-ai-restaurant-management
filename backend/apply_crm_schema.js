const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: 'postgres://postgres:pranav@localhost:5432/SmartServe-AI' });

async function apply() {
  try {
    const sqlPath = path.resolve(__dirname, '../database/schema/010_create_crm_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Applying schema...');
    await pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    pool.end();
  }
}

apply();
