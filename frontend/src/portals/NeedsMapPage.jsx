import { useEffect, useState } from "react";
import { getDistricts } from "../api";
import { colorForAvailability } from "../utils";
import { featurePath } from "../mapUtils";
import rwandaDistricts from "../data/rwanda-districts.min.json";

export default function NeedsMapPage() {
  const [districts, setDistricts] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getDistricts().then(setDistricts).catch((err) => setError(err.message)); }, []);
  const active = selected || districts?.[0];
  const districtByName = new Map((districts || []).map((district) => [district.district, district]));
  return <main className="workspace-page">
    <header className="workspace-header"><p className="eyebrow">Planning view</p><h1>District needs map</h1><p>Compare reported availability and priority across the districts currently in your monitoring network.</p></header>
    {error && <p className="empty-state">{error}</p>}
    {!error && !districts && <p className="empty-state">Loading district coverage…</p>}
    {districts && <div className="map-layout"><section className="map-card" aria-label="District needs map">
      <div className="map-key"><span>Lower availability</span><i /><span>Higher availability</span></div>
      <svg className="needs-map" viewBox="0 0 100 100" role="img" aria-label="Rwanda district needs map">
        {rwandaDistricts.features.filter((feature) => feature.properties.district).map((feature) => {
          const name = feature.properties.district;
          const district = districtByName.get(name);
          const isActive = active?.district === name;
          return <path key={name} d={featurePath(feature)} className={`map-district ${district ? "map-district-monitored" : ""} ${isActive ? "map-district-active" : ""}`} style={{ "--district-fill": district ? colorForAvailability(district.avgAvailability) : "#e9f1ef" }} onClick={() => district && setSelected(district)}><title>{district ? `${name}: ${district.avgAvailability ?? "No"}${district.avgAvailability !== null ? "% availability" : " data"}` : `${name}: not monitored yet`}</title></path>;
        })}
      </svg><p className="map-note">District boundaries are from Rwanda’s official GIS service. Color shows reported availability; pale districts are not yet monitored in this pilot.</p>
    </section>{active && <aside className="map-insight"><span className="metric-label">Selected district</span><h2>{active.district}</h2><div className="availability-number" style={{ color: colorForAvailability(active.avgAvailability) }}>{active.avgAvailability ?? "—"}{active.avgAvailability !== null && "%"}</div><p className="availability-caption">average reported availability</p><div className="insight-grid"><div><strong>{active.avgNeedScore}</strong><span>need score</span></div><div><strong>{active.staleCount}</strong><span>need follow-up</span></div><div><strong>{active.reportedCount}/{active.sectorCount}</strong><span>reporting</span></div><div><strong>{active.totalPopulation.toLocaleString()}</strong><span>residents</span></div></div><p className="insight-callout">{active.staleCount ? `${active.staleCount} sector${active.staleCount > 1 ? "s have" : " has"} an overdue or missing update.` : "All sectors are reporting within the current monitoring window."}</p></aside>}</div>}
  </main>;
}
