import { useEffect, useState, useMemo } from "react";
import { getDistricts, getActiveDistribution } from "../api";
import { colorForAvailability, formatNumber } from "../utils";
import { featurePath } from "../mapUtils";
import rwandaDistricts from "../data/rwanda-districts.min.json";

export default function NeedsMapPage() {
  const [districts, setDistricts] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [mapMode, setMapMode] = useState("current"); // "current" | "projected"
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getDistricts(),
      getActiveDistribution().catch(() => null),
    ])
      .then(([distData, planData]) => {
        setDistricts(distData);
        setActivePlan(planData);
      })
      .catch((err) => setError(err.message));
  }, []);

  const planDistrictMap = useMemo(() => {
    if (!activePlan?.districts) return new Map();
    return new Map(activePlan.districts.map((d) => [d.district, d]));
  }, [activePlan]);

  const active = selected || districts?.[0];
  const activePlanDistrict = active ? planDistrictMap.get(active.district) : null;
  const districtByName = new Map((districts || []).map((district) => [district.district, district]));

  return (
    <main className="workspace-page">
      <header className="workspace-header">
        <div className="dist-map-header-top">
          <div>
            <p className="eyebrow">National Geographic Planning</p>
            <h1>District Needs & Allocation Map</h1>
            <p>
              Compare reported scarcity and simulated water equity distribution across all 30 districts in Rwanda.
            </p>
          </div>

          {/* Map Layer Switcher */}
          <div className="dist-map-toggle-group">
            <button
              type="button"
              className={`dist-map-mode-btn ${mapMode === "current" ? "active" : ""}`}
              onClick={() => setMapMode("current")}
            >
              📍 Current Reported Scarcity
            </button>
            <button
              type="button"
              className={`dist-map-mode-btn ${mapMode === "projected" ? "active" : ""}`}
              onClick={() => setMapMode("projected")}
            >
              💧 Projected Equity Allocation
            </button>
          </div>
        </div>
      </header>

      {error && <p className="empty-state">{error}</p>}
      {!error && !districts && <p className="empty-state">Loading district coverage…</p>}

      {districts && (
        <div className="map-layout">
          <section className="map-card" aria-label="District needs map">
            <div className="map-key">
              <span>Lower availability</span>
              <i />
              <span>Higher availability</span>
            </div>

            <svg className="needs-map" viewBox="0 0 100 100" role="img" aria-label="Rwanda district needs map">
              {rwandaDistricts.features
                .filter((feature) => feature.properties.district)
                .map((feature) => {
                  const name = feature.properties.district;
                  const district = districtByName.get(name);
                  const planDist = planDistrictMap.get(name);
                  const isActive = active?.district === name;

                  let displayAvail = district?.avgAvailability ?? null;
                  if (mapMode === "projected" && planDist) {
                    displayAvail = planDist.projectedAvailability;
                  }

                  const fillColor = district ? colorForAvailability(displayAvail) : "#e9f1ef";

                  return (
                    <path
                      key={name}
                      d={featurePath(feature)}
                      className={`map-district ${district ? "map-district-monitored" : ""} ${
                        isActive ? "map-district-active" : ""
                      }`}
                      style={{ "--district-fill": fillColor }}
                      onClick={() => district && setSelected(district)}
                    >
                      <title>
                        {district
                          ? `${name}: ${displayAvail !== null ? `${Math.round(displayAvail)}% (${mapMode === "projected" ? "Projected" : "Current"})` : "No data"}`
                          : `${name}: not monitored yet`}
                      </title>
                    </path>
                  );
                })}
            </svg>

            <div className="dist-map-footer-notes">
              <p className="map-note">
                Viewing <strong>{mapMode === "projected" ? "Projected Equity Allocation" : "Current Reported Water Availability"}</strong> across Rwanda’s districts. Click any district to inspect metrics.
              </p>
              {mapMode === "projected" && activePlan && (
                <span className="dist-map-plan-tag">
                  Directive: {activePlan.title || "Active Plan"} ({formatNumber(activePlan.summary.totalSupply_m3)} m³/day)
                </span>
              )}
            </div>
          </section>

          {active && (
            <aside className="map-insight">
              <span className="metric-label">Selected District</span>
              <h2>{active.district}</h2>

              {mapMode === "projected" && activePlanDistrict ? (
                <>
                  <div
                    className="availability-number"
                    style={{ color: colorForAvailability(activePlanDistrict.projectedAvailability) }}
                  >
                    {Math.round(activePlanDistrict.projectedAvailability)}%
                  </div>
                  <p className="availability-caption">projected post-allocation availability</p>

                  <div className="insight-grid">
                    <div>
                      <strong>{formatNumber(Math.round(activePlanDistrict.totalAllocation_m3))} m³</strong>
                      <span>daily volume</span>
                    </div>
                    <div>
                      <strong>{Math.round(activePlanDistrict.lpcd || 0)} L</strong>
                      <span>per capita/day</span>
                    </div>
                    <div>
                      <strong>+{Math.round(activePlanDistrict.projectedAvailability - (active.avgAvailability ?? 50))}%</strong>
                      <span>net boost</span>
                    </div>
                    <div>
                      <strong>{active.totalPopulation.toLocaleString()}</strong>
                      <span>residents</span>
                    </div>
                  </div>

                  <p className="insight-callout">
                    Base availability was {active.avgAvailability ?? "—"}%. The equity formula allocates {formatNumber(Math.round(activePlanDistrict.totalAllocation_m3))} m³/day to lift all sectors above the target equity threshold.
                  </p>
                </>
              ) : (
                <>
                  <div
                    className="availability-number"
                    style={{ color: colorForAvailability(active.avgAvailability) }}
                  >
                    {active.avgAvailability ?? "—"}
                    {active.avgAvailability !== null && "%"}
                  </div>
                  <p className="availability-caption">average reported availability</p>

                  <div className="insight-grid">
                    <div>
                      <strong>{active.avgNeedScore}</strong>
                      <span>need score</span>
                    </div>
                    <div>
                      <strong>{active.staleCount}</strong>
                      <span>need follow-up</span>
                    </div>
                    <div>
                      <strong>
                        {active.reportedCount}/{active.sectorCount}
                      </strong>
                      <span>reporting</span>
                    </div>
                    <div>
                      <strong>{active.totalPopulation.toLocaleString()}</strong>
                      <span>residents</span>
                    </div>
                  </div>

                  <p className="insight-callout">
                    {active.staleCount
                      ? `${active.staleCount} sector${active.staleCount > 1 ? "s have" : " has"} an overdue or missing update.`
                      : "All sectors are reporting within the current monitoring window."}
                  </p>
                </>
              )}
            </aside>
          )}
        </div>
      )}
    </main>
  );
}
