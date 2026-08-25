import { useState } from "react";
import { login } from "../api";

export default function Login({ onLoggedIn }) {
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
    <div className="login-page">
      <div className="login-card">
        <p className="eyebrow">Water Equity Monitor</p>
        <h1 className="login-title">Mira</h1>
        <p className="hero-sub">Sign in as a sector official or as WASAC.</p>

        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. nyamirambo or wasac_hq"
              autoFocus
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary btn-block" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="login-hint">
          Demo accounts — WASAC: <code>wasac_hq</code> / <code>wasac123</code>. Any sector: its
          slugified name (e.g. <code>nyamirambo</code>) / <code>sector123</code>.
        </p>
      </div>
    </div>
  );
}
