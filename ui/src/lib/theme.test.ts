import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { readTheme, THEME_STORAGE_KEY, writeTheme } from "./theme";

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

  it("follows the system theme when no preference is stored", () => {
    setSystemTheme(true);
    expect(readTheme(localStorage)).toBe("dark");
    setSystemTheme(false);
    expect(readTheme(localStorage)).toBe("light");
  });

  it("uses a valid stored theme ahead of system preference", () => {
    setSystemTheme(true);
    writeTheme("light", localStorage);
    expect(readTheme(localStorage)).toBe("light");
    localStorage.setItem(THEME_STORAGE_KEY, "unknown");
    expect(readTheme(localStorage)).toBe("dark");
  });

  it("falls back to the system theme when storage access is blocked", () => {
    setSystemTheme(false);
    const broken = {
      getItem: vi.fn(() => {
        throw new Error("blocked");
      }),
      setItem: vi.fn(() => {
        throw new Error("blocked");
      }),
    };
    expect(readTheme(broken)).toBe("light");
    expect(() => writeTheme("light", broken)).not.toThrow();
  });
});
