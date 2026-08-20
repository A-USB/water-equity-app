const NAV = {
  wasac: [
    { key: "dashboard", label: "Dashboard" },
    { key: "reports", label: "Reports", soon: true },
    { key: "settings", label: "Settings", soon: true },
  ],
  sector: [{ key: "dashboard", label: "My Sector" }],
};

export default function Sidebar({ role, username, sectorName, active, onNavigate, onLogout }) {
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
            onClick={() => !item.soon && onNavigate(item.key)}
            disabled={item.soon}
          >
            <span>{item.label}</span>
            {item.soon && <span className="soon-badge">soon</span>}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
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
