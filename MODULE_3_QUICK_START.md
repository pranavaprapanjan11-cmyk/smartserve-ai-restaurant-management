# Module 3: Menu Management System - Quick Start Guide

## ⚡ Quick Start (5 minutes)

### Prerequisites
- Node.js 16+ installed
- PostgreSQL running
- Git cloned SmartServe-AI repository

---

## 🚀 Setup Steps

### Step 1: Database Migration (1 min)

```bash
# Connect to PostgreSQL and run migration
psql -U postgres -d smartserve -f database/schema/002_create_menu_schema.sql

# Or paste the SQL from the file into your database client
```

**Expected output:** No errors, tables created

### Step 2: Backend Setup (2 min)

```bash
cd backend

# Install dependencies (if not done)
npm install

# Create or verify .env file
cat > .env << EOF
DATABASE_URL=postgres://user:password@localhost:5432/smartserve
JWT_SECRET=your-secure-secret-change-in-production
BCRYPT_SALT_ROUNDS=10
PORT=4000
EOF

# Start development server
npm run dev
```

**Expected output:**
```
Backend server listening on port 4000
```

### Step 3: Frontend Setup (2 min)

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Create or verify .env.local file
cat > .env.local << EOF
VITE_API_BASE=http://localhost:4000/api
EOF

# Start development server
npm run dev
```

**Expected output:**
```
VITE v8.x.x ready in xxx ms
Local: http://localhost:5173/
```

---

## 📂 Test the Module

### 1. Login to Application
```
URL: http://localhost:5173/
Username: (use a RESTAURANT_OWNER or MANAGER account)
Password: (your password)
```

### 2. Navigate to Menu Management
```
Click on Menu link in navigation
Should see empty menu dashboard with "Add Item" button
```

### 3. Create First Menu Item
```
Click "➕ Add Item"
Fill in form:
  - Category: (create one if needed)
  - Name: "Chicken Biryani"
  - Price: 250
  - Description: "Fragrant basmati rice"
Click "Create Item"
```

### 4. Verify in Dashboard
```
Return to menu dashboard
Should see item card with:
  - Food image placeholder
  - Price: ₹250
  - Available status
  - Edit and Delete buttons
```

---

## 📁 Created Files Location

### Backend
```
backend/src/modules/menu/
  ├── menu.types.ts
  ├── menu.validation.ts
  ├── menu.service.ts
  ├── menu.controller.ts
  └── menu.routes.ts
```

### Frontend
```
frontend/src/
  ├── pages/menu/
  │   ├── MenuDashboard.tsx
  │   ├── AddMenuItem.tsx
  │   └── EditMenuItem.tsx
  ├── components/menu/
  │   ├── MenuCard.tsx
  │   └── MenuStats.tsx
  └── services/
      └── menuService.ts
```

### Database
```
database/schema/
  └── 002_create_menu_schema.sql
```

### Documentation
```
MODULE_3_INSTALLATION_GUIDE.md
MODULE_3_COMPLETE_SUMMARY.md
```

---

## 🔧 API Testing with cURL

### Create Menu Category

```bash
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:4000/api/menu/categories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Biryani",
    "icon_emoji": "🍛",
    "color_code": "#FF6B35",
    "description": "Rice dishes"
  }'
```

### Create Menu Item

```bash
CATEGORY_ID="uuid-from-above"
TOKEN="your-jwt-token-here"

curl -X POST http://localhost:4000/api/menu \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": "'$CATEGORY_ID'",
    "name": "Chicken Biryani",
    "description": "Fragrant basmati rice with tender chicken",
    "price": 250,
    "image_url": "https://via.placeholder.com/300",
    "preparation_time": 30,
    "spice_level": 2,
    "dietary_info": "NON_VEGETARIAN",
    "is_available": true,
    "is_bestseller": true
  }'
```

### Get All Menu Items

```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:4000/api/menu \
  -H "Authorization: Bearer $TOKEN"
```

### Get Menu Statistics

```bash
TOKEN="your-jwt-token-here"

curl -X GET http://localhost:4000/api/menu/stats \
  -H "Authorization: Bearer $TOKEN"
```

### Search Menu Items

```bash
TOKEN="your-jwt-token-here"

curl -X GET "http://localhost:4000/api/menu/search?q=biryani" \
  -H "Authorization: Bearer $TOKEN"
```

### Toggle Availability

```bash
ITEM_ID="uuid-from-menu-item"
TOKEN="your-jwt-token-here"

curl -X PATCH "http://localhost:4000/api/menu/$ITEM_ID/availability" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_available": false}'
```

### Edit Menu Item

```bash
ITEM_ID="uuid-from-menu-item"
TOKEN="your-jwt-token-here"

curl -X PUT "http://localhost:4000/api/menu/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chicken Biryani (Updated)",
    "price": 275,
    "is_bestseller": false
  }'
```

### Delete Menu Item

```bash
ITEM_ID="uuid-from-menu-item"
TOKEN="your-jwt-token-here"

curl -X DELETE "http://localhost:4000/api/menu/$ITEM_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Common Issues & Solutions

### Issue: "Category not found"
**Solution:** Make sure you're using a category_id that belongs to your restaurant

### Issue: "Not authenticated"
**Solution:** Ensure your JWT token is valid and not expired

### Issue: "ECONNREFUSED" - Cannot connect to database
**Solution:** 
```bash
# Check if PostgreSQL is running
pg_isready

# If not, start PostgreSQL
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
# Windows: Services > PostgreSQL > Start
```

