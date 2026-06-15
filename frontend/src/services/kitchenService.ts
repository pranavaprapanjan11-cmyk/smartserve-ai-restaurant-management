import * as orderService from './orderService';

export async function getKitchenOrders(token: string) {
  const orders = await orderService.getOrders(token);
  const newOrders = orders.filter(o => o.status === orderService.OrderStatus.NEW);
  const preparing = orders.filter(
    o => o.status === orderService.OrderStatus.PREPARING || o.status === orderService.OrderStatus.SENT_TO_KITCHEN
  );
  const ready = orders.filter(o => o.status === orderService.OrderStatus.READY);
  return { all: orders, newOrders, preparing, ready };
}

export async function startCooking(orderId: string, token: string) {
  return orderService.updateOrderStatus(orderId, orderService.OrderStatus.PREPARING, token);
}

export async function markReady(orderId: string, token: string) {
  return orderService.updateOrderStatus(orderId, orderService.OrderStatus.READY, token);
}

export async function markServed(orderId: string, token: string) {
  return orderService.updateOrderStatus(orderId, orderService.OrderStatus.SERVED, token);
}

export function elapsedMinutes(order: orderService.Order) {
  try {
    const then = new Date(order.created_at).getTime();
    const now = Date.now();
    return Math.floor((now - then) / 60000);
  } catch (e) {
    return 0;
  }
}

export function averagePrepMinutes(orders: orderService.Order[]) {
  const samples = orders.filter(o => o.status === orderService.OrderStatus.READY || o.status === orderService.OrderStatus.SERVED);
  if (samples.length === 0) return 0;
  const total = samples.reduce((acc, o) => {
    const then = new Date(o.created_at).getTime();
    const updated = new Date(o.updated_at || o.created_at).getTime();
    return acc + Math.max(0, Math.floor((updated - then) / 60000));
  }, 0);
  return Math.round(total / samples.length);
}

export default {
  getKitchenOrders,
  startCooking,
  markReady,
  markServed,
  elapsedMinutes,
  averagePrepMinutes,
};
