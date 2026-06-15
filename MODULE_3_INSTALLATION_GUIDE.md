# Module 3: Menu Management System - Installation & Integration Guide

## Overview

Module 3 is a production-ready Menu Management System for SmartServe AI. It provides restaurant owners and managers with a premium SaaS interface to manage menu items, categories, and analytics.

---

## 📦 Installation Instructions

### 1. Install Additional Dependencies (If Needed)

#### Backend
The backend uses existing dependencies. Ensure all are installed:

```bash
cd backend
npm install
```

**Required packages (already in package.json):**
- `express` - Web framework
- `pg` - PostgreSQL driver
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT authentication
- `joi` - Input validation
- `cors` - Cross-origin requests
- `dotenv` - Environment variables

#### Frontend
The frontend uses existing dependencies. Install or verify:

```bash
cd frontend
npm install
```

**Required packages (already in package.json):**
- `react` & `react-dom` - UI library
- `react-router-dom` - Routing
- `axios` - HTTP client
- `tailwindcss` - Styling
- `typescript` - Type safety

### 2. Database Setup

Run the menu schema migration:

```sql
-- Connect to your PostgreSQL database
psql -U postgres -d smartserve -f database/schema/002_create_menu_schema.sql
```

Or execute the SQL directly in your database client:

```sql
-- File: database/schema/002_create_menu_schema.sql
-- Paste the entire schema file content
```

**Tables created:**
- `menu_categories` - Restaurant menu categories
- `menu_items` - Individual menu items
- `menu_item_analytics` - Item performance metrics

---

## 🔧 Integration Steps

### Backend Integration

#### Step 1: Verify Server Configuration

File: `backend/src/server.ts`

The file has been updated to include menu routes:

```typescript
import menuRouter from './modules/menu/menu.routes';

// Mount menu routes
app.use('/api/menu', menuRouter);
```

**Status:** ✅ Already integrated

#### Step 2: Environment Variables

Ensure your `.env` file includes:

```env
DATABASE_URL=postgres://user:password@localhost:5432/smartserve
JWT_SECRET=your-secure-secret
BCRYPT_SALT_ROUNDS=10
PORT=4000
```

#### Step 3: Build & Test Backend

```bash
cd backend

# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

**Expected output:**
```
Backend server listening on port 4000
```

### Frontend Integration

#### Step 1: Verify Routing

File: `frontend/src/App.tsx`

The file has been updated to include menu routes:

```typescript
import MenuDashboard from './pages/menu/MenuDashboard'
import AddMenuItem from './pages/menu/AddMenuItem'
import EditMenuItem from './pages/menu/EditMenuItem'

// Routes automatically included with role-based access
```

**Status:** ✅ Already integrated

#### Step 2: Verify Environment Configuration

Ensure your `.env.local` (frontend) includes:

```env
VITE_API_BASE=http://localhost:4000/api
```

#### Step 3: Build & Test Frontend

```bash
cd frontend

# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Expected output:**
```
VITE v8.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

---

## 🎯 API Endpoints Reference

### Menu Items

| Method | Endpoint | Authentication | Description |
|--------|----------|---|---|
| POST | `/api/menu` | Required | Create menu item |
| GET | `/api/menu` | Required | Get all menu items |
| GET | `/api/menu/:id` | Required | Get menu item by ID |
| PUT | `/api/menu/:id` | Required | Update menu item |
| DELETE | `/api/menu/:id` | Required | Delete menu item |
| PATCH | `/api/menu/:id/availability` | Required | Toggle availability |
| GET | `/api/menu/search` | Required | Search menu items |

### Categories

| Method | Endpoint | Authentication | Description |
|--------|----------|---|---|
| GET | `/api/menu/categories` | Required | Get all categories |
| POST | `/api/menu/categories` | Required | Create category |

### Statistics

| Method | Endpoint | Authentication | Description |
|--------|----------|---|---|
| GET | `/api/menu/stats` | Required | Get menu statistics |

---

## 📂 File Structure

### Backend Files

```
backend/src/modules/menu/
├── menu.types.ts           # TypeScript interfaces and enums
├── menu.validation.ts      # Input validation schemas
├── menu.service.ts         # Business logic and DB operations
├── menu.controller.ts      # Route handlers
├── menu.routes.ts          # Express routes
```

### Frontend Files

```
frontend/src/
├── pages/menu/
│   ├── MenuDashboard.tsx   # Main menu management dashboard
│   ├── AddMenuItem.tsx     # Create new menu item
│   └── EditMenuItem.tsx    # Edit existing menu item
├── components/menu/
│   ├── MenuCard.tsx        # Menu item card component
│   └── MenuStats.tsx       # Statistics cards
└── services/
    └── menuService.ts      # API client service
