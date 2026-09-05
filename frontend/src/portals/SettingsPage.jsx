import { useState, useEffect } from "react";
import { getDistributionConfig, updateDistributionConfig } from "../api";

export default function SettingsPage({ auth }) {
  const [email, setEmail] = useState(() => localStorage.getItem("Mira:email") || "");
  const [alerts, setAlerts] = useState(() => localStorage.getItem("Mira:alerts") !== "false");
  const [saved, setSaved] = useState(false);
  const [distConfig, setDistConfig] = useState(null);
  const [distSaving, setDistSaving] = useState(false);

  useEffect(() => {
    if (auth.role === "wasac") {
      getDistributionConfig()
        .then((cfg) => {
          setDistConfig({
            totalSupply_m3: cfg.totalSupply_m3 || 160000,
            basePoolPct: Math.round((cfg.basePoolPct ?? 0.30) * 100),
            needPoolPct: Math.round((cfg.needPoolPct ?? 0.70) * 100),
            targetFloorPct: cfg.targetFloorPct ?? 75,
            targetCeilingPct: cfg.targetCeilingPct ?? 85,
            maxSectorSpreadPct: cfg.maxSectorSpreadPct ?? 25,
            perCapitaUrban_lpcd: cfg.perCapitaUrban_lpcd ?? 80,
            perCapitaRural_lpcd: cfg.perCapitaRural_lpcd ?? 25,
          });
        })
        .catch(console.error);
    }
  }, [auth.role]);

  async function save(event) {
    event.preventDefault();
    localStorage.setItem("Mira:email", email);
    localStorage.setItem("Mira:alerts", alerts);

    if (distConfig && auth.role === "wasac") {
      setDistSaving(true);
      try {
        await updateDistributionConfig({
          totalSupply_m3: Number(distConfig.totalSupply_m3),
          basePoolPct: Number(distConfig.basePoolPct) / 100,
          needPoolPct: Number(distConfig.needPoolPct) / 100,
          targetFloorPct: Number(distConfig.targetFloorPct),
          targetCeilingPct: Number(distConfig.targetCeilingPct),
          maxSectorSpreadPct: Number(distConfig.maxSectorSpreadPct),
          perCapitaUrban_lpcd: Number(distConfig.perCapitaUrban_lpcd),
          perCapitaRural_lpcd: Number(distConfig.perCapitaRural_lpcd),
        });
      } catch (err) {
        console.error("Failed to update dist config:", err);
      } finally {
        setDistSaving(false);
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  return (
    <main className="workspace-page settings-page">
      <header className="workspace-header">
        <p className="eyebrow">Workspace Preferences</p>
        <h1>Settings</h1>
        <p>Manage your WASAC monitoring, alert thresholds, and default equity formula parameters.</p>
      </header>

      <form className="settings-stack" onSubmit={save}>
        {/* Account Section */}
        <section className="panel settings-section">
          <h2>Account</h2>
          <p className="settings-description">Your signed-in account and notification destination.</p>
          <div className="settings-account">
            <div className="account-avatar">{auth.username.slice(0, 1).toUpperCase()}</div>
            <div>
              <strong>{auth.username}</strong>
              <span>{auth.role === "wasac" ? "WASAC Administrator" : "Sector Official"}</span>
            </div>
          </div>
          <label className="field">
            <span>Notification Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@wasac.rw"
            />
          </label>
        </section>

        {/* Monitoring Alerts */}
        <section className="panel settings-section">
          <h2>Monitoring Alerts</h2>
          <p className="settings-description">Receive on-device reminders when a sector report is overdue.</p>
          <label className="toggle-row">
            <span>
              <strong>Follow-up Alerts</strong>
              <small>Flag sectors with stale or missing reports beyond 14 days.</small>
            </span>
            <input
              type="checkbox"
              checked={alerts}
              onChange={(event) => setAlerts(event.target.checked)}
            />
            <i />
          </label>
        </section>

        {/* Default Distribution Engine Parameters (WASAC Only) */}
        {auth.role === "wasac" && distConfig && (
          <section className="panel settings-section">
            <h2>Distribution Formula Defaults</h2>
            <p className="settings-description">
              Default national baseline constants used by the Equity Distribution Engine.
            </p>

            <div className="dist-tuner-grid">
              <label className="field">
                <span>Default Daily Supply (m³/day)</span>
                <input
                  type="number"
                  value={distConfig.totalSupply_m3}
                  onChange={(e) =>
                    setDistConfig((c) => ({ ...c, totalSupply_m3: e.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span>Target Availability Floor (%)</span>
                <input
                  type="number"
                  value={distConfig.targetFloorPct}
                  onChange={(e) =>
                    setDistConfig((c) => ({ ...c, targetFloorPct: e.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span>Base Pool Split (%)</span>
                <input
                  type="number"
                  value={distConfig.basePoolPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDistConfig((c) => ({
                      ...c,
                      basePoolPct: val,
                      needPoolPct: 100 - val,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>Need-Based Split (%)</span>
                <input
                  type="number"
                  value={distConfig.needPoolPct}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDistConfig((c) => ({
                      ...c,
                      needPoolPct: val,
                      basePoolPct: 100 - val,
                    }));
                  }}
                />
              </label>

              <label className="field">
                <span>Urban LPCD Target</span>
                <input
                  type="number"
                  value={distConfig.perCapitaUrban_lpcd}
                  onChange={(e) =>
                    setDistConfig((c) => ({ ...c, perCapitaUrban_lpcd: e.target.value }))
                  }
                />
              </label>

              <label className="field">
                <span>Rural LPCD Target</span>
                <input
                  type="number"
                  value={distConfig.perCapitaRural_lpcd}
                  onChange={(e) =>
                    setDistConfig((c) => ({ ...c, perCapitaRural_lpcd: e.target.value }))
                  }
                />
              </label>
            </div>
          </section>
        )}

        <div className="settings-actions">
          <span className="saved-message">{saved && "Preferences and parameters saved successfully!"}</span>
          <button className="btn-primary" type="submit" disabled={distSaving}>
            {distSaving ? "Saving…" : "Save Preferences"}
          </button>
        </div>
      </form>
    </main>
  );
}
