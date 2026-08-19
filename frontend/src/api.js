const BASE = "/api";

export async function getSectors() {
  const res = await fetch(`${BASE}/sectors`);
  if (!res.ok) throw new Error("Failed to load sectors");
  return res.json();
}

export async function addSector(sector) {
  const res = await fetch(`${BASE}/sectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(sector),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to add sector");
  return res.json();
}

export async function addReport(report) {
  const res = await fetch(`${BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to submit report");
  return res.json();
}
