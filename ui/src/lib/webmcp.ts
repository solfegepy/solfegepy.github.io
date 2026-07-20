import { decodeBase64, decodeJwt, type Base64Variant } from "./codecs";

interface JsonSchema {
  readonly type: "object";
  readonly properties: Readonly<Record<string, Readonly<Record<string, unknown>>>>;
  readonly required: readonly string[];
  readonly additionalProperties: false;
}

interface WebMcpAnnotations {
  readonly readOnlyHint: true;
  readonly untrustedContentHint: true;
}

export interface WebMcpTool {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly annotations: WebMcpAnnotations;
  readonly execute: (input: unknown) => Promise<unknown>;
}

interface WebMcpRegistrationOptions {
  readonly signal: AbortSignal;
}

interface ModelContext {
  registerTool(tool: WebMcpTool, options: WebMcpRegistrationOptions): unknown;
}

interface DocumentWithModelContext extends Document {
  readonly modelContext?: ModelContext;
}

const INVALID_INPUT = { ok: false, error: "Invalid tool input." } as const;

function isExactObject(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value) as unknown;
  if (prototype !== Object.prototype && prototype !== null) return false;
  const ownKeys = Object.keys(value);
  return ownKeys.length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function isBase64Input(value: unknown): value is { value: string; variant: Base64Variant } {
  return (
    isExactObject(value, ["value", "variant"]) &&
    typeof value.value === "string" &&
    (value.variant === "standard" || value.variant === "url-safe")
  );
}

function isJwtInput(value: unknown): value is { value: string } {
  return isExactObject(value, ["value"]) && typeof value.value === "string";
}

/** WebMCP descriptor for browser-only Base64 decoding. */
export const BASE64_DECODE_TOOL = {
  name: "decode_base64",
  title: "Decode Base64",
  description: "Decode standard Base64 or Base64url text into UTF-8 text.",
  inputSchema: {
    type: "object",
    properties: {
      value: { type: "string", maxLength: 1_000_000 },
      variant: { type: "string", enum: ["standard", "url-safe"] },
    },
    required: ["value", "variant"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input: unknown) {
    if (!isBase64Input(input)) return INVALID_INPUT;
    const result = decodeBase64(input.value, input.variant);
    return result.ok ? { ok: true, value: result.value, variant: input.variant } : result;
  },
} as const satisfies WebMcpTool;

/** WebMCP descriptor for browser-only, unverified JWT decoding. */
export const JWT_DECODE_TOOL = {
  name: "decode_jwt",
  title: "Decode JWT",
  description: "Decode compact JWS JWT header, payload, and signature without signature verification.",
  inputSchema: {
    type: "object",
    properties: { value: { type: "string", maxLength: 100_000 } },
    required: ["value"],
    additionalProperties: false,
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input: unknown) {
    if (!isJwtInput(input)) return INVALID_INPUT;
    const result = decodeJwt(input.value);
    return result.ok
      ? { ok: true, ...result.value, signatureVerified: false as const }
      : { ok: false, error: result.error };
  },
} as const satisfies WebMcpTool;

/** Registers one WebMCP tool when supported and returns idempotent lifecycle cleanup. */
export function registerWebMcpTool(tool: WebMcpTool): () => void {
  const modelContext = (document as DocumentWithModelContext).modelContext;
  if (!modelContext) return () => undefined;

  const controller = new AbortController();
  try {
    void Promise.resolve(modelContext.registerTool(tool, { signal: controller.signal })).catch(() => undefined);
  } catch {
    // Registration denial must not affect human UI.
  }

  let cleaned = false;
  return () => {
    if (cleaned) return;
    cleaned = true;
    controller.abort();
  };
}
