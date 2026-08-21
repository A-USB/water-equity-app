import { useState } from "react";
import ReportForm from "./ReportForm";
import { colorForAvailability, formatNumber, relativeDate, reportStatus } from "../utils";

export default function SectorCard({ sector, minPop, maxPop, onChanged, canReport = false, onOpenDetail }) {
  const [reporting, setReporting] = useState(false);

  const popNorm = maxPop === minPop ? 0.5 : (sector.population - minPop) / (maxPop - minPop);
  const gaugeHeight = Math.round(14 + popNorm * 22); // 14–36px: thicker bar = more people
  const fillColor = colorForAvailability(sector.latestAvailability);
  const badgeColor = colorForAvailability(100 - sector.needScore);
  const status = reportStatus(sector.latestReportDate);
  const clickable = Boolean(onOpenDetail);

  return (
    <article
      className="sector-card"
      onClick={clickable ? () => onOpenDetail(sector) : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      style={clickable ? { cursor: "pointer" } : undefined}
    >
      <header className="sector-card-head">
        <div>
          <h3>{sector.name}</h3>
          <p className="sector-district">{sector.district} district</p>
        </div>
        <div className="need-badge" style={{ "--badge-color": badgeColor }}>
          <span className="need-badge-num">{sector.needScore}</span>
          <span className="need-badge-label">need</span>
        </div>
      </header>

      <div className="gauge-track" style={{ height: gaugeHeight }}>
        <div
          className="gauge-fill"
          style={{
            width: sector.latestAvailability === null ? "100%" : `${sector.latestAvailability}%`,
            background: fillColor,
            opacity: sector.latestAvailability === null ? 0.25 : 1,
          }}
        />
      </div>

      <div className="sector-card-meta">
        <span>
          {sector.latestAvailability === null ? "No data yet" : `${sector.latestAvailability}% availability`}
        </span>
        <span className="dot">·</span>
        <span>{formatNumber(sector.population)} people</span>
      </div>

      <div className="sector-card-status-row">
        <p className="sector-card-date">Last report: {relativeDate(sector.latestReportDate)}</p>
        {status.level !== "fresh" && (
          <span className={`stale-badge stale-${status.level}`}>
            {status.level === "critical" ? "Needs attention" : "Stale"}
          </span>
        )}
      </div>

      {canReport &&
        (reporting ? (
          <ReportForm
            onCancel={() => setReporting(false)}
            onSubmitted={() => {
              setReporting(false);
              onChanged();
            }}
          />
        ) : (
          <button className="btn-ghost btn-block" onClick={() => setReporting(true)}>
            + Add report
          </button>
        ))}
    </article>
  );
}
