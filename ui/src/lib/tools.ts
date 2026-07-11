export const TOOL_GROUPS = ["Encoding", "Conversion"] as const;
export type ToolGroup = (typeof TOOL_GROUPS)[number];
export type ToolId = "base64" | "url" | "query" | "jwt" | "python" | "timestamp";

export interface ToolDefinition {
  id: ToolId;
  group: ToolGroup;
  label: string;
  route: "/" | "/url" | "/query" | "/jwt" | "/python-json" | "/timestamp";
  title: string;
  description: readonly [summary: string, ...details: string[]];
}

export const TOOLS = [
  {
    id: "base64",
    group: "Encoding",
    label: "Base64",
    route: "/",
    title: "Base64 Decode and Encode",
    description: [
      "Convert plain text, Base64, or Base64url:",
      "Base64: uses +, /, and = padding",
      "Base64url: uses - and _ without padding.",
    ],
  },
  {
    id: "url",
    group: "Encoding",
    label: "URL",
    route: "/url",
    title: "URL Encode and Decode",
    description: [
      "Encode or decode URL values:",
      "RFC 3986 components: encode reserved characters",
      "Full URI: preserves URI structure",
      "Form URL encoded: uses + for spaces",
    ],
  },
  {
    id: "query",
    group: "Encoding",
    label: "Query Params",
    route: "/query",
    title: "Query Parameter Parser and Builder",
    description: ["Convert URL query parameters to JSON or build a query string from JSON."],
  },
  {
    id: "jwt",
    group: "Encoding",
    label: "JWT",
    route: "/jwt",
    title: "JWT Decoder",
    description: ["Decode JWT headers and payloads without signature verification."],
  },
  {
    id: "python",
    group: "Conversion",
    label: "Python → JSON",
    route: "/python-json",
    title: "Python Literal to JSON Converter",
    description: ["Convert dictionaries from Python PDB or print output into JSON."],
  },
  {
    id: "timestamp",
    group: "Conversion",
    label: "Timestamp",
    route: "/timestamp",
    title: "Z Time and Unix Timestamp Converter",
    description: ["Convert strict UTC Z time, Unix seconds, and Unix milliseconds."],
  },
] as const satisfies readonly ToolDefinition[];

/** Returns registry definition for tool ID. */
export function getTool(id: ToolId): (typeof TOOLS)[number] {
  return TOOLS.find((tool) => tool.id === id)!;
}

/** Returns tool description as plain text for metadata. */
export function getToolDescription(tool: ToolDefinition): string {
  return tool.description.join(" ");
}
