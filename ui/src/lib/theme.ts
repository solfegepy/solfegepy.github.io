export type ResolvedTheme = "light" | "dark";
export type ThemeOverride = ResolvedTheme | null;

export const THEME_STORAGE_KEY = "codec-bench-theme";

type ThemeStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type ThemeMedia = Pick<MediaQueryList, "matches"> &
  Partial<Pick<MediaQueryList, "addEventListener" | "removeEventListener">>;

function browserStorage(): ThemeStorage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function systemMedia(): ThemeMedia | undefined {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    return undefined;
  }
}

/** Read valid explicit theme override; return null for system preference. */
export function readThemeOverride(storage: ThemeStorage | undefined = browserStorage()): ThemeOverride {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

/** Persist explicit light or dark theme when storage is available. */
export function writeThemeOverride(theme: ResolvedTheme, storage: ThemeStorage | undefined = browserStorage()): void {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // ponytail: session theme still works when browser storage is blocked.
  }
}

/** Remove explicit theme override and restore system preference. */
export function removeThemeOverride(storage: ThemeStorage | undefined = browserStorage()): void {
  try {
    storage?.removeItem(THEME_STORAGE_KEY);
  } catch {
    // ponytail: current session still follows system when browser storage is blocked.
  }
}

/** Resolve current operating-system color preference. */
export function resolveSystemTheme(media: ThemeMedia | undefined = systemMedia()): ResolvedTheme {
  return media?.matches ? "dark" : "light";
}

/** Apply resolved theme to document root. */
export function applyTheme(theme: ResolvedTheme): void {
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
}

/** Resolve and apply initial theme before application hydration. */
export function initializeTheme(
  storage: ThemeStorage | undefined = browserStorage(),
  media: ThemeMedia | undefined = systemMedia(),
): { override: ThemeOverride; resolved: ResolvedTheme } {
  const override = readThemeOverride(storage);
  const resolved = override ?? resolveSystemTheme(media);
  applyTheme(resolved);
  return { override, resolved };
}

/** Follow system theme changes while no explicit override exists. */
export function subscribeToSystemTheme(
  media: ThemeMedia | undefined = systemMedia(),
  storage: ThemeStorage | undefined = browserStorage(),
  onChange: (theme: ResolvedTheme) => void = applyTheme,
): () => void {
  if (!media?.addEventListener) return () => undefined;
  const listener = () => {
    if (readThemeOverride(storage) !== null) return;
    const resolved = resolveSystemTheme(media);
    applyTheme(resolved);
    onChange(resolved);
  };
  media.addEventListener("change", listener);
  return () => media.removeEventListener?.("change", listener);
}

export const THEME_BOOTSTRAP_SCRIPT = `(() => {
  const key = ${JSON.stringify(THEME_STORAGE_KEY)};
  let override = null;
  try {
    const stored = localStorage.getItem(key);
    if (stored === "light" || stored === "dark") override = stored;
    else if (stored !== null) localStorage.removeItem(key);
  } catch {}
  document.documentElement.dataset.theme = override ??
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
})();`;
