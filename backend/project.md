✅ auth
✅ users
✅ menuCategories
✅ menuItems
✅ tables
✅ orders
✅ orderItems
✅ payments
✅ paymentMethods   ← simple CRUD, quick
❌ stock            ← inventory management
❌ stockOrders      ← purchase orders
❌ suppliers        ← vendor management
❌ stockAlerts      ← low stock alerts
❌ analytics        ← last


// ============================================================
## ROUTE DETAILS
// ============================================================
 
// ------------------------------------------------------------
## AUTH — /api/auth
// No token required
// ------------------------------------------------------------
// POST   /api/auth/login          → Login, returns JWT token
// POST   /api/auth/logout         → Invalidate token (optional)
// GET    /api/auth/me             → Get current logged-in user (needs token)
 
// ------------------------------------------------------------
## USERS — /api/users
## Admin only
// ------------------------------------------------------------
// GET    /api/users               → Get all users
// GET    /api/users/:id           → Get single user
// POST   /api/users               → Create new user (admin creates staff)
// PUT    /api/users/:id           → Update user (name, email, role)
// DELETE /api/users/:id           → Delete user
 
// ------------------------------------------------------------
## MENU CATEGORIES — /api/menu-categories
## GET: all roles | POST/PUT/DELETE: admin only
// ------------------------------------------------------------
// GET    /api/menu-categories         → Get all categories
// GET    /api/menu-categories/:id     → Get single category
// POST   /api/menu-categories         → Create category
// PUT    /api/menu-categories/:id     → Update category
// DELETE /api/menu-categories/:id     → Delete category
 
// ------------------------------------------------------------
## MENU ITEMS — /api/menu-items
## GET: all roles | POST/PUT/DELETE: admin only
// ------------------------------------------------------------
// GET    /api/menu-items              → Get all items (with current price)
// GET    /api/menu-items/:id          → Get single item + price history
// POST   /api/menu-items              → Create item
// PUT    /api/menu-items/:id          → Update item
// PATCH  /api/menu-items/:id/toggle   → Toggle available true/false
// DELETE /api/menu-items/:id          → Delete item
 
// ------------------------------------------------------------
## TABLES — /api/tables
## GET: all roles | POST/PUT/DELETE: admin only
// ------------------------------------------------------------
// GET    /api/tables                  → Get all tables
// GET    /api/tables/:id              → Get single table
// POST   /api/tables                  → Create table
// PUT    /api/tables/:id              → Update table
// PATCH  /api/tables/:id/toggle       → Toggle is_active
// DELETE /api/tables/:id              → Delete table
 
// ------------------------------------------------------------
## ORDERS — /api/orders
## GET: cashier/admin | POST: cashier/guest | PATCH: cashier
// ------------------------------------------------------------
// GET    /api/orders                  → Get all orders (filter by status)
// GET    /api/orders/:id              → Get single order + items
// GET    /api/orders/table/:tableId   → Get active order for a table
// POST   /api/orders                  → Create new order
// PATCH  /api/orders/:id/status       → Update order status
// DELETE /api/orders/:id              → Cancel order (admin only)
 
// ------------------------------------------------------------
## ORDER ITEMS — /api/order-items
## POST: cashier/guest | PATCH: kitchen/barista/cashier
// ------------------------------------------------------------
// GET    /api/order-items/:orderId         → Get all items for an order
// GET    /api/order-items/queue/kitchen    → Food items with status Pending/Preparing
// GET    /api/order-items/queue/barista    → Drink items with status Pending/Preparing
// GET    /api/orders/table/:tableId
// POST   /api/order-items                  → Add item to order
// PATCH  /api/order-items/:id/status       → Update item status (Preparing/Ready)
//                                            ★ triggers stock deduction when → Ready
// DELETE /api/order-items/:id              → Remove item from order
 
