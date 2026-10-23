# Zoom RMS — Restaurant Management System

Zoom RMS is a modern, full-stack, real-time Restaurant Management System designed for cafes and restaurants. It features QR-code guest ordering, real-time kitchen and barista display queues, cashier billing with Bakong KHQR payments, role-based staff management, inventory tracking, and sales analytics.

---

## 🚀 Key Features

- **Guest QR Code Ordering**: Guests scan table-specific QR codes to open a session, view menus (with Khmer & English localization), and place orders directly from their phones.
- **Location & Bot Verification**: Anti-prank protection via geolocation validation (geofencing) and reCAPTCHA.
- **Real-Time Order Queues (Socket.io)**:
  - **Kitchen Display System (KDS)**: Instant food order ticket notifications with status updates (`Pending` → `Preparing` → `Ready`).
  - **Barista Display System (BDS)**: Dedicated queue for drink tickets.
- **Cashier POS & Payment Gateway**:
  - Bill processing and invoice tracking.
  - **Bakong KHQR** integration for USD and KHR digital payments.
  - Optional Telegram Bot notifications on completed orders.
- **Staff & Role-Based Access Control (RBAC)**:
  - Supported roles: `admin`, `cashier`, `barista`, `kitchen`, `server`.
- **Inventory & Stock Management**:
  - Stock item tracking with minimum alert levels.
  - Purchase orders (PO) and supplier management.
  - Automatic stock adjustments upon order fulfillment.
- **Analytics & Reporting**:
  - Daily revenue summaries and peak ordering hours.
  - Top-selling menu item analysis.

---

## 🛠️ Technology Stack

| Component | Technologies |
| :--- | :--- |
| **Backend** | Node.js (ES Modules), Express 5, Prisma ORM, PostgreSQL (Neon), Socket.io, JWT, Bcrypt |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Zustand, Radix UI, Lucide Icons, Socket.io-client |
| **Payment & Integrations** | Bakong KHQR (`bakong-khqr`), Telegram Bot API |
| **Tooling & Dev** | ESLint, Nodemon, tsx |

---

## 📁 Repository Structure

```
RMS/
├── backend/                  # Express REST API, Prisma schema, WebSockets
│   ├── prisma/               # Database schemas, migrations, seeds
│   ├── src/
│   │   ├── modules/          # Domain-driven modules (auth, orders, menu, stock, etc.)
│   │   ├── middleware/       # Auth, RBAC, rate-limiting, guest session
│   │   ├── sockets/          # Socket.io connection handlers and event emitters
│   │   └── utils/            # Prisma client, Telegram alerts, KHQR helpers
│   └── package.json
│
├── frontend/                 # React 19 SPA (Vite + Tailwind CSS v4)
│   ├── public/               # Static assets & icons
│   ├── src/
│   │   ├── components/       # Radix UI and custom reusable components
│   │   ├── pages/            # Guest menu, Cashier POS, Kitchen/Barista, Admin
│   │   ├── context/          # App state & session providers
│   │   ├── hooks/            # Custom React hooks (socket, audio alerts, etc.)
│   │   └── services/         # Axios API clients
│   └── package.json
└── README.md
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**
- **PostgreSQL** database instance (e.g. Neon, Supabase, or local PostgreSQL)

---

### 1. Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in `backend/`:
   ```env
   PORT=8080
   NODE_ENV=development
   DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
   JWT_SECRET="your_jwt_secret_key"
   CLIENT_URL="http://localhost:5173"

   # Optional Integrations
   TELEGRAM_BOT_TOKEN="your_telegram_bot_token"
   TELEGRAM_CHAT_ID="your_telegram_chat_id"
   BAKONG_TOKEN="your_bakong_api_token"
   KHQR_BAKONG_ID_USD="your_merchant_usd@bakong"
   KHQR_BAKONG_ID_KHR="your_merchant_khr@bakong"
   KHQR_MERCHANT_NAME="Restaurant Name"
   KHQR_MERCHANT_CITY="Phnom Penh"
   CAFE_LAT="11.5564"
   CAFE_LNG="104.9282"
   MAX_ORDER_DISTANCE_M="150"
   RECAPTCHA_SECRET_KEY="your_recaptcha_secret"
   ```

4. Run Prisma database migrations and client generation:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev
   ```

5. (Optional) Seed initial data:
   ```bash
   node prisma/seed.js
   ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:8080`.*

---

### 2. Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file in `frontend/`:
   ```env
   VITE_RECAPTCHA_SITE_KEY="your_recaptcha_site_key"
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend runs on `http://localhost:5173`.*

---

## 🔗 Related Repositories

- **Backend**: [neang214/zoom-rms-backend](https://github.com/neang214/zoom-rms-backend)
- **Frontend**: [neang214/zoom-rms-frontend](https://github.com/neang214/zoom-rms-frontend)
- **Monorepo**: [neang214/zoom-rms](https://github.com/neang214/zoom-rms)
