import { afterEach, describe, expect, it, vi } from "vitest";

import { BASE64_DECODE_TOOL, JWT_DECODE_TOOL, registerWebMcpTool, type WebMcpTool } from "./webmcp";

const toBase64Url = (value: string): string =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

const jwt = (header: string, payload: string, signature = "c2ln"): string =>
  `${toBase64Url(header)}.${toBase64Url(payload)}.${signature}`;

function setModelContext(value?: {
  registerTool: (tool: WebMcpTool, options: { signal: AbortSignal }) => unknown;
}): void {
  Object.defineProperty(document, "modelContext", { configurable: true, value });
}

afterEach(() => {
  Reflect.deleteProperty(document, "modelContext");
  vi.restoreAllMocks();
});

describe("WebMCP descriptors", () => {
  it("defines exact names, titles, descriptions, and annotations", () => {
    expect(BASE64_DECODE_TOOL).toMatchObject({
      name: "decode_base64",
      title: "Decode Base64",
      description: "Decode standard Base64 or Base64url text into UTF-8 text.",
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    });
    expect(JWT_DECODE_TOOL).toMatchObject({
      name: "decode_jwt",
      title: "Decode JWT",
      description: "Decode compact JWS JWT header, payload, and signature without signature verification.",
      annotations: { readOnlyHint: true, untrustedContentHint: true },
    });
  });

  it("defines strict Base64 and JWT input schemas", () => {
    expect(BASE64_DECODE_TOOL.inputSchema).toEqual({
      type: "object",
      properties: {
        value: { type: "string", maxLength: 1_000_000 },
        variant: { type: "string", enum: ["standard", "url-safe"] },
      },
      required: ["value", "variant"],
      additionalProperties: false,
    });
    expect(JWT_DECODE_TOOL.inputSchema).toEqual({
      type: "object",
      properties: { value: { type: "string", maxLength: 100_000 } },
      required: ["value"],
      additionalProperties: false,
    });
  });
});

describe("Base64 WebMCP execution", () => {
  it.each([
    [{ value: "aGVsbG8=", variant: "standard" }, "hello"],
    [{ value: "w7_Dvw", variant: "url-safe" }, "ÿÿ"],
    [{ value: "w7_Dvw==", variant: "url-safe" }, "ÿÿ"],
    [{ value: "Y2Fmw6kg8J+OtQ==", variant: "standard" }, "café 🎵"],
    [{ value: " Y2Fm\nw6kg8J+OtQ== ", variant: "standard" }, "café 🎵"],
    [{ value: "", variant: "standard" }, ""],
  ] as const)("decodes valid input %#", async (input, value) => {
    await expect(BASE64_DECODE_TOOL.execute(input)).resolves.toEqual({ ok: true, value, variant: input.variant });
  });

  it.each([
    [{ value: "***", variant: "standard" }, "Enter valid Base64."],
    [{ value: "/w==", variant: "standard" }, "Decoded bytes are not valid UTF-8."],
    [{ value: "A".repeat(1_000_001), variant: "standard" }, "Base64 is too large. Maximum size is 1000000 characters."],
  ] as const)("returns exact codec failure %#", async (input, error) => {
    await expect(BASE64_DECODE_TOOL.execute(input)).resolves.toEqual({ ok: false, error });
  });

  it.each([
    null,
    [],
    {},
    { value: "aGVsbG8=" },
    { variant: "standard" },
    { value: 42, variant: "standard" },
    { value: "aGVsbG8=", variant: 42 },
    { value: "aGVsbG8=", variant: "other" },
    { value: "aGVsbG8=", variant: "standard", extra: true },
  ])("rejects invalid runtime arguments %#", async (input) => {
    await expect(BASE64_DECODE_TOOL.execute(input)).resolves.toEqual({ ok: false, error: "Invalid tool input." });
  });
});

