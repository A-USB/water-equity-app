import { useEffect, useState } from "react";
import { getMe } from "./api";
import { loadAuth, saveAuth, clearAuth } from "./auth";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import SectorPortal from "./portals/SectorPortal";
import WasacPortal from "./portals/WasacPortal";

export default function App() {
  const [auth, setAuth] = useState(undefined); // undefined = still checking, null = logged out

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
  }

  if (auth === undefined) return null;

  if (!auth) return <AuthScreen onLoggedIn={handleLoggedIn} />;

  return (
    <div className="shell">
      <Sidebar
        role={auth.role}
        username={auth.username}
        sectorName={auth.sectorName}
        active="dashboard"
        onNavigate={() => {}}
        onLogout={handleLogout}
      />
      <div className="shell-main">
        <div className="page">{auth.role === "sector" ? <SectorPortal auth={auth} /> : <WasacPortal />}</div>
      </div>
    </div>
  );
}
