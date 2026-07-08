import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

/**
 * ProtectedRoute
 * ─────────────────────────────────────────────────────────────────
 * Wraps any page that requires the user to be logged in.
 *
 * Behaviour:
 *  - While the auth state is being rehydrated (isLoading): show nothing
 *  - Not authenticated: redirect to /login
 *  - Authenticated: render children normally
 *
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
const ProtectedRoute = ({ children }) => {
  const { isAuth, isLoading } = useAuth();

  // Still checking localStorage / validating token — render nothing yet
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--bg-primary, #f6f1eb)",
          color: "var(--text-primary, #1f2937)",
          fontSize: "14px",
          gap: "12px",
        }}
      >
        <span style={{ fontSize: "24px" }}>🎓</span>
        <span>Loading session…</span>
      </div>
    );
  }

  // No valid token — send to login
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  // All good — render the protected page
  return children;
};

export default ProtectedRoute;
