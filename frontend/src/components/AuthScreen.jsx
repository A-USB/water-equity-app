import { useState } from "react";
import { login, signup } from "../api";

const ROLES = {
  sector: {
    label: "Sector official",
    sub: "Report water status",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 12h.01M15 12h.01M9 8h.01M15 8h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  wasac: {
    label: "WASAC team",
    sub: "Manage all sectors",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3C9 7 6 10.5 6 14a6 6 0 0 0 12 0c0-3.5-3-7-6-11Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
};

/* ── icon components ─────────────────────────────────────── */
function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="11" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function IconEye({ crossed }) {
  return crossed ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24m1.42-2.83A3 3 0 0 0 12.71 8.7M3 3l18 18M10.71 5.75A8 8 0 0 1 21 12c-1 1.66-2.62 3.62-5.2 4.8M6.61 6.61A8 8 0 0 0 3 12c1 1.66 2.62 3.62 5.2 4.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12C2.73 7.89 7 4 12 4s9.27 3.89 11 8c-1.73 4.11-6 8-11 8S2.73 16.11 1 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthScreen({ onLoggedIn, theme, onToggleTheme }) {
  const [mode, setMode] = useState("select-role"); // Start at role selection
  const [role, setRole] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [sectorName, setSectorName] = useState("");
  const [district, setDistrict] = useState("");
  const [population, setPopulation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";
  const isRoleSelection = mode === "select-role";
  const isSignup = mode === "signup";

  // Initial entry point based on whether coming from home page
  // Default is login, but can start at role selection

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      let auth;
      if (isSignup) {
        const payload = { role, username, password };
        if (role === "sector")
          Object.assign(payload, { sectorName, district, population: Number(population) });
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

  function handleRoleSelect(selectedRole) {
    setRole(selectedRole);
    setMode("login"); // Go to login after selecting role
    setError("");
  }

  function handleGoToSignup() {
    setMode("signup");
    setError("");
  }

  function handleBackToRoleSelection() {
    setMode("select-role");
    setRole(null);
    setError("");
  }

  // ═══════════════════════════════════════════
  // ROLE SELECTION STEP - CENTERED BOX
  // ═══════════════════════════════════════════
  if (isRoleSelection) {
    return (
      <div className="auth-page auth-page-centered">
        <div className="auth-centered-box">
          <div className="auth-centered-box-header">
            <button
              type="button"
              className="auth-theme-btn"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button
              type="button"
              className="auth-back-btn"
              onClick={handleBackToRoleSelection}
            >
              ← Back
            </button>
          </div>

          <div className="auth-centered-box-content">
            <h1 className="auth-title">Select organization role</h1>
            <p className="auth-subtitle">
              Choose your role to continue.
            </p>

            <div className="auth-role-select-grid">
              {Object.entries(ROLES).map(([key, r]) => (
                <button
                  type="button"
                  key={key}
                  className="auth-role-select-card"
                  onClick={() => handleRoleSelect(key)}
                >
                  <span className="auth-role-select-icon">{r.icon}</span>
                  <span className="auth-role-select-label">{r.label}</span>
                  <span className="auth-role-select-sub">{r.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // LOGIN or SIGNUP FORM
  // ═══════════════════════════════════════════
  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* ════════════════ LEFT STORY PANEL ════════════════ */}
        <section className="auth-story">
          <div className="auth-story-header">
            <img className="auth-logo" src="/logo.svg" alt="Mira" />
            <p className="auth-tagline">Water for a brighter tomorrow</p>
          </div>

          <div className="auth-story-content">
            <h1 className="auth-story-headline">
              Clean water.<br />
              Healthy communities.
            </h1>
            <p className="auth-story-copy">A more sustainable future.</p>

            <ul className="auth-story-points">
              <li>
                <span className="auth-point-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2C9 6 6 9.5 6 13a6 6 0 0 0 12 0c0-3.5-3-7-6-11Z" />
                  </svg>
                </span>
                <div>
                  <strong>Access</strong>
                  <span>to clean water</span>
                </div>
              </li>
              <li>
                <span className="auth-point-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <div>
                  <strong>Stronger</strong>
                  <span>communities</span>
                </div>
              </li>
              <li>
                <span className="auth-point-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20A14.5 14.5 0 0 0 12 2" /><path d="M2 12h20" />
                  </svg>
                </span>
                <div>
                  <strong>A sustainable</strong>
                  <span>planet</span>
                </div>
              </li>
            </ul>
          </div>

          <div className="auth-waterfall-bg" aria-hidden="true" />
        </section>

        {/* ════════════════ RIGHT FORM PANEL ════════════════ */}
        <main className="auth-panel">
          <div className="auth-panel-header">
            <button
              type="button"
              className="auth-theme-btn"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            {isSignup && (
              <button
                type="button"
                className="auth-back-btn"
                onClick={handleBackToRoleSelection}
              >
                ← Back
              </button>
            )}
          </div>

          <div className="auth-form-wrap">
            <h1 className="auth-title">{isSignup ? "Create your account" : "Welcome back"}</h1>
            <p className="auth-subtitle">
              {isSignup
                ? `Complete your profile as ${role === "sector" ? "a Sector official" : "WASAC team member"}.`
                : `Log in to your Mira account as ${role === "sector" ? "a Sector official" : "WASAC team member"}.`}
            </p>

            <form onSubmit={handleSubmit}>
              {isSignup && role === "sector" && (
                <>
                  <label className="auth-field">
                    <span className="auth-field-label">Sector name</span>
                    <input
                      value={sectorName}
                      onChange={(e) => setSectorName(e.target.value)}
                      placeholder="e.g. Kigoma"
                      required
                    />
                  </label>
                  <div className="auth-field-row">
                    <label className="auth-field">
                      <span className="auth-field-label">District</span>
                      <input
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Nyanza"
                        required
                      />
                    </label>
                    <label className="auth-field">
                      <span className="auth-field-label">Population</span>
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

              {/* username field */}
              <label className="auth-field">
                <span className="auth-field-label">Username</span>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <IconUser />
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="wasac1"
                    autoFocus={!isSignup}
                    required
                  />
                </div>
              </label>

              {/* password field */}
              <label className="auth-field">
                <span className="auth-field-label">Password</span>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <IconLock />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={isSignup ? 6 : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="auth-pw-toggle"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <IconEye crossed={showPassword} />
                  </button>
                </div>
              </label>

              {/* remember me + forgot password (login only) */}
              {isLogin && (
                <div className="auth-options">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={() => setError("Password recovery is not enabled for this demo yet.")}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              <button type="submit" className="auth-submit-btn" disabled={busy}>
                {busy ? "Please wait…" : isSignup ? "Create Account →" : "Sign in →"}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={() => setError("Google sign-in is not connected for this app yet.")}
            >
              <IconGoogle /> Continue with Google
            </button>

            {/* show appropriate bottom link */}
            {isSignup ? (
              <div className="auth-switch-bottom">
                <span>Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  Sign in
                </button>
              </div>
            ) : (
              <div className="auth-switch-bottom">
                <span>Don't have an account?</span>
                <button
                  type="button"
                  onClick={handleGoToSignup}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
