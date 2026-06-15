// File: backend/src/modules/menu/menu.routes.ts
// Express router for menu module endpoints

import { Router } from 'express';
import {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  toggleMenuItemAvailability,
  createMenuCategory,
  getCategories,
  getMenuStats,
  searchMenuItems,
} from './menu.controller';
import {
  validateCreateMenuItem,
  validateUpdateMenuItem,
  validateCreateMenuCategory,
  validateToggleAvailability,
} from './menu.validation';
import { authenticateJWT } from '../auth/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// ==================== MENU ITEMS ====================

// GET /api/menu - Get all menu items
router.get('/', getMenuItems);

// GET /api/menu/search - Search menu items
router.get('/search', searchMenuItems);

// POST /api/menu - Create menu item
router.post('/', validateCreateMenuItem, createMenuItem);

// GET /api/menu/:id - Get menu item by ID
router.get('/:id', getMenuItemById);

// PUT /api/menu/:id - Update menu item
router.put('/:id', validateUpdateMenuItem, updateMenuItem);

// DELETE /api/menu/:id - Delete menu item
router.delete('/:id', deleteMenuItem);

// PATCH /api/menu/:id/availability - Toggle availability
router.patch('/:id/availability', validateToggleAvailability, toggleMenuItemAvailability);

// ==================== CATEGORIES ====================

// GET /api/menu/categories - Get all categories
router.get('/categories', getCategories);

// POST /api/menu/categories - Create category
router.post('/categories', validateCreateMenuCategory, createMenuCategory);

// ==================== STATISTICS ====================

// GET /api/menu/stats - Get menu statistics
router.get('/stats', getMenuStats);

export default router;
