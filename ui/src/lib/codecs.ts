import type { ConversionResult, JwtDecodeResult, QueryObject, QueryValue } from "./types";

export type Base64Variant = "standard" | "url-safe";
export type UrlEncodingVariant = "rfc3986" | "uri" | "form";
export type TimestampFormat = "ztime" | "timestamp-seconds" | "timestamp-milliseconds";

const MAX_TIMESTAMP_MILLISECONDS = 253_402_300_799_999n;

const fail = (error: string): ConversionResult => ({ ok: false, error });
const pass = (value: string): ConversionResult => ({ ok: true, value });

const JWT_MAX_LENGTH = 100_000;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

function isValidJwtSegment(segment: string, allowEmpty = false): boolean {
  return (allowEmpty && segment === "") || (BASE64URL_PATTERN.test(segment) && segment.length % 4 !== 1);
}

function decodeJwtSegment(segment: string): Uint8Array {
  const standard = segment
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(segment.length / 4) * 4, "=");
  return Uint8Array.from(atob(standard), (character) => character.charCodeAt(0));
}

function parseJwtObject(segment: string, name: "header" | "payload"): Record<string, unknown> | string {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(decodeJwtSegment(segment));
  } catch {
    return `JWT ${name} must decode to valid UTF-8.`;
  }

  let value: unknown;
  try {
    value = JSON.parse(text) as unknown;
  } catch {
    return `JWT ${name} must contain valid JSON.`;
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return `JWT ${name} must contain a JSON object.`;
  }
  return value as Record<string, unknown>;
}

/** Decodes a compact JWS JWT without verifying its signature. */
export function decodeJwt(input: string): JwtDecodeResult {
  if (input.length > JWT_MAX_LENGTH) {
    return { ok: false, error: "JWT is too large. Maximum size is 100000 characters." };
  }
  const token = input.trim();
  if (!token) return { ok: false, error: "Enter a JWT." };
  const segments = token.split(".");
  if (segments.length !== 3) return { ok: false, error: "JWT must contain three segments." };
  const [headerSegment, payloadSegment, signature] = segments as [string, string, string];
  if (!isValidJwtSegment(headerSegment)) {
    return { ok: false, error: "JWT header must be valid unpadded Base64url." };
  }
  if (!isValidJwtSegment(payloadSegment)) {
    return { ok: false, error: "JWT payload must be valid unpadded Base64url." };
  }
  if (!isValidJwtSegment(signature, true)) {
    return { ok: false, error: "JWT signature must be valid unpadded Base64url." };
  }

  const header = parseJwtObject(headerSegment, "header");
  if (typeof header === "string") return { ok: false, error: header };
  const payload = parseJwtObject(payloadSegment, "payload");
  if (typeof payload === "string") return { ok: false, error: payload };
  if (!signature && header.alg !== "none") return { ok: false, error: 'Empty signature requires alg "none".' };
  return { ok: true, value: { header, payload, signature } };
}

function parseZTime(input: string): bigint | undefined {
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?Z$/);
  if (!match) return undefined;
  const year = Number(match[1]!);
  const month = Number(match[2]!);
  const day = Number(match[3]!);
  const hour = Number(match[4]!);
  const minute = Number(match[5]!);
  const second = Number(match[6]!);
  const milliseconds = Number((match[7] ?? "").padEnd(3, "0"));
  if (year < 1970 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59 || second > 59) {
    return undefined;
  }
  const value = Date.UTC(year, month - 1, day, hour, minute, second, milliseconds);
  const date = new Date(value);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getUTCHours() !== hour ||
    date.getUTCMinutes() !== minute ||
    date.getUTCSeconds() !== second ||
    date.getUTCMilliseconds() !== milliseconds
  ) {
    return undefined;
  }
  return BigInt(value);
}

function parseUnixTimestamp(input: string, source: Exclude<TimestampFormat, "ztime">): bigint | undefined {
  const match = input.trim().match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) return undefined;
  const integer = match[1]!;
  const fraction = match[2] ?? "";
  const milliseconds =
    source === "timestamp-seconds"
      ? BigInt(integer) * 1_000n + BigInt(fraction.slice(0, 3).padEnd(3, "0"))
      : BigInt(integer);
  return milliseconds <= MAX_TIMESTAMP_MILLISECONDS ? milliseconds : undefined;
}

/** Converts strict UTC Z time and Unix timestamp formats through epoch milliseconds. */
export function convertTimestamp(input: string, source: TimestampFormat, target: TimestampFormat): ConversionResult {
  if (!input.trim()) return fail(source === "ztime" ? "Enter a Z time." : "Enter a Unix timestamp.");
  const milliseconds = source === "ztime" ? parseZTime(input) : parseUnixTimestamp(input, source);
  if (milliseconds === undefined) {
    return fail(
      source === "ztime"
        ? "Enter a valid UTC Z time from 1970 through 9999."
        : "Enter a non-negative Unix timestamp within years 1970 through 9999.",
    );
  }
  switch (target) {
    case "ztime":
      return pass(new Date(Number(milliseconds)).toISOString());
    case "timestamp-seconds":
      return pass(String(milliseconds / 1_000n));
    case "timestamp-milliseconds":
      return pass(String(milliseconds));
  }
}

