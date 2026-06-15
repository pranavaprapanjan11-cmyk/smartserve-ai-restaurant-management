// File: backend/src/modules/orders/orders.routes.ts
// Express router for orders module endpoints

import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  getOrdersByTable,
  updateOrderStatus,
  deleteOrder,
} from './orders.controller';
import {
  validateCreateOrder,
  validateUpdateOrderStatus,
} from './orders.validation';
import { authenticateJWT } from '../auth/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// GET /api/orders - Get all orders for the restaurant
router.get('/', getOrders);

// POST /api/orders - Create a new order
router.post('/', validateCreateOrder, createOrder);

// GET /api/orders/table/:tableNumber - Get orders for a specific table
router.get('/table/:tableNumber', getOrdersByTable);

// GET /api/orders/:id - Get detailed information for an order
router.get('/:id', getOrderById);

// PUT /api/orders/:id/status - Update order status
router.put('/:id/status', validateUpdateOrderStatus, updateOrderStatus);

// DELETE /api/orders/:id - Delete an order
router.delete('/:id', deleteOrder);

export default router;
