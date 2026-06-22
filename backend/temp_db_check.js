const { Pool } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env','utf8').split(/\r?\n/).reduce((acc, line) => {
  const idx = line.indexOf('=');
  if (idx !== -1) acc[line.slice(0, idx)] = line.slice(idx + 1);
  return acc;
}, {});

const pool = new Pool({ connectionString: env.DATABASE_URL });

(async () => {
  try {
    const users = await pool.query('SELECT id, email, role, created_at FROM users LIMIT 10');
    const orders = await pool.query('SELECT COUNT(*) AS cnt FROM orders');
    const payments = await pool.query('SELECT COUNT(*) AS cnt FROM payments');
    const inventory = await pool.query('SELECT COUNT(*) AS cnt FROM inventory_items');
    const menu = await pool.query('SELECT COUNT(*) AS cnt FROM menu_items');
    console.log(JSON.stringify({ users: users.rows, orders: orders.rows[0], payments: payments.rows[0], inventory: inventory.rows[0], menu: menu.rows[0] }, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
})();
