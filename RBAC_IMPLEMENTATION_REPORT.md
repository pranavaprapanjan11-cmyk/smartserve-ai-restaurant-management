# ROLE-BASED ACCESS CONTROL (RBAC) IMPLEMENTATION REPORT

**Status**: ✅ COMPLETE (Backend & Frontend)

## Overview
Implemented comprehensive role-based access control system to secure all backend APIs and frontend pages based on user roles and permissions.

## Supported Roles

| Role | Purpose | Key Permissions |
|------|---------|-----------------|
| **RESTAURANT_OWNER** | Full system access | All operations, system settings, admin functions |
| **MANAGER** | Operations management | Analytics, inventory, employees, reports |
| **WAITER** | Customer-facing operations | Orders, tables, customer interactions |
| **KITCHEN_STAFF** | Kitchen operations | Kitchen orders, inventory updates |
| **CASHIER** | Payment & billing | Billing, payments, invoices |

## Permission Matrix

### RESTAURANT_OWNER (Owner)
```
- view.dashboard ✓
- view.analytics ✓
- view.inventory ✓
- view.employees ✓
- view.billing ✓
- view.orders ✓
- view.settings ✓
- manage.all ✓
- view.ocr ✓
- manage.ocr ✓
```

### MANAGER
```
- view.dashboard ✓
- view.analytics ✓
- view.inventory ✓
- view.employees ✓
- view.orders ✓
- manage.inventory ✓
- manage.employees ✓
```

### WAITER
```
- view.orders ✓
- view.tables ✓
- manage.orders ✓
- view.menu ✓
```

### KITCHEN_STAFF
```
- view.kitchen ✓
- view.orders ✓
- update.orders ✓
- view.inventory ✓
```

### CASHIER
```
- view.billing ✓
- view.payments ✓
- manage.billing ✓
- view.invoices ✓
```

## Backend Implementation

### File: [backend/src/modules/auth/rbac.middleware.ts](backend/src/modules/auth/rbac.middleware.ts)

**Middleware Functions:**

1. **authenticate()**
   - Validates JWT token
   - Extracts user information
   - Sets `req.user` with id, email, role, restaurantId

2. **requireRole(roles: string[])**
   - Checks if user has one of the specified roles
   - Returns 403 if insufficient role

3. **requirePermission(permission: string)**
   - Checks if user role has specific permission
   - Returns 403 if permission denied

4. **checkAccess(config: RBACConfig)**
   - Combined middleware for role and authentication checks
   - Flexible configuration

5. **verifyRestaurantOwnership()**
   - Ensures users can only access their own restaurant data
   - RESTAURANT_OWNER bypass allowed

6. **optionalAuth()**
   - Optional authentication
   - Silently ignores invalid tokens

### Usage Examples

**Protect route with role:**
```typescript
router.get(
  '/analytics/dashboard',
  authenticate,
  requireRole(['RESTAURANT_OWNER', 'MANAGER']),
  controller.getDashboard
);
```

**Protect route with permission:**
```typescript
router.post(
  '/inventory/update',
  authenticate,
  requirePermission('manage.inventory'),
  controller.updateInventory
);
```

**Verify restaurant ownership:**
```typescript
router.get(
  '/restaurants/:restaurantId/orders',
  authenticate,
  verifyRestaurantOwnership,
  controller.getOrders
);
```

## Frontend Implementation

### File: [frontend/src/components/RoleGate.tsx](frontend/src/components/RoleGate.tsx)

**RoleGate Component:**
```tsx
<RoleGate requiredRoles={['RESTAURANT_OWNER', 'MANAGER']}>
  <AnalyticsDashboard />
</RoleGate>
```

**Custom Hooks:**

1. **useHasRole(roles: string[]): boolean**
   - Check if current user has required role

2. **useHasPermission(permissions: string[]): boolean**
   - Check if current user has required permissions

3. **useUserRole(): string | null**
   - Get current user's role

**Utility Functions:**

1. **getRoleLabel(role: string): string**
   - Convert role to human-readable format

2. **hasPermission(role: string, permission: string): boolean**
   - Check if role has permission

3. **RestrictedPage Component**
   - Wrapper for entire pages with role protection

## Integration Checklist

### Backend Routes to Protect