```

### Database Files

```
database/
└── schema/
    └── 002_create_menu_schema.sql  # Menu tables and indexes
```

---

## 🎨 Design Features

### Frontend Design Highlights

1. **Premium Dark Theme**
   - Dark gradient backgrounds (slate-900)
   - Purple and blue accent colors
   - Glassmorphism effects

2. **Modern Components**
   - Animated statistics cards
   - Beautiful menu item cards with hover effects
   - Responsive grid layouts

3. **Interactive Elements**
   - Real-time search filtering
   - Category filtering with color codes
   - Toggle availability switches
   - Delete confirmation modals

4. **Responsive Design**
   - Mobile-first approach
   - Adapts to all screen sizes
   - Touch-friendly buttons

---

## 🧪 Testing the Module

### 1. Create a Menu Category (via API)

```bash
curl -X POST http://localhost:4000/api/menu/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Biryani",
    "icon_emoji": "🍛",
    "color_code": "#FF6B35"
  }'
```

### 2. Create a Menu Item (via API)

```bash
curl -X POST http://localhost:4000/api/menu \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "CATEGORY_UUID",
    "name": "Chicken Biryani",
    "description": "Fragrant basmati rice with tender chicken",
    "price": 250,
    "preparation_time": 30,
    "spice_level": 2,
    "dietary_info": "NON_VEGETARIAN"
  }'
```

### 3. Access Menu Dashboard

1. Navigate to http://localhost:5173/
2. Login with RESTAURANT_OWNER or MANAGER role
3. Click on menu navigation link
4. Should see MenuDashboard with empty state

### 4. Add Menu Item via UI

1. Click "➕ Add Item" button
2. Fill in form fields
3. Click "Create Item"
4. Item should appear on dashboard

### 5. Edit Menu Item

1. Click "✎ Edit" on any menu card
2. Update fields
3. Click "Save Changes"
4. Changes should reflect immediately

### 6. Toggle Availability

1. Click "🔓 Mark Unavailable" (or vice versa)
2. Badge should update
3. Item availability status changes

### 7. Delete Menu Item

1. Click "🗑 Delete" on any menu card
2. Confirm deletion in modal
3. Item should disappear from list

---

## 🔐 Authentication & Authorization

### Role-Based Access Control

Menu Management is restricted to:
- `RESTAURANT_OWNER` - Full access
- `MANAGER` - Full access

Users with other roles (CASHIER, WAITER, KITCHEN_STAFF) cannot access menu management.

### JWT Implementation

All menu endpoints require valid JWT token in Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🚀 Deployment Checklist

- [ ] Database schema migrated (`002_create_menu_schema.sql`)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables configured
- [ ] Backend server starts successfully
- [ ] Frontend app starts successfully
- [ ] Can create menu categories
- [ ] Can create menu items
- [ ] Can edit menu items
- [ ] Can delete menu items
- [ ] Can toggle availability
- [ ] Search filtering works
- [ ] Category filtering works
- [ ] Statistics display correctly
- [ ] Responsive design on mobile

---

## 🐛 Troubleshooting

### Backend Issues

**Error: "Category not found or unauthorized"**
- Ensure category_id belongs to your restaurant
- Verify restaurant_id in JWT token

**Error: "Database connection failed"**
- Check DATABASE_URL environment variable
- Verify PostgreSQL is running
- Ensure schema migrations ran successfully

**Error: "Invalid token"**
- Ensure JWT_SECRET matches in backend
- Verify token hasn't expired
- Re-authenticate

### Frontend Issues

**Menu items not loading**
- Check browser console for network errors
- Verify API_BASE URL in .env.local
- Ensure token is valid
- Check backend is running

**Images not displaying**
- Verify image_url is valid HTTP URL
- Check CORS is enabled on backend
- Ensure image server is accessible

**Styling looks broken**
- Clear browser cache
- Rebuild frontend: `npm run build`
- Verify Tailwind CSS compiled correctly

---

## 📊 Performance Optimization

The module includes several optimizations:

1. **Database Indexes**
   - Indexes on `restaurant_id`, `category_id`, `is_available`
   - Fast filtering and search queries

2. **Query Optimization**
   - Eager loading analytics with menu items
   - Single query for statistics
   - Efficient search with ILIKE

3. **Frontend Caching**
   - Minimized re-renders with useMemo
   - Efficient state management
   - Lazy loading of components

---

## 📖 API Response Examples

### Create Menu Item Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "restaurant_id": "user-id",
  "category_id": "category-id",
  "name": "Chicken Biryani",
  "description": "Fragrant basmati rice with tender chicken",
  "price": 250,
  "image_url": "https://example.com/image.jpg",
  "is_available": true,
  "is_bestseller": false,
  "preparation_time": 30,
  "spice_level": 2,
  "dietary_info": "VEGETARIAN",
  "calories": 450,
  "tags": "rice,spicy",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "analytics": {
    "id": "analytics-id",
    "menu_item_id": "item-id",
    "orders_count": 0,
    "revenue": 0,
    "rating": 0,
    "last_ordered_at": null
  }
}
```

