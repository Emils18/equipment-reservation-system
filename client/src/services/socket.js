// =====================================================
// Real-Time Connection
// Connects React to Socket.IO backend
// =====================================================

import { io } from "socket.io-client";

const serverUrl =
  import.meta.env.VITE_SERVER_URL ||
  "http://localhost:5000";

const socket = io(serverUrl, {
  withCredentials: true,
});

export default socket;