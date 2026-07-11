import { describe, expect, it } from "vitest";

import {
  decodeBase64,
  decodeJwt,
  decodeUrl,
  encodeBase64,
  encodeUrl,
  parsePython,
  parseQuery,
  serializePython,
  serializeQuery,
  convertTimestamp,
} from "./codecs";

const toBase64Url = (value: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const jwt = (header: string, payload: string, signature = "c2ln"): string =>
  `${toBase64Url(header)}.${toBase64Url(payload)}.${signature}`;

describe("JWT decoder", () => {
  it("decodes strict unpadded Base64url with nested JSON and Unicode", () => {
    const token = jwt(
      '{"alg":"HS256","typ":"JWT","meta":{"emoji":"🎵"}}',
      '{"sub":"123","profile":{"name":"Ada café"},"roles":["admin"]}',
      "c3ludGhldGljLXNpZ25hdHVyZQ",
    );

    expect(decodeJwt(token)).toEqual({
      ok: true,
      value: {
        header: { alg: "HS256", typ: "JWT", meta: { emoji: "🎵" } },
        payload: { sub: "123", profile: { name: "Ada café" }, roles: ["admin"] },
        signature: "c3ludGhldGljLXNpZ25hdHVyZQ",
      },
    });
  });

  it('accepts alg "none" with an empty signature', () => {
    expect(decodeJwt(jwt('{"alg":"none"}', '{"sub":"123"}', ""))).toEqual({
      ok: true,
      value: { header: { alg: "none" }, payload: { sub: "123" }, signature: "" },
    });
  });

  it.each([
    ["x".repeat(100_001), "JWT is too large. Maximum size is 100000 characters."],
    [" \n ", "Enter a JWT."],
    ["a.b", "JWT must contain three segments."],
    [".e30.c2ln", "JWT header must be valid unpadded Base64url."],
    ["abc=.e30.c2ln", "JWT header must be valid unpadded Base64url."],
    ["a.e30.c2ln", "JWT header must be valid unpadded Base64url."],
    ["e30..c2ln", "JWT payload must be valid unpadded Base64url."],
    ["e30.e+0.c2ln", "JWT payload must be valid unpadded Base64url."],
    ["e30.e.c2ln", "JWT payload must be valid unpadded Base64url."],
    ["e30.e30.c2ln=", "JWT signature must be valid unpadded Base64url."],
    ["e30.e30.a", "JWT signature must be valid unpadded Base64url."],
    [`_w.${toBase64Url("{}")}._w`, "JWT header must decode to valid UTF-8."],
    [`${toBase64Url("{}")}._w._w`, "JWT payload must decode to valid UTF-8."],
    [`${toBase64Url("no")}.${toBase64Url("{}")}._w`, "JWT header must contain valid JSON."],
    [`${toBase64Url("{}")} .${toBase64Url("no")}._w`.replace(" ", ""), "JWT payload must contain valid JSON."],
    [`${toBase64Url("null")}.${toBase64Url("{}")}._w`, "JWT header must contain a JSON object."],
    [`${toBase64Url("{}")} .${toBase64Url("[]")}._w`.replace(" ", ""), "JWT payload must contain a JSON object."],
    [jwt('{"alg":"HS256"}', "{}", ""), 'Empty signature requires alg "none".'],
  ])("returns exact validation error for %s", (input, error) => {
    expect(decodeJwt(input)).toEqual({ ok: false, error });
  });

  it("trims outer whitespace only", () => {
    const token = jwt('{"alg":"HS256"}', "{}");
    expect(decodeJwt(` \n${token}\t `).ok).toBe(true);
    expect(decodeJwt(token.replace(".", ". "))).toEqual({
      ok: false,
      error: "JWT payload must be valid unpadded Base64url.",
    });
    expect(decodeJwt(`${toBase64Url("{}")}./w.c2ln`)).toEqual({
      ok: false,
      error: "JWT payload must be valid unpadded Base64url.",
    });
  });

  it("returns deeply nested and hostile-looking JSON only as data", () => {
    const nested = { value: "leaf" } as Record<string, unknown>;
    for (let depth = 0; depth < 100; depth++) nested.value = { value: nested.value };
    const marker = "<script>globalThis.jwtExecuted=true</script>";
    const token = jwt('{"alg":"HS256"}', JSON.stringify({ nested, marker, __proto__: null }));
    const result = decodeJwt(token);

    expect(result.ok).toBe(true);
    expect(result.ok && result.value.payload.marker).toBe(marker);
    expect((globalThis as typeof globalThis & { jwtExecuted?: boolean }).jwtExecuted).toBeUndefined();
  });

  it("preserves prototype-looking keys as own data", () => {
    const token = jwt('{"alg":"HS256"}', '{"__proto__":{"polluted":true},"constructor":"data"}');
    const result = decodeJwt(token);

    expect(result.ok && Object.hasOwn(result.value.payload, "__proto__")).toBe(true);
    expect(result.ok && result.value.payload.constructor).toBe("data");
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
});

describe("timestamp conversion", () => {
  it.each([
    ["2026-01-31T12:34:56.789Z", "timestamp-seconds", "1769862896"],
    ["2026-01-31T12:34:56.789Z", "timestamp-milliseconds", "1769862896789"],
    ["1970-01-01T00:00:00Z", "timestamp-milliseconds", "0"],
    ["1970-01-01T00:00:00.0Z", "timestamp-milliseconds", "0"],
    ["1970-01-01T00:00:00.01Z", "timestamp-milliseconds", "10"],
    ["1970-01-01T00:00:00.001Z", "timestamp-milliseconds", "1"],
    ["9999-12-31T23:59:59.999Z", "timestamp-milliseconds", "253402300799999"],
  ] as const)("converts Z time %s to %s", (input, target, output) => {
    expect(convertTimestamp(input, "ztime", target)).toEqual({ ok: true, value: output });
  });

  it.each([
    ["1769862896", "timestamp-seconds", "2026-01-31T12:34:56.000Z"],
    ["1769862896789", "timestamp-milliseconds", "2026-01-31T12:34:56.789Z"],
    ["1769862896.7899", "timestamp-seconds", "2026-01-31T12:34:56.789Z"],
    ["1.9999", "timestamp-milliseconds", "1970-01-01T00:00:00.001Z"],
    ["253402300799999", "timestamp-milliseconds", "9999-12-31T23:59:59.999Z"],
  ] as const)("converts %s %s to canonical Z time", (input, source, output) => {
    expect(convertTimestamp(input, source, "ztime")).toEqual({ ok: true, value: output });
  });

  it.each([
    ["1.5", "timestamp-seconds", "timestamp-milliseconds", "1500"],
    ["1500.9", "timestamp-milliseconds", "timestamp-seconds", "1"],
  ] as const)("converts directly from %s to %s", (input, source, target, output) => {
    expect(convertTimestamp(input, source, target)).toEqual({ ok: true, value: output });
  });

  it.each(["", "-1", "+1", "1e3", "1_000", "NaN", "Infinity", ".5", "253402300800000"])(
    "rejects invalid Unix timestamp %s",
    (input) => {
      expect(convertTimestamp(input, "timestamp-milliseconds", "ztime")).toEqual({
        ok: false,
        error: input
          ? "Enter a non-negative Unix timestamp within years 1970 through 9999."
          : "Enter a Unix timestamp.",
      });
    },
  );

  it.each([
    "",
    "1969-12-31T23:59:59.999Z",
    "2026-01-31 12:34:56Z",
    "2026-01-31t12:34:56z",
    "2026-01-31T12:34:56+00:00",
    "2026-02-29T12:34:56Z",
    "2024-02-29T12:34:60Z",
    "2024-02-29T12:34:56.1234Z",
    "10000-01-01T00:00:00Z",
    "2024-01-01T00:00:00Z trailing",
  ])("rejects invalid Z time %s", (input) => {
    expect(convertTimestamp(input, "ztime", "timestamp-seconds")).toEqual({
      ok: false,
      error: input ? "Enter a valid UTC Z time from 1970 through 9999." : "Enter a Z time.",
    });
  });
});

describe("Base64 codec", () => {
  it.each([
    ["hello", "aGVsbG8="],
    ["café 🎵", "Y2Fmw6kg8J+OtQ=="],
    ["", ""],
  ])("encodes %s as standard Base64", (input, output) => {
    expect(encodeBase64(input, "standard")).toEqual({
      ok: true,
      value: output,
    });
  });

  it("uses unpadded URL-safe alphabet", () => {
    expect(encodeBase64("ÿÿ", "url-safe")).toEqual({
      ok: true,
      value: "w7_Dvw",
    });
  });

  it.each(["w7_Dvw", "w7_Dvw=="])("decodes padded or unpadded URL-safe input", (input) => {
    expect(decodeBase64(input, "url-safe")).toEqual({
      ok: true,
      value: "ÿÿ",
    });
  });

  it("ignores whitespace in valid standard input", () => {
    expect(decodeBase64(" Y2Fm\nw6kg8J+OtQ== ", "standard")).toEqual({
      ok: true,
      value: "café 🎵",
    });
  });

  it.each(["***", "a===", "A"])("rejects invalid Base64", (input) => {
    expect(decodeBase64(input, "standard")).toEqual({
      ok: false,
      error: "Enter valid Base64.",
    });
  });

  it("rejects bytes that are not UTF-8", () => {
    expect(decodeBase64("/w==", "standard")).toEqual({
      ok: false,
      error: "Decoded bytes are not valid UTF-8.",
    });
  });
});

describe("URL component codec", () => {
  it.each([
    ["hello world", "hello%20world"],
    ["a/b?c=d&e=f", "a%2Fb%3Fc%3Dd%26e%3Df"],
    ["café 🎵", "caf%C3%A9%20%F0%9F%8E%B5"],
    ["a+b", "a%2Bb"],
    ["", ""],
  ])("encodes and decodes RFC 3986 component %s", (plain, encoded) => {
    expect(encodeUrl(plain, "rfc3986")).toEqual({ ok: true, value: encoded });
    expect(decodeUrl(encoded, "rfc3986")).toEqual({ ok: true, value: plain });
  });

  it("uses only the RFC 3986 unreserved safe set", () => {
    expect(encodeUrl("AZaz09-._~", "rfc3986")).toEqual({ ok: true, value: "AZaz09-._~" });
    expect(encodeUrl("!'()*:/?#[]@", "rfc3986")).toEqual({
      ok: true,
      value: "%21%27%28%29%2A%3A%2F%3F%23%5B%5D%40",
    });
    expect(encodeUrl("$&+,;=", "rfc3986")).toEqual({ ok: true, value: "%24%26%2B%2C%3B%3D" });
  });

  it("encodes and decodes a complete URI while preserving delimiters", () => {
    const plain = "https://example.test/a path?q=café#part 1";
    const encoded = "https://example.test/a%20path?q=caf%C3%A9#part%201";
    expect(encodeUrl(plain, "uri")).toEqual({ ok: true, value: encoded });
    expect(decodeUrl(encoded, "uri")).toEqual({ ok: true, value: plain });
  });

  it("uses application/x-www-form-urlencoded scalar rules", () => {
    const plain = "a+b / c~d";
    const encoded = "a%2Bb+%2F+c%7Ed";
    expect(encodeUrl(plain, "form")).toEqual({ ok: true, value: encoded });
    expect(decodeUrl(encoded, "form")).toEqual({ ok: true, value: plain });
  });

  it("distinguishes RFC 3986 and form safe sets", () => {
    expect(encodeUrl("~*", "rfc3986")).toEqual({ ok: true, value: "~%2A" });
    expect(encodeUrl("~*", "form")).toEqual({ ok: true, value: "%7E*" });
  });

  it("treats plus as space only in form decoding", () => {
    expect(decodeUrl("a+b", "rfc3986")).toEqual({ ok: true, value: "a+b" });
    expect(decodeUrl("a+b", "uri")).toEqual({ ok: true, value: "a+b" });
    expect(decodeUrl("a+b", "form")).toEqual({ ok: true, value: "a b" });
    expect(decodeUrl("a%2Bb", "form")).toEqual({ ok: true, value: "a+b" });
  });

  it.each(["rfc3986", "uri", "form"] as const)("round trips Unicode and empty input in %s mode", (variant) => {
    for (const plain of ["café 🎵", ""]) {
      const encoded = encodeUrl(plain, variant);
      expect(encoded.ok && decodeUrl(encoded.value, variant)).toEqual({ ok: true, value: plain });
    }
  });

  it.each(["rfc3986", "uri", "form"] as const)("decodes lowercase percent triplets in %s mode", (variant) => {
    expect(decodeUrl("caf%c3%a9", variant)).toEqual({ ok: true, value: "café" });
  });

  it.each(["rfc3986", "uri", "form"] as const)("rejects malformed escapes and invalid UTF-8 in %s mode", (variant) => {
    for (const input of ["%E0%A4%A", "%", "%ZZ", "%FF"]) {
      expect(decodeUrl(input, variant)).toEqual({
        ok: false,
        error: "Enter valid percent-encoded text.",
      });
    }
  });

  it.each(["rfc3986", "uri", "form"] as const)("rejects lone surrogates in %s mode", (variant) => {
    expect(encodeUrl("\ud800", variant)).toEqual({ ok: false, error: "Enter valid Unicode text." });
  });

  it("preserves escaped reserved delimiters when decoding a complete URI", () => {
    const encoded = "https://example.test/a%2Fb?q=x%26y#z%23w";
    expect(decodeUrl(encoded, "uri")).toEqual({ ok: true, value: encoded });
  });
});

describe("query parsing", () => {
  it.each([
    [
      "https://example.test/path?a=1&a=2&message=hello+world&empty=",
      { a: ["1", "2"], message: "hello world", empty: "" },
    ],
    ["?plus=%2B&encoded=a%26b", { plus: "+", encoded: "a&b" }],
    ["name=Ada", { name: "Ada" }],
    ["https://example.test/path", {}],
    ["", {}],
    ["=blank&x=", { "": "blank", x: "" }],
  ])("parses %s", (input, value) => {
    expect(parseQuery(input)).toEqual({
      ok: true,
      value: JSON.stringify(value, null, 2),
    });
  });
});

describe("query serialization", () => {
  it.each([
    ['{"a":["1","2"],"message":"hello world"}', "a=1&a=2&message=hello+world"],
    ["{}", ""],
    ['{"":"blank","empty":""}', "=blank&empty="],
    ['{"empty":[]}', ""],
  ])("serializes %s", (input, value) => {
    expect(serializeQuery(input)).toEqual({ ok: true, value });
  });

  it.each(["nope", "[]", "null", '{"x":1}', '{"x":true}', '{"x":null}', '{"x":{}}', '{"x":[["a"]]}'])(
    "rejects unsupported JSON %s",
    (input) => {
      expect(serializeQuery(input).ok).toBe(false);
    },
  );

  it("round trips supported values", () => {
    const source = '{"a":["1","2"],"message":"hello world"}';
    const serialized = serializeQuery(source);
    expect(serialized.ok && parseQuery(serialized.value)).toEqual({
      ok: true,
      value: '{\n  "a": [\n    "1",\n    "2"\n  ],\n  "message": "hello world"\n}',
    });
  });
});

describe("Python literal conversion", () => {
  it.each([
    ["{'name': 'Ada', 'active': True, 'missing': None}", { name: "Ada", active: true, missing: null }],
    ["{'items': (1, 2.5, -3), 'nested': [{'ok': False}]}", { items: [1, 2.5, -3], nested: [{ ok: false }] }],
    [String.raw`{'quote': 'it\'s', 'line': "a\nb"}`, { quote: "it's", line: "a\nb" }],
  ])("converts %s to indented JSON", (input, value) => {
    expect(parsePython(input)).toEqual({ ok: true, value: JSON.stringify(value, null, 2) });
  });

  it.each(["", "{'x': unknown}", "__import__('os')", "{1: 'x'}", "{1, 2}", "float('nan')", "[1] trailing"])(
    "rejects unsupported Python %s",
    (input) => expect(parsePython(input).ok).toBe(false),
  );
});

describe("JSON to Python literal conversion", () => {
  it.each([
    ['{"name":"Ada","active":true,"missing":null}', "{'name': 'Ada', 'active': True, 'missing': None}"],
    [
      '{"items":[1,2.5,-3],"nested":[{"ok":false}],"emptyObject":{},"emptyArray":[]}',
      "{'items': [1, 2.5, -3], 'nested': [{'ok': False}], 'emptyObject': {}, 'emptyArray': []}",
    ],
    ['"text"', "'text'"],
    ["true", "True"],
    ["false", "False"],
    ["null", "None"],
    ["1000", "1000"],
  ])("converts %s to Python", (input, output) => {
    expect(serializePython(input)).toEqual({ ok: true, value: output });
  });

  it("escapes Python single-quoted strings", () => {
    const value = 'it\'s \\ "quoted" café\n\t\r\b\f\u0001\ud800';
    expect(serializePython(JSON.stringify(value))).toEqual({
      ok: true,
      value: String.raw`'it\'s \\ "quoted" café\n\t\r\b\f\x01\ud800'`,
    });
  });

  it.each(["", "nope", "{", "undefined", "NaN"])("rejects invalid JSON %s", (input) => {
    expect(serializePython(input)).toEqual({ ok: false, error: "Enter valid JSON." });
  });

  it.each(["{'name': 'Ada', 'active': True, 'missing': None}", "[1, {'nested': [False, 'it\\'s', None]}]"])(
    "round trips supported Python %s",
    (input) => {
      const json = parsePython(input);
      expect(json.ok).toBe(true);
      if (!json.ok) return;
      const python = serializePython(json.value);
      expect(python.ok).toBe(true);
      if (!python.ok) return;
      expect(parsePython(python.value)).toEqual(json);
    },
  );
});
