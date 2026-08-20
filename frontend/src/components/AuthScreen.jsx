import { useState } from "react";
import { login, signup } from "../api";

const ROLES = {
  sector: { label: "Executive Secretary", sub: "Report your sector's water availability" },
  wasac: { label: "WASAC", sub: "View and manage all sectors nationally" },
};

export default function AuthScreen({ onLoggedIn }) {
  const [role, setRole] = useState(null);
  const [mode, setMode] = useState("login");

  if (!role) {
    return (
      <div className="login-page">
        <div className="role-select-card">
          <p className="eyebrow">Water Equity Monitor</p>
          <h1 className="login-title">Amazi</h1>
          <p className="hero-sub">Continue as —</p>
          {Object.entries(ROLES).map(([key, r]) => (
            <button key={key} className="role-option" onClick={() => setRole(key)}>
              <span className="role-option-label">{r.label}</span>
              <span className="role-option-sub">{r.sub}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <button className="back-link" onClick={() => setRole(null)}>
          ← Change role
        </button>
        <p className="eyebrow">{ROLES[role].label}</p>
        <h1 className="login-title">Amazi</h1>

        <div className="tab-row">
          <button className={`tab ${mode === "login" ? "tab-active" : ""}`} onClick={() => setMode("login")}>
            Sign in
          </button>
          <button className={`tab ${mode === "signup" ? "tab-active" : ""}`} onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>

        {mode === "login" ? (
          <LoginForm onLoggedIn={onLoggedIn} />
        ) : (
          <SignupForm role={role} onLoggedIn={onLoggedIn} />
        )}

        {mode === "login" && (
          <p className="login-hint">
            {role === "wasac" ? (
              <>
                Demo: <code>wasac_hq</code> / <code>wasac123</code>
              </>
            ) : (
              <>
                Demo: slugified sector name (e.g. <code>nyamirambo</code>) / <code>sector123</code>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

function LoginForm({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const auth = await login(username, password);
      onLoggedIn(auth);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label className="field">
        <span>Username</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
      </label>
      <label className="field">
        <span>Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary btn-block" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function SignupForm({ role, onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [district, setDistrict] = useState("");
  const [population, setPopulation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { role, username, password };
      if (role === "sector") {
        Object.assign(payload, { sectorName, district, population: Number(population) });
      }
      const auth = await signup(payload);
      onLoggedIn(auth);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {role === "sector" && (
        <>
          <label className="field">
            <span>Sector name</span>
            <input value={sectorName} onChange={(e) => setSectorName(e.target.value)} placeholder="e.g. Kigoma" required />
          </label>
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
        </>
      )}
      <label className="field">
        <span>Choose a username</span>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </label>
      <label className="field">
        <span>Choose a password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn-primary btn-block" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
