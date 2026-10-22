const C0_NAMES = [
  "NUL",
  "SOH",
  "STX",
  "ETX",
  "EOT",
  "ENQ",
  "ACK",
  "BEL",
  "BS",
  "HT",
  "LF",
  "VT",
  "FF",
  "CR",
  "SO",
  "SI",
  "DLE",
  "DC1",
  "DC2",
  "DC3",
  "DC4",
  "NAK",
  "SYN",
  "ETB",
  "CAN",
  "EM",
  "SUB",
  "ESC",
  "FS",
  "GS",
  "RS",
  "US",
] as const;

const C1_NAMES = [
  "PAD",
  "HOP",
  "BPH",
  "NBH",
  "IND",
  "NEL",
  "SSA",
  "ESA",
  "HTS",
  "HTJ",
  "VTS",
  "PLD",
  "PLU",
  "RI",
  "SS2",
  "SS3",
  "DCS",
  "PU1",
  "PU2",
  "STS",
  "CCH",
  "MW",
  "SPA",
  "EPA",
  "SOS",
  "SGCI",
  "SCI",
  "CSI",
  "ST",
  "OSC",
  "PM",
  "APC",
] as const;

/** One Unicode code point and its display values in the reference table. */
export interface AsciiRow {
  /** Unicode code point represented by the row. */
  codePoint: number;
  /** The underlying Unicode character, including controls and spaces. */
  character: string;
  /** Readable table value for controls and invisible spacing characters. */
  display: string;
  /** Decimal Unicode code point. */
  decimal: number;
  /** Uppercase Unicode code point with a U+ prefix. */
  hex: string;
  /** UTF-8 bytes percent-encoded one byte at a time. */
  urlEncoded: string;
}

const CODE_POINT_RANGES = [
  [0x0000, 0x024f],
  [0x1e00, 0x1eff],
] as const;

const SPACING_LABELS = new Map<number, string>([
  [0x0020, "SPACE"],
  [0x00a0, "NO-BREAK SPACE"],
  [0x00ad, "SOFT HYPHEN"],
]);

const LATIN_FOLDS: Readonly<Record<string, string>> = {
  æ: "ae",
  Æ: "ae",
  œ: "oe",
  Œ: "oe",
  ø: "o",
  Ø: "o",
  ł: "l",
  Ł: "l",
  đ: "d",
  Đ: "d",
  ð: "d",
  Ð: "d",
  þ: "th",
  Þ: "th",
  ß: "ss",
  ẞ: "ss",
};

const LATIN_SCRIPT = /^\p{Script=Latin}$/u;
const UNICODE_LETTER = /^\p{Letter}$/u;
const LATIN_LETTERS_AND_MARKS = /^[\p{Script=Latin}\p{Mark}]+$/u;

function foldLatinLetter(value: string): string {
  const decomposed = value.normalize("NFD").replace(/\p{Mark}/gu, "");
  return Array.from(decomposed, (character) => LATIN_FOLDS[character] ?? character.toLowerCase()).join("");
}

function searchLatinFamily(value: string): readonly AsciiRow[] | undefined {
  if (!LATIN_LETTERS_AND_MARKS.test(value)) return undefined;

  const queryLetters = Array.from(value.normalize("NFD")).filter((character) => UNICODE_LETTER.test(character));
  if (queryLetters.length !== 1 || !LATIN_SCRIPT.test(queryLetters[0] ?? "")) return undefined;

  const foldedQuery = foldLatinLetter(value);

  return ASCII_ROWS.filter((row) => {
    if (!LATIN_SCRIPT.test(row.character) || !UNICODE_LETTER.test(row.character)) return false;
    const foldedCharacter = foldLatinLetter(row.character);
    return foldedCharacter === foldedQuery || (foldedCharacter.length > 1 && foldedCharacter.includes(foldedQuery));
  });
}

function getDisplay(codePoint: number, character: string): string {
  if (codePoint < 0x0020) return C0_NAMES[codePoint] ?? character;
  if (codePoint === 0x007f) return "DEL";
  if (codePoint >= 0x0080 && codePoint <= 0x009f) return C1_NAMES[codePoint - 0x0080] ?? character;
  return SPACING_LABELS.get(codePoint) ?? character;
}

function makeRow(codePoint: number): AsciiRow {
  const character = String.fromCodePoint(codePoint);
  const urlEncoded = Array.from(
    new TextEncoder().encode(character),
    (byte) => `%${byte.toString(16).padStart(2, "0").toUpperCase()}`,
  ).join("");

  return {
    codePoint,
    character,
    display: getDisplay(codePoint, character),
    decimal: codePoint,
    hex: `U+${codePoint.toString(16).toUpperCase().padStart(4, "0")}`,
    urlEncoded,
  };
}

const ASCII_ROWS: readonly AsciiRow[] = CODE_POINT_RANGES.flatMap(([start, end]) =>
  Array.from({ length: end - start + 1 }, (_, index) => makeRow(start + index)),
);

/** Returns the fixed reference rows in ascending Unicode code point order. */
export function getAsciiRows(): readonly AsciiRow[] {
  return ASCII_ROWS;
}

function findCodePoint(codePoint: number): readonly AsciiRow[] {
  const row = ASCII_ROWS.find((candidate) => candidate.codePoint === codePoint);
  return row ? [row] : [];
}

function parseHex(value: string): readonly AsciiRow[] {
  if (!/^[\da-f]+$/i.test(value)) return [];
  return findCodePoint(Number.parseInt(value, 16));
}

function searchPercentBytes(value: string): readonly AsciiRow[] {
  if (!/^(?:%[\da-f]{2})+$/i.test(value)) return [];

  try {
    const decoded = decodeURIComponent(value);
    const characters = Array.from(decoded);
    return characters.length === 1 ? findCharacter(characters[0] ?? "") : [];
  } catch (error) {
    // Invalid percent-encoded user input should produce no matches instead of escaping search.
    if (error instanceof URIError) return [];
    throw error;
  }
}

function findCharacter(character: string): readonly AsciiRow[] {
  const codePoints = Array.from(character, (value) => value.codePointAt(0));
  const codePoint = codePoints[0];
  return codePoint === undefined || codePoints.length !== 1 ? [] : findCodePoint(codePoint);
}

/** Searches the reference by code, percent-encoded UTF-8, or exact character. */
export function searchAsciiRows(query: string): readonly AsciiRow[] {
  const value = query.trim();
  if (value === "") return ASCII_ROWS;

  const prefixedHex = /^(?:0x|u\+)([\da-f]+)$/i.exec(value);
  if (prefixedHex) return parseHex(prefixedHex[1] ?? "");
  if (value.startsWith("%")) return searchPercentBytes(value);
  if (/^\d+$/.test(value)) return findCodePoint(Number(value));
  if (/^[\da-f]+$/i.test(value) && value.length > 1) return parseHex(value);
  const latinFamily = searchLatinFamily(value);
  if (latinFamily !== undefined) return latinFamily;
  if (Array.from(value).length === 1) return findCharacter(value);
  return [];
}
