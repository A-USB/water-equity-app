import { colorForAvailability } from "../utils";

const SAMPLE_FILLS = [
  { pct: 82, label: "Muyira" },
  { pct: 55, label: "Karago" },
  { pct: 28, label: "Nyamirambo" },
  { pct: 91, label: "Ntyazo" },
  { pct: 40, label: "Muhima" },
];

export default function Home({ onContinue }) {
  return (
    <div className="landing">
      <div className="landing-inner">
        <p className="eyebrow">Water Equity Monitor</p>
        <h1 className="landing-title">Amazi</h1>
        <p className="landing-sub">
          Rwanda's water availability doesn't run out evenly — some districts stay dry for weeks
          while others never notice a shortage. Amazi gives Sector officials a place to report
          what's actually happening on the ground, and gives WASAC a clear, ranked view of where
          the need is greatest — by population, by district, by season.
        </p>

        <div className="landing-gauges" aria-hidden="true">
          {SAMPLE_FILLS.map((g) => (
            <div className="landing-gauge" key={g.label}>
              <div className="gauge-track" style={{ height: 10 }}>
                <div className="gauge-fill" style={{ width: `${g.pct}%`, background: colorForAvailability(g.pct) }} />
              </div>
              <span className="landing-gauge-label">{g.label}</span>
            </div>
          ))}
        </div>

        <button className="btn-primary landing-cta" onClick={onContinue}>
          Get started →
        </button>

        <div className="landing-cards">
          <div className="landing-card">
            <p className="landing-card-eyebrow">For Sector officials</p>
            <h3>Report your sector</h3>
            <p>
              Log your sector's current water availability in seconds, and keep a running
              record WASAC can actually see and act on.
            </p>
          </div>
          <div className="landing-card">
            <p className="landing-card-eyebrow">For WASAC</p>
            <h3>See the whole picture</h3>
            <p>
              Every district, ranked by need — population and reported scarcity combined —
              down to the individual sector.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
