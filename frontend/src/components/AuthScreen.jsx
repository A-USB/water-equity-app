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

export default function AuthScreen({ onLoggedIn, theme, onToggleTheme }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [role, setRole] = useState("sector");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [district, setDistrict] = useState("");
  const [population, setPopulation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
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
      <button className="auth-theme-toggle" type="button" onClick={onToggleTheme}>
        <span aria-hidden="true">{theme === "dark" ? "☼" : "☾"}</span>
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>

      <div className="auth-layout">
        <section className="auth-story">
          <div className="auth-story-content">
            <img className="auth-logo" src="/logo.svg" alt="Mira" />
            <p className="auth-kicker">Water for a brighter tomorrow</p>
            <h1>Clean water.<br />Stronger communities.</h1>
            <p className="auth-story-copy">
              A shared view of water availability across Rwanda — from the people
              reporting on the ground to the teams acting on what they see.
            </p>
            <div className="auth-story-points">
              <span><b>◌</b> Access to clean water</span>
              <span><b>♧</b> Stronger communities</span>
              <span><b>◇</b> A sustainable future</span>
            </div>
          </div>
          <div className="auth-water-art" aria-hidden="true">
            <span className="auth-water-sun" />
            <span className="auth-water-hill auth-water-hill-one" />
            <span className="auth-water-hill auth-water-hill-two" />
            <span className="auth-water-river" />
          </div>
        </section>

        <main className="auth-panel">
          <div className="auth-panel-top">
            <span>{isSignup ? "Already have an account?" : "Don't have an account?"}</span>
            <button type="button" onClick={() => setMode(isSignup ? "login" : "signup")}>
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </div>

          <div className="auth-card">
            <p className="auth-eyebrow">{isSignup ? "Create your account" : "Mira account"}</p>
            <h2 className="auth-title">{isSignup ? "Join the network" : "Welcome back"}</h2>
            <p className="auth-subtitle">
              {isSignup
                ? "Choose your portal and enter your details to get started."
                : "Sign in and continue making an impact."}
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
                  <span className="auth-role-label">{key === "sector" ? "Sector official" : "WASAC team"}</span>
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
                      <input type="number" min="0" value={population} onChange={(e) => setPopulation(e.target.value)} placeholder="e.g. 22000" required />
                    </label>
                  </div>
                </>
              )}

              <label className="field">
                <span>Username</span>
                <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. nyamirambo" autoFocus={!isSignup} required />
              </label>

              <label className="field">
                <span>Password</span>
                <div className="password-wrap">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    minLength={isSignup ? 6 : undefined}
                    required
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? "◉" : "◌"}
                  </button>
                </div>
                {isSignup && <span className="field-hint">Must be at least 6 characters long</span>}
              </label>

              {!isSignup && (
                <div className="auth-options">
                  <label className="remember-option">
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="auth-muted-action" onClick={() => setError("Password recovery is not enabled for this local demo yet.")}>
                    Forgot password?
                  </button>
                </div>
              )}

              {error && <p className="form-error">{error}</p>}
              <button type="submit" className="btn-primary btn-block auth-submit" disabled={busy}>
                {busy ? "Please wait…" : isSignup ? "Create account →" : "Sign in →"}
              </button>
            </form>

            <div className="auth-or"><span>or</span></div>
            <button type="button" className="auth-secondary-action" onClick={() => setError("Google sign-in is not connected for this app yet.")}>
              <strong>G</strong> Continue with Google
            </button>

            <p className="auth-terms">
              By continuing, you agree to our <button type="button">Terms of Service</button> and <button type="button">Privacy Policy</button>.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
