# Zoom RMS — Backend API

Backend REST API and real-time WebSocket service for Zoom RMS (Restaurant Management System), built with Express 5, Prisma ORM, PostgreSQL, and Socket.io.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 5
- **ORM & Database**: Prisma 6 + PostgreSQL (Neon-ready with keepalive)
- **WebSockets**: Socket.io 4 for real-time order feeds
- **Authentication**: JWT & Bcrypt (Role-Based Access Control)
- **Payments**: Bakong KHQR (`bakong-khqr`)
- **Notifications**: Telegram Bot API integration

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the backend directory:

```env
PORT=8080
NODE_ENV=development
DATABASE_URL="postgresql://user:password@host:5432/rms_db?sslmode=require"
JWT_SECRET="your_secure_jwt_secret"
CLIENT_URL="http://localhost:5173"

# Telegram Notifications (Optional)
TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
TELEGRAM_CHAT_ID="your_telegram_chat_id"

# Bakong KHQR Payment (Optional)
BAKONG_TOKEN="your_bakong_token"
KHQR_BAKONG_ID_USD="merchant_usd@bakong"
KHQR_BAKONG_ID_KHR="merchant_khr@bakong"
KHQR_MERCHANT_NAME="Restaurant Name"
KHQR_MERCHANT_CITY="Phnom Penh"

# Geofence & Bot Security (Optional)
CAFE_LAT="11.5564"
CAFE_LNG="104.9282"
MAX_ORDER_DISTANCE_M="150"
RECAPTCHA_SECRET_KEY="your_recaptcha_secret_key"
```

---

## 🚀 Setup & Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   # Or for quick sync:
   npx prisma db push
   ```

4. **Seed database (Default users, categories, tables)**:
   ```bash
   node prisma/seed.js
   ```

5. **Start server**:
   ```bash
   npm run dev
   ```
   *Server listens on port 8080 by default.*

---

## 📡 API Overview

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Staff login (returns JWT cookie/token)
- `POST /api/auth/logout` — Logout user
- `GET /api/auth/me` — Retrieve current authenticated profile

### Users (`/api/users`) — *Admin only*
- `GET /api/users` — List staff users
- `POST /api/users` — Create staff user (`admin`, `cashier`, `barista`, `kitchen`, `server`)
- `PUT /api/users/:id` — Update staff details
- `DELETE /api/users/:id` — Remove user

### Menu & Categories
- `/api/menu-categories` — Menu categories (`food`, `drink`)
- `/api/menu-items` — Menu items with Khmer & English names, pricing, and availability toggle

### Tables & Guest Sessions
- `/api/tables` — Table management and QR token generation
- `/api/tables/qr/:qrToken` — Validates table QR code and issues secure guest session token

### Orders & Kitchen Queues
- `GET /api/orders` — Orders list with status filters (`Pending`, `Preparing`, `Served`, `Paid`)
- `POST /api/orders` — Create new order (supports guest QR ordering and staff POS)
- `GET /api/order-items/queue/kitchen` — Real-time food queue for kitchen display
- `GET /api/order-items/queue/barista` — Real-time drink queue for barista display
- `PATCH /api/order-items/:id/status` — Advance item status (`Pending` → `Preparing` → `Ready`)

### Payments & Invoicing
- `POST /api/payments` — Record payment and mark order Paid
- `POST /api/payments/khqr` — Generate dynamic Bakong KHQR for scanning

### Stock & Inventory — *Admin only*
- `/api/stock` — Inventory item tracking with min-stock alert thresholds
- `/api/stock-orders` — Purchase orders to suppliers (auto-increments inventory on `Received`)
- `/api/suppliers` — Supplier contact directory

### Analytics — *Admin only*
- `GET /api/analytics/revenue/daily` — 30-day daily revenue
- `GET /api/analytics/revenue/hourly` — Peak order hour distribution
- `GET /api/analytics/menu/top-selling` — Top performing items

---

## 🔌 WebSocket Events (Socket.io)

| Event | Direction | Description |
| :--- | :--- | :--- |
| `order:new` | Server → Client | Emitted when a new order is submitted |
| `order:confirmed` | Server → Client | Emitted when cashier approves guest order |
| `orderItem:status` | Server → Client | Real-time status update for kitchen/barista ticket |
| `payment:received`| Server → Client | Notifies cashier & guest on successful payment |