describe("JWT WebMCP execution", () => {
  it("returns decoded data with explicit unverified status", async () => {
    const token = jwt('{"alg":"HS256","typ":"JWT"}', '{"sub":"123","role":"admin"}', "c2ln");

    await expect(JWT_DECODE_TOOL.execute({ value: token })).resolves.toEqual({
      ok: true,
      header: { alg: "HS256", typ: "JWT" },
      payload: { sub: "123", role: "admin" },
      signature: "c2ln",
      signatureVerified: false,
    });
  });

  it.each([
    ["x".repeat(100_001), "JWT is too large. Maximum size is 100000 characters."],
    [" ", "Enter a JWT."],
    ["a.b", "JWT must contain three segments."],
    [".e30.c2ln", "JWT header must be valid unpadded Base64url."],
    ["e30..c2ln", "JWT payload must be valid unpadded Base64url."],
    ["e30.e30.c2ln=", "JWT signature must be valid unpadded Base64url."],
    [`_w.${toBase64Url("{}")}._w`, "JWT header must decode to valid UTF-8."],
    [`${toBase64Url("{}")}._w._w`, "JWT payload must decode to valid UTF-8."],
    [`${toBase64Url("no")}.${toBase64Url("{}")}._w`, "JWT header must contain valid JSON."],
    [`${toBase64Url("{}")} .${toBase64Url("no")}._w`.replace(" ", ""), "JWT payload must contain valid JSON."],
    [`${toBase64Url("null")}.${toBase64Url("{}")}._w`, "JWT header must contain a JSON object."],
    [`${toBase64Url("{}")} .${toBase64Url("[]")}._w`.replace(" ", ""), "JWT payload must contain a JSON object."],
    [jwt('{"alg":"HS256"}', "{}", ""), 'Empty signature requires alg "none".'],
  ])("preserves codec failure %#", async (value, error) => {
    await expect(JWT_DECODE_TOOL.execute({ value })).resolves.toEqual({ ok: false, error });
  });

  it.each([null, [], {}, { value: 42 }, { value: "a.b.c", extra: true }])(
    "rejects invalid runtime arguments %#",
    async (input) => {
      await expect(JWT_DECODE_TOOL.execute(input)).resolves.toEqual({ ok: false, error: "Invalid tool input." });
    },
  );

  it("returns hostile claims as inert data", async () => {
    const marker = "<script>globalThis.webMcpExecuted=true</script>";
    const token = jwt('{"alg":"HS256"}', JSON.stringify({ marker, __proto__: null }));
    const result = await JWT_DECODE_TOOL.execute({ value: token });

    expect(result).toMatchObject({ ok: true, payload: { marker } });
    expect((globalThis as typeof globalThis & { webMcpExecuted?: boolean }).webMcpExecuted).toBeUndefined();
  });
});

describe("WebMCP registration", () => {
  it("returns no-op cleanup without model context", () => {
    const cleanup = registerWebMcpTool(BASE64_DECODE_TOOL);

    expect(() => cleanup()).not.toThrow();
  });

  it("passes an AbortSignal and aborts once", () => {
    const registerTool = vi.fn();
    setModelContext({ registerTool });

    const cleanup = registerWebMcpTool(BASE64_DECODE_TOOL);
    expect(registerTool).toHaveBeenCalledOnce();
    expect(registerTool).toHaveBeenCalledWith(BASE64_DECODE_TOOL, { signal: expect.any(AbortSignal) });
    const signal = registerTool.mock.calls[0]?.[1].signal;
    expect(signal?.aborted).toBe(false);
    const abort = vi.fn();
    signal?.addEventListener("abort", abort);

    cleanup();
    cleanup();
    expect(signal?.aborted).toBe(true);
    expect(abort).toHaveBeenCalledOnce();
  });

  it("handles synchronous throws and asynchronous rejection", async () => {
    setModelContext({ registerTool: () => Promise.reject(new Error("denied")) });
    expect(() => registerWebMcpTool(BASE64_DECODE_TOOL)).not.toThrow();
    await Promise.resolve();

    setModelContext({
      registerTool: () => {
        throw new Error("denied");
      },
    });
    expect(() => registerWebMcpTool(JWT_DECODE_TOOL)).not.toThrow();
  });
});
