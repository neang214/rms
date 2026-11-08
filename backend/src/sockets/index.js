import { Server } from "socket.io";

const allowedOrigins = [
  "https://zoom-rms.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map(s => s.trim().replace(/\/$/, "")) : []),
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(s => s.trim().replace(/\/$/, "")) : [])
];

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.replace(/\/$/, "");
  if (
    allowedOrigins.includes(cleanOrigin) ||
    /\.vercel\.app$/.test(cleanOrigin) ||
    /\.onrender\.com$/.test(cleanOrigin)
  ) return true;
  if (process.env.NODE_ENV !== "production") {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
      return true;
    }
    if (/^https?:\/\/.*\.ngrok(-free)?\.(app|dev)$/.test(origin)) {
      return true;
    }
  }
  return false;
};

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_role", (role) => {
      const validRoles = ["kitchen", "barista", "cashier", "admin"];
      if (validRoles.includes(role)) {
        socket.join(`role:${role}`);
      }
    });

    socket.on("join_table", (tableId) => {
      if (tableId) {
        socket.join(`table:${tableId}`);
      }
    });

    socket.on("leave_table", (tableId) => {
      if (tableId) {
        socket.leave(`table:${tableId}`);
      }
    });

    socket.on("disconnect", () => {
    });
  });

  return io;
}

export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet");
  }
  return io;
}
