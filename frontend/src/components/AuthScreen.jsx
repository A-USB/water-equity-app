import { useState } from "react";
import { login, signup } from "../api";
import Footer from "./Footer";

const ROLES = {
  sector: {
    label: "I'm an Executive Secretary",
    sub: "Report my sector's water status",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 12h.01M15 12h.01M9 8h.01M15 8h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  wasac: {
    label: "I'm from WASAC",
    sub: "View and manage all sectors",
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M12 3C9 7 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-3-7-6-11Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

export default function AuthScreen({ onLoggedIn }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [role, setRole] = useState("sector");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [district, setDistrict] = useState("");
  const [population, setPopulation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let auth;
      if (isSignup) {
        const payload = { role, username, password };
        if (role === "sector") Object.assign(payload, { sectorName, district, population: Number(population) });
        auth = await signup(payload);
      } else {
        auth = await login(username, password);
      }
      onLoggedIn(auth);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-page-center">
      <div className="auth-card">
        <h1 className="auth-title">{isSignup ? "Create your account" : "Sign in to your account"}</h1>
        <p className="auth-subtitle">
          {isSignup ? "Enter your details to get started" : "Enter your credentials to continue"}
        </p>

        <div className="auth-role-row">
          {Object.entries(ROLES).map(([key, r]) => (
            <button
              type="button"
              key={key}
              className={`auth-role-card ${role === key ? "auth-role-active" : ""}`}
              onClick={() => setRole(key)}
            >
              <span className="auth-role-icon">{r.icon}</span>
              <span className="auth-role-label">{r.label}</span>
              <span className="auth-role-sub">{r.sub}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {isSignup && role === "sector" && (
            <>
              <label className="field">
                <span>Sector name</span>
                <input value={sectorName} onChange={(e) => setSectorName(e.target.value)} placeholder="e.g. Kigoma" required />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>District</span>
                  <input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Nyanza" required />
                </label>
                <label className="field">
                  <span>Population</span>
                  <input
                    type="number"
                    min="0"
                    value={population}
                    onChange={(e) => setPopulation(e.target.value)}
                    placeholder="e.g. 22000"
                    required
                  />
                </label>
              </div>
            </>
          )}

          <label className="field">
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. nyamirambo" required />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={isSignup ? 6 : undefined}
              required
            />
            {isSignup && <span className="field-hint">Must be at least 6 characters long</span>}
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="btn-primary btn-block auth-submit" disabled={busy}>
            {busy ? "Please wait…" : isSignup ? "Create your account" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => setMode("login")}>
                Sign in
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button type="button" onClick={() => setMode("signup")}>
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
      </div>
      <Footer />
    </div>
  );
}
