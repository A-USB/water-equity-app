import { useState } from "react";

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const NAV_ICONS = {
  dashboard: (
    <Icon>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </Icon>
  ),
  map: (
    <Icon>
      <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.3" />
    </Icon>
  ),
  reports: (
    <Icon>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  ),
  settings: (
    <Icon>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V19.9a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3.1a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9.2a1.7 1.7 0 0 0 1-1.55V3.1a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9.2a1.7 1.7 0 0 0 1.55 1H20.9a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1Z" />
    </Icon>
  ),
  distribution: (
    <Icon>
      <path d="M12 2L2 7l10 5 10-5-10-5Z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </Icon>
  ),
};

const SUN_ICON = (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);

const MOON_ICON = (
  <Icon>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
  </Icon>
);

const LOGOUT_ICON = (
  <Icon>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

const COLLAPSE_ICON = (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <line x1="9" y1="4" x2="9" y2="20" />
    <polyline points="14 9 11 12 14 15" />
  </Icon>
);

const EXPAND_ICON = (
  <Icon>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <line x1="9" y1="4" x2="9" y2="20" />
    <polyline points="12 9 15 12 12 15" />
  </Icon>
);

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
              {COLLAPSE_ICON}
            </button>
          )}
        </div>
        {!collapsed && <span className="sidebar-brand-sub">{role === "wasac" ? "WASAC" : "Sector portal"}</span>}
      </header>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-nav-item${active === item.key ? " sidebar-nav-active" : ""}`}
            onClick={() => onNavigate(item.key)}
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-nav-icon" aria-hidden="true">
              {NAV_ICONS[item.key] || NAV_ICONS.dashboard}
            </span>
            {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
          </button>
        ))}
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
          <span className="sidebar-nav-icon" aria-hidden="true">{theme === "dark" ? SUN_ICON : MOON_ICON}</span>
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
            {collapsed ? EXPAND_ICON : COLLAPSE_ICON}
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
          <span className="sidebar-nav-icon" aria-hidden="true">{LOGOUT_ICON}</span>
          {!collapsed && <span className="sidebar-nav-label">Sign out</span>}
        </button>
      </footer>
    </aside>
  );
}
