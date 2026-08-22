import { useEffect, useMemo, useState } from "react";
import { getReports } from "../api";
import { colorForAvailability } from "../utils";
import Pagination from "../components/Pagination";

const REPORTS_PER_PAGE = 10;

function downloadCsv(reports) {
  const rows = [["Date", "District", "Sector", "Availability (%)", "Reported by", "Note"], ...reports.map((report) => [new Date(report.date).toLocaleString(), report.district, report.sectorName, report.availabilityPercent, report.reportedBy || "—", report.note || ""])];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a"); link.href = url; link.download = "amazi-reports.csv"; link.click(); URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [district, setDistrict] = useState("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  useEffect(() => { getReports().then(setReports).catch((err) => setError(err.message)); }, []);

  const districts = useMemo(() => [...new Set((reports || []).map((report) => report.district))].sort(), [reports]);
  const filtered = useMemo(() => (reports || []).filter((report) => (
    (district === "all" || report.district === district) && `${report.sectorName} ${report.district}`.toLowerCase().includes(query.toLowerCase())
  )), [reports, district, query]);
  const average = filtered.length ? Math.round(filtered.reduce((sum, report) => sum + report.availabilityPercent, 0) / filtered.length) : null;
  const totalPages = Math.max(1, Math.ceil(filtered.length / REPORTS_PER_PAGE));
  const visibleReports = filtered.slice((page - 1) * REPORTS_PER_PAGE, page * REPORTS_PER_PAGE);
  function changeDistrict(event) { setDistrict(event.target.value); setPage(1); }
  function changeQuery(event) { setQuery(event.target.value); setPage(1); }

  return <main className="workspace-page">
    <header className="workspace-header report-header"><div><p className="eyebrow">Monitoring record</p><h1>Reports</h1><p>Review every sector update, filter the feed, and export a shareable snapshot.</p></div><button className="btn-primary" disabled={!filtered.length} onClick={() => downloadCsv(filtered)}>Export CSV</button></header>
    {error && <p className="empty-state">{error}</p>}
    {!error && !reports && <p className="empty-state">Loading reports…</p>}
    {reports && <><section className="report-summary"><div><span>Reports shown</span><strong>{filtered.length}</strong></div><div><span>Average availability</span><strong style={{ color: colorForAvailability(average) }}>{average === null ? "—" : `${average}%`}</strong></div><div><span>Latest update</span><strong className="summary-date">{filtered[0] ? new Date(filtered[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—"}</strong></div></section><section className="panel report-panel"><div className="report-controls"><label className="search-field">Search <input value={query} onChange={changeQuery} placeholder="Sector or district" /></label><label className="select-field">District <select value={district} onChange={changeDistrict}><option value="all">All districts</option>{districts.map((name) => <option key={name}>{name}</option>)}</select></label></div>{!filtered.length ? <p className="empty-state">No reports match those filters.</p> : <><div className="report-table-wrap"><table className="report-table"><thead><tr><th>Sector</th><th>District</th><th>Availability</th><th>Submitted</th><th>Note</th></tr></thead><tbody>{visibleReports.map((report) => <tr key={report.id}><td><strong>{report.sectorName}</strong></td><td>{report.district}</td><td><span className="availability-pill" style={{ color: colorForAvailability(report.availabilityPercent) }}>{report.availabilityPercent}%</span></td><td>{new Date(report.date).toLocaleDateString()}</td><td>{report.note || <span className="muted">No note</span>}</td></tr>)}</tbody></table></div><Pagination page={page} totalPages={totalPages} onChange={setPage} /></>}</section></>}
  </main>;
}
