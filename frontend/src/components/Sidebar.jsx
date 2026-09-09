import { useState } from "react";
import {
  IconGrid,
  IconMapPin,
  IconHistory,
  IconSettings,
  IconDistribution,
  IconSun,
  IconMoon,
  IconLogOut,
  IconPanelLeftClose,
  IconPanelLeftOpen,
} from "./Icons";

const NAV_ICONS = {
  dashboard: IconGrid,
  map: IconMapPin,
  distribution: IconDistribution,
  reports: IconHistory,
  settings: IconSettings,
};

const NAV = {
  wasac: [
    { key: "dashboard", label: "Dashboard" },
    { key: "map", label: "Needs map" },
    { key: "distribution", label: "Distribution" },
    { key: "reports", label: "Reports" },
    { key: "settings", label: "Settings" },
  ],
  sector: [{ key: "dashboard", label: "My Sector" }],
};

export default function Sidebar({ role, username, sectorName, active, onNavigate, onLogout, theme, onToggleTheme }) {
  const [collapsed, setCollapsed] = useState(false);
  const items = NAV[role] || [];

  return (
    <aside className={`sidebar${collapsed ? " sidebar-collapsed" : ""}`}>
      <header className="sidebar-brand">
        <div className="sidebar-brand-row">
          <img src="/logo.svg" alt="Mira" className="sidebar-logo" />
          {!collapsed && (
            <button
              className="sidebar-collapse"
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <IconPanelLeftClose size={18} />
            </button>
          )}
        </div>
        {!collapsed && <span className="sidebar-brand-sub">{role === "wasac" ? "WASAC" : "Sector portal"}</span>}
      </header>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {items.map((item) => {
          const NavIcon = NAV_ICONS[item.key] || IconGrid;
          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-nav-item${active === item.key ? " sidebar-nav-active" : ""}`}
              onClick={() => onNavigate(item.key)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-nav-icon" aria-hidden="true">
                <NavIcon size={18} />
              </span>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <footer className="sidebar-footer">
        {!collapsed && (
          <div className="sidebar-identity">
            <span className="sidebar-avatar">{(sectorName || username || "?").slice(0, 1).toUpperCase()}</span>
            <div className="sidebar-identity-text">
              <span className="sidebar-identity-name">{sectorName || username}</span>
              <span className="sidebar-identity-role">{username}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          className="sidebar-nav-item"
          onClick={onToggleTheme}
          title={collapsed ? (theme === "dark" ? "Switch to light mode" : "Switch to dark mode") : undefined}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="sidebar-nav-icon" aria-hidden="true">
            {theme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
          </span>
          {!collapsed && <span className="sidebar-nav-label">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        <button
          type="button"
          className="sidebar-nav-item"
          onClick={() => setCollapsed((value) => !value)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <span className="sidebar-nav-icon" aria-hidden="true">
            {collapsed ? <IconPanelLeftOpen size={18} /> : <IconPanelLeftClose size={18} />}
          </span>
          {!collapsed && <span className="sidebar-nav-label">Collapse sidebar</span>}
        </button>

        <button
          type="button"
          className="sidebar-nav-item"
          onClick={onLogout}
          title={collapsed ? "Sign out" : undefined}
          aria-label="Sign out"
        >
          <span className="sidebar-nav-icon" aria-hidden="true">
            <IconLogOut size={18} />
          </span>
          {!collapsed && <span className="sidebar-nav-label">Sign out</span>}
        </button>
      </footer>
    </aside>
  );
}
