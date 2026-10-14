import express from "express";
import { authenticate, authenticateOptional } from "../../middleware/authenticate.js";
import { authorize } from "../../middleware/authorize.js";
import { requireGuestSessionIfGuestChannel } from "../../middleware/guestSession.js";
import { guestOrderLimiter } from "../../middleware/rateLimiter.js";
import * as orderItemController from "./orderItem.controller.js";

const router = express.Router();

router.post(
  "/",
  guestOrderLimiter,
  authenticateOptional,
  requireGuestSessionIfGuestChannel,
  orderItemController.addItem,
);

router.get(
  "/queue/kitchen",
  authenticate,
  authorize("kitchen"),
  orderItemController.getKitchenQueue,
);
router.get(
  "/queue/barista",
  authenticate,
  authorize("barista"),
  orderItemController.getBaristaQueue,
);
router.get(
  "/:orderId",
  authenticate,
  authorize("cashier", "admin", "server"),
  orderItemController.getItemsByOrder,
);
router.patch(
  "/:id/status",
  authenticate,
  authorize("kitchen", "barista"),
  orderItemController.updateItemStatus,
);
router.patch(
  "/:id/note",
  authenticate,
  authorize("cashier", "admin", "server"),
  orderItemController.updateItemNote,
);
router.delete(
  "/:id",
  authenticate,
  authorize("cashier", "admin", "server"),
  orderItemController.deleteItem,
);

export default router;