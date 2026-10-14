// src/modules/payments/khqr.route.js
import express from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { generateKHQR, checkKHQR } from "./khqr.controller.js";

const router = express.Router();

// Generate a KHQR QR string for a specific order amount
router.post(
  "/generate",
  authenticate,
  authorize("cashier", "admin"),
  generateKHQR
);

// Poll to check if payment went through — called by frontend every 3s
router.get(
  "/check/:md5",
  authenticate,
  authorize("cashier", "admin"),
  checkKHQR
);

export default router;
