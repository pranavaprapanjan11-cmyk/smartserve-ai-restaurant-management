# SmartServe AI Phase 2 Audit

## 1. Existing Role System

### Backend
- Roles are defined in `backend/src/modules/auth/auth.types.ts` as:
  - `SUPER_ADMIN`
  - `RESTAURANT_OWNER`
  - `MANAGER`
  - `CASHIER`
  - `WAITER`
  - `KITCHEN_STAFF`
- Authentication uses JWT in `backend/src/modules/auth/auth.middleware.ts`.
- `authenticateJWT` verifies tokens and loads `user.id`, `user.role`, and `user.email`.
- `authorizeRoles(...)` is available and used in inventory routes for create/update/delete operations only.
- `auth.routes.ts` exposes `/api/auth/register`, `/api/auth/login`, and `/api/auth/me`.
- Registration validates roles in `backend/src/modules/auth/auth.validation.ts` and frontend `Register.tsx` exposes all backend roles.

### Frontend
- Auth state is stored in `frontend/src/context/AuthContext.tsx` and preserved in `localStorage`.
- `frontend/src/routes/ProtectedRoute.tsx` protects the app and supports an optional allowed-role list.
- `frontend/src/components/Layout/TopNav.tsx` currently only conditionally shows the Kitchen link for roles:
  - `KITCHEN_STAFF`
  - `MANAGER`
  - `RESTAURANT_OWNER`
  - `SUPER_ADMIN`
- No other explicit role-based navigation visibility exists today.

### Current role gaps vs requested Phase B roles
- `CHEF` does not exist; the system currently uses `KITCHEN_STAFF`.
- `MANAGER`, `CASHIER`, `WAITER`, and `RESTAURANT_OWNER` exist.
- There is no built-in frontend or backend enforcement of the desired role access boundaries beyond inventory and kitchen.

## 2. Existing Restaurant Ownership Model

### Data model
- The database schema uses `restaurant_id UUID NOT NULL REFERENCES users(id)` in most business tables:
  - `menu_categories`
  - `menu_items`
  - `orders`
  - `inventory_items`
  - `menu_item_ingredients`
  - `payments`, `invoices`, etc.
- This means `users.id` is treated as the restaurant owner identifier rather than a separate `restaurants` table.
- The `employees` schema references `restaurants(id)`, but the rest of the system does not consistently use a dedicated restaurant entity.

### Ownership resolution
- `backend/src/modules/orders/orders.service.ts` contains `getRestaurantId(userId, role)`:
  - If role is `RESTAURANT_OWNER` or `SUPER_ADMIN`, restaurant ID = user ID.
  - Otherwise, it selects the first user with role `RESTAURANT_OWNER` in the DB.
- `backend/src/modules/menu/menu.routes.ts` uses that resolver to override `req.user.id` for menu requests so waiter/staff see the restaurant owner's menu.
- `backend/src/modules/inventory/inventory.service.ts` uses the same fallback by selecting the first restaurant owner.

### Risks
- Current ownership is effectively single-restaurant by first owner lookup.
- There is no explicit restaurant assignment for staff users.
- Cross-restaurant isolation is weak: multiple owners or restaurants are not clearly separated.

## 3. Existing Order Workflow

### Backend flow
- `backend/src/modules/orders/orders.routes.ts` protects all order routes with `authenticateJWT`.
- `createOrder` in `orders.service.ts`:
  - resolves restaurant using `getRestaurantId`
  - validates menu items belong to that restaurant and are available
  - inserts `orders` and `order_items`
  - updates `menu_item_analytics`
- `updateOrderStatus` can deduct inventory when status becomes `SERVED`.
- `getOrders` and `getOrderById` fetch orders scoped to `restaurant_id`.
- `getOrdersByTable` exists, using `table_number` and restaurant isolation.

### Order status model
- Status values in `backend/src/modules/orders/orders.types.ts`:
  - `NEW`
  - `SENT_TO_KITCHEN`
  - `PREPARING`
  - `READY`
  - `SERVED`
  - `PAID`
- This supports the requested kitchen flow states, though the current backend does not enforce state transitions in a strict KDS.

### Frontend flow
- Order pages exist for waiter workflows:
  - `WaiterDashboard`
  - `CreateOrder`
  - `OrderDetails`
- Kitchen page exists at `/kitchen` and is protected for kitchen-capable roles.
- No frontend workflow currently enforces the requested Owner/Manager/Cashier/Waiter/Chef boundaries across all modules.

## 4. Existing Inventory Workflow

