import colors from "tailwindcss/colors";

const CHROMATIC_FAMILIES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;

const NEUTRAL_FAMILIES = ["slate", "gray", "zinc", "neutral", "stone", "mauve", "olive", "mist", "taupe"] as const;
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const HEX_PATTERN = /^#?(?:[\da-f]{3}|[\da-f]{6})$/i;

type NumberedFamily = (typeof CHROMATIC_FAMILIES)[number] | (typeof NEUTRAL_FAMILIES)[number];
type Shade = (typeof SHADES)[number];

export type TailwindFamily = NumberedFamily | "black" | "white";

export type TailwindPaletteEntry = Readonly<{
  token: string;
  family: TailwindFamily;
  shade: Shade | null;
  hex: string;
}>;

export type TailwindMatchResult =
  | Readonly<{ status: "empty" }>
  | Readonly<{ status: "invalid" }>
  | Readonly<{
      status: "matched";
      inputHex: string;
      entry: TailwindPaletteEntry;
      match: "exact" | "closest";
    }>;

// Release that last changed the default palette, not the installed version: later releases reuse these colors.
// Bump it when a Tailwind upgrade changes the palette.
export const TAILWIND_VERSION = "4.2.0";

function oklchToHex(value: string): string {
  const components = value.match(/^oklch\(([^%]+)%\s+([^\s]+)\s+([^\s)]+)\)$/);
  if (components === null) return value.toLowerCase() === "#000" ? "#000000" : "#ffffff";

  const lightness = Number(components[1]) / 100;
  const chroma = Number(components[2]);
  const hue = components[3] === "none" ? 0 : (Number(components[3]) * Math.PI) / 180;
  // CSS Color's Oklch-to-sRGB conversion uses this direct form to avoid intermediate rounding.
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linearRgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return `#${linearRgb
    .map((channel) => {
      const clipped = Math.max(0, Math.min(1, channel));
      const encoded = clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055;
      return Math.round(encoded * 255)
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}

function makeEntry(family: NumberedFamily, shade: Shade): TailwindPaletteEntry {
  const token = `${family}-${shade}`;
  return Object.freeze({ token, family, shade, hex: oklchToHex(colors[family][shade]) });
}

function makeAnchor(family: "black" | "white"): TailwindPaletteEntry {
  return Object.freeze({ token: family, family, shade: null, hex: oklchToHex(colors[family]) });
}

export const TAILWIND_PALETTE: readonly TailwindPaletteEntry[] = Object.freeze([
  ...[...CHROMATIC_FAMILIES, ...NEUTRAL_FAMILIES].flatMap((family) => SHADES.map((shade) => makeEntry(family, shade))),
  makeAnchor("black"),
  makeAnchor("white"),
]);

type Oklab = readonly [number, number, number];

function hexToOklab(hex: string): Oklab {
  const red = parseInt(hex.slice(1, 3), 16) / 255;
  const green = parseInt(hex.slice(3, 5), 16) / 255;
  const blue = parseInt(hex.slice(5, 7), 16) / 255;
  const linearRed = red <= 0.04045 ? red / 12.92 : ((red + 0.055) / 1.055) ** 2.4;
  const linearGreen = green <= 0.04045 ? green / 12.92 : ((green + 0.055) / 1.055) ** 2.4;
  const linearBlue = blue <= 0.04045 ? blue / 12.92 : ((blue + 0.055) / 1.055) ** 2.4;
  const l = (0.4122214708 * linearRed + 0.5363325363 * linearGreen + 0.0514459929 * linearBlue) ** (1 / 3);
  const m = (0.2119034982 * linearRed + 0.6806995451 * linearGreen + 0.1073969566 * linearBlue) ** (1 / 3);
  const s = (0.0883024619 * linearRed + 0.2817188376 * linearGreen + 0.6299787005 * linearBlue) ** (1 / 3);

  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

const PALETTE_OKLAB = TAILWIND_PALETTE.map((entry) => ({ entry, coordinates: hexToOklab(entry.hex) }));

function squaredDistance(first: Oklab, second: Oklab): number {
  return (first[0] - second[0]) ** 2 + (first[1] - second[1]) ** 2 + (first[2] - second[2]) ** 2;
}

function normalizeHex(input: string): string | null {
  const trimmed = input.trim();
  if (!HEX_PATTERN.test(trimmed)) return null;

  const digits = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  const expanded = digits.length === 3 ? [...digits].map((digit) => `${digit}${digit}`).join("") : digits;
  return `#${expanded.toLowerCase()}`;
}

/** Normalize hex and return its exact or perceptually closest Tailwind token. */
export function matchTailwindColor(input: string): TailwindMatchResult {
  const trimmed = input.trim();
  if (trimmed === "") return { status: "empty" };

  const inputHex = normalizeHex(trimmed);
  if (inputHex === null) return { status: "invalid" };

  const exactEntry = TAILWIND_PALETTE.find(({ hex }) => hex === inputHex);
  let closestEntry = PALETTE_OKLAB[0]!;
  let closestDistance = Number.POSITIVE_INFINITY;
  const inputCoordinates = hexToOklab(inputHex);

  for (const candidate of PALETTE_OKLAB) {
    const distance = squaredDistance(inputCoordinates, candidate.coordinates);
    // Strict comparison keeps the first palette token when distances tie.
    if (distance < closestDistance) {
      closestEntry = candidate;
      closestDistance = distance;
    }
  }

  return {
    status: "matched",
    inputHex,
    entry: exactEntry ?? closestEntry.entry,
    match: exactEntry === undefined ? "closest" : "exact",
  };
}

/** Format a normalized `#rrggbb` hex as a CSS `hsl()` value with rounded components. */
export function formatHsl(hex: string): string {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const chroma = max - min;
  const lightness = (max + min) / 2;
  const saturation = chroma === 0 ? 0 : chroma / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (chroma !== 0) {
    if (max === red) hue = ((green - blue) / chroma) % 6;
    else if (max === green) hue = (blue - red) / chroma + 2;
    else hue = (red - green) / chroma + 4;
  }

  return `hsl(${Math.round((hue * 60 + 360) % 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%)`;
}
