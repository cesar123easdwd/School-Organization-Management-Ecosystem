import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar  from "../Navbar";

/**
 * DashboardLayout
 * ─────────────────────────────────────────────────────────────────
 * Shell that wraps every protected page.
 * Renders the Sidebar + Navbar, then uses React Router's <Outlet>
 * to render whichever child route is currently active.
 *
 * This replaces the old useState-based page switching in App.js.
 */
const DashboardLayout = () => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-content">
      <Navbar />
      <Outlet /> {/* ← active page renders here */}
    </div>
  </div>
);

export default DashboardLayout;
