import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../components/layout/ProtectedRoute";

// Auth
import Login from "../pages/auth/Login";

// Dashboard shell (wraps all protected pages with Sidebar + Navbar)
import DashboardLayout from "../components/layout/DashboardLayout";

// Pages
import Dashboard  from "../pages/Dashboard";
import Members    from "../pages/Members";
import Events     from "../pages/Events";
import Attendance from "../pages/Attendance";
import Payments   from "../pages/Payments";
import Reports    from "../pages/Reports";
import Systems    from "../pages/Systems";
import Logs       from "../pages/Logs";
import Users      from "../pages/Users";

/**
 * AppRoutes
 * ─────────────────────────────────────────────────────────────────
 * Central route definition for the entire app.
 *
 *  Public:    /login
 *  Protected: all other pages — wrapped in <ProtectedRoute>
 */
const AppRoutes = () => (
  <Routes>
    {/* ── Public ──────────────────────────────────────────── */}
    <Route path="/login" element={<Login />} />

    {/* ── Root redirect ───────────────────────────────────── */}
    <Route path="/" element={<Navigate to="/dashboard" replace />} />

    {/* ── Protected (all inside the sidebar/navbar shell) ─── */}
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path="dashboard"  element={<Dashboard />}  />
      <Route path="members"    element={<Members />}    />
      <Route path="events"     element={<Events />}     />
      <Route path="attendance" element={<Attendance />} />
      <Route path="payments"   element={<Payments />}   />
      <Route path="reports"    element={<Reports />}    />
      <Route path="systems"    element={<Systems />}    />
      <Route path="logs"       element={<Logs />}       />
      <Route path="users"      element={<Users />}      />
    </Route>

    {/* ── Catch-all: any unknown URL → dashboard ──────────── */}
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
);

export default AppRoutes;
