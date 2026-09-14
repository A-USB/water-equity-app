import { colorForAvailability, formatNumber } from "../utils";
import { IconAlertTriangle } from "./Icons";

export default function DistrictCard({ district: d, isSelected, onSelect }) {
  return (
    <article
      className={`panel district-card ${isSelected ? "selected" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect();
      }}
    >
      <div className="sector-card-top">
        <strong className="sector-card-name">{d.district}</strong>
      </div>

          

           <div className="sector-card-meta">
        <span>{d.avgAvailability === null ? "No reports yet" : `${d.avgAvailability}% avg availability`}</span>
        {d.trendDelta !== null && d.trendDelta !== 0 && (
          <span className={`trend-badge ${d.trendDelta > 0 ? "trend-up" : "trend-down"}`}>
            {d.trendDelta > 0 ? "▲" : "▼"} {Math.abs(d.trendDelta)}%
          </span>
        )}
      </div>
      <div className="district-card-stats">
        <span>{formatNumber(d.totalPopulation)} people</span>
        <span>
          {d.sectorCount} sector{d.sectorCount === 1 ? "" : "s"}
        </span>
        <span>
          {d.reportedCount}/{d.sectorCount} reporting
        </span>
        {d.staleCount > 0 && (
          <span className="district-stale-flag" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <IconAlertTriangle size={12} /> {d.staleCount} need attention
          </span>
        )}
      </div>
    </article>
  );
}
