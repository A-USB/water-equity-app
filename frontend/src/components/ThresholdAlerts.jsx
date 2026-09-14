import { colorForAvailability } from "../utils";

export default function ThresholdAlerts({ districts, threshold, onOpen }) {
  const flagged = (districts || [])
    .filter((d) => d.avgAvailability !== null && d.avgAvailability < threshold)
    .sort((a, b) => a.avgAvailability - b.avgAvailability);

  if (flagged.length === 0) return null;

  return (
    <div className="panel threshold-alerts">
      <h3 className="panel-title">Below alert threshold</h3>
      <p className="needs-attention-sub">
        {flagged.length} district{flagged.length === 1 ? "" : "s"} under your {threshold}% alert threshold.
      </p>
      <ul className="needs-attention-list">
        {flagged.map((d) => (
          <li key={d.district}>
            <button className="needs-attention-item" onClick={() => onOpen(d)}>
              <span>
                <strong>{d.district}</strong>
              </span>
              <span className="stale-badge stale-critical" style={{ color: colorForAvailability(d.avgAvailability) }}>
                {d.avgAvailability}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}