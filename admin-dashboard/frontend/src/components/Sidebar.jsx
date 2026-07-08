import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const navItems = [
  {
    section: "Main",
    items: [
      { path: "/dashboard",  label: "Dashboard",  icon: "🏠" },
      { path: "/members",    label: "Members",    icon: "👥" },
      { path: "/events",     label: "Events",     icon: "📅" },
      { path: "/attendance", label: "Attendance", icon: "✅" },
      { path: "/payments",   label: "Payments",   icon: "💳" },
    ],
  },
  {
    section: "Management",
    items: [
      { path: "/users",    label: "Users",    icon: "👤" },
      { path: "/reports",  label: "Reports",  icon: "📊" },
      { path: "/systems",  label: "Systems",  icon: "🔗" },
      { path: "/logs",     label: "Logs",     icon: "📋" },
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

  // Derive initials from name (e.g. "Cecilio Cesar Liwag Jr." → "CC")
  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0].toUpperCase()).join("")
    : "AD";

  return (
    <aside className="sidebar" aria-label="Main navigation">

      {/* Logo / Branding */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🎓</div>
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
          <span className="nav-icon">🚪</span>
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
          <span style={{ color: "var(--text-muted)", fontSize: "14px" }}>⚙</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
