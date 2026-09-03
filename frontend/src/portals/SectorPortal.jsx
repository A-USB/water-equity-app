import { useEffect, useState, useCallback } from "react";
import { getSectors, getSectorReports, getActiveDistribution } from "../api";
import SectorCard from "../components/SectorCard";
import ReportHistory from "../components/ReportHistory";

export default function SectorPortal({ auth }) {
  const [sector, setSector] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  const [allocation, setAllocation] = useState(null);

  const load = useCallback(async () => {
    try {
      const [sectors, history] = await Promise.all([
        getSectors(),
        getSectorReports(auth.sectorId),
      ]);
      setSector(sectors[0] || null);
      setReports(history);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, [auth.sectorId]);

  useEffect(() => {
    load();
    getActiveDistribution().then(setAllocation).catch(() => {});
  }, [load]);

  return (
    <main>
      <div className="section-head">
        <h2>{auth.sectorName || "Your sector"}</h2>
      </div>

      {error && <p className="empty-state">{error}</p>}

      {!error && !sector && <p className="empty-state">Loading…</p>}

      {sector && (
        <div className="sector-portal-grid">
          <SectorCard sector={sector} minPop={sector.population} maxPop={sector.population} onChanged={load} canReport />
          
          {allocation && allocation.sectorAllocation && (
            <div className="panel dist-incoming">
              <h3>Incoming Water Allocation</h3>
              <div className="dist-incoming-grid">
                <div>
                  <span className="dist-card-label">Allocated Volume</span>
                  <span className="dist-card-value">{Math.round(allocation.sectorAllocation.allocation_m3).toLocaleString()} m³/day</span>
                </div>
                <div>
                  <span className="dist-card-label">Projected Availability</span>
                  <span className="dist-card-value dist-green">{Math.round(allocation.sectorAllocation.projectedAvailability)}%</span>
                </div>
                <div>
                  <span className="dist-card-label">Last Updated</span>
                  <span className="dist-card-value">{new Date(allocation.publishedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="panel">
            <h3 className="panel-title">Report history</h3>
            <ReportHistory reports={reports} />
          </div>
        </div>
      )}
    </main>
  );
}
