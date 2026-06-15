// File: backend/src/modules/orders/orders.service.ts
// Service layer for order operations: database queries and transactions

import { Pool } from 'pg';
import {
  Order,
  OrderItem,
  CreateOrderPayload,
  OrderStatus,
} from './orders.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Resolves the appropriate restaurant_id.
 * If the user is an owner, it is their user ID.
 * If the user is a waiter, we find the first RESTAURANT_OWNER user in the DB.
 */
export async function getRestaurantId(userId: string, role: string): Promise<string> {
  if (role === 'RESTAURANT_OWNER' || role === 'SUPER_ADMIN') {
    return userId;
  }
  const { rows } = await pool.query(
    "SELECT id FROM users WHERE role = 'RESTAURANT_OWNER' ORDER BY created_at ASC LIMIT 1"
  );
  if (rows.length > 0) {
    return rows[0].id;
  }
  return userId;
}

export async function createOrder(
  waiterId: string,
  waiterRole: string,
  payload: CreateOrderPayload
): Promise<Order> {
  const restaurantId = await getRestaurantId(waiterId, waiterRole);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Fetch menu item details to ensure validity and calculate subtotals
    const itemIds = payload.items.map((i) => i.menu_item_id);
    const { rows: dbItems } = await client.query(
      `SELECT id, name, price, is_available FROM menu_items 
       WHERE id = ANY($1) AND restaurant_id = $2`,
      [itemIds, restaurantId]
    );

    if (dbItems.length !== itemIds.length) {
      throw new Error('Some menu items were not found or unauthorized');
    }

    let totalAmount = 0;
    const itemsToInsert = payload.items.map((item) => {
      const dbItem = dbItems.find((d: any) => d.id === item.menu_item_id);
      if (!dbItem) {
        throw new Error(`Menu item ${item.menu_item_id} not found`);
      }
      if (!dbItem.is_available) {
        throw new Error(`Menu item "${dbItem.name}" is currently unavailable`);
      }
      const unitPrice = parseFloat(dbItem.price);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      return {
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        subtotal,
      };
    });

    // 2. Insert order
    const orderSql = `
      INSERT INTO orders (restaurant_id, waiter_id, table_number, guest_count, status, total_amount)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const { rows: orderRows } = await client.query(orderSql, [
      restaurantId,
      waiterId,
      payload.table_number,
      payload.guest_count || 1,
      OrderStatus.NEW,
      totalAmount,
    ]);
    const orderRecord = orderRows[0];

    // 3. Insert order items
    const insertedItems: OrderItem[] = [];
    for (const item of itemsToInsert) {
      const itemSql = `
        INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const { rows: itemRows } = await client.query(itemSql, [
        orderRecord.id,
        item.menu_item_id,
        item.quantity,
        item.unit_price,
        item.subtotal,
      ]);
      insertedItems.push(itemRows[0]);
    }

    // 4. Update menu item analytics (increment orders count and revenue)
    for (const item of itemsToInsert) {
      await client.query(
        `UPDATE menu_item_analytics 
         SET orders_count = orders_count + $1, 
             revenue = revenue + $2,
             last_ordered_at = NOW(),
             updated_at = NOW()
         WHERE menu_item_id = $3`,
        [item.quantity, item.subtotal, item.menu_item_id]
      );
    }

    await client.query('COMMIT');

    return {
      ...orderRecord,
      total_amount: parseFloat(orderRecord.total_amount),
      items: insertedItems.map((item) => ({
        ...item,
        unit_price: parseFloat(item.unit_price as any),
        subtotal: parseFloat(item.subtotal as any),
      })),
    } as Order;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getOrders(
  userId: string,
  role: string
): Promise<Order[]> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    SELECT o.*, u.name as waiter_name
    FROM orders o
    LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.restaurant_id = $1
    ORDER BY o.created_at DESC
  `;
  const { rows } = await pool.query(sql, [restaurantId]);

  return rows.map((r: any) => ({
    ...r,
    total_amount: parseFloat(r.total_amount),
  })) as Order[];
}

export async function getOrderById(
  userId: string,
  role: string,
  orderId: string
): Promise<Order | null> {
  const restaurantId = await getRestaurantId(userId, role);

  const orderSql = `
    SELECT o.*, u.name as waiter_name
    FROM orders o
    LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.id = $1 AND o.restaurant_id = $2
    LIMIT 1
  `;
  const { rows: orderRows } = await pool.query(orderSql, [orderId, restaurantId]);
  if (orderRows.length === 0) return null;

  const orderRecord = orderRows[0];

  const itemsSql = `
    SELECT oi.*, mi.name, mi.image_url
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC
  `;
  const { rows: itemsRows } = await pool.query(itemsSql, [orderId]);

  return {
    ...orderRecord,
    total_amount: parseFloat(orderRecord.total_amount),
    items: itemsRows.map((item: any) => ({
      ...item,
      unit_price: parseFloat(item.unit_price as any),
      subtotal: parseFloat(item.subtotal as any),
    })),
  } as Order;
}

export async function getOrdersByTable(
  userId: string,
  role: string,
  tableNumber: number
): Promise<Order[]> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    SELECT o.*, u.name as waiter_name
    FROM orders o
    LEFT JOIN users u ON o.waiter_id = u.id
    WHERE o.table_number = $1 AND o.restaurant_id = $2
    ORDER BY o.created_at DESC
  `;
  const { rows } = await pool.query(sql, [tableNumber, restaurantId]);

  return rows.map((r: any) => ({
    ...r,
    total_amount: parseFloat(r.total_amount),
  })) as Order[];
}

export async function updateOrderStatus(
  userId: string,
  role: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    UPDATE orders
    SET status = $1, updated_at = NOW()
    WHERE id = $2 AND restaurant_id = $3
    RETURNING *
  `;
  const { rows } = await pool.query(sql, [status, orderId, restaurantId]);

  if (rows.length === 0) {
    throw new Error('Order not found or unauthorized');
  }

  const orderRecord = rows[0];

  // Fetch items to complete the order response payload
  const itemsSql = `
    SELECT oi.*, mi.name, mi.image_url
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC
  `;
  const { rows: itemsRows } = await pool.query(itemsSql, [orderId]);

  return {
    ...orderRecord,
    total_amount: parseFloat(orderRecord.total_amount),
    items: itemsRows.map((item: any) => ({
      ...item,
      unit_price: parseFloat(item.unit_price as any),
      subtotal: parseFloat(item.subtotal as any),
    })),
  } as Order;
}

export async function deleteOrder(
  userId: string,
  role: string,
  orderId: string
): Promise<void> {
  const restaurantId = await getRestaurantId(userId, role);

  const sql = `
    DELETE FROM orders
    WHERE id = $1 AND restaurant_id = $2
  `;
  const result = await pool.query(sql, [orderId, restaurantId]);

  if (result.rowCount === 0) {
    throw new Error('Order not found or unauthorized');
  }
}
