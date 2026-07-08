import React, { createContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios";

/**
 * AuthContext
 * ─────────────────────────────────────────────────────────────────
 * Global authentication state available to every component.
 *
 * Shape: {
 *   user:       object | null   — the logged-in admin user
 *   token:      string | null   — the JWT string
 *   isLoading:  boolean         — true while validating stored token on mount
 *   isAuth:     boolean         — true when user is confirmed logged in
 *   login(email, password)      — authenticates and stores session
 *   logout()                    — clears session and redirects
 * }
 */
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,      setUser]      = useState(null);
  const [token,     setToken]     = useState(null);
  const [isLoading, setIsLoading] = useState(true); // starts true — we check localStorage first

  /* ── On mount: rehydrate session from localStorage ─────────── */
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // Validate the stored token is still good by hitting /api/auth/me
        const response = await api.get("/auth/me");
        setUser(response.data.user);
        setToken(storedToken);
      } catch {
        // Token is expired or invalid — clear it silently
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  /* ── login: POST credentials, store token + user ───────────── */
  const login = useCallback(async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token: newToken, user: newUser } = response.data;

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    setToken(newToken);
    setUser(newUser);

    return newUser; // caller can use this if needed
  }, []);

  /* ── logout: clear everything ───────────────────────────────── */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isLoading,
    isAuth: !!user && !!token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
