import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

/* ── SVG Icons ────────────────────────────────────────────────────── */
const IconDashboard = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const IconUsers = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconCalendar = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconCheck = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);
const IconCreditCard = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);
const IconUser = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconBarChart = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const IconLink = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const IconList = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const IconLogOut = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const navItems = [
  {
    section: "Main",
    items: [
      { path: "/dashboard",  label: "Dashboard",  icon: <IconDashboard /> },
      { path: "/members",    label: "Members",    icon: <IconUsers /> },
      { path: "/events",     label: "Events",     icon: <IconCalendar /> },
      { path: "/attendance", label: "Attendance", icon: <IconCheck /> },
      { path: "/payments",   label: "Payments",   icon: <IconCreditCard /> },
    ],
  },
  {
    section: "Management",
    items: [
      { path: "/users",    label: "Users",    icon: <IconUser /> },
      { path: "/reports",  label: "Reports",  icon: <IconBarChart /> },
      { path: "/systems",  label: "Systems",  icon: <IconLink /> },
      { path: "/logs",     label: "Logs",     icon: <IconList /> },
    ],
  },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0].toUpperCase()).join("")
    : "AD";

  return (
    <aside className="sidebar" aria-label="Main navigation">

      {/* Logo / Branding */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">SchoolOrg</span>
          <span className="sidebar-logo-sub">Admin Dashboard</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {navItems.map((group) => (
          <React.Fragment key={group.section}>
            <span className="sidebar-section-label">{group.section}</span>
            {group.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                id={`nav-${item.path.replace("/", "")}`}
                className={({ isActive }) =>
                  `nav-item${isActive ? " active" : ""}`
                }
                aria-label={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </React.Fragment>
        ))}

        {/* Logout */}
        <span className="sidebar-section-label" style={{ marginTop: "8px" }}>Account</span>
        <button
          id="nav-logout"
          className="nav-item"
          onClick={handleLogout}
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
          aria-label="Logout"
        >
          <span className="nav-icon"><IconLogOut /></span>
          <span className="nav-label">Logout</span>
        </button>
      </nav>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="sidebar-user" id="sidebar-user-profile" aria-label="User profile">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">
              {user?.name?.split(" ").slice(0, 2).join(" ") || "Admin"}
            </div>
            <div className="user-role">
              {user?.role === "superadmin" ? "Super Admin" : user?.role || "Admin"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
