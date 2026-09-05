import { useEffect, useState, useCallback } from "react";
import { getSectors, getSectorReports, getActiveDistribution } from "../api";
import { formatNumber, colorForAvailability } from "../utils";
import SectorCard from "../components/SectorCard";
import ReportHistory from "../components/ReportHistory";

export default function SectorPortal({ auth }) {
  const [sector, setSector] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [allocation, setAllocation] = useState(null);

  const load = useCallback(async () => {
    try {
      const [sectors, history, activeDist] = await Promise.all([
        getSectors(),
        getSectorReports(auth.sectorId),
        getActiveDistribution().catch(() => null),
      ]);
      setSector(sectors[0] || null);
      setReports(history);
      setAllocation(activeDist);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [auth.sectorId]);

  useEffect(() => {
    load();
  }, [load]);

  const secAlloc = allocation?.sectorAllocation;
  const currentAvail = secAlloc?.currentAvailability ?? sector?.latestAvailability ?? 50;
  const projectedAvail = secAlloc?.projectedAvailability ?? currentAvail;
  const gain = Math.round(projectedAvail - currentAvail);

  return (
    <main className="workspace-page sector-portal-main">
      <header className="workspace-header">
        <p className="eyebrow">Sector Administration</p>
        <h1>{auth.sectorName || sector?.name || "Your Sector"}</h1>
        <p className="hero-sub">
          Monitor your sector’s water status, inspect incoming WASAC equity quotas, and submit availability updates.
        </p>
      </header>

      {error && <p className="empty-state">{error}</p>}
      {!error && !sector && <p className="empty-state">Loading sector profile…</p>}

      {sector && (
        <div className="sector-portal-grid">
          {/* Main Status & Report Card */}
          <SectorCard
            sector={sector}
            minPop={sector.population}
            maxPop={sector.population}
            onChanged={load}
            canReport
          />

          {/* Official WASAC Water Allocation Directive */}
          {secAlloc ? (
            <div className="panel dist-incoming-card">
              <div className="dist-incoming-head">
                <div className="dist-incoming-badge">WASAC ALLOCATION DIRECTIVE</div>
                <span className="dist-incoming-date">
                  Updated: {new Date(allocation.publishedAt).toLocaleDateString("en-RW", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <h3 className="dist-incoming-title">
                {allocation.title || "Daily Water Allocation"}
              </h3>

              {allocation.notes && (
                <p className="dist-incoming-notes">“{allocation.notes}”</p>
              )}

              <div className="dist-incoming-grid">
                <div className="dist-metric-box">
                  <span className="dist-card-label">Daily Sector Quota</span>
                  <div className="dist-metric-val">
                    <strong>{formatNumber(Math.round(secAlloc.allocation_m3))}</strong>
                    <small>m³/day</small>
                  </div>
                  <span className="dist-metric-sub">Guaranteed minimum supply</span>
                </div>

                <div className="dist-metric-box">
                  <span className="dist-card-label">Per Capita Rate</span>
                  <div className="dist-metric-val">
                    <strong>{Math.round(secAlloc.lpcd || (secAlloc.allocation_m3 * 1000) / sector.population)}</strong>
                    <small>L/person/day</small>
                  </div>
                  <span className="dist-metric-sub">Based on {formatNumber(sector.population)} residents</span>
                </div>

                <div className="dist-metric-box">
                  <span className="dist-card-label">Projected Availability</span>
                  <div className="dist-metric-val">
                    <strong style={{ color: colorForAvailability(projectedAvail) }}>
                      {Math.round(projectedAvail)}%
                    </strong>
                    {gain > 0 && <span className="dist-lift-tag">+{gain}% boost</span>}
                  </div>
                  <span className="dist-metric-sub">
                    Current base: {Math.round(currentAvail)}%
                  </span>
                </div>
              </div>

              {/* Visual Availability Progression Bar */}
              <div className="dist-progression-wrap">
                <div className="dist-progression-labels">
                  <span>Current: {Math.round(currentAvail)}%</span>
                  <span className="dist-green">Projected Target: {Math.round(projectedAvail)}%</span>
                </div>
                <div className="dist-progression-track">
                  <div
                    className="dist-progression-cur"
                    style={{
                      width: `${Math.min(100, currentAvail)}%`,
                      background: colorForAvailability(currentAvail),
                    }}
                  />
                  <div
                    className="dist-progression-proj"
                    style={{
                      left: `${Math.min(100, currentAvail)}%`,
                      width: `${Math.max(0, Math.min(100 - currentAvail, projectedAvail - currentAvail))}%`,
                    }}
                  />
                </div>
              </div>

              <p className="dist-incoming-explainer">
                ℹ️ This quota is computed using Rwanda’s national 30/70 water equity formula, prioritizing sectors with acute scarcity and higher population densities to ensure balanced access across {sector.district} district.
              </p>
            </div>
          ) : (
            <div className="panel dist-incoming-card dist-incoming-empty">
              <span className="dist-card-label">WASAC Allocation</span>
              <p>No active allocation plan published for this period yet. WASAC operations will publish the daily dispatch schedule shortly.</p>
            </div>
          )}

          {/* Historical Reports List */}
          <div className="panel">
            <h3 className="panel-title">Report history</h3>
            <ReportHistory reports={reports} />
          </div>
        </div>
      )}
    </main>
  );
}
