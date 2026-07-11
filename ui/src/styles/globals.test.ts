import { readFileSync, readdirSync } from "node:fs";
import { extname, join } from "node:path";

import { describe, expect, it } from "vitest";

const SOURCE_ROOT = join(process.cwd(), "src");
const SEMANTIC_COLORS = [
  "paper",
  "panel",
  "field",
  "ink",
  "muted",
  "line",
  "primary",
  "primary-strong",
  "accent",
  "accent-strong",
] as const;
const APPROVED_COLORS =
  /^var\(--color-(?:slate-(?:50|[1-9]00|950)|blue-(?:50|[1-9]00|950)|orange-(?:50|[1-9]00|950)|white|transparent)\)$/;
const TEST_ID_SURFACES = ["section", "header", "footer", "main", "nav", "article", "button", "a", "input", "textarea"];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return [".astro", ".tsx"].includes(extname(path)) && !path.endsWith(".test.tsx") ? [path] : [];
  });
}

describe("Tailwind theme contract", () => {
  const css = readFileSync(join(SOURCE_ROOT, "styles/globals.css"), "utf8");

  it("uses no arbitrary Tailwind utilities", () => {
    const arbitraryUtility = /(?:^|\s)(?:[\w-]+:)*[\w-]+-\[[^\]]+\]/gm;
    const violations = sourceFiles(SOURCE_ROOT).flatMap((path) => {
      const matches = readFileSync(path, "utf8").match(arbitraryUtility) ?? [];
      return matches.map((match) => `${path}: ${match.trim()}`);
    });

    expect(violations).toEqual([]);
  });

  it("defines every semantic color utility", () => {
    for (const color of SEMANTIC_COLORS) expect(css).toContain(`--color-${color}: var(--${color});`);
  });

  it("maps theme colors only to approved Tailwind colors", () => {
    const declarations = [
      ...css.matchAll(/^\s+--(paper|panel|field|ink|muted|line|primary(?:-strong)?|accent(?:-strong)?): (.+);$/gm),
    ];

    expect(declarations).toHaveLength(SEMANTIC_COLORS.length * 2);
    for (const [, , value] of declarations) expect(value).toMatch(APPROVED_COLORS);
    expect(css).not.toMatch(/#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)a?\(/i);
  });
});

describe("UI source contract", () => {
  it("gives test surfaces stable hooks and buttons titles", () => {
    const surfacePattern = new RegExp(`<(${TEST_ID_SURFACES.join("|")})\\b[\\s\\S]*?>`, "g");
    const missingTestIds: string[] = [];
    const missingButtonTitles: string[] = [];

    for (const path of sourceFiles(SOURCE_ROOT)) {
      const source = readFileSync(path, "utf8");
      // ponytail: regex covers current markup; use framework ASTs if contract attributes move after raw `>` tokens.
      for (const match of source.matchAll(surfacePattern)) {
        const [openingTag, tag] = match;
        if (!/\bdata-testid\s*=/.test(openingTag)) missingTestIds.push(`${path}: <${tag}>`);
        if (tag === "button" && !/\btitle\s*=/.test(openingTag)) missingButtonTitles.push(`${path}: <button>`);
      }
    }

    expect(missingTestIds).toEqual([]);
    expect(missingButtonTitles).toEqual([]);
  });

  it("uses direct textarea classes instead of descendant utility selectors", () => {
    const source = readFileSync(join(SOURCE_ROOT, "components/shared/CodecWorkspace.tsx"), "utf8");

    expect(source).not.toContain("[&_textarea]:pr-16");
  });
});
