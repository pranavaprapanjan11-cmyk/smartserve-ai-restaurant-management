import { Pool } from 'pg';
import { getRestaurantId } from '../orders/orders.service';
import {
  HealthScoreResponse,
  InventoryForecastItem,
  MenuInsights,
  Recommendation,
  SalesForecast,
} from './ai.types';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function safeNumber(value: any): number {
  return value === null || value === undefined ? 0 : Number(value);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clampScore(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

export async function getSalesForecast(userId: string, role: string): Promise<SalesForecast> {
  const restaurantId = await getRestaurantId(userId, role);

  const query = `
    SELECT
      series_day::date AS day,
      (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE restaurant_id = $1 AND created_at::date = series_day) AS revenue,
      (SELECT COALESCE(COUNT(*), 0) FROM orders WHERE restaurant_id = $1 AND created_at::date = series_day) AS order_count
    FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') AS series_day
    ORDER BY series_day
  `;

  const { rows } = await pool.query(query, [restaurantId]);
  const daily = rows.map((row: any) => ({
    day: row.day,
    revenue: safeNumber(row.revenue),
    orders: safeNumber(row.order_count),
  }));

  const todayRevenue = daily.length > 0 ? daily[daily.length - 1].revenue : 0;
  const yesterdayRevenue = daily.length > 1 ? daily[daily.length - 2].revenue : 0;
  const weeklyRevenue = daily.slice(-7).reduce((sum, row) => sum + row.revenue, 0);
  const recentDaily = daily.slice(-7).map((row) => row.revenue);
  const averageDailyRevenue = average(daily.slice(0, -1).map((row) => row.revenue));

  const predictedTomorrowRevenue = Math.max(0, averageDailyRevenue);
  const predictedWeeklyRevenue = Math.max(0, average(recentDaily) * 7);

  return {
    todayRevenue,
    yesterdayRevenue,
    weeklyRevenue,
    predictedTomorrowRevenue: parseFloat(predictedTomorrowRevenue.toFixed(2)),
    predictedWeeklyRevenue: parseFloat(predictedWeeklyRevenue.toFixed(2)),
  };
}

export async function getInventoryForecast(userId: string, role: string): Promise<InventoryForecastItem[]> {
  const restaurantId = await getRestaurantId(userId, role);

  const query = `
    SELECT
      ii.id,
      ii.name,
      ii.quantity_on_hand,
      ii.reorder_threshold,
      COALESCE(SUM(oi.quantity * mii.quantity_required), 0) AS total_used
    FROM inventory_items ii
    LEFT JOIN menu_item_ingredients mii ON mii.inventory_item_id = ii.id AND mii.restaurant_id = ii.restaurant_id
    LEFT JOIN order_items oi ON oi.menu_item_id = mii.menu_item_id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.restaurant_id = ii.restaurant_id AND o.created_at >= CURRENT_DATE - INTERVAL '13 days'
    WHERE ii.restaurant_id = $1
    GROUP BY ii.id, ii.name, ii.quantity_on_hand, ii.reorder_threshold
    ORDER BY ii.name ASC
  `;

  const { rows } = await pool.query(query, [restaurantId]);

  return rows.map((row: any) => {
    const quantityOnHand = safeNumber(row.quantity_on_hand);
    const totalUsed = safeNumber(row.total_used);
    const avgDailyUsage = totalUsed / 14;
    const daysRemaining = avgDailyUsage > 0 ? quantityOnHand / avgDailyUsage : 999;
    const roundedDays = Math.round(daysRemaining * 100) / 100;

    let risk: InventoryForecastItem['risk'] = 'LOW';
    if (quantityOnHand <= safeNumber(row.reorder_threshold) || roundedDays <= 3) {
      risk = 'HIGH';
    } else if (roundedDays <= 7) {
      risk = 'MEDIUM';
    }

    return {
      item: row.name,
      daysRemaining: Number(roundedDays.toFixed(2)),
      risk,
    };
  });
}

export async function getMenuInsights(userId: string, role: string): Promise<MenuInsights> {
  const restaurantId = await getRestaurantId(userId, role);

  const query = `
    SELECT
      mi.id,
      mi.name,
      COALESCE(SUM(oi.quantity), 0) AS quantity_sold,
      COALESCE(SUM(oi.subtotal), 0) AS revenue
    FROM menu_items mi
    LEFT JOIN order_items oi ON oi.menu_item_id = mi.id
    WHERE mi.restaurant_id = $1
    GROUP BY mi.id, mi.name
    ORDER BY mi.name ASC
  `;

  const { rows } = await pool.query(query, [restaurantId]);
  const items = rows.map((row: any) => ({
    name: row.name,
    quantitySold: safeNumber(row.quantity_sold),
    revenue: safeNumber(row.revenue),
  }));

  const totalQuantitySold = items.reduce((sum, item) => sum + item.quantitySold, 0);
  const bestSeller = items.reduce<MenuInsights['bestSeller']>((best, item) => {
    if (!best || item.quantitySold > best.quantitySold) return item;
    return best;
  }, null as any);

  const worstSeller = items.reduce<MenuInsights['worstSeller']>((worst, item) => {
    if (!worst || item.quantitySold < worst.quantitySold) return item;
    return worst;
  }, null as any);

  const highestRevenueItem = items.reduce<MenuInsights['highestRevenueItem']>((highest, item) => {
    if (!highest || item.revenue > highest.revenue) return item;
    return highest;
  }, null as any);

  return {
    bestSeller,
    worstSeller,
    highestRevenueItem,
    totalQuantitySold,
  };
}

export async function getRecommendations(userId: string, role: string): Promise<Recommendation[]> {
  const restaurantId = await getRestaurantId(userId, role);
  const [inventoryRows, menuInsights, salesForecast] = await Promise.all([
    pool.query(
      `SELECT name, quantity_on_hand, reorder_threshold FROM inventory_items WHERE restaurant_id = $1 ORDER BY name ASC`,
      [restaurantId]
    ),
    getMenuInsights(userId, role),
    getSalesForecast(userId, role),
  ]);

  const lowStockItems = inventoryRows.rows.filter((row: any) => safeNumber(row.quantity_on_hand) <= safeNumber(row.reorder_threshold));
  const recommendations: Recommendation[] = [];

  if (lowStockItems.length > 0) {
    const itemNames = lowStockItems.map((item: any) => item.name).slice(0, 3).join(', ');
    recommendations.push({
      recommendation: `Increase stock of ${itemNames}`,
      reason: 'Several inventory items are at or below their reorder threshold.',
    });
  }

  if (menuInsights.bestSeller && menuInsights.bestSeller.quantitySold > 0) {
    recommendations.push({
      recommendation: `Promote ${menuInsights.bestSeller.name}`,
      reason: `${menuInsights.bestSeller.name} is the highest selling item and can drive higher revenue when highlighted.`,
    });
  }

  if (menuInsights.worstSeller && menuInsights.totalQuantitySold > 0 && menuInsights.worstSeller.quantitySold < menuInsights.totalQuantitySold * 0.05) {
    recommendations.push({
      recommendation: `Promote ${menuInsights.worstSeller.name}`,
      reason: 'This menu item is selling below 5% of total volume and may benefit from a promotion.',
    });
  }

  if (salesForecast.predictedTomorrowRevenue > salesForecast.weeklyRevenue / 7 * 1.1) {
    recommendations.push({
      recommendation: 'Prepare for higher demand tomorrow',
      reason: 'Tomorrow’s sales forecast is above the weekly daily average.',
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      recommendation: 'Monitor menu and stock levels weekly',
      reason: 'No urgent actions were identified; keep tracking sales and inventory trends.',
    });
  }

  return recommendations.slice(0, 5);
}

export async function getHealthScore(userId: string, role: string): Promise<HealthScoreResponse> {
  const restaurantId = await getRestaurantId(userId, role);

  const [salesForecast, ordersResult, inventoryResult, menuResult] = await Promise.all([
    getSalesForecast(userId, role),
    pool.query(
      `SELECT COUNT(*) AS total_orders FROM orders WHERE restaurant_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '6 days'`,
      [restaurantId]
    ),
    pool.query(
      `SELECT COUNT(*) FILTER (WHERE quantity_on_hand <= reorder_threshold) AS low_stock_items, COUNT(*) AS total_items FROM inventory_items WHERE restaurant_id = $1`,
      [restaurantId]
    ),
    pool.query(
      `SELECT 
         (SELECT COALESCE(COUNT(DISTINCT menu_item_id), 0) FROM order_items oi JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE mi.restaurant_id = $1) AS items_with_sales,
         (SELECT COALESCE(COUNT(*), 0) FROM menu_items WHERE restaurant_id = $1) AS total_items`,
      [restaurantId]
    ),
  ]);

  const totalOrders = safeNumber(ordersResult.rows[0]?.total_orders);
  const inventoryRow = inventoryResult.rows[0] || { low_stock_items: 0, total_items: 0 };
  const lowStockItems = safeNumber(inventoryRow.low_stock_items);
  const totalInventoryItems = safeNumber(inventoryRow.total_items) || 1;
  const menuRow = menuResult.rows[0] || { items_with_sales: 0, total_items: 0 };
  const itemsWithSales = safeNumber(menuRow.items_with_sales);
  const totalMenuItems = safeNumber(menuRow.total_items) || 1;

  const revenueScore = clampScore((salesForecast.weeklyRevenue / 5000) * 30, 30);
  const orderScore = clampScore((totalOrders / 50) * 25, 25);
  const inventoryScore = clampScore(((totalInventoryItems - lowStockItems) / totalInventoryItems) * 25, 25);
  const menuScore = clampScore((itemsWithSales / totalMenuItems) * 20, 20);

  const totalScore = revenueScore + orderScore + inventoryScore + menuScore;
  const normalizedScore = Math.round(Math.max(0, Math.min(100, totalScore)));
  let status = 'Critical';
  if (normalizedScore >= 90) status = 'Excellent';
  else if (normalizedScore >= 75) status = 'Healthy';
  else if (normalizedScore >= 60) status = 'Needs Attention';

  return { score: normalizedScore, status };
}
