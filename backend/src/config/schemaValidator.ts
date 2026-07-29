// File: backend/src/config/schemaValidator.ts
import pool from './db';

const REQUIRED_TABLES = [
  'users',
  'workspaces',
  'menu_items',
  'menu_categories',
  'inventory_items',
  'inventory_categories',
  'suppliers',
  'ai_imports'
];

export async function validateDatabaseSchema(): Promise<void> {
  try {
    const { rows } = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const existingTables = new Set(rows.map(r => r.table_name.toLowerCase()));
    const missingTables = REQUIRED_TABLES.filter(t => !existingTables.has(t));

    if (missingTables.length > 0) {
      console.error('\n******************************************************************');
      console.error('FATAL DATABASE SCHEMA VALIDATION FAILURE!');
      console.error(`Missing required table(s): ${missingTables.join(', ')}`);
      console.error('Please run database migrations before starting the server:');
      console.error('  npm run migrate');
      console.error('******************************************************************\n');
      process.exit(1);
    }

    console.log(`[Database Schema Validation] SUCCESS: All required tables (${REQUIRED_TABLES.length}) are verified.`);
  } catch (err: any) {
    console.error('\n[Database Schema Validation] ERROR during schema check:', err.message || err);
    console.error('Failing server startup to prevent inconsistent database state.\n');
    process.exit(1);
  }
}
