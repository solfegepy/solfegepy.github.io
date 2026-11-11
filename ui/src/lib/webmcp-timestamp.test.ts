import { describe, expect, it } from "vitest";

import { TIMESTAMP_CONVERT_TOOL } from "./webmcp-timestamp";

describe("timestamp WebMCP conversion", () => {
  it("converts explicit Unix seconds to UTC Z time", async () => {
    await expect(
      TIMESTAMP_CONVERT_TOOL.execute({
        value: "1700000000",
        source: "timestamp-seconds",
        target: "ztime",
      }),
    ).resolves.toEqual({ ok: true, value: "2023-11-14T22:13:20.000Z" });
  });

  it("rejects invalid or oversized tool arguments", async () => {
    for (const input of [
      null,
      {},
      { value: "0", source: "timestamp-seconds", target: "ztime", extra: true },
      { value: "0", source: "guess", target: "ztime" },
      { value: "9".repeat(101), source: "timestamp-seconds", target: "ztime" },
    ]) {
      await expect(TIMESTAMP_CONVERT_TOOL.execute(input)).resolves.toEqual({
        ok: false,
        error: "Invalid tool input.",
      });
    }
  });

  it("returns conversion errors for invalid timestamps", async () => {
    await expect(
      TIMESTAMP_CONVERT_TOOL.execute({ value: "not-a-time", source: "ztime", target: "timestamp-seconds" }),
    ).resolves.toEqual({ ok: false, error: "Enter a valid UTC Z time from 1970 through 9999." });
  });
});
