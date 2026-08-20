import { useEffect, useState } from "react";
import { getMe } from "./api";
import { loadAuth, saveAuth, clearAuth } from "./auth";
import Login from "./components/Login";
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
    // validate the stored token is still a live session
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

  if (auth === undefined) return null; // brief check on load, avoids a login-screen flash

  if (!auth) return <Login onLoggedIn={handleLoggedIn} />;

  return (
    <div className="page">
      <div className="topbar">
        <span className="topbar-identity">
          Signed in as <strong>{auth.username}</strong>
          <span className="topbar-role">{auth.role === "wasac" ? "WASAC" : "Sector official"}</span>
        </span>
        <button className="btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>

      {auth.role === "sector" ? <SectorPortal auth={auth} /> : <WasacPortal />}
    </div>
  );
}
