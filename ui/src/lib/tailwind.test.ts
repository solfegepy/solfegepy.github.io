import { describe, expect, it } from "vitest";

import { formatHsl, hexHue, matchTailwindColor, parseOklch, TAILWIND_PALETTE, TAILWIND_VERSION } from "./tailwind";

describe("Tailwind palette", () => {
  it("exposes all default fixed-color tokens in wheel order", () => {
    expect(TAILWIND_VERSION).toBe("4.2.0");
    expect(TAILWIND_PALETTE).toHaveLength(288);
    expect(TAILWIND_PALETTE[0]).toEqual({
      token: "red-50",
      family: "red",
      shade: 50,
      hex: "#fef2f2",
      oklch: "oklch(97.1% 0.013 17.38)",
    });
    expect(TAILWIND_PALETTE.find(({ token }) => token === "blue-500")?.hex).toBe("#2b7fff");
    expect(TAILWIND_PALETTE.find(({ token }) => token === "gray-950")?.hex).toBe("#030712");
    expect(TAILWIND_PALETTE.at(-2)).toEqual({
      token: "black",
      family: "black",
      shade: null,
      hex: "#000000",
      oklch: "oklch(0% 0 0)",
    });
    expect(TAILWIND_PALETTE.at(-1)).toEqual({
      token: "white",
      family: "white",
      shade: null,
      hex: "#ffffff",
      oklch: "oklch(100% 0 0)",
    });
    expect(new Set(TAILWIND_PALETTE.map(({ token }) => token)).size).toBe(288);
    expect(TAILWIND_PALETTE.every(({ hex }) => /^#[\da-f]{6}$/.test(hex))).toBe(true);
    expect(TAILWIND_PALETTE.filter(({ shade }) => shade !== null)).toHaveLength(286);
    expect(new Set(TAILWIND_PALETTE.filter(({ shade }) => shade !== null).map(({ family }) => family)).size).toBe(26);
    for (const family of new Set(TAILWIND_PALETTE.filter(({ shade }) => shade !== null).map(({ family }) => family))) {
      expect(TAILWIND_PALETTE.filter((entry) => entry.family === family)).toHaveLength(11);
    }
  });
});

describe("matchTailwindColor input boundary", () => {
  it.each([
    ["#FFF", "#ffffff"],
    ["000", "#000000"],
    ["  Ff00aA  ", "#ff00aa"],
    ["#12aBcD", "#12abcd"],
  ])("normalizes %s to %s", (input, inputHex) => {
    const result = matchTailwindColor(input);

    expect(result).toMatchObject({ status: "matched", inputHex });
  });

  it.each(["", "   ", "\n\t"])('treats whitespace-only input "%s" as empty', (input) => {
    expect(matchTailwindColor(input)).toEqual({ status: "empty" });
  });

  it.each(["#12", "#ggg", "#abcd", "#11223344", "rgb(0,0,0)", "red", "#12 3456"])(
    "rejects unsupported input %s",
    (input) => {
      expect(matchTailwindColor(input)).toEqual({ status: "invalid" });
    },
  );

  it("matches palette entries exactly when the normalized hex is present", () => {
    expect(matchTailwindColor("#2b7fff")).toMatchObject({
      status: "matched",
      inputHex: "#2b7fff",
      entry: { token: "blue-500", hex: "#2b7fff" },
      match: "exact",
    });
    expect(matchTailwindColor("#000")).toMatchObject({
      status: "matched",
      inputHex: "#000000",
      entry: { token: "black", hex: "#000000" },
      match: "exact",
    });
    expect(matchTailwindColor("#ffffff")).toMatchObject({
      status: "matched",
      inputHex: "#ffffff",
      entry: { token: "white", hex: "#ffffff" },
      match: "exact",
    });
  });

  it("selects the closest chromatic palette token for an absent hex", () => {
    expect(matchTailwindColor("#ff6b35")).toMatchObject({
      status: "matched",
      inputHex: "#ff6b35",
      entry: { token: "orange-500" },
      match: "closest",
    });
  });

  it("selects the closest neutral palette token for a gray hex", () => {
    expect(matchTailwindColor("#5a5652")).toMatchObject({
      status: "matched",
      inputHex: "#5a5652",
      entry: { token: "stone-600" },
      match: "closest",
    });
  });

  it("uses OKLab where RGB distance would choose a different token", () => {
    // CSS Color 4's sRGB-to-OKLab equations identify slate-950; raw RGB distance identifies gray-950.
    expect(matchTailwindColor("#000011")).toMatchObject({
      status: "matched",
      inputHex: "#000011",
      entry: { token: "slate-950" },
      match: "closest",
    });
  });

  it("breaks duplicate-hex ties by the documented palette order", () => {
    // #fafafa belongs to zinc-50, neutral-50, and mauve-50; zinc comes first in the fixed family order.
    expect(matchTailwindColor("#fafafa")).toMatchObject({
      status: "matched",
      entry: { token: "zinc-50", hex: "#fafafa" },
      match: "exact",
    });
  });
});

describe("formatHsl", () => {
  it("formats hex as CSS hsl() with rounded hue, saturation and lightness", () => {
    expect(formatHsl("#3f3f46")).toBe("hsl(240 5% 26%)");
    expect(formatHsl("#2b7fff")).toBe("hsl(216 100% 58%)");
    expect(formatHsl("#ffffff")).toBe("hsl(0 0% 100%)");
  });
});

describe("parseOklch", () => {
  it.each([
    ["oklch(63.7% 0.237 25.331)", { lightness: 0.637, chroma: 0.237, hue: 25.331 }],
    ["oklch(100% 0 0)", { lightness: 1, chroma: 0, hue: 0 }],
    ["oklch(50% 0 none)", { lightness: 0.5, chroma: 0, hue: 0 }],
  ])("reads lightness as a fraction, chroma, and hue degrees from %s", (value, expected) => {
    expect(parseOklch(value)).toEqual(expected);
  });
});

describe("hexHue", () => {
  // The sRGB primaries and secondaries are unevenly spread around the OKLCH hue circle.
  it.each([
    ["#ff0000", 29.2],
    ["#ffff00", 109.8],
    ["#00ff00", 142.5],
    ["#00ffff", 194.8],
    ["#0000ff", 264.1],
    ["#ff00ff", 328.4],
  ])("places %s at OKLCH hue %f degrees", (hex, hue) => {
    expect(hexHue(hex)).toBeCloseTo(hue, 1);
  });
});
