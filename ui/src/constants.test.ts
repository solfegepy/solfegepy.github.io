import { describe, expect, it, vi } from "vitest";

import { CONVERSION_EXAMPLES } from "./constants";

describe("conversion examples", () => {
  it("creates Timestamp example from current whole second", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_784_496_902_987);

    expect(CONVERSION_EXAMPLES.timestamp()).toEqual({
      forward: "2026-07-19T21:35:02Z",
      reverse: "1784496902",
    });
  });
});
