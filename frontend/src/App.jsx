import { useEffect, useState } from "react";
import { getMe } from "./api";
import { loadAuth, saveAuth, clearAuth } from "./auth";
import Home from "./components/Home";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import SectorPortal from "./portals/SectorPortal";
import WasacPortal from "./portals/WasacPortal";
import ReportsPage from "./portals/ReportsPage";
import SettingsPage from "./portals/SettingsPage";
import NeedsMapPage from "./portals/NeedsMapPage";

export default function App() {
  const [auth, setAuth] = useState(undefined); // undefined = still checking, null = logged out
  const [activePage, setActivePage] = useState("dashboard");
  const [stage, setStage] = useState("landing"); // "landing" | "auth" — only matters while logged out

  useEffect(() => {
    const stored = loadAuth();
    if (!stored) {
      setAuth(null);
      return;
    }
    getMe()
      .then((me) => setAuth({ ...stored, ...me }))
      .catch(() => {
        clearAuth();
        setAuth(null);
      });
  }, []);

  function handleLoggedIn(data) {
    saveAuth(data);
    setAuth(data);
  }

  function handleLogout() {
    clearAuth();
    setAuth(null);
    setStage("landing");
  }

  if (auth === undefined) return null;

  if (!auth) {
    return stage === "landing" ? (
      <Home onContinue={() => setStage("auth")} />
    ) : (
      <AuthScreen onLoggedIn={handleLoggedIn} />
    );
  }

  return (
    <div className="shell">
      <Sidebar
        role={auth.role}
        username={auth.username}
        sectorName={auth.sectorName}
        active={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
      />
      <div className="shell-main">
        <div className="page">
          {auth.role === "sector" ? <SectorPortal auth={auth} /> : (
            <>
              {activePage === "dashboard" && <WasacPortal />}
              {activePage === "map" && <NeedsMapPage />}
              {activePage === "reports" && <ReportsPage />}
              {activePage === "settings" && <SettingsPage auth={auth} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
