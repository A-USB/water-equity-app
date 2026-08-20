import { useEffect, useState, useCallback } from "react";
import { getSectors } from "../api";
import SectorCard from "../components/SectorCard";
import AddSectorForm from "../components/AddSectorForm";
import { colorForAvailability } from "../utils";

export default function WasacPortal() {
  const [sectors, setSectors] = useState(null);
  const [error, setError] = useState("");
  const [addingSector, setAddingSector] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getSectors();
      setSectors(data);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reported = (sectors || []).filter((s) => s.latestAvailability !== null);
  const avg = reported.length
    ? Math.round(reported.reduce((sum, s) => sum + s.latestAvailability, 0) / reported.length)
    : null;
  const populations = (sectors || []).map((s) => s.population);
  const minPop = populations.length ? Math.min(...populations) : 0;
  const maxPop = populations.length ? Math.max(...populations) : 1;

  return (
    <>
      <header className="hero">
        <p className="eyebrow">WASAC · national view</p>
        <h1>Sectors by need</h1>
        <p className="hero-sub">
          Every connected sector, ranked by need score — population and reported scarcity
          combined — so the next allocation decision starts from the clearest picture available.
        </p>

        <div className="hero-stat">
          <div>
            <span className="hero-stat-num" style={{ color: colorForAvailability(avg) }}>
              {avg === null ? "—" : `${avg}%`}
            </span>
            <span className="hero-stat-label">average reported availability</span>
          </div>
          <div className="hero-gauge">
            <div className="hero-gauge-line" style={{ background: colorForAvailability(avg) }} />
          </div>
        </div>
      </header>

      <main>
        <div className="section-head">
          <h2>All sectors ({sectors ? sectors.length : "…"})</h2>
          <button className="btn-primary" onClick={() => setAddingSector((v) => !v)}>
            {addingSector ? "Close" : "+ Add sector"}
          </button>
        </div>

        {addingSector && (
          <div className="panel">
            <AddSectorForm
              onCancel={() => setAddingSector(false)}
              onAdded={() => {
                setAddingSector(false);
                load();
              }}
            />
          </div>
        )}

        {error && <p className="empty-state">{error}</p>}
        {!error && sectors === null && <p className="empty-state">Loading sectors…</p>}
        {!error && sectors !== null && sectors.length === 0 && (
          <p className="empty-state">No sectors yet. Add one to start tracking.</p>
        )}

        {sectors && sectors.length > 0 && (
          <div className="sector-grid">
            {sectors.map((s) => (
              <SectorCard key={s.id} sector={s} minPop={minPop} maxPop={maxPop} onChanged={load} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
