// File: backend/src/modules/orders/orders.types.ts
// Types and interfaces for the Orders module

export enum OrderStatus {
  NEW = 'NEW',
  SENT_TO_KITCHEN = 'SENT_TO_KITCHEN',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  PAID = 'PAID',
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at?: string;
  // Included in responses if joined
  name?: string;
  image_url?: string;
}

export interface Order {
  id: string;
  restaurant_id: string;
  waiter_id: string;
  table_number: number;
  guest_count: number;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  waiter_name?: string;
}

export interface CreateOrderItemPayload {
  menu_item_id: string;
  quantity: number;
}

export interface CreateOrderPayload {
  table_number: number;
  guest_count?: number;
  items: CreateOrderItemPayload[];
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
}