class PythonLiteralParser {
  private index = 0;

  constructor(private readonly source: string) {}

  parse(): unknown {
    const value = this.readValue();
    this.skipWhitespace();
    if (this.index !== this.source.length) throw new Error("Trailing input");
    return value;
  }

  private readValue(): unknown {
    this.skipWhitespace();
    const character = this.source[this.index];
    if (character === "'" || character === '"') return this.readString(character);
    if (character === "[") return this.readSequence("]");
    if (character === "(") return this.readSequence(")");
    if (character === "{") return this.readObject();
    for (const [literal, value] of [
      ["True", true],
      ["False", false],
      ["None", null],
    ] as const) {
      if (this.source.startsWith(literal, this.index)) {
        this.index += literal.length;
        return value;
      }
    }
    return this.readNumber();
  }

  private readString(quote: string): string {
    this.index++;
    let result = "";
    const escapes: Record<string, string> = {
      "'": "'",
      '"': '"',
      "\\": "\\",
      a: "\u0007",
      b: "\b",
      f: "\f",
      n: "\n",
      r: "\r",
      t: "\t",
      v: "\u000b",
    };
    while (this.index < this.source.length) {
      const character = this.source[this.index++]!;
      if (character === quote) return result;
      if (character !== "\\") {
        if (character === "\n" || character === "\r") throw new Error("Unterminated string");
        result += character;
        continue;
      }
      const escape = this.source[this.index++];
      if (escape === undefined) throw new Error("Unterminated escape");
      if (escape === "\n") continue;
      if (escape in escapes) {
        result += escapes[escape];
        continue;
      }
      if (escape === "x" || escape === "u" || escape === "U") {
        const length = escape === "x" ? 2 : escape === "u" ? 4 : 8;
        const digits = this.source.slice(this.index, this.index + length);
        if (!new RegExp(`^[0-9a-fA-F]{${length}}$`).test(digits)) throw new Error("Invalid escape");
        const point = Number.parseInt(digits, 16);
        if (point > 0x10ffff) throw new Error("Invalid code point");
        result += String.fromCodePoint(point);
        this.index += length;
        continue;
      }
      throw new Error("Unsupported escape");
    }
    throw new Error("Unterminated string");
  }

  private readSequence(close: "]" | ")"): unknown[] {
    this.index++;
    const result: unknown[] = [];
    this.skipWhitespace();
    while (this.source[this.index] !== close) {
      result.push(this.readValue());
      this.skipWhitespace();
      if (this.source[this.index] === close) break;
      if (this.source[this.index] !== ",") throw new Error("Expected comma");
      this.index++;
      this.skipWhitespace();
      if (this.source[this.index] === close) break;
    }
    if (this.source[this.index] !== close) throw new Error("Unterminated sequence");
    this.index++;
    return result;
  }

  private readObject(): Record<string, unknown> {
    this.index++;
    const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
    this.skipWhitespace();
    while (this.source[this.index] !== "}") {
      const quote = this.source[this.index];
      if (quote !== "'" && quote !== '"') throw new Error("Object keys must be strings");
      const key = this.readString(quote);
      this.skipWhitespace();
      if (this.source[this.index++] !== ":") throw new Error("Expected colon");
      result[key] = this.readValue();
      this.skipWhitespace();
      if (this.source[this.index] === "}") break;
      if (this.source[this.index] !== ",") throw new Error("Expected comma");
      this.index++;
      this.skipWhitespace();
      if (this.source[this.index] === "}") break;
    }
    if (this.source[this.index] !== "}") throw new Error("Unterminated object");
    this.index++;
    return result;
  }

  private readNumber(): number {
    const match = this.source.slice(this.index).match(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (!match) throw new Error("Expected value");
    this.index += match[0].length;
    const value = Number(match[0]);
    if (!Number.isFinite(value)) throw new Error("Invalid number");
    return value;
  }

  private skipWhitespace(): void {
    while (/\s/.test(this.source[this.index] ?? "")) this.index++;
  }
}

export function parsePython(input: string): ConversionResult {
  if (!input.trim()) return fail("Enter a Python literal.");
  try {
    return pass(JSON.stringify(new PythonLiteralParser(input).parse(), null, 2));
  } catch {
    return fail("Enter a supported Python literal.");
  }
}

function quotePythonString(value: string): string {
  let result = "'";
  const escapes: Record<number, string> = {
    8: "\\b",
    9: "\\t",
    10: "\\n",
    12: "\\f",
    13: "\\r",
  };
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code === 39) result += "\\'";
    else if (code === 92) result += "\\\\";
    else if (code in escapes) result += escapes[code];
    else if (code < 32 || code === 127) result += `\\x${code.toString(16).padStart(2, "0")}`;
    else if (code >= 0xd800 && code <= 0xdfff) {
      const next = value.charCodeAt(index + 1);
      if (code <= 0xdbff && next >= 0xdc00 && next <= 0xdfff) result += value[index]! + value[++index]!;
      else result += `\\u${code.toString(16).padStart(4, "0")}`;
    } else result += value[index];
  }
  return `${result}'`;
}

