const KEY = "Mira_theme";

export function loadTheme() {
  try {
    return localStorage.getItem(KEY) || "light";
  } catch {
    return "light";
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // ignore — theme just won't persist
  }
}