// ------------------------------------------------------------
## PAYMENTS — /api/payments
## Cashier only (admin can view)
// ------------------------------------------------------------
// GET    /api/payments                → Get all payments
// GET    /api/payments/:id            → Get single payment
// GET    /api/payments/order/:orderId → Get payment for an order
// POST   /api/payments                → Create payment (process bill)
// PATCH  /api/payments/:id/status     → Update payment status
 
// ------------------------------------------------------------
## PAYMENT METHODS — /api/payment-methods
## GET: all | POST/DELETE: admin only
// ------------------------------------------------------------
// GET    /api/payment-methods         → Get all payment methods
// POST   /api/payment-methods         → Add new method
// DELETE /api/payment-methods/:id     → Remove method
 
// ------------------------------------------------------------
## STOCK — /api/stock
## GET: admin | POST/PUT: admin
// ------------------------------------------------------------
// GET    /api/stock                   → Get all stock items
// GET    /api/stock/:id               → Get single stock item
// POST   /api/stock                   → Add new stock item
// PUT    /api/stock/:id               → Update stock item
// PATCH  /api/stock/:id/quantity      → Add stock quantity
// DELETE /api/stock/:id               → Delete stock item
 
// ------------------------------------------------------------
## STOCK ORDERS — /api/stock-orders
## Admin only
// ------------------------------------------------------------
// GET    /api/stock-orders            → Get all purchase orders
// GET    /api/stock-orders/:id        → Get single purchase order
// POST   /api/stock-orders            → Place new purchase order
// PATCH  /api/stock-orders/:id/status → Update status (Ordered / Received)
//                                       ★ when Received → stock.quantity += quantity
 
// ------------------------------------------------------------
## SUPPLIERS — /api/suppliers
## Admin only
// ------------------------------------------------------------
// GET    /api/suppliers               → Get all suppliers
// GET    /api/suppliers/:id           → Get single supplier
// POST   /api/suppliers               → Add supplier
// PUT    /api/suppliers/:id           → Update supplier
// DELETE /api/suppliers/:id           → Delete supplier
 
// ------------------------------------------------------------
## STOCK ALERTS — /api/stock-alerts
## Admin only
// ------------------------------------------------------------
// GET    /api/stock-alerts            → Get all alerts (filter ?resolved=false)
// GET    /api/stock-alerts/:id        → Get single alert
// PATCH  /api/stock-alerts/:id/resolve → Mark alert as resolved
 
// ------------------------------------------------------------
## ANALYTICS — /api/analytics
## Admin only
// ------------------------------------------------------------
// GET    /api/analytics/revenue/daily       → Revenue per day (last 30 days)
// GET    /api/analytics/revenue/hourly      → Orders count per hour (peak hours)
// GET    /api/analytics/menu/top-selling    → Top 10 best selling items
// GET    /api/analytics/stock/usage         → Stock consumption per item
 

# RMS — Project Structure

