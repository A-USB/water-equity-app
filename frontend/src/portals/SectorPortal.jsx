import { useEffect, useState, useCallback } from "react";
import { getSectors, getSectorReports } from "../api";
import SectorCard from "../components/SectorCard";
import ReportHistory from "../components/ReportHistory";

export default function SectorPortal({ auth }) {
  const [sector, setSector] = useState(null);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

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
          <div className="panel">
            <h3 className="panel-title">Report history</h3>
            <ReportHistory reports={reports} />
          </div>
        </div>
      )}
    </main>
  );
}
