import rateLimit from "express-rate-limit";

// Applies to the public, unauthenticated guest-ordering endpoints only:
// POST /orders, GET /orders/table/:tableId, POST /order-items
//
// These have no login wall, so without a limit a script could hammer them
// in a loop — flooding the kitchen/barista queues or just stressing the DB.
// Authenticated staff routes are NOT affected by this limiter.
export const guestOrderLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,             // 20 requests per minute per IP across these routes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many requests. Please wait a moment and try again.",
  },
});