### Backend flow
- `inventory.routes.ts` applies `authenticateJWT` to all inventory endpoints.
- `authorizeRoles` allows only `MANAGER`, `RESTAURANT_OWNER`, and `SUPER_ADMIN` to create/update/delete inventory items and save recipes.
- `listLowStockItems`, `getInventoryItems`, and `getInventoryItemById` are available to all authenticated users.
- `deductInventoryForOrder` exists and uses `menu_item_ingredients` to subtract items when an order is served.
- Inventory schema includes support for categories, suppliers, transactions, and alerts, but not all of that may be wired into the current API.

### Gaps
- Inventory item access is not explicitly restricted by role for read-only operations.
- Billing and analytics can access inventory indirectly, but there is no comprehensive notification or low-stock event system yet.

## 5. Existing Analytics Workflow

### Backend flow
- Analytics dashboard is exposed via `GET /api/analytics/dashboard` and protected with `authenticateJWT`.
- `getAnalyticsDashboard` in `analytics.service.ts` returns:
  - daily, weekly, monthly, total revenue
  - order counts by status
  - menu item sales/revenue
  - kitchen metrics and delayed orders
  - inventory low-stock counts
  - health score and trend data
- It uses `getRestaurantId(userId, role)` for restaurant scoping.

### Frontend flow
- Analytics page exists at `/analytics` in `frontend/src/pages/analytics/AnalyticsDashboard.tsx`.
- Frontend loads analytics data using the auth token.
- Route access is currently open to any authenticated user, not restricted to manager/owner only.

## 6. What Already Exists

- Role enum and backend JWT auth mechanism
- Core order creation and status update workflow
- Inventory item CRUD + recipe mapping
- Analytics aggregation for sales, kitchen, and inventory health
- AI intelligence dashboards using the same restaurant scoping
- Menu and billing modules with restaurant-scoped queries
- Table number tracking inside orders
- Kitchen dashboard page and route

## 7. What Is Missing

### Role-based access control
- `CHEF` role is missing and should be added separately from `KITCHEN_STAFF`.
- Backend lacks fine-grained role permission enforcement in:
  - billing routes
  - menu management routes
  - orders routes
  - analytics routes
  - settings routes
- Frontend lacks explicit role-based navigation and route gating for:
  - Billing only for Cashiers
  - Orders only for Waiters
  - Inventory/Analytics for Managers
  - Kitchen display only for Chef/Kitchen roles
  - Full admin pages only for Owners

### Restaurant ownership / multi-restaurant readiness
- There is no dedicated `restaurants` entity in active business logic.
- `getRestaurantId` fallback to the first `RESTAURANT_OWNER` is not safe for multiple restaurants.
- Staff users are not assigned to a specific restaurant in the current auth flow.
- Cross-restaurant security is not validated or enforced consistently.

### Table management
- Orders include `table_number`, but there is no table management module or table status dashboard.
- No front-end components exist for table availability, capacity, or reservations.

### Export and notifications
- No PDF/Excel export endpoints or frontend export UI exist.
- No notification subsystem exists for low stock, order ready, or daily revenue summary.

### Platform gaps
- Billing routes are auth-protected but not role-restricted by backend.
- Inventory routes are partially role-restricted, but visibility is broad.
- Analytics route is unrestricted beyond authentication.

## 8. Recommended Implementation Order

1. **Phase B: Role-Based Access Control**
   - Add missing `CHEF` role and map it to kitchen display behavior.
   - Harden backend authorization for each module with `authorizeRoles`.
   - Add frontend role gating for navigation and protected routes.
   - Use existing `ProtectedRoute` and extend menu visibility logic.

2. **Restaurant Ownership / Multi-Restaurant Audit**
   - Create explicit restaurant ownership resolution.
   - Assign staff users to a specific restaurant instead of using the first owner fallback.
   - Fix cross-restaurant isolation and enforce it consistently in services.
   - Generate a separate `MULTI_RESTAURANT_AUDIT.md` after the audit.

3. **Phase C: Kitchen Display System**
   - Reuse order statuses already present.
   - Build kitchen queues from existing `orders` and `order_items`.
   - Add real-time refresh and kitchen workflow pages.

4. **Phase D: Table Management**
   - Add a table entity/dashboard and map orders to tables.
   - Keep order creation as-is while adding table status tracking.

5. **Phase E: Report Exports**
   - Add reporting endpoints using analytic aggregates.
   - Build simple PDF/Excel export from existing dashboards.

6. **Phase F: Notification System**
   - Add low stock / order ready / daily revenue alerts using existing inventory and billing data.
   - Keep implementation lightweight and event-driven.

7. **Phase G: Multi-Restaurant Readiness**
   - Perform a final pass on isolation, ownership boundaries, and shared data security.
   - Do not rewrite working modules; patch only missing isolation behavior.

## 9. Immediate Priority

- Phase B must start with the missing role enforcement and restaurant ownership fixes.
- The next step is to implement role restrictions and validate both backend and frontend.
- Do not begin Phase C until Phase B is complete and tested.
