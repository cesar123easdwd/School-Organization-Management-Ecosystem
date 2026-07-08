import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth
 * ─────────────────────────────────────────────────────────────────
 * Clean hook to consume AuthContext in any component.
 *
 * Usage:
 *   const { user, isAuth, login, logout } = useAuth();
 *
 * Throws if used outside of <AuthProvider> — helps catch mistakes early.
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>. Check your component tree.");
  }

  return context;
};

export default useAuth;
