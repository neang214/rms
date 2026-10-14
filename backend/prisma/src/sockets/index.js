import { Server } from "socket.io";

let io = null;

// Room naming convention:
//   "role:kitchen"   — all kitchen staff, get new/updated food orders
//   "role:barista"   — all barista staff, get new/updated drink orders
//   "role:cashier"   — all cashier staff, get new orders, confirmations,
//                       status changes, payments
//   "table:<id>"     — anyone (staff or guest) watching one specific
//                       table, e.g. a guest waiting on their own order
//
// Staff clients join their role room right after connecting (the frontend
// emits "join_role" once it knows who's logged in). Guest clients join a
// table room when they land on /order?table=<id>.

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
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
      // rooms are cleaned up automatically by socket.io on disconnect
    });
  });

  return io;
}

// Controllers import this to emit events without needing to import
// socket.io directly or pass the io instance through every function call.
export function getIO() {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet");
  }
  return io;
}
