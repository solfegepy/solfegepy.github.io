import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { readTheme, THEME_STORAGE_KEY, writeTheme } from "./theme";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("theme contract", () => {
  it("boots every layout before body", () => {
    const layout = readFileSync(resolve(import.meta.dirname, "../layouts/Layout.astro"), "utf8");
    expect(layout.indexOf("THEME_BOOTSTRAP_SCRIPT")).toBeLessThan(layout.indexOf("<body>"));
  });

  it("defaults to dark and uses only valid stored themes", () => {
    expect(readTheme(localStorage)).toBe("dark");
    writeTheme("light", localStorage);
    expect(readTheme(localStorage)).toBe("light");
    localStorage.setItem(THEME_STORAGE_KEY, "unknown");
    expect(readTheme(localStorage)).toBe("dark");
  });

  it("survives storage exceptions", () => {
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
