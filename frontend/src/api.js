import { loadAuth, clearAuth } from "./auth";

const BASE = "/api";

function authHeaders() {
  const auth = loadAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

async function handle(res) {
  if (res.status === 401) {
    clearAuth();
    window.location.reload();
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Request failed");
  }
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return handle(res);
}

export async function signup(payload) {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handle(res);
}

export async function getDistricts() {
  const res = await fetch(`${BASE}/districts`, { headers: authHeaders() });
  return handle(res);
}

export async function getDistrictSectors(district, page, pageSize) {
  const res = await fetch(
    `${BASE}/districts/${encodeURIComponent(district)}/sectors?page=${page}&pageSize=${pageSize}`,
    { headers: authHeaders() }
  );
  return handle(res);
}

export async function getMe() {
  const res = await fetch(`${BASE}/me`, { headers: authHeaders() });
  return handle(res);
}

export async function getSectors() {
  const res = await fetch(`${BASE}/sectors`, { headers: authHeaders() });
  return handle(res);
}

export async function getSectorReports(sectorId) {
  const res = await fetch(`${BASE}/sectors/${sectorId}/reports`, { headers: authHeaders() });
  return handle(res);
}

export async function addSector(sector) {
  const res = await fetch(`${BASE}/sectors`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(sector),
  });
  return handle(res);
}

export async function addReport(report) {
  const res = await fetch(`${BASE}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(report),
  });
  return handle(res);
}

export async function getReports() {
  const res = await fetch(`${BASE}/reports`, { headers: authHeaders() });
  return handle(res);
}

export async function getPublicDistricts() {
  const res = await fetch(`${BASE}/public/districts`);
  return handle(res);
}

export async function getDistributionConfig() {
  const res = await fetch(`${BASE}/distribution/config`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch distribution config");
  return res.json();
}

export async function updateDistributionConfig(updates) {
  const res = await fetch(`${BASE}/distribution/config`, {
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update config");
  return res.json();
}

export async function calculateDistribution(supply, overrides = {}) {
  const params = new URLSearchParams();
  if (supply !== undefined && supply !== null) params.set("supply", supply);
  Object.entries(overrides).forEach(([key, val]) => {
    if (val !== undefined && val !== null) params.set(key, val);
  });
  const queryString = params.toString();
  const url = queryString ? `${BASE}/distribution/calculate?${queryString}` : `${BASE}/distribution/calculate`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to calculate distribution");
  return res.json();
}

export async function publishDistribution(payload) {
  // Supports either number (legacy/simple) or object payload { totalSupply_m3, title, notes, config }
  const body = typeof payload === "number" ? { totalSupply_m3: payload } : payload;
  const res = await fetch(`${BASE}/distribution/publish`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to publish");
  return res.json();
}

export async function getActiveDistribution() {
  const res = await fetch(`${BASE}/distribution/active`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch active distribution");
  return res.json();
}

export async function getDistributionHistory() {
  const res = await fetch(`${BASE}/distribution/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch distribution history");
  return res.json();
}

export async function getDistributionPlan(id) {
  const res = await fetch(`${BASE}/distribution/plans/${encodeURIComponent(id)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to fetch distribution plan");
  return res.json();
}

