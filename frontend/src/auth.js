const KEY = "amazi_auth";

export function saveAuth(auth) {
  localStorage.setItem(KEY, JSON.stringify(auth));
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}
