# KDS Audit: Existing Order System

This document outlines the audit of the existing order system within SmartServe AI, including structure, status values, workflow, and APIs.

## 1. Orders Module Structure
The orders module is located in the following directories:
* **Backend:** `backend/src/modules/orders/`
  * `orders.types.ts`: Defines interfaces and status enums (`OrderStatus`).
  * `orders.service.ts`: Handles PostgreSQL database queries and transactions (inserts, updates, inventory checks).
  * `orders.controller.ts`: Validates request authentication and invokes the service layer.
  * `orders.routes.ts`: Maps HTTP routes to controllers and applies role authorization.
  * `orders.validation.ts`: Provides input validation using Joi.
* **Frontend:** `frontend/src/services/orderService.ts` & `frontend/src/pages/orders/`

## 2. Order Status Values
The existing status values are defined under the `OrderStatus` enum:
```typescript
export enum OrderStatus {
  NEW = 'NEW',
  SENT_TO_KITCHEN = 'SENT_TO_KITCHEN',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  PAID = 'PAID',
}
```

## 3. Order Workflow and Lifecycle
The current lifecycle of an order proceeds as follows:
1. **Creation (`NEW`):** Waiters create orders. The initial status is set to `OrderStatus.NEW` by default in `orders.service.ts` (`createOrder`).
2. **Kitchen Preparation (`PREPARING` / `SENT_TO_KITCHEN`):** Chef starts cooking. Status is updated to `PREPARING`.
3. **Fulfilled in Kitchen (`READY`):** Order is marked ready for serving.
4. **Served (`SERVED`):** Waiter serves the order. At this point, inventory is deducted (via `inventoryService.deductInventoryForOrder`).
5. **Paid (`PAID`):** Customer pays, completing the transaction.

## 4. Existing Order APIs
The following APIs exist for managing orders under `/api/orders`:
* **GET `/api/orders`** - Fetches all orders for the active restaurant.
  * *Roles:* OWNER, MANAGER, CASHIER, WAITER, CHEF, SUPER_ADMIN.
* **POST `/api/orders`** - Creates a new order.
  * *Roles:* WAITER, MANAGER, OWNER, SUPER_ADMIN.
* **GET `/api/orders/table/:tableNumber`** - Fetches orders for a specific table.
  * *Roles:* OWNER, MANAGER, CASHIER, WAITER, CHEF, SUPER_ADMIN.
* **GET `/api/orders/:id`** - Retrieves details of a specific order.
  * *Roles:* OWNER, MANAGER, CASHIER, WAITER, CHEF, SUPER_ADMIN.
* **PUT `/api/orders/:id/status`** - Updates the status of an order.
  * *Roles:* CHEF, WAITER, MANAGER, OWNER, SUPER_ADMIN.
* **DELETE `/api/orders/:id`** - Deletes an order.
  * *Roles:* MANAGER, OWNER, SUPER_ADMIN.

## 5. Summary & Reuse Plan
* **Status Mapping:** We will map the preferred workflow (`NEW` -> `COOKING` -> `READY` -> `SERVED`) to the existing database status values:
  * `NEW` -> `OrderStatus.NEW`
  * `COOKING` -> `OrderStatus.PREPARING`
  * `READY` -> `OrderStatus.READY`
  * `SERVED` -> `OrderStatus.SERVED`
* **Status Updates:** We will reuse `ordersService.updateOrderStatus` to update the order statuses and handle the automatic inventory deduction when marked `SERVED`.
