// =====================================================
// Real-Time Connection
// Shared Socket.IO connection for Staff + Borrower pages
// =====================================================

import { io } from "socket.io-client";

const serverUrl =
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:5000";

const socket = io(serverUrl, {
  withCredentials: true,

  // Automatically reconnect if Wi-Fi/server temporarily drops
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  timeout: 10000,

  // WebSocket first, polling as fallback
  transports: [
    "websocket",
    "polling",
  ],
});

export default socket;