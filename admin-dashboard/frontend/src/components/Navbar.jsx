import React from "react";
import { useLocation } from "react-router-dom";
import useAuth from '../hooks/useAuth';

/* Map route paths to page titles + subtitles */
const PAGE_META = {
  "/dashboard":  { title: "Dashboard",           subtitle: "Organization overview" },
  "/members":    { title: "Members",             subtitle: "Manage student members" },
  "/events":     { title: "Events",              subtitle: "Create & track events" },
  "/attendance": { title: "Attendance",          subtitle: "Monitor attendance records" },
  "/payments":   { title: "Payments & Sanctions", subtitle: "Track fees & penalties" },
  "/reports":    { title: "Reports",             subtitle: "Analytics & summaries" },
  "/users":      { title: "Admin Users",         subtitle: "Manage administrator accounts" },
};

const Navbar = () => {
  const location = useLocation();
  const { user }  = useAuth();

  const meta = PAGE_META[location.pathname] || { title: "Dashboard", subtitle: "School Organization Admin" };

  // Derive initials from real user
  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0].toUpperCase()).join("")
    : "AD";

  return (
    <header className="navbar" role="banner" aria-label="Top navigation bar">
      {/* Left: Page title */}
      <div className="navbar-left">
        <h2 className="navbar-title">{meta.title}</h2>
        <span className="navbar-subtitle">{meta.subtitle}</span>
      </div>

      {/* Right: Admin avatar */}
      <div className="navbar-right">
        <div
          className="navbar-avatar"
          id="navbar-admin-avatar"
          role="img"
          aria-label={`Logged in as ${user?.name || 'Admin'}`}
          title={user?.name || 'Admin'}
        >
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
