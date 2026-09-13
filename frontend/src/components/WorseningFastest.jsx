export default function WorseningFastest({ districts, onOpen }) {
  const worsening = (districts || [])
    .filter((d) => d.trendDelta !== null && d.trendDelta < 0)
    .sort((a, b) => a.trendDelta - b.trendDelta) // most negative first
    .slice(0, 3);

  if (worsening.length === 0) return null;

  return (
    <div className="panel worsening-fastest">
      <h3 className="panel-title">Worsening fastest</h3>
      <p className="needs-attention-sub">
        Districts with the sharpest drop in availability over the last 7 days.
      </p>
      <ul className="needs-attention-list">
        {worsening.map((d) => (
          <li key={d.district}>
            <button className="needs-attention-item" onClick={() => onOpen(d)}>
              <span>
                <strong>{d.district}</strong> · {d.avgAvailability}% now
                <span className="worsening-was"> (was {d.previousAvgAvailability}%)</span>
              </span>
              <span className="stale-badge stale-critical">
                ▼ {Math.abs(d.trendDelta)}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}