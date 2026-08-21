import { reportStatus } from "../utils";

export default function NeedsAttention({ sectors, onOpen }) {
  const flagged = sectors
    .map((s) => ({ sector: s, status: reportStatus(s.latestReportDate) }))
    .filter((x) => x.status.level !== "fresh")
    .sort((a, b) => (b.status.days ?? 9999) - (a.status.days ?? 9999))
    .slice(0, 6);

  if (flagged.length === 0) return null;

  return (
    <div className="panel needs-attention">
      <h3 className="panel-title">Needs attention</h3>
      <p className="needs-attention-sub">Sectors with no report in over two weeks, nationally.</p>
      <ul className="needs-attention-list">
        {flagged.map(({ sector, status }) => (
          <li key={sector.id}>
            <button className="needs-attention-item" onClick={() => onOpen(sector)}>
              <span>
                <strong>{sector.name}</strong> · {sector.district}
              </span>
              <span className={`stale-badge stale-${status.level}`}>
                {status.days === null ? "Never reported" : `${status.days}d ago`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
