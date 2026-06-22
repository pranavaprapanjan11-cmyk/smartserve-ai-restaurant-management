// File: backend/scripts/seed_restaurant_data.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seedForOwner(client, ownerId) {
  console.log(`Seeding data for Restaurant Owner ID: ${ownerId}`);

  // Clean up any old test data under this owner to avoid duplicates
  await client.query('DELETE FROM payments WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM invoices WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE restaurant_id = $1)', [ownerId]);
  await client.query('DELETE FROM orders WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_alerts WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_transactions WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM menu_item_ingredients WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_items WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM suppliers WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM inventory_categories WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM menu_items WHERE restaurant_id = $1', [ownerId]);
  await client.query('DELETE FROM menu_categories WHERE restaurant_id = $1', [ownerId]);

  // 1. Seed Menu Categories and Items
  const catNames = ['Beverages', 'Starters', 'Main Course', 'Desserts'];
  const catIds = [];
  for (const name of catNames) {
    const res = await client.query(
      'INSERT INTO menu_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id',
      [ownerId, name]
    );
    catIds.push(res.rows[0].id);
  }

  const menuItemsData = [
    { catIdx: 0, name: 'Lemon Tea', price: 45.00 },
    { catIdx: 0, name: 'Cold Coffee', price: 90.00 },
    { catIdx: 1, name: 'Paneer Tikka', price: 180.00 },
    { catIdx: 1, name: 'Chicken 65', price: 210.00 },
    { catIdx: 2, name: 'Veg Biryani', price: 220.00 },
    { catIdx: 2, name: 'Butter Chicken with Naan', price: 320.00 },
    { catIdx: 3, name: 'Chocolate Brownie', price: 120.00 }
  ];

  const itemIds = [];
  for (const item of menuItemsData) {
    const res = await client.query(
      'INSERT INTO menu_items (restaurant_id, category_id, name, price, is_available) VALUES ($1, $2, $3, $4, true) RETURNING id',
      [ownerId, catIds[item.catIdx], item.name, item.price]
    );
    itemIds.push(res.rows[0].id);
    
    // Seed menu item analytics
    await client.query(
      `INSERT INTO menu_item_analytics (menu_item_id, orders_count, revenue, last_ordered_at) 
       VALUES ($1, 0, 0, NULL) ON CONFLICT DO NOTHING`,
      [res.rows[0].id]
    );
  }

  // 2. Seed Inventory Categories and Suppliers
  const invCatRes = await client.query(
    'INSERT INTO inventory_categories (restaurant_id, name) VALUES ($1, $2) RETURNING id',
    [ownerId, 'Food Ingredients']
  );
  const invCategoryId = invCatRes.rows[0].id;

  const supplierRes = await client.query(
    `INSERT INTO suppliers (restaurant_id, name, contact_name, phone, email, address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [ownerId, 'Fresh Foods Supplier', 'John Supplier', '9999988888', 'john@freshfoods.com', '123 Market St']
  );
  const supplierId = supplierRes.rows[0].id;

  // 3. Seed Inventory Items
  const inventoryItemsData = [
    { name: 'Basmati Rice', qty: 5.0, threshold: 25.0, unit: 'kg' }, // Trigger low stock
    { name: 'Chicken Breast', qty: 45.0, threshold: 15.0, unit: 'kg' },
    { name: 'Paneer', qty: 12.0, threshold: 5.0, unit: 'kg' },
    { name: 'Tomatoes', qty: 8.0, threshold: 10.0, unit: 'kg' }, // Trigger low stock
    { name: 'Onions', qty: 30.0, threshold: 15.0, unit: 'kg' }
  ];

  const invIds = [];
  for (const item of inventoryItemsData) {
    const res = await client.query(
      `INSERT INTO inventory_items (restaurant_id, category_id, supplier_id, name, quantity_on_hand, reorder_threshold, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [ownerId, invCategoryId, supplierId, item.name, item.qty, item.threshold, item.unit]
    );
    const invId = res.rows[0].id;
    invIds.push(invId);

    // If stock is below threshold, trigger an active inventory alert
    if (item.qty <= item.threshold) {
      await client.query(
        `INSERT INTO inventory_alerts (restaurant_id, inventory_item_id, alert_type, message, is_active)
         VALUES ($1, $2, 'LOW_STOCK', $3, true)`,
        [ownerId, invId, `Low stock alert for ${item.name}. Current: ${item.qty}${item.unit}`]
      );
    }
  }

  // Map ingredients for forecasting (Basmati Rice is used in Veg Biryani)
  if (itemIds[4] && invIds[0]) {
    await client.query(
      `INSERT INTO menu_item_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
       VALUES ($1, $2, $3, 0.25)`, 
      [ownerId, itemIds[4], invIds[0]]
    );
  }
  // Butter Chicken is at index 5, uses Chicken (index 1) and Tomatoes (index 3)
  if (itemIds[5]) {
    if (invIds[1]) {
      await client.query(
        `INSERT INTO menu_item_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
         VALUES ($1, $2, $3, 0.3)`,
        [ownerId, itemIds[5], invIds[1]]
      );
    }
    if (invIds[3]) {
      await client.query(
        `INSERT INTO menu_item_ingredients (restaurant_id, menu_item_id, inventory_item_id, quantity_required)
         VALUES ($1, $2, $3, 0.15)`,
        [ownerId, itemIds[5], invIds[3]]
      );
    }
  }

  // 4. Reset Tables
  await client.query(
    `UPDATE restaurant_tables SET status = 'AVAILABLE', current_order_id = NULL, 
     reserved_for = NULL, reserved_phone = NULL, reservation_time = NULL WHERE restaurant_id = $1`,
    [ownerId]
  );

  // 5. Seed Orders, Invoices, and Payments
  // Create 15 orders spread over the last 10 days
  const now = new Date();
  for (let i = 0; i < 15; i++) {
    let orderDate = new Date();
    // Spread back in time, but set some PAID orders to TODAY (index 9 and 10)
    if (i === 9 || i === 10 || i === 14) {
      orderDate = now;
    } else {
      orderDate.setDate(now.getDate() - (14 - i));
    }
    
    let status = 'PAID';
    if (i === 11) status = 'SERVED';
    if (i === 12) status = 'READY';
    if (i === 13) status = 'PREPARING';
    if (i === 14) {
      status = 'NEW';
    }

    const tableNum = (i % 8) + 1;
    const guestCount = (i % 3) + 2;
    
    const selectedItemIdx = i % menuItemsData.length;
    const menuItemId = itemIds[selectedItemIdx];
    const itemPrice = menuItemsData[selectedItemIdx].price;
    const qty = (i % 2) + 1;
    const subtotal = itemPrice * qty;

    const orderRes = await client.query(
      `INSERT INTO orders (restaurant_id, waiter_id, table_number, guest_count, status, total_amount, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING id`,
      [ownerId, ownerId, tableNum, guestCount, status, subtotal, orderDate]
    );
    const orderId = orderRes.rows[0].id;

    // Insert order item
    await client.query(
      `INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [orderId, menuItemId, qty, itemPrice, subtotal, orderDate]
    );

    // Increment menu item analytics
    await client.query(
      `UPDATE menu_item_analytics 
       SET orders_count = orders_count + $1, revenue = revenue + $2, last_ordered_at = $3, updated_at = NOW()
       WHERE menu_item_id = $4`,
      [qty, subtotal, orderDate, menuItemId]
    );

    // If paid, create invoice and payment
    if (status === 'PAID') {
      const tax = parseFloat((subtotal * 0.18).toFixed(2));
      const total = subtotal + tax;
      const invNum = `INV-${2000 + i}-${Date.now().toString().slice(-4)}`;

      const invRes = await client.query(
        `INSERT INTO invoices (restaurant_id, order_id, invoice_number, subtotal, tax_amount, discount_amount, total_amount, status, issue_date, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, 0, $6, 'PAID', $7, $7, $7) RETURNING id`,
        [ownerId, orderId, invNum, subtotal, tax, total, orderDate]
      );
      const invoiceId = invRes.rows[0].id;

      await client.query(
        `INSERT INTO payments (restaurant_id, order_id, invoice_id, amount, payment_method, status, transaction_reference, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'CARD', 'PAID', $5, $6, $6)`,
        [ownerId, orderId, invoiceId, total, `TX-${2000 + i}`, orderDate]
      );
    }
  }

  // 6. Update some tables to reflect active orders
  const readyOrder = await client.query("SELECT id FROM orders WHERE restaurant_id = $1 AND status = 'READY' LIMIT 1", [ownerId]);
  if (readyOrder.rows.length > 0) {
    await client.query(
      `UPDATE restaurant_tables SET status = 'OCCUPIED', current_order_id = $1, last_occupied_at = NOW()
       WHERE table_number = 1 AND restaurant_id = $2`,
      [readyOrder.rows[0].id, ownerId]
    );
  }
  
  const prepOrder = await client.query("SELECT id FROM orders WHERE restaurant_id = $1 AND status = 'PREPARING' LIMIT 1", [ownerId]);
  if (prepOrder.rows.length > 0) {
    await client.query(
      `UPDATE restaurant_tables SET status = 'OCCUPIED', current_order_id = $1, last_occupied_at = NOW()
       WHERE table_number = 2 AND restaurant_id = $2`,
      [prepOrder.rows[0].id, ownerId]
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await client.query(
    `UPDATE restaurant_tables SET status = 'RESERVED', reserved_for = 'Rahul Sharma', 
     reserved_phone = '9876543210', reservation_time = $1 WHERE table_number = 3 AND restaurant_id = $2`,
    [tomorrow, ownerId]
  );

  console.log(`Seeding complete for owner: ${ownerId}!`);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const ownersRes = await client.query("SELECT id, name FROM users WHERE role = 'RESTAURANT_OWNER'");
    console.log(`Found ${ownersRes.rows.length} restaurant owner accounts to seed.`);

    for (const owner of ownersRes.rows) {
      await seedForOwner(client, owner.id);
    }

    await client.query('COMMIT');
    console.log('Database seeding successfully applied to all owners!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('SEEDING FAILED:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
