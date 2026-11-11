import { decodeUrl, encodeUrl, type UrlEncodingVariant } from "./codecs";
import { INVALID_INPUT, isExactObject, type WebMcpTool } from "./webmcp";

const DIRECTIONS = ["encode", "decode"] as const;
const VARIANTS = ["rfc3986", "uri", "form"] as const;
type UrlDirection = (typeof DIRECTIONS)[number];
const MAX_URL_INPUT_LENGTH = 1_000_000;

function isUrlInput(value: unknown): value is { value: string; direction: UrlDirection; variant: UrlEncodingVariant } {
  // Model-provided arguments are untrusted, and this size cap prevents excessive browser allocation.
  if (!isExactObject(value, ["value", "direction", "variant"])) return false;
  return (
    typeof value.value === "string" &&
    value.value.length <= MAX_URL_INPUT_LENGTH &&
    DIRECTIONS.includes(value.direction as UrlDirection) &&
    VARIANTS.includes(value.variant as UrlEncodingVariant)
  );
}

/**
 * WebMCP descriptor for browser-only URL encoding and decoding.
 */
export const URL_CONVERT_TOOL = {
  name: "convert_url",
  title: "Encode or decode URL text",
  description: "Encode or decode URL text in RFC 3986 component, full URI, or form mode. Input stays in this browser.",
  inputSchema: {
    type: "object",
    properties: {
      value: { type: "string", maxLength: MAX_URL_INPUT_LENGTH },
      direction: { type: "string", enum: DIRECTIONS },
      variant: { type: "string", enum: VARIANTS },
    },
    required: ["value", "direction", "variant"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input: unknown) {
    if (!isUrlInput(input)) return INVALID_INPUT;
    return input.direction === "encode" ? encodeUrl(input.value, input.variant) : decodeUrl(input.value, input.variant);
  },
} as const satisfies WebMcpTool;