### Issue: "Module not found" errors
**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Styling looks broken
**Solution:**
```bash
# Rebuild frontend
cd frontend
npm run build
npm run preview
```

---

## 📊 Directory Structure

```
SmartServe-AI/
├── backend/
│   └── src/
│       ├── modules/
│       │   ├── auth/          # Module 2 (Authentication)
│       │   └── menu/          # Module 3 (Menu Management) ✨ NEW
│       └── server.ts          # UPDATED with menu routes
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── auth/          # Module 2 auth pages
│       │   └── menu/          # Module 3 menu pages ✨ NEW
│       ├── components/
│       │   └── menu/          # Module 3 components ✨ NEW
│       ├── services/
│       │   ├── authService.ts
│       │   └── menuService.ts # ✨ NEW
│       └── App.tsx            # UPDATED with menu routes
├── database/
│   └── schema/
│       ├── 001_create_users_table.sql
│       └── 002_create_menu_schema.sql # ✨ NEW
├── MODULE_3_INSTALLATION_GUIDE.md     # ✨ NEW
└── MODULE_3_COMPLETE_SUMMARY.md        # ✨ NEW
```

---

## 🧪 Manual Testing Workflow

### Test 1: Create Menu Item
1. Login with RESTAURANT_OWNER or MANAGER
2. Navigate to `/menu`
3. Click "➕ Add Item"
4. Fill form and submit
5. Verify item appears on dashboard

### Test 2: Edit Menu Item
1. Click "✎ Edit" on any menu card
2. Change any field
3. Click "Save Changes"
4. Verify changes reflected

### Test 3: Delete Menu Item
1. Click "🗑 Delete" on any menu card
2. Confirm in modal
3. Verify item removed

### Test 4: Search Functionality
1. Type in search bar
2. Verify filtered results
3. Clear search
4. Verify all items return

### Test 5: Category Filter
1. Click on category chip
2. Verify only items in that category show
3. Click "All Categories"
4. Verify all items return

### Test 6: Toggle Availability
1. Click availability button
2. Verify badge updates
3. Reload page
4. Verify status persisted

### Test 7: Statistics
1. View stats cards on dashboard
2. Verify correct counts and values
3. Create/delete items
4. Verify stats update

### Test 8: Access Control
1. Login with CASHIER or WAITER role
2. Try to access `/menu`
3. Should redirect to login

---

## 🚀 Production Deployment

### Backend
```bash
# Build
npm run build

# Run production build
npm start
```

### Frontend
```bash
# Build
npm run build

# Deploy dist/ folder to hosting
# Can use Vercel, Netlify, AWS S3, etc.
```

### Environment Variables
```bash
# Backend (.env)
DATABASE_URL=production-postgres-url
JWT_SECRET=long-random-secret-min-32-chars
BCRYPT_SALT_ROUNDS=10
PORT=4000
NODE_ENV=production

# Frontend (.env.production.local)
VITE_API_BASE=https://your-api.com/api
```

---

## 📚 Additional Resources

### Files to Read
- `MODULE_3_INSTALLATION_GUIDE.md` - Detailed installation
- `MODULE_3_COMPLETE_SUMMARY.md` - Full implementation details
- `docs/API_DESIGN.md` - API design principles
- `docs/ARCHITECTURE.md` - System architecture

### Backend Entry Points
- `backend/src/modules/menu/menu.routes.ts` - See all endpoints
- `backend/src/modules/menu/menu.service.ts` - See business logic
- `backend/src/modules/menu/menu.controller.ts` - See request handlers

### Frontend Entry Points
- `frontend/src/pages/menu/MenuDashboard.tsx` - Main dashboard
- `frontend/src/services/menuService.ts` - API client
- `frontend/src/components/menu/MenuCard.tsx` - Card component

---

## ✅ Checklist Before Deployment

- [ ] Database migrated
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Environment variables set
- [ ] Backend server starts without errors
- [ ] Frontend app starts without errors
- [ ] Can create menu item
- [ ] Can edit menu item
- [ ] Can delete menu item
- [ ] Statistics display correctly
- [ ] Search works correctly
- [ ] Category filter works
- [ ] Mobile responsive tested
- [ ] Error handling tested
- [ ] Role-based access tested

---

## 🎓 Learning Resources

### Backend Concepts Used
- Express.js routing
- PostgreSQL queries
- JWT authentication
- Input validation with Joi
- Error handling patterns
- Service layer architecture

### Frontend Concepts Used
- React hooks (useState, useEffect, useMemo)
- React Router routing
- Axios HTTP client
- Tailwind CSS styling
- Component composition
- Form handling and validation

### Database Concepts Used
- Table relationships (foreign keys)
- Indexes for performance
- Transaction support
- UUID primary keys
- Timestamp tracking

---

## 🤝 Support

If you encounter any issues:

1. Check the error message carefully
2. Review troubleshooting section above
3. Check backend console for logs
4. Check browser developer tools (F12)
5. Review the installation guide
6. Review the complete summary document

---

## 📞 Module 3 Contact Points

**Frontend Dashboard:** `/menu`  
**Add Item Page:** `/menu/add`  
**Edit Item Page:** `/menu/edit/:id`  

**Backend API Base:** `/api/menu`  
**Authentication:** JWT Bearer token required  
**Authorization:** RESTAURANT_OWNER or MANAGER role required  

---

**Module 3 Status:** ✅ Production Ready

Start using the Menu Management System now!

```bash
npm run dev  # Both backend and frontend
```

Then visit: http://localhost:5173/menu
