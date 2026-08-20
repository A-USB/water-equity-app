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
