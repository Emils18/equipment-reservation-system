// =====================================================
// API Helper
// Connects React to the Express backend
// =====================================================

import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  // Required for staff login cookies
  withCredentials: true,
});

export default api;