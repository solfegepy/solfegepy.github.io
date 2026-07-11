import { describe, expect, it } from "vitest";

import { requirePositiveInteger } from "./config-env";

describe("requirePositiveInteger", () => {
  it("returns a positive integer", () => {
    expect(requirePositiveInteger({ UI_INT_PORT: "3000" }, "UI_INT_PORT")).toBe(3000);
  });

  it("names a missing key", () => {
    expect(() => requirePositiveInteger({}, "UI_INT_PORT")).toThrow("Missing UI_INT_PORT");
  });

  it.each(["", "0", "-1", "1.5", "port"])("names an invalid key for %j", (value) => {
    expect(() => requirePositiveInteger({ UI_TEST_INT_PORT: value }, "UI_TEST_INT_PORT")).toThrow(
      "Invalid UI_TEST_INT_PORT",
    );
  });
});
