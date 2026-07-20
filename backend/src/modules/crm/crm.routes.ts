import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../auth/auth.middleware';
import { Role } from '../auth/auth.types';
import * as crmController from './crm.controller';
import {
  validateCreateCustomer,
  validateUpdateCustomer,
  validateCreateReservation,
  validateUpdateReservationStatus,
  validateCreateWaitlistEntry,
  validateUpdateWaitlistStatus,
} from './crm.validation';

const router = Router();

// Auth required for all CRM routes
router.use(authenticateJWT);

// Customers
router.get('/customers', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), crmController.listCustomers);
router.post('/customers', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.CASHIER, Role.SUPER_ADMIN), validateCreateCustomer, crmController.createCustomer);
router.put('/customers/:id', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), validateUpdateCustomer, crmController.updateCustomer);

// Reservations
router.get('/reservations', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.WAITER, Role.SUPER_ADMIN), crmController.listReservations);
router.post('/reservations', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.WAITER, Role.SUPER_ADMIN), validateCreateReservation, crmController.createReservation);
router.patch('/reservations/:id/status', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.WAITER, Role.SUPER_ADMIN), validateUpdateReservationStatus, crmController.updateReservationStatus);
router.put('/reservations/:id', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.WAITER, Role.SUPER_ADMIN), validateCreateReservation, crmController.updateReservation);

// Waitlist
router.get('/waitlist', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.WAITER, Role.SUPER_ADMIN), crmController.listWaitlist);
router.post('/waitlist', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.WAITER, Role.SUPER_ADMIN), validateCreateWaitlistEntry, crmController.createWaitlistEntry);
router.patch('/waitlist/:id/status', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.WAITER, Role.SUPER_ADMIN), validateUpdateWaitlistStatus, crmController.updateWaitlistStatus);

// Analytics
router.get('/dashboard', authorizeRoles(Role.OWNER, Role.MANAGER, Role.RESTAURANT_OWNER, Role.SUPER_ADMIN), crmController.getDashboardMetrics);

export default router;
