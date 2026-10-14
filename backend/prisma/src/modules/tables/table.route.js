import express from "express";
import { authorize } from "../../middleware/authorize.js";
import { authenticate } from "../../middleware/authenticate.js";
import { guestOrderLimiter } from "../../middleware/rateLimiter.js";
import * as tableController from "./table.controller.js";

const router = express.Router();

router.get("/", tableController.getAllTables);
router.get("/:id", tableController.getTable);

// admin-only — full list including qr_token, used by the admin Tables page
// to render/print QR codes (the public "/" list strips the token)
router.get(
    "/admin/all",
    authenticate,
    authorize("admin"),
    tableController.getAllTablesAdmin,
);

// public — guest scans QR, frontend resolves the token to a real table.
// Rate limited since it's reachable with no login.
router.get("/qr/:token", guestOrderLimiter, tableController.getTableByToken);

router.post("/", authenticate, authorize("admin"), tableController.createTable);
router.put(
    "/:id",
    authenticate,
    authorize("admin"),
    tableController.updateTable,
);
router.patch(
    "/:id/toggle",
    authenticate,
    authorize("cashier"),
    tableController.updateTableStatus,
);

// admin can re-issue a table's QR token, invalidating the old printed QR
router.patch(
    "/:id/regenerate-qr",
    authenticate,
    authorize("admin"),
    tableController.regenerateQrToken,
);

router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    tableController.deleteTable,
);

export default router;
