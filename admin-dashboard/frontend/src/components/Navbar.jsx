import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useAuth from '../hooks/useAuth';
import dashboardService from '../services/dashboardService';

/* Map route paths to page titles + subtitles */
const PAGE_META = {
  "/dashboard":  { title: "Dashboard",           subtitle: "Organization overview" },
  "/members":    { title: "Members",             subtitle: "Manage student members" },
  "/events":     { title: "Events",              subtitle: "Create & track events" },
  "/attendance": { title: "Attendance",          subtitle: "Monitor attendance records" },
  "/payments":   { title: "Payments & Sanctions", subtitle: "Track fees & penalties" },
  "/reports":    { title: "Reports",             subtitle: "Analytics & summaries" },
  "/systems":    { title: "Connected Systems",   subtitle: "Integration management" },
  "/logs":       { title: "Activity Logs",       subtitle: "System event history" },
  "/users":      { title: "Admin Users",         subtitle: "Manage administrator accounts" },
};

const Navbar = () => {
  const location = useLocation();
  const { user }  = useAuth();

  const meta = PAGE_META[location.pathname] || { title: "Dashboard", subtitle: "School Organization Admin" };

  const [onlineCount, setOnlineCount] = useState(null);
  const [statusLabel, setStatusLabel] = useState('loading');

  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const data = await dashboardService.getStats();
        if (!active) return;
        const count = data?.stats?.onlineSystems ?? 0;
        setOnlineCount(count);
        setStatusLabel(count > 0 ? 'online' : 'offline');
      } catch {
        if (!active) return;
        setOnlineCount(0);
        setStatusLabel('offline');
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

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

      {/* Right: Actions */}
      <div className="navbar-right">
        {/* Live indicator */}
        <div
          className={`live-indicator ${statusLabel}`}
          aria-label={`System status: ${statusLabel === 'online' ? 'Online' : statusLabel === 'offline' ? 'Offline' : 'Checking'}`}
        >
          <span className="live-dot" />
          {statusLabel === 'loading'
            ? 'Checking…'
            : statusLabel === 'online'
              ? `${onlineCount} system${onlineCount !== 1 ? 's' : ''} online`
              : 'All systems offline'}
        </div>

        {/* Admin Avatar */}
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
