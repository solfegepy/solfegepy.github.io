import { describe, expect, it } from "vitest";

import { URL_CONVERT_TOOL } from "./webmcp-url";

describe("URL WebMCP conversion", () => {
  it("encodes text using explicitly selected URL modes", async () => {
    await expect(
      URL_CONVERT_TOOL.execute({ value: "hello world", direction: "encode", variant: "rfc3986" }),
    ).resolves.toEqual({
      ok: true,
      value: "hello%20world",
    });
    await expect(
      URL_CONVERT_TOOL.execute({ value: "hello world", direction: "encode", variant: "form" }),
    ).resolves.toEqual({
      ok: true,
      value: "hello+world",
    });
    await expect(
      URL_CONVERT_TOOL.execute({ value: "https://example.com/a b", direction: "encode", variant: "uri" }),
    ).resolves.toEqual({
      ok: true,
      value: "https://example.com/a%20b",
    });
  });

  it("decodes text using explicitly selected URL modes", async () => {
    await expect(
      URL_CONVERT_TOOL.execute({ value: "hello+world", direction: "decode", variant: "form" }),
    ).resolves.toEqual({
      ok: true,
      value: "hello world",
    });
    await expect(
      URL_CONVERT_TOOL.execute({ value: "hello%20world", direction: "decode", variant: "rfc3986" }),
    ).resolves.toEqual({
      ok: true,
      value: "hello world",
    });
  });

  it("rejects invalid arguments and preserves codec errors", async () => {
    for (const input of [
      null,
      {},
      { value: "ok" },
      { value: 42, direction: "encode", variant: "rfc3986" },
      { value: "ok", direction: "invalid", variant: "rfc3986" },
      { value: "ok", direction: "encode", variant: "unknown" },
      { value: "ok", direction: "encode", variant: "rfc3986", extra: true },
      { value: "x".repeat(1_000_001), direction: "encode", variant: "rfc3986" },
    ]) {
      await expect(URL_CONVERT_TOOL.execute(input)).resolves.toEqual({ ok: false, error: "Invalid tool input." });
    }
    await expect(URL_CONVERT_TOOL.execute({ value: "%GG", direction: "decode", variant: "rfc3986" })).resolves.toEqual({
      ok: false,
      error: "Enter valid percent-encoded text.",
    });
  });
});
