import express from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import * as orderController from "./order.controller.js";

const router = express.Router();

// Rate limit for guest order creation — prevents a single device from
// spamming the system with fake orders. 10 orders per 15 minutes per IP
// is generous for a real guest but tight enough to stop abuse.
const guestOrderLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many orders from this device. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// guest creates order via QR — no auth needed but rate limited
router.post("/", guestOrderLimit, orderController.createOrder);
router.get("/table/:tableId", orderController.getActiveOrderByTable);

// history — admin only, date-filtered
router.get(
  "/history",
  authenticate,
  authorize("admin", "cashier"),
  orderController.getOrderHistory,
);

// unconfirmed guest orders — cashier confirmation gate
router.get(
  "/unconfirmed",
  authenticate,
  authorize("cashier", "admin"),
  orderController.getUnconfirmedOrders,
);

// these still need auth — staff only
router.get(
  "/",
  authenticate,
  authorize("cashier", "admin"),
  orderController.getAllOrders,
);
router.get(
  "/:id",
  authenticate,
  authorize("cashier", "admin"),
  orderController.getOrderById,
);
router.patch(
  "/:id/status",
  authenticate,
  authorize("cashier"),
  orderController.updateOrderStatus,
);
router.patch(
  "/:id/confirm",
  authenticate,
  authorize("cashier", "admin"),
  orderController.confirmOrder,
);
router.delete(
  "/:id",
  authenticate,
  authorize("cashier", "admin"),
  orderController.deleteOrder,
);

export default router;
