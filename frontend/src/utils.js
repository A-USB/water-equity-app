// Interpolates the "gauge" color along a bad -> mid -> good scale.
// This is the app's core visual language: color always means water availability.
const BAD = [181, 69, 31]; // clay — scarcity
const MID = [217, 164, 65]; // amber — caution
const GOOD = [30, 127, 140]; // teal — abundant

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

export function colorForAvailability(pct) {
  if (pct === null || pct === undefined) return "rgb(150,160,162)"; // no data = neutral gray
  const p = Math.max(0, Math.min(100, pct));
  const [from, to, t] = p <= 50 ? [BAD, MID, p / 50] : [MID, GOOD, (p - 50) / 50];
  const r = lerp(from[0], to[0], t);
  const g = lerp(from[1], to[1], t);
  const b = lerp(from[2], to[2], t);
  return `rgb(${r},${g},${b})`;
}

export function formatNumber(n) {
  return new Intl.NumberFormat("en-RW").format(n);
}

// Keep in sync with STALE_DAYS in the backend's server.js.
const STALE_DAYS = 14;

export function reportStatus(iso) {
  if (!iso) return { level: "critical", label: "No report yet", days: null };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days > 30) return { level: "critical", label: `${days} days since last report`, days };
  if (days > STALE_DAYS) return { level: "stale", label: `${days} days since last report`, days };
  return { level: "fresh", label: `${days} day${days === 1 ? "" : "s"} ago`, days };
}

export function relativeDate(iso) {
  if (!iso) return "no reports yet";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}
