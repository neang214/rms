import crypto from "crypto";
import prisma from "../../utils/db.js";
import { getIO } from "../../sockets/index.js";

// Generates a random, unguessable token used in each table's QR code
// instead of the sequential table_id — a 48-character hex string.
const generateQrToken = () => crypto.randomBytes(24).toString("hex");

export const getAllTables = async (req, res) => {
  try {
    // This endpoint is public (no auth) for the admin UI's table list to
    // load without a login wall on first paint — but that also means a
    // guest's browser could call it. qr_token must NEVER appear here,
    // or anyone could read every table's QR secret in one request.
    const tables = await prisma.table.findMany({
      orderBy: { table_number: "asc" },
      select: {
        table_id: true,
        table_number: true,
        capacity: true,
        is_available: true,
      },
    });

    res.status(200).json(tables);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Admin-only — full table list INCLUDING qr_token, so the admin Tables
// page can render and print each table's QR code. This is the one list
// endpoint that exposes tokens, and it's gated behind authenticate +
// authorize("admin"); the public getAllTables above still strips them.
export const getAllTablesAdmin = async (req, res) => {
  try {
    const tables = await prisma.table.findMany({
      orderBy: { table_number: "asc" },
    });
    res.status(200).json(tables);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getTable = async (req, res) => {
  try {
    // Same reasoning as getAllTables — qr_token excluded from this
    // public-by-id lookup.
    const table = await prisma.table.findUnique({
      where: { table_id: parseInt(req.params.id) },
      select: {
        table_id: true,
        table_number: true,
        capacity: true,
        is_available: true,
      },
    });

    if (!table) return res.status(404).json({ message: "Table not found" });
    res.status(200).json(table);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Public lookup used by the guest QR flow — resolves a table by its
// unguessable qr_token instead of its sequential table_id, so scanning
// the real QR is the only practical way to land on a real table.
export const getTableByToken = async (req, res) => {
  try {
    const table = await prisma.table.findUnique({
      where: { qr_token: req.params.token },
    });

    if (!table) return res.status(404).json({ message: "Table not found" });
    res.status(200).json(table);
  } catch (error) {
    console.error("getTableByToken error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const createTable = async (req, res) => {
  const { table_number, capacity, is_available } = req.body;
  try {
    const table = await prisma.table.create({
      data: {
        table_number,
        capacity: parseInt(capacity),
        is_available: is_available ?? true,
        qr_token: generateQrToken(),
      },
    });

    const io = getIO();
    // strip qr_token before broadcasting — same rule as the GET endpoints,
    // this event reaches admin/cashier clients and the token should only
    // ever be readable via the dedicated QR-display flow, not a live feed
    const { qr_token, ...safeTable } = table;
    io.to("role:admin").to("role:cashier").emit("table:created", safeTable);

    res.status(201).json(table);
  } catch (error) {
    if (error.code === "P2002")
      return res.status(400).json({ message: "Table number already exists" });
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Issues a brand-new qr_token for a table, invalidating the old QR code.
// Use this if a printed QR is lost, damaged, or you suspect it's been
// shared/copied somewhere it shouldn't be.
export const regenerateQrToken = async (req, res) => {
  try {
    const table = await prisma.table.update({
      where: { table_id: parseInt(req.params.id) },
      data: { qr_token: generateQrToken() },
    });
    res.status(200).json(table);
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ message: "Table not found" });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTable = async (req, res) => {
  const { table_number, capacity, is_available } = req.body;
  try {
    const table = await prisma.table.update({
      where: { table_id: parseInt(req.params.id) },
      data: {
        table_number,
        capacity: capacity ? parseInt(capacity) : undefined,
        is_available,
      },
    });

    const io = getIO();
    const { qr_token, ...safeTable } = table;
    io.to("role:admin").to("role:cashier").emit("table:updated", safeTable);

    res.status(200).json(table);
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ message: "Table not found" });
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateTableStatus = async (req, res) => {
  const { is_available } = req.body;
  try {
    // was previously `table_id: req.params.id` (a string) — Prisma's Int
    // field requires a number, so this threw on every call. Fixed.
    const table = await prisma.table.update({
      where: { table_id: parseInt(req.params.id) },
      data: { is_available },
    });

    const io = getIO();
    const { qr_token, ...safeTable } = table;
    io.to("role:admin").to("role:cashier").emit("table:updated", safeTable);

    res.json({ message: "Table updated" });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ message: "Table not found" });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteTable = async (req, res) => {
  try {
    const tableId = parseInt(req.params.id);
    await prisma.table.delete({
      where: { table_id: tableId },
    });

    const io = getIO();
    io.to("role:admin").to("role:cashier").emit("table:deleted", { table_id: tableId });

    res.status(200).json({ message: "Table deleted successfully" });
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ message: "Table not found" });
    if (error.code === "P2003")
      return res.status(400).json({ code: "TABLE_HAS_ORDERS", message: "Can't delete this table — it still has orders linked to it." });
    return res.status(500).json({ message: "Internal server error" });
  }
};
