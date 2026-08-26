import { useEffect, useState } from "react";
import { getPublicDistricts } from "../api";
import { colorForAvailability, formatNumber } from "../utils";
import { featurePath } from "../mapUtils";
import rwandaDistricts from "../data/rwanda-districts.min.json";
import SiteFooter from "./SiteFooter";

const STEPS = [
  {
    n: "01",
    title: "Sectors report",
    body: "Executive Secretaries log their sector's water availability directly — no middleman, no delay.",
  },
  {
    n: "02",
    title: "WASAC sees the whole picture",
    body: "Every district ranked by need, weighted by population and how long since a sector last reported in.",
  },
  {
    n: "03",
    title: "Availability becomes visible",
    body: "The same data that drives WASAC's dashboard renders as a live map — where the water actually is, right now.",
  },
];

export default function Home({ onContinue, theme, onToggleTheme }) {
  const [districts, setDistricts] = useState(null);

  useEffect(() => {
    getPublicDistricts()
      .then(setDistricts)
      .catch(() => setDistricts([]));
  }, []);

  const districtByName = new Map((districts || []).map((d) => [d.district, d]));
  const monitoredCount = districts?.length ?? null;
  const sectorCount = districts?.reduce((sum, d) => sum + d.sectorCount, 0) ?? null;
  const reportedAvg =
    districts && districts.some((d) => d.avgAvailability !== null)
      ? Math.round(
          districts.filter((d) => d.avgAvailability !== null).reduce((s, d) => s + d.avgAvailability, 0) /
            districts.filter((d) => d.avgAvailability !== null).length
        )
      : null;

  return (
    <div className="home">
      <nav className="home-nav">
        <div className="home-nav-inner">
        <img src="/logo.svg" alt="Mira" className="home-nav-logo" />         
        <div className="home-nav-actions">
            <button className="home-theme-toggle" onClick={onToggleTheme}>
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <button className="home-nav-signin" onClick={onContinue}>Sign in →</button>
          </div>
        </div>
      </nav>

      <header className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">Water Equity Monitor · Rwanda</p>
          <h1 className="home-hero-title">
            Water availability shouldn't be a rumor.
          </h1>
          <p className="home-hero-sub">
            Rwanda's water doesn't run short everywhere at once — some districts stay dry for
            weeks in the dry season while others never notice. Mira connects Sector officials
            reporting from the ground to WASAC's national view, and turns that data into a live
            picture of where water actually is.
          </p>
          <div className="home-hero-actions">
            <button className="btn-primary home-cta" onClick={onContinue}>
              Get started →
            </button>
            <a className="home-cta-secondary" href="#how-it-works">
              How it works
            </a>
          </div>

          <div className="home-stat-row">
            <div>
              <span className="home-stat-num">{monitoredCount === null ? "…" : monitoredCount}</span>
              <span className="home-stat-label">districts monitored</span>
            </div>
            <div>
              <span className="home-stat-num">{sectorCount === null ? "…" : sectorCount}</span>
              <span className="home-stat-label">sectors connected</span>
            </div>
            <div>
              <span className="home-stat-num" style={{ color: colorForAvailability(reportedAvg) }}>
                {reportedAvg === null ? "—" : `${reportedAvg}%`}
              </span>
              <span className="home-stat-label">avg. reported availability</span>
            </div>
          </div>
        </div>

        <div className="home-hero-map">
          <div className="home-hero-map-frame">
            {districts === null ? (
              <p className="home-map-loading">Loading live map…</p>
            ) : (
              <svg viewBox="0 0 100 100" role="img" aria-label="Rwanda districts, colored by reported water availability">
                {rwandaDistricts.features
                  .filter((f) => f.properties.district)
                  .map((f) => {
                    const name = f.properties.district;
                    const d = districtByName.get(name);
                    return (
                      <path
                        key={name}
                        d={featurePath(f)}
                        className="home-map-district"
                        style={{ "--district-fill": d ? colorForAvailability(d.avgAvailability) : "#e4ecea" }}
                      >
                        <title>
                          {d
                            ? `${name}: ${d.avgAvailability ?? "no"}${d.avgAvailability !== null ? "% availability" : " data yet"}`
                            : `${name}: not monitored yet`}
                        </title>
                      </path>
                    );
                  })}
              </svg>
            )}
          </div>
          <p className="home-map-caption">Live — colored by the same data WASAC sees.</p>
        </div>
      </header>

      <section className="home-how" id="how-it-works">
        <p className="eyebrow home-how-eyebrow">How it works</p>
        <div className="home-how-grid">
          {STEPS.map((s) => (
            <div className="home-how-step" key={s.n}>
              <span className="home-how-num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="home-cards" id="portals">
        <div className="landing-card">
          <p className="landing-card-eyebrow">For Sector officials</p>
          <h3>Report your sector</h3>
          <p>
            Log your sector's current water availability in seconds, and keep a running record
            WASAC can actually see and act on.
          </p>
        </div>
        <div className="landing-card">
          <p className="landing-card-eyebrow">For WASAC</p>
          <h3>See the whole picture</h3>
          <p>
            Every district, ranked by need — population and reported scarcity combined — down to
            the individual sector, with alerts when a sector goes quiet.
          </p>
        </div>
      </section>

      <SiteFooter onContinue={onContinue} />
    </div>
  );
}
