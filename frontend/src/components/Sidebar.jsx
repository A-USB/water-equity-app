const NAV = {
  wasac: [
    { key: "dashboard", label: "Dashboard" },
    { key: "map", label: "Needs map" },
    { key: "reports", label: "Reports" },
    { key: "settings", label: "Settings" },
  ],
  sector: [{ key: "dashboard", label: "My Sector" }],
};

export default function Sidebar({ role, username, sectorName, active, onNavigate, onLogout, theme, onToggleTheme }) {
  const items = NAV[role] || [];
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">Amazi</span>
        <span className="sidebar-brand-sub">{role === "wasac" ? "WASAC" : "Sector portal"}</span>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <button
            key={item.key}
            className={`sidebar-nav-item ${active === item.key ? "sidebar-nav-active" : ""}`}
            onClick={() => onNavigate(item.key)}
          >
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className={`theme-toggle-option ${theme === "light" ? "theme-toggle-active" : ""}`}>Light</span>
          <span className={`theme-toggle-option ${theme === "dark" ? "theme-toggle-active" : ""}`}>Dark</span>
        </button>

        <div className="sidebar-identity">
          <span className="sidebar-identity-name">{sectorName || username}</span>
          <span className="sidebar-identity-role">{username}</span>
        </div>
        <button className="btn-ghost btn-block" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
