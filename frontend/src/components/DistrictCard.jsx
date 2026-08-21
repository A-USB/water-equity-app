import { colorForAvailability, formatNumber } from "../utils";

export default function DistrictCard({ d, onOpen }) {
  return (
    <article className="district-card" onClick={() => onOpen(d)} role="button" tabIndex={0}>
      <div className="district-card-head">
        <h3>{d.district}</h3>
        <span className="need-badge" style={{ "--badge-color": colorForAvailability(100 - d.avgNeedScore) }}>
          <span className="need-badge-num">{d.avgNeedScore}</span>
          <span className="need-badge-label">need</span>
        </span>
      </div>

      <div className="gauge-track" style={{ height: 20 }}>
        <div
          className="gauge-fill"
          style={{
            width: d.avgAvailability === null ? "100%" : `${d.avgAvailability}%`,
            background: colorForAvailability(d.avgAvailability),
            opacity: d.avgAvailability === null ? 0.25 : 1,
          }}
        />
      </div>

      <div className="sector-card-meta">
        <span>{d.avgAvailability === null ? "No reports yet" : `${d.avgAvailability}% avg availability`}</span>
      </div>
      <div className="district-card-stats">
        <span>{formatNumber(d.totalPopulation)} people</span>
        <span>
          {d.sectorCount} sector{d.sectorCount === 1 ? "" : "s"}
        </span>
        <span>
          {d.reportedCount}/{d.sectorCount} reporting
        </span>
        {d.staleCount > 0 && <span className="district-stale-flag">⚠ {d.staleCount} need attention</span>}
      </div>
    </article>
  );
}
