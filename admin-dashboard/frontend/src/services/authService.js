import api from "../api/axios";

/**
 * authService
 * Centralizes all authentication-related API calls.
 * No component should call axios directly for auth.
 */
const authService = {
  /**
   * Login with email + password.
   * Returns { token, user } on success.
   * Throws on failure (caught by AuthContext.login).
   */
  login: (email, password) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),

  /**
   * Get the current logged-in user's profile.
   * Used by AuthContext on mount to validate the stored token.
   */
  getMe: () =>
    api.get("/auth/me").then((r) => r.data.user),

  /**
   * Register a new admin account.
   * Only superadmin should use this.
   */
  register: (name, email, password, role = "admin") =>
    api.post("/auth/register", { name, email, password, role }).then((r) => r.data),

  /**
   * Get all admin users (superadmin only).
   */
  getAllUsers: () =>
    api.get("/auth/users").then((r) => r.data),

  /**
   * Deactivate an admin account by ID (superadmin only).
   */
  deactivateUser: (id) =>
    api.delete(`/auth/users/${id}`).then((r) => r.data),
};

export default authService;
