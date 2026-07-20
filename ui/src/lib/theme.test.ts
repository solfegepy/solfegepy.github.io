import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  applyTheme,
  initializeTheme,
  readThemeOverride,
  removeThemeOverride,
  resolveSystemTheme,
  subscribeToSystemTheme,
  THEME_STORAGE_KEY,
  writeThemeOverride,
} from "./theme";

function media(matches: boolean) {
  const target = new EventTarget();
  return Object.assign(target, { matches, media: "(prefers-color-scheme: dark)", onchange: null });
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.restoreAllMocks();
});

describe("theme contract", () => {
  it("boots every layout before body and leaves 404 without duplicate resolver", () => {
    const layout = readFileSync(resolve(import.meta.dirname, "../layouts/Layout.astro"), "utf8");
    const notFound = readFileSync(resolve(import.meta.dirname, "../pages/404.astro"), "utf8");
    expect(layout.indexOf("THEME_BOOTSTRAP_SCRIPT")).toBeLessThan(layout.indexOf("<body>"));
    expect(notFound).not.toContain("prefers-color-scheme");
  });

  it("uses valid override and otherwise follows system", () => {
    const darkSystem = media(true);
    expect(initializeTheme(localStorage, darkSystem)).toEqual({ override: null, resolved: "dark" });
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(initializeTheme(localStorage, darkSystem)).toEqual({ override: "light", resolved: "light" });
    localStorage.setItem(THEME_STORAGE_KEY, "unknown");
    expect(initializeTheme(localStorage, darkSystem)).toEqual({ override: null, resolved: "dark" });
  });

  it("stores only explicit themes and removes system override", () => {
    writeThemeOverride("dark", localStorage);
    expect(readThemeOverride(localStorage)).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    removeThemeOverride(localStorage);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("applies system changes only without override", () => {
    const system = media(false);
    const stop = subscribeToSystemTheme(system, localStorage);
    system.matches = true;
    system.dispatchEvent(new Event("change"));
    expect(document.documentElement.dataset.theme).toBe("dark");
    writeThemeOverride("light", localStorage);
    applyTheme("light");
    system.matches = false;
    system.dispatchEvent(new Event("change"));
    expect(document.documentElement.dataset.theme).toBe("light");
    stop();
  });

  it("survives storage exceptions", () => {
    const broken = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      removeItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    expect(readThemeOverride(broken)).toBeNull();
    expect(() => writeThemeOverride("dark", broken)).not.toThrow();
    expect(() => removeThemeOverride(broken)).not.toThrow();
    expect(resolveSystemTheme(media(true))).toBe("dark");
  });
});
