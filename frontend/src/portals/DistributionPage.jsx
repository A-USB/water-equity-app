import { useState, useEffect, useCallback } from "react";
import { calculateDistribution, publishDistribution, getDistributionConfig } from "../api";

export default function DistributionPage() {
  const [data, setData] = useState(null);
  const [config, setConfig] = useState(null);
  const [supply, setSupply] = useState(160000);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [expandedDistrict, setExpandedDistrict] = useState(null);
  const [published, setPublished] = useState(null);

  const loadData = useCallback(async (supplyValue) => {
    setLoading(true);
    try {
      const result = await calculateDistribution(supplyValue);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getDistributionConfig()
      .then((cfg) => {
        setConfig(cfg);
        setSupply(cfg.totalSupply_m3);
        loadData(cfg.totalSupply_m3);
      })
      .catch(console.error);
  }, [loadData]);

  // Debounced recalculation on supply change
  useEffect(() => {
    if (!config) return;
    const timer = setTimeout(() => loadData(supply), 400);
    return () => clearTimeout(timer);
  }, [supply, config, loadData]);

  async function handlePublish() {
    setPublishing(true);
    try {
      await publishDistribution(supply);
      setPublished(new Date().toLocaleTimeString());
      setTimeout(() => setPublished(null), 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  }

  function fmt(n) {
    if (n == null) return "—";
    return Number(n).toLocaleString();
  }

  function availColor(pct) {
    if (pct == null) return "";
    if (pct < 50) return "dist-red";
    if (pct < 75) return "dist-orange";
    return "dist-green";
  }

  function tierLabel(tier) {
    if (tier >= 1.5) return { text: "T1 Critical", cls: "dist-tier-1" };
    if (tier >= 1.3) return { text: "T2 Urban", cls: "dist-tier-2" };
    if (tier >= 1.0) return { text: "T3 Moderate", cls: "dist-tier-3" };
    return { text: "T4 Abundant", cls: "dist-tier-4" };
  }

  if (!config || !data) {
    return (
      <div className="page">
        <div className="hero"><h1>Distribution Engine</h1>
          <p className="hero-sub">Loading distribution data…</p>
        </div>
      </div>
    );
  }

  const { summary, districts } = data;

  return (
    <div className="page">
      <div className="hero">
        <p className="eyebrow">Equity-Based Allocation</p>
        <h1>Distribution Engine</h1>
        <p className="hero-sub">
          Allocate Rwanda’s daily water supply across 30 districts using the 30/70 equity split.
          Adjust the supply, review projections, and publish the plan.
        </p>
      </div>

      <main>
        {/* Summary cards */}
        <div className="dist-summary">
          <div className="panel dist-card">
            <span className="dist-card-label">Available Supply</span>
            <span className="dist-card-value">{fmt(summary.totalSupply_m3)} m³</span>
          </div>
          <div className="panel dist-card">
            <span className="dist-card-label">Population Served</span>
            <span className="dist-card-value">{fmt(summary.totalPopulation)}</span>
          </div>
          <div className="panel dist-card">
            <span className="dist-card-label">Equity Index</span>
            <span className={`dist-card-value ${summary.equityIndex >= 0.85 ? "dist-green" : "dist-orange"}`}>
              {(summary.equityIndex * 100).toFixed(1)}%
            </span>
          </div>
          <div className="panel dist-card">
            <span className="dist-card-label">Districts Below 75%</span>
            <span className="dist-card-value">
              <span className="dist-red">{summary.districtsBeforeFloor}</span>
              {" "}→{" "}
              <span className={summary.districtsAfterFloor === 0 ? "dist-green" : "dist-orange"}>
                {summary.districtsAfterFloor}
              </span>
            </span>
          </div>
        </div>

        {/* Supply slider */}
        <div className="panel dist-supply-panel">
          <div className="dist-supply-header">
            <span className="dist-supply-title">Daily Supply Input</span>
            <span className="dist-supply-value">{fmt(supply)} m³/day</span>
          </div>
          <input
            type="range"
            className="dist-slider"
            min={50000}
            max={350000}
            step={1000}
            value={supply}
            onChange={(e) => setSupply(Number(e.target.value))}
          />
          <div className="dist-supply-labels">
            <span>50,000 m³</span>
            <span>Dry Season (~150K)</span>
            <span>Full Capacity (~342K)</span>
          </div>
        </div>

        {loading && <p className="dist-loading">Recalculating allocation…</p>}

        {/* District table */}
        <div className="panel">
          <h2 className="dist-table-title">District Allocation</h2>
          <div className="table-wrap">
            <table className="history-table dist-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Population</th>
                  <th>Tier</th>
                  <th>Current</th>
                  <th>Projected</th>
                  <th>Volume (m³)</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {districts.map((d) => {
                  const tier = tierLabel(d.stressTier);
                  const change = Math.round(d.projectedAvailability - d.currentAvailability);
                  const isExpanded = expandedDistrict === d.district;
                  return [
                    <tr
                      key={d.district}
                      className={`dist-row ${isExpanded ? "dist-row-expanded" : ""}`}
                      onClick={() => setExpandedDistrict(isExpanded ? null : d.district)}
                    >
                      <td className="dist-district-name">
                        <span className="dist-expand-icon">{isExpanded ? "▼" : "▶"}</span>
                        {d.district}
                      </td>
                      <td>{fmt(d.population)}</td>
                      <td><span className={`dist-tier-badge ${tier.cls}`}>{tier.text}</span></td>
                      <td className={availColor(d.currentAvailability)}>{Math.round(d.currentAvailability)}%</td>
                      <td className={availColor(d.projectedAvailability)}>
                        <strong>{Math.round(d.projectedAvailability)}%</strong>
                      </td>
                      <td className="mono">{fmt(Math.round(d.totalAllocation_m3))}</td>
                      <td className={change > 0 ? "dist-green" : ""}>
                        {change > 0 ? `▲ +${change}%` : `${change}%`}
                      </td>
                    </tr>,
                    isExpanded && (
                      <tr key={d.district + "-sectors"} className="dist-sector-row">
                        <td colSpan={7}>
                          <div className="dist-sector-detail">
                            <div className="dist-sector-header">
                              <strong>{d.district} Sectors</strong>
                              {(() => {
                                const avails = d.sectors.map(s => s.projectedAvailability);
                                const spread = Math.round(Math.max(...avails) - Math.min(...avails));
                                return (
                                  <span className={`dist-spread-badge ${spread <= 25 ? "dist-green" : "dist-orange"}`}>
                                    Spread: {spread}% {spread <= 25 ? "✔" : "⚠"}
                                  </span>
                                );
                              })()}
                            </div>
                            <table className="history-table">
                              <thead>
                                <tr>
                                  <th>Sector</th>
                                  <th>Population</th>
                                  <th>Current</th>
                                  <th>Projected</th>
                                  <th>Allocated (m³)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {d.sectors.map((s) => (
                                  <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{fmt(s.population)}</td>
                                    <td className={availColor(s.currentAvailability)}>
                                      {Math.round(s.currentAvailability)}%
                                    </td>
                                    <td className={availColor(s.projectedAvailability)}>
                                      <strong>{Math.round(s.projectedAvailability)}%</strong>
                                    </td>
                                    <td className="mono">{fmt(Math.round(s.allocation_m3))}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ),
                  ];
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Publish */}
        <div className="dist-publish">
          {published && (
            <p className="dist-published-msg">✅ Allocation plan published at {published}</p>
          )}
          <button
            className="btn-primary dist-publish-btn"
            onClick={handlePublish}
            disabled={publishing || loading}
          >
            {publishing ? "Publishing…" : "📤 Publish Allocation Plan"}
          </button>
        </div>
      </main>
    </div>
  );
}
