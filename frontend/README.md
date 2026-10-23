# Zoom RMS — Frontend Client

Modern, responsive Single Page Application (SPA) for Zoom RMS (Restaurant Management System), built with React 19, Vite 8, Tailwind CSS v4, Radix UI, and Zustand.

---

## 📱 Modules & Features

- **Guest QR Experience**:
  - Scan table QR code or access via table session URL.
  - Browse menu with category tabs, item photos, and prices.
  - Khmer and English bilingual support.
  - Cart drawer, item customization notes ("no ice", "extra spicy"), and instant order placement.
  - Live order tracking screen showing real-time prep progress.
- **Cashier POS**:
  - Table overview map with live status indicators.
  - Guest order approval gate (prevents spam/prank orders from reaching the kitchen).
  - Bill splitting, bill generation, and Bakong KHQR checkout.
- **Kitchen & Barista Display Queues**:
  - Live ticket boards with audio notifications on incoming orders.
  - One-tap status advance (`Pending` → `Preparing` → `Ready`).
- **Admin Dashboard**:
  - Sales and revenue charts, peak order hours analysis.
  - Menu item creation, photo uploads, and availability toggles.
  - Table management with printed QR code generator.
  - Stock purchase orders and supplier management.
  - Staff user management with role assignments.

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Components**: [Radix UI](https://www.radix-ui.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)
- **QR Code Tools**: `html5-qrcode` (scanner) & `qrcode.react` (generator)
- **Real-Time Client**: `socket.io-client`
- **HTTP Client**: `axios`

---

## ⚙️ Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_RECAPTCHA_SITE_KEY="your_google_recaptcha_v3_or_v2_site_key"
```

---

## 🚀 Setup & Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Vite development server**:
   ```bash
   npm run dev
   ```
   *The dev server runs on `http://localhost:5173`.*

3. **Production build**:
   ```bash
   npm run build
   ```

4. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 🔄 Proxy & Mobile Testing

The Vite configuration is preconfigured to reverse-proxy `/api` and `/socket.io` to the backend on `http://localhost:8080`.

To test on your mobile phone via local Wi-Fi or ngrok:
- Run `npm run dev -- --host`
- Connect your phone to the same Wi-Fi network and open the printed Network URL.
- If using an ngrok tunnel, add your domain to `allowedHosts` in `vite.config.js`.
