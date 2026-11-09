export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "codec-bench-theme";
const SYSTEM_THEME_QUERY = "(prefers-color-scheme: dark)";
const SYSTEM_THEME_BY_PREFERENCE = { true: "dark", false: "light" } satisfies Record<string, Theme>;

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

function systemTheme(): Theme {
  const prefersDark = window.matchMedia(SYSTEM_THEME_QUERY).matches;
  return SYSTEM_THEME_BY_PREFERENCE[String(prefersDark) as keyof typeof SYSTEM_THEME_BY_PREFERENCE];
}

function browserStorage(): ThemeStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Read saved theme; follow the system preference when nothing valid is stored. */
export function readTheme(storage: ThemeStorage | undefined = browserStorage()): Theme {
  const fallbackTheme = systemTheme();
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : fallbackTheme;
  } catch {
    return fallbackTheme;
  }
}

/** Persist chosen theme when storage is available. */
export function writeTheme(theme: Theme, storage: ThemeStorage | undefined = browserStorage()): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ponytail: session theme still works when browser storage is blocked.
  }
}

/** Apply theme to document root. */
export function applyTheme(theme: Theme): void {
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
}

export const THEME_BOOTSTRAP_SCRIPT = `(() => {
  const systemThemes = ${JSON.stringify(SYSTEM_THEME_BY_PREFERENCE)};
  let theme = systemThemes[String(window.matchMedia(${JSON.stringify(SYSTEM_THEME_QUERY)}).matches)];
  try {
    const stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (stored === "light" || stored === "dark") theme = stored;
  } catch {}
  document.documentElement.dataset.theme = theme;
})();`;
