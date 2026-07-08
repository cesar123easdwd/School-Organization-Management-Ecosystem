import axios from "axios";

/**
 * axios.js — Central Axios instance
 * ─────────────────────────────────────────────────────────────────
 * All API calls in this app go through this instance.
 * It automatically:
 *   1. Points every request at the backend base URL
 *   2. Attaches the JWT from localStorage to every request header
 *   3. Handles 401 responses globally (auto-logout)
 */

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ── Request Interceptor: attach JWT ──────────────────────────── */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ── Response Interceptor: handle 401 globally ────────────────── */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and reload to login
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