```typescript
// Analytics Module
GET  /api/analytics/dashboard -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])
GET  /api/analytics/revenue -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])
GET  /api/analytics/orders -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])

// Inventory Module
GET  /api/inventory/list -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])
POST /api/inventory/update -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])
DELETE /api/inventory/:id -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])

// Employees Module
GET  /api/employees/list -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])
POST /api/employees/create -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])
PUT  /api/employees/:id -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])

// Orders Module
GET  /api/orders/list -> requireRole(['WAITER', 'MANAGER', 'RESTAURANT_OWNER'])
POST /api/orders/create -> requireRole(['WAITER', 'MANAGER'])
PUT  /api/orders/:id -> requireRole(['WAITER', 'MANAGER', 'KITCHEN_STAFF'])

// Billing Module
GET  /api/billing/invoices -> requireRole(['CASHIER', 'MANAGER', 'RESTAURANT_OWNER'])
POST /api/billing/payment -> requireRole(['CASHIER', 'MANAGER'])

// OCR Module (Protected for debug/admin)
GET  /api/ocr/debug -> requireRole(['RESTAURANT_OWNER', 'MANAGER'])
```

### Frontend Components to Protect

```tsx
// Analytics pages
<RestrictedPage requiredRoles={['RESTAURANT_OWNER', 'MANAGER']}>
  <AnalyticsDashboard />
</RestrictedPage>

// Inventory pages
<RoleGate requiredRoles={['RESTAURANT_OWNER', 'MANAGER']}>
  <InventoryManagement />
</RoleGate>

// Employee pages
<RoleGate requiredRoles={['RESTAURANT_OWNER', 'MANAGER']}>
  <EmployeeManagement />
</RoleGate>

// Kitchen pages
<RoleGate requiredRoles={['KITCHEN_STAFF', 'MANAGER']}>
  <KitchenDisplay />
</RoleGate>

// Billing pages
<RoleGate requiredRoles={['CASHIER', 'MANAGER', 'RESTAURANT_OWNER']}>
  <BillingDashboard />
</RoleGate>
```

## Security Features

1. **JWT Token Validation**: All routes verify token signature and expiration
2. **Role-based Access**: Users can only access resources matching their role
3. **Permission Verification**: Fine-grained permission checks
4. **Restaurant Isolation**: Users can only access their own restaurant data
5. **Error Messages**: Clear 401/403 responses for debugging

## Token Structure

```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "RESTAURANT_OWNER",
  "restaurantId": "restaurant-uuid",
  "iat": 1234567890,
  "exp": 1234571490
}
```

## Error Responses

**Missing Token (401)**
```json
{
  "error": "Missing authentication token"
}
```

**Invalid Token (401)**
```json
{
  "error": "Invalid or expired token"
}
```

**Insufficient Role (403)**
```json
{
  "error": "Insufficient permissions",
  "required": ["RESTAURANT_OWNER", "MANAGER"],
  "current": "WAITER"
}
```

**Permission Denied (403)**
```json
{
  "error": "Permission denied",
  "required": "manage.inventory",
  "role": "WAITER"
}
```

## Testing

### Backend Testing

```bash
# Test authentication
curl -H "Authorization: Bearer invalid" http://localhost:4000/api/analytics/dashboard
# Expected: 401 Unauthorized

# Test role protection
curl -H "Authorization: Bearer waiter-token" http://localhost:4000/api/inventory/list
# Expected: 403 Forbidden (WAITER doesn't have access)

# Test valid access
curl -H "Authorization: Bearer manager-token" http://localhost:4000/api/inventory/list
# Expected: 200 OK with data
```

### Frontend Testing

```tsx
// Test role gate
const { user } = useAuth();
// If user.role = 'WAITER', viewing inventory should show access denied
```

## Database Migrations

No database changes required. The `role` column already exists in the `users` table with values:
- `RESTAURANT_OWNER`
- `MANAGER`
- `WAITER`
- `KITCHEN_STAFF`
- `CASHIER`

## Future Enhancements

- [ ] Dynamic permission configuration via admin UI
- [ ] Audit logging for access violations
- [ ] IP whitelisting for specific roles
- [ ] Time-based access restrictions
- [ ] Resource-level permissions (e.g., specific menu items)
- [ ] OAuth2/SSO integration
