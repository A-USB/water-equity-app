import { relativeDate } from "../utils";

export default function ReportHistory({ reports }) {
  if (!reports.length) {
    return <p className="empty-state">No reports submitted yet.</p>;
  }
  return (
    <table className="history-table">
      <thead>
        <tr>
          <th>Availability</th>
          <th>Note</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((r) => (
          <tr key={r.id}>
            <td className="mono">{r.availabilityPercent}%</td>
            <td>{r.note || "—"}</td>
            <td className="mono">{relativeDate(r.date)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
