import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { readTheme, THEME_BOOTSTRAP_SCRIPT, THEME_STORAGE_KEY, writeTheme } from "./theme";

const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");

function setSystemTheme(dark: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({ matches: dark }) as MediaQueryList),
  });
}

afterEach(() => {
  localStorage.clear();
  if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
  else Reflect.deleteProperty(window, "matchMedia");
  vi.restoreAllMocks();
});

describe("theme contract", () => {
  it("boots every layout before body", () => {
    const layout = readFileSync(resolve(import.meta.dirname, "../layouts/Layout.astro"), "utf8");
    expect(layout.indexOf("THEME_BOOTSTRAP_SCRIPT")).toBeLessThan(layout.indexOf("<body>"));
  });

  it("defaults to dark regardless of system preference when no preference is stored", () => {
    setSystemTheme(true);
    expect(readTheme(localStorage)).toBe("dark");
    setSystemTheme(false);
    expect(readTheme(localStorage)).toBe("dark");
  });

  it("boots dark before hydration and respects a saved light theme", () => {
    setSystemTheme(false);
    window.eval(THEME_BOOTSTRAP_SCRIPT);
    expect(document.documentElement.dataset.theme).toBe("dark");

    writeTheme("light", localStorage);
    window.eval(THEME_BOOTSTRAP_SCRIPT);
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("uses a valid stored theme ahead of system preference", () => {
    setSystemTheme(true);
    writeTheme("light", localStorage);
    expect(readTheme(localStorage)).toBe("light");
    localStorage.setItem(THEME_STORAGE_KEY, "unknown");
    expect(readTheme(localStorage)).toBe("dark");
  });

  it("falls back to dark when storage access is blocked", () => {
    setSystemTheme(false);
    const broken = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    expect(readTheme(broken)).toBe("dark");
    expect(() => writeTheme("light", broken)).not.toThrow();
  });
});
