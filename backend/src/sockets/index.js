import { Server } from "socket.io";

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          origin === "http://localhost:5173" ||
          origin === "https://zoom-rms.vercel.app" ||
          /\.vercel\.app$/.test(origin) ||
          (process.env.CLIENT_URL && process.env.CLIENT_URL.includes(origin))
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("join_role", (role) => {
      const validRoles = ["kitchen", "barista", "cashier", "admin", "server"];
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
