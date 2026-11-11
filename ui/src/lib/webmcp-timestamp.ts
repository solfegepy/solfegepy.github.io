import { convertTimestamp, type TimestampFormat } from "./codecs";
import { INVALID_INPUT, isExactObject, type WebMcpTool } from "./webmcp";

const FORMATS = ["ztime", "timestamp-seconds", "timestamp-milliseconds"] as const;

function isTimestampInput(
  value: unknown,
): value is { value: string; source: TimestampFormat; target: TimestampFormat } {
  // Bound untrusted numbers before convertTimestamp parses them as BigInt.
  return (
    isExactObject(value, ["value", "source", "target"]) &&
    typeof value.value === "string" &&
    value.value.length <= 100 &&
    FORMATS.includes(value.source as TimestampFormat) &&
    FORMATS.includes(value.target as TimestampFormat)
  );
}

/**
 * Converts timestamps between explicit UTC Z time and Unix formats in the browser.
 */
export const TIMESTAMP_CONVERT_TOOL = {
  name: "convert_timestamp",
  title: "Convert timestamp",
  description: "Convert UTC Z time and Unix seconds or milliseconds. Select input and output formats explicitly.",
  inputSchema: {
    type: "object",
    properties: {
      value: { type: "string", maxLength: 100 },
      source: { type: "string", enum: FORMATS },
      target: { type: "string", enum: FORMATS },
    },
    required: ["value", "source", "target"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input: unknown) {
    if (!isTimestampInput(input)) return INVALID_INPUT;
    return convertTimestamp(input.value, input.source, input.target);
  },
} as const satisfies WebMcpTool;
