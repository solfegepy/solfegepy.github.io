import { describe, expect, it } from "vitest";

import { getAsciiRows, searchAsciiRows } from "./ascii";

describe("ASCII and Latin reference rows", () => {
  it("covers the agreed ranges once in code-point order", () => {
    const rows = getAsciiRows();

    expect(rows).toHaveLength(848);
    expect(rows[0]?.codePoint).toBe(0x0000);
    expect(rows[0x024f]?.codePoint).toBe(0x024f);
    expect(rows[0x0250]?.codePoint).toBe(0x1e00);
    expect(rows.at(-1)?.codePoint).toBe(0x1eff);
    expect(new Set(rows.map((row) => row.codePoint)).size).toBe(848);
    expect(rows.map((row) => row.codePoint)).toEqual([...rows.map((row) => row.codePoint)].sort((a, b) => a - b));
  });

  it("shows control characters and spacing characters with readable labels", () => {
    const rows = getAsciiRows();

    expect(rows.find((row) => row.codePoint === 0x0000)?.display).toBe("NUL");
    expect(rows.find((row) => row.codePoint === 0x007f)?.display).toBe("DEL");
    expect(rows.find((row) => row.codePoint === 0x0080)?.display).toBe("PAD");
    expect(rows.find((row) => row.codePoint === 0x009f)?.display).toBe("APC");
    expect(rows.find((row) => row.codePoint === 0x0020)?.display).toBe("SPACE");
    expect(rows.find((row) => row.codePoint === 0x00a0)?.display).toBe("NO-BREAK SPACE");
    expect(rows.find((row) => row.codePoint === 0x00ad)?.display).toBe("SOFT HYPHEN");
  });

  it("derives caret and UTF-8 URL values from Unicode code points", () => {
    const rows = getAsciiRows();

    expect(rows.find((row) => row.codePoint === 0x005e)).toMatchObject({
      character: "^",
      decimal: 94,
      hex: "U+005E",
      urlEncoded: "%5E",
    });
    expect(rows.find((row) => row.codePoint === 0x00e9)).toMatchObject({
      character: "é",
      decimal: 233,
      hex: "U+00E9",
      urlEncoded: "%C3%A9",
    });
    expect(rows.find((row) => row.codePoint === 0x0065)?.urlEncoded).toBe("%65");
  });

  it.each(["94", "5E", "0x5E", "u+005e", "%5E", "%5e", " %5E "])("finds caret from code lookup %s", (query) => {
    expect(searchAsciiRows(query).map((row) => row.character)).toEqual(["^"]);
  });

  it("finds UTF-8 percent bytes and trims surrounding query whitespace", () => {
    expect(searchAsciiRows("%C3%A9").map((row) => row.hex)).toEqual(["U+00E9"]);
    expect(searchAsciiRows("  5E  ").map((row) => row.character)).toEqual(["^"]);
  });

  it.each(["%", "%C3", "%C3%28", "%FF", "%5G", "%5E%41", "U+0250", "592", "0x110000"])(
    "returns no rows for unsupported or malformed input %s",
    (query) => {
      expect(searchAsciiRows(query)).toEqual([]);
    },
  );

  it("returns the fixed rows for empty or whitespace-only search", () => {
    expect(searchAsciiRows("   ")).toBe(getAsciiRows());
  });
});

describe("Latin letter family search", () => {
  it("finds the e family across Latin blocks and folds ligatures", () => {
    const lowercase = searchAsciiRows("e").map((row) => row.character);
    const uppercase = searchAsciiRows("E").map((row) => row.character);

    expect(lowercase).toEqual(uppercase);
    expect(lowercase).toEqual(
      expect.arrayContaining(["e", "E", "è", "é", "ê", "ë", "ē", "ė", "ę", "ě", "ẹ", "ế", "Ế", "æ", "œ"]),
    );
    expect(lowercase).not.toContain("b");
  });

  it("treats composed and decomposed letter queries the same", () => {
    expect(searchAsciiRows("é")).toEqual(searchAsciiRows("e\u0301"));
    expect(searchAsciiRows("é")).toEqual(searchAsciiRows("e"));
  });

  it.each([
    ["a", ["æ", "Æ"]],
    ["e", ["æ", "Æ", "œ", "Œ"]],
    ["o", ["œ", "Œ", "ø", "Ø"]],
    ["l", ["ł", "Ł"]],
    ["d", ["đ", "Đ", "ð", "Ð"]],
    ["t", ["þ", "Þ"]],
    ["s", ["ß", "ẞ"]],
  ])("folds common non-decomposing letters into the %s family", (letter, variants) => {
    const family = searchAsciiRows(letter).map((row) => row.character);

    for (const variant of variants) expect(family).toContain(variant);
    expect(searchAsciiRows(letter.toUpperCase()).map((row) => row.character)).toEqual(family);
  });

  it("keeps a non-decomposing letter searchable by itself", () => {
    expect(searchAsciiRows("ƿ")).toEqual(searchAsciiRows("Ƿ"));
    expect(searchAsciiRows("ƿ").map((row) => row.character)).toEqual(["ƿ", "Ƿ"]);
  });

  it("searches a non-decomposing ligature case-insensitively", () => {
    expect(searchAsciiRows("œ")).toEqual(searchAsciiRows("Œ"));
    expect(searchAsciiRows("œ").map((row) => row.character)).toEqual(["Œ", "œ"]);
  });

  it("does not treat multiple letters with combining marks as one family query", () => {
    expect(searchAsciiRows("e\u0301a")).toEqual([]);
  });

  it.each(["a", "b", "c", "d", "e", "f"])("searches for the %s family instead of a bare hex digit", (letter) => {
    const result = searchAsciiRows(letter);

    expect(result).toContainEqual(expect.objectContaining({ character: letter }));
    expect(result.map((row) => row.codePoint)).not.toContain(Number.parseInt(letter, 16));
  });

  it("uses an explicit hexadecimal prefix for code point 14", () => {
    expect(searchAsciiRows("0xE").map((row) => row.codePoint)).toEqual([14]);
  });
});
