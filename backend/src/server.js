import "dotenv/config";
import http from "http";
import { app } from "./app.js";
import { initSocket } from "./sockets/index.js";
import prisma from "./utils/db.js";

const PORT = Number(process.env.PORT) || 8080;

const server = http.createServer(app);
const io = initSocket(server);

setInterval(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    console.error("Neon keepalive failed:", e.message);
  }
}, 4 * 60 * 1000);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

const ALT_PORT = PORT === 10000 ? 8080 : 10000;
if (process.env.RENDER || process.env.NODE_ENV === "production") {
  const altServer = http.createServer(app);
  io.attach(altServer);
  altServer.on("error", () => {});
  altServer.listen(ALT_PORT, "0.0.0.0", () => {
    console.log(`Secondary listener active on port ${ALT_PORT}`);
  });
}