function pythonLiteral(value: unknown): string {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return quotePythonString(value);
  if (Array.isArray(value)) return `[${value.map(pythonLiteral).join(", ")}]`;
  return `{${Object.entries(value as Record<string, unknown>)
    .map(([key, item]) => `${quotePythonString(key)}: ${pythonLiteral(item)}`)
    .join(", ")}}`;
}

/** Converts valid JSON into an equivalent Python literal. */
export function serializePython(input: string): ConversionResult {
  try {
    return pass(pythonLiteral(JSON.parse(input)));
  } catch {
    return fail("Enter valid JSON.");
  }
}

export function encodeBase64(input: string, variant: Base64Variant): ConversionResult {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const encoded = btoa(binary);
  return pass(variant === "url-safe" ? encoded.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "") : encoded);
}

export function decodeBase64(input: string, variant: Base64Variant): ConversionResult {
  const compact = input.replace(/\s/g, "");
  const alphabet = variant === "url-safe" ? "[A-Za-z0-9_-]" : "[A-Za-z0-9+/]";
  const unpadded = compact.replace(/=+$/, "");
  const padding = compact.slice(unpadded.length);
  if (
    !new RegExp(`^${alphabet}*$`).test(unpadded) ||
    !/^={0,2}$/.test(padding) ||
    compact.length % 4 === 1 ||
    (padding.length > 0 && compact.length % 4 !== 0)
  ) {
    return fail("Enter valid Base64.");
  }

  const standard = unpadded
    .replaceAll("-", "+")
    .replaceAll("_", "/")
    .padEnd(Math.ceil(unpadded.length / 4) * 4, "=");
  try {
    const binary = atob(standard);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return pass(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return fail(
      standard.length > 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(standard)
        ? "Decoded bytes are not valid UTF-8."
        : "Enter valid Base64.",
    );
  }
}

const percentEncodeCharacter = (character: string): string =>
  `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`;

export function encodeUrl(input: string, variant: UrlEncodingVariant = "rfc3986"): ConversionResult {
  try {
    switch (variant) {
      case "rfc3986":
        return pass(encodeURIComponent(input).replace(/[!'()*]/g, percentEncodeCharacter));
      case "uri":
        return pass(encodeURI(input));
      case "form":
        return pass(
          encodeURIComponent(input)
            .replace(/[!'()~]/g, percentEncodeCharacter)
            .replaceAll("%20", "+"),
        );
    }
  } catch {
    return fail("Enter valid Unicode text.");
  }
}

export function decodeUrl(input: string, variant: UrlEncodingVariant = "rfc3986"): ConversionResult {
  try {
    return pass(
      variant === "uri"
        ? decodeURI(input)
        : decodeURIComponent(variant === "form" ? input.replaceAll("+", " ") : input),
    );
  } catch {
    return fail("Enter valid percent-encoded text.");
  }
}

function queryText(input: string): string {
  const trimmed = input.trim();
  if (/^[A-Za-z][A-Za-z\d+.-]*:\/\//.test(trimmed)) return new URL(trimmed).search.slice(1);
  return trimmed.startsWith("?") ? trimmed.slice(1) : trimmed;
}

export function parseQuery(input: string): ConversionResult {
  try {
    const result: QueryObject = {};
    for (const [key, value] of new URLSearchParams(queryText(input))) {
      const current = result[key];
      result[key] = current === undefined ? value : Array.isArray(current) ? [...current, value] : [current, value];
    }
    return pass(JSON.stringify(result, null, 2));
  } catch {
    return fail("Enter a valid URL or query string.");
  }
}

function isQueryValue(value: unknown): value is QueryValue {
  return typeof value === "string" || (Array.isArray(value) && value.every((item) => typeof item === "string"));
}

export function serializeQuery(input: string): ConversionResult {
  let source: unknown;
  try {
    source = JSON.parse(input);
  } catch {
    return fail("Enter a valid JSON object.");
  }
  if (source === null || Array.isArray(source) || typeof source !== "object") return fail("JSON must be an object.");
  if (!Object.values(source).every(isQueryValue)) return fail("Values must be strings or arrays of strings.");

  const parameters = new URLSearchParams();
  for (const [key, value] of Object.entries(source)) {
    for (const item of Array.isArray(value) ? value : [value]) parameters.append(key, item);
  }
  return pass(parameters.toString());
}
