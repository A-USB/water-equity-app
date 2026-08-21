import { useEffect, useState } from "react";
import { getDistricts } from "../api";
import { colorForAvailability } from "../utils";

const anchors = { Nyabihu: { x: 23, y: 27 }, Nyarugenge: { x: 58, y: 44 }, Nyanza: { x: 51, y: 75 } };

export default function NeedsMapPage() {
  const [districts, setDistricts] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { getDistricts().then(setDistricts).catch((err) => setError(err.message)); }, []);
  const active = selected || districts?.[0];
  return <main className="workspace-page">
    <header className="workspace-header"><p className="eyebrow">Planning view</p><h1>District needs map</h1><p>Compare reported availability and priority across the districts currently in your monitoring network.</p></header>
    {error && <p className="empty-state">{error}</p>}
    {!error && !districts && <p className="empty-state">Loading district coverage…</p>}
    {districts && <div className="map-layout"><section className="map-card" aria-label="District needs map">
      <div className="map-key"><span>Lower availability</span><i /><span>Higher availability</span></div>
      <svg className="needs-map" viewBox="0 0 100 100" role="img" aria-label="District needs shown as colored markers">
        <path className="country-shape" d="M17 17 C31 7,60 13,81 24 C93 31,87 48,82 60 C77 73,69 88,51 91 C34 91,18 80,12 63 C6 45,7 26,17 17Z" />
        <path className="map-river" d="M16 48 C28 39,36 50,49 43 S70 34,83 46" />
        {districts.map((district) => { const point = anchors[district.district] || { x: 50, y: 50 }; const availability = district.avgAvailability ?? 0; return <g key={district.district} className="map-marker" onClick={() => setSelected(district)}><circle cx={point.x} cy={point.y} r={8 + district.avgNeedScore / 18} fill={colorForAvailability(availability)} opacity=".2" /><circle cx={point.x} cy={point.y} r="5.5" fill={colorForAvailability(availability)} className={active?.district === district.district ? "map-marker-active" : ""} /><text x={point.x} y={point.y + 13}>{district.district}</text></g>; })}
      </svg><p className="map-note">Marker size represents relative need score. Select a district to inspect its current signal.</p>
    </section>{active && <aside className="map-insight"><span className="metric-label">Selected district</span><h2>{active.district}</h2><div className="availability-number" style={{ color: colorForAvailability(active.avgAvailability) }}>{active.avgAvailability ?? "—"}{active.avgAvailability !== null && "%"}</div><p className="availability-caption">average reported availability</p><div className="insight-grid"><div><strong>{active.avgNeedScore}</strong><span>need score</span></div><div><strong>{active.staleCount}</strong><span>need follow-up</span></div><div><strong>{active.reportedCount}/{active.sectorCount}</strong><span>reporting</span></div><div><strong>{active.totalPopulation.toLocaleString()}</strong><span>residents</span></div></div><p className="insight-callout">{active.staleCount ? `${active.staleCount} sector${active.staleCount > 1 ? "s have" : " has"} an overdue or missing update.` : "All sectors are reporting within the current monitoring window."}</p></aside>}</div>}
  </main>;
}