```
rms-backend/
├── modules/
│   ├── auth/
│   │   ├── auth.route.js
│   │   ├── auth.controller.js
│   │   └── auth.service.js
│   ├── users/
│   │   ├── user.route.js
│   │   ├── user.controller.js
│   │   └── user.service.js
│   ├── menuCategories/
│   │   ├── menuCategory.route.js
│   │   ├── menuCategory.controller.js
│   │   └── menuCategory.service.js
│   ├── menuItems/
│   │   ├── menuItem.route.js
│   │   ├── menuItem.controller.js
│   │   └── menuItem.service.js
│   ├── prices/
│   │   ├── price.route.js
│   │   ├── price.controller.js
│   │   └── price.service.js
│   ├── recipes/
│   │   ├── recipe.route.js
│   │   ├── recipe.controller.js
│   │   └── recipe.service.js
│   ├── tables/
│   │   ├── table.route.js
│   │   ├── table.controller.js
│   │   └── table.service.js
│   ├── orders/
│   │   ├── order.route.js
│   │   ├── order.controller.js
│   │   └── order.service.js
│   ├── orderItems/
│   │   ├── orderItem.route.js
│   │   ├── orderItem.controller.js
│   │   └── orderItem.service.js  ← includes auto stock deduction logic
│   ├── payments/
│   │   ├── payment.route.js
│   │   ├── payment.controller.js
│   │   └── payment.service.js
│   ├── paymentMethods/
│   │   ├── paymentMethod.route.js
│   │   ├── paymentMethod.controller.js
│   │   └── paymentMethod.service.js
│   ├── stock/
│   │   ├── stock.route.js
│   │   ├── stock.controller.js
│   │   └── stock.service.js
│   ├── stockOrders/
│   │   ├── stockOrder.route.js
│   │   ├── stockOrder.controller.js
│   │   └── stockOrder.service.js
│   ├── suppliers/
│   │   ├── supplier.route.js
│   │   ├── supplier.controller.js
│   │   └── supplier.service.js
│   ├── stockAlerts/
│   │   ├── stockAlert.route.js
│   │   ├── stockAlert.controller.js
│   │   └── stockAlert.service.js
│   └── analytics/
│       ├── analytics.route.js
│       ├── analytics.controller.js
│       └── analytics.service.js
│
├── middleware/
│   ├── authenticate.js       ← verify JWT cookie (shared by all modules)
│   └── authorize.js          ← check role access (shared by all modules)
│
├── utils/
│   └── generateToken.js      ← generate JWT and set cookie
│
├── prisma/
│   ├── schema.prisma         ← database schema
│   └── seed.js               ← seed admin user, units, payment methods
│
├── app.js                    ← express setup, mount all module routes
├── server.js                 ← start server + Socket.io
└── .env                      ← environment variables
```

---

## File Responsibilities

| File | Responsibility |
|------|----------------|
| `*.route.js` | Define endpoints, apply middleware |
| `*.controller.js` | Handle req/res, call service |
| `*.service.js` | Prisma queries, business logic |
| `middleware/authenticate.js` | Verify JWT from cookie |
| `middleware/authorize.js` | Guard routes by role |
| `utils/generateToken.js` | Generate JWT and set as cookie |

---

## Environment Variables (.env)

```env
DATABASE_URL="mysql://root:password@localhost:3306/rms_db"
JWT_SECRET="your_super_secret_key_here"
JWT_EXPIRES_IN="1d"
NODE_ENV="development"
PORT=3000
```

---

## Install Dependencies

```bash
# Core
npm install express prisma @prisma/client bcrypt jsonwebtoken dotenv cookie-parser

# Features
npm install qrcode socket.io

# Dev
npm install --save-dev nodemon
```

---

## Getting Started

```bash
# 1. Setup database
npx prisma migrate dev --name init

# 2. Seed initial data
npx prisma db seed

# 3. Start server
npm run dev
```

---

## Module Build Order

Build modules in this order — each depends on the one before it:

1. `auth`             — login, cookie token
2. `users`            — admin manages staff
3. `menuCategories`   — needed before menu items
4. `menuItems`        — needed before orders
5. `prices`           — versioned pricing per item
6. `recipes`          — ingredient mapping per item
7. `tables`           — needed before orders
8. `suppliers`        — needed before stock orders
9. `stock`            — inventory
10. `stockOrders`     — purchase orders (Pending → Ordered → Received)
11. `stockAlerts`     — auto-created when stock hits min_level
12. `orders`          — core order flow
13. `orderItems`      — line items + auto stock deduction on Ready
14. `paymentMethods`  — lookup table
15. `payments`        — process bill
16. `analytics`       — queries existing data, build last

1. get order_id, method_id from req.body
2. get user_id from req.user

3. check order exists → if not → 404
4. check order.status !== "Paid" → if Paid → 400 "Order already paid"
5. check method exists → if not → 404

6. calculate total:
   → find all order_items where order_id = order_id
   → sum up (quantity × unit_price) for each item

7. wrap in $transaction:
   → create payment:
      { order_id, method_id, user_id, amount: total, status: "Completed" }
   → update order status to "Paid"

8. return payment