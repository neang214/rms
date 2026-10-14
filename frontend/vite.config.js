import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        host: true, // listen on the network, not just localhost — needed to
        // reach the dev server from a phone on the same WiFi
        allowedHosts: [
            "bulgur-kindred-groove.ngrok-free.dev",
            // Add any other ngrok/tunnel hostnames here if the reserved
            // domain ever changes, or use true to allow any host (less safe,
            // fine for short-lived team testing, not for anything public-facing
            // long-term).
        ],
        proxy: {
            // Forward API calls and the socket.io handshake to the backend
            // running on 8080. This means only ONE public URL (this Vite dev
            // server's) needs to be exposed via ngrok/tunnel — the browser
            // talks to this same origin for everything, and Vite quietly
            // relays it to the backend behind the scenes.
            "/api": {
                target: "http://localhost:8080",
                changeOrigin: true,
            },
            "/socket.io": {
                target: "http://localhost:8080",
                ws: true, // required for Socket.IO's websocket upgrade
                changeOrigin: true,
            },
        },
    },
});
