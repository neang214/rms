import { resolveGuestSession } from "../utils/guestSession.js";

async function attach(req, res) {
  const token = req.headers["x-guest-session"];

  if (!token) {
    res.status(401).json({ message: "Guest session required" });
    return false;
  }

  const session = await resolveGuestSession(token);

  if (!session) {
    res.status(401).json({
      message: "Guest session expired or invalid. Please rescan the table QR code.",
    });
    return false;
  }

  req.guestSession = session;
  return true;
}

export async function requireGuestSession(req, res, next) {
  if (await attach(req, res)) next();
}

export async function requireGuestSessionIfGuestChannel(req, res, next) {
  if (req.body?.channel === "guest") {
    if (await attach(req, res)) next();
    return;
  }

  // Non-guest channel requests must come from authenticated staff
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: Staff login or guest session required" });
  }

  const allowedStaffRoles = ["admin", "cashier", "server"];
  if (!allowedStaffRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: `Access denied. Required role: ${allowedStaffRoles.join(" or ")}`,
    });
  }

  next();
}