export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "codec-bench-theme";
export const DEFAULT_THEME: Theme = "dark";

type ThemeStorage = Pick<Storage, "getItem" | "setItem">;

function browserStorage(): ThemeStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

/** Read saved theme; fall back to dark when nothing valid is stored. */
export function readTheme(storage: ThemeStorage | undefined = browserStorage()): Theme {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
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
  let theme = ${JSON.stringify(DEFAULT_THEME)};
  try {
    const stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (stored === "light" || stored === "dark") theme = stored;
  } catch {}
  document.documentElement.dataset.theme = theme;
})();`;