### Menu Statistics Response

```json
{
  "total_items": 45,
  "available_items": 42,
  "categories_count": 8,
  "average_price": 280.50,
  "bestsellers_count": 5,
  "total_revenue": 15500.00,
  "highest_rated_item": {
    "id": "item-id",
    "name": "Paneer Tikka",
    "price": 320,
    ...
  }
}
```

---

## 🎓 Feature Walkthrough

### MenuDashboard.tsx Features

- **Statistics Cards** with animated counter
- **Search Bar** with real-time filtering
- **Category Filter** with color-coded buttons
- **Menu Cards** grid with hover effects
- **Availability Toggle** for quick status change
- **Edit/Delete Actions** with confirmation

### AddMenuItem.tsx Features

- **Category Selection** dropdown with emoji icons
- **Form Validation** with error messages
- **Multiple Fields** (name, price, image, dietary info)
- **Dietary Preferences** (Vegetarian, Vegan, etc.)
- **Spice Level** selector with emoji indicators
- **Bestseller Toggle** for quick promotion

### EditMenuItem.tsx Features

- **Pre-filled Form** with existing data
- **Edit All Fields** including category change
- **Same Validation** as add form
- **Cancel/Save Options**

### MenuCard.tsx Component

- **Beautiful Image Display** with fallback icon
- **Badges** for bestseller and availability status
- **Analytics Display** (orders, revenue, rating)
- **Action Buttons** (Edit, Delete, Toggle)
- **Confirmation Modal** for delete action
- **Hover Animations** and transitions

---

## 🔄 Next Steps

### Future Enhancements

1. **Image Upload** - Direct image upload instead of URL
2. **Bulk Operations** - Bulk edit/delete menu items
3. **Import/Export** - CSV import/export functionality
4. **Analytics Dashboard** - Detailed sales analytics
5. **Menu Versioning** - Track menu item changes
6. **Seasonal Items** - Date-based availability
7. **Item Variants** - Sizes, extras, customizations

---

## 📝 Notes

- All menu operations require valid JWT authentication
- Restaurant ID is extracted from JWT token
- All timestamps use ISO 8601 format (UTC)
- Prices stored as DECIMAL(10,2) for accuracy
- Images served as external URLs (CDN recommended)
- Analytics updated automatically on orders

---

**Module 3 Status:** ✅ Production Ready

**Last Updated:** January 2025
**Version:** 1.0.0
