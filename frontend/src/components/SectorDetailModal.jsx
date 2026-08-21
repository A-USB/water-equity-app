import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getSectorReports } from "../api";
import { formatNumber, reportStatus } from "../utils";
import ReportHistory from "./ReportHistory";

export default function SectorDetailModal({ sector, onClose }) {
  const [reports, setReports] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getSectorReports(sector.id)
      .then((data) => !cancelled && setReports(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [sector.id]);

  const status = reportStatus(sector.latestReportDate);
  const chartData = reports
    ? [...reports]
        .reverse()
        .map((r) => ({ date: new Date(r.date).toLocaleDateString("en-RW", { month: "short", day: "numeric" }), value: r.availabilityPercent }))
    : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{sector.name}</h2>
            <p className="sector-district">{sector.district} district · {formatNumber(sector.population)} people</p>
          </div>
          <button className="btn-ghost" onClick={onClose}>
            Close
          </button>
        </div>

        {status.level !== "fresh" && (
          <p className={`modal-stale-notice stale-${status.level}`}>
            {status.level === "critical" ? "⚠ " : ""}
            {status.days === null ? "This sector has never submitted a report." : `${status.label} — this sector may need a follow-up.`}
          </p>
        )}

        {error && <p className="empty-state">{error}</p>}
        {!error && reports === null && <p className="empty-state">Loading history…</p>}

        {reports && reports.length > 0 && (
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--c-line)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--c-ink-soft)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--c-ink-soft)" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip
                  contentStyle={{ fontSize: 12, fontFamily: "var(--font-body)", borderRadius: 8, border: "1px solid var(--c-line)" }}
                  formatter={(v) => [`${v}%`, "Availability"]}
                />
                <Line type="monotone" dataKey="value" stroke="var(--c-good)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {reports && (
          <>
            <h3 className="panel-title">Report history</h3>
            <ReportHistory reports={reports} />
          </>
        )}
      </div>
    </div>
  );
}
