export const TOOL_GROUPS = ["Encoding", "Conversion"] as const;
export type ToolGroup = (typeof TOOL_GROUPS)[number];
export type ToolId = "base64" | "url" | "query" | "jwt" | "python" | "timestamp" | "tailwind";

export interface ToolDefinition {
  id: ToolId;
  group: ToolGroup;
  label: string;
  route: "/" | "/url/" | "/query/" | "/jwt/" | "/python-json/" | "/timestamp/" | "/tailwind/";
  title: string;
  description: readonly [summary: string, ...details: string[]];
  /** Search snippet for the page `<meta name="description">`; keep it under 160 characters. */
  metaDescription: string;
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
    metaDescription:
      "Free Base64 encoder and decoder. Convert UTF-8 text to and from standard Base64 or unpadded Base64url in your browser.",
  },
  {
    id: "url",
    group: "Encoding",
    label: "URL",
    route: "/url/",
    title: "URL Encode and Decode",
    description: [
      "Encode or decode URL values:",
      "RFC 3986 components: encode reserved characters",
      "Full URI: preserves URI structure",
      "Form URL encoded: uses + for spaces",
    ],
    metaDescription:
      "Free URL encoder and decoder for RFC 3986 components, full URIs, and form URL-encoded values, with clear + and %20 handling.",
  },
  {
    id: "query",
    group: "Conversion",
    label: "Query Params",
    route: "/query/",
    title: "Query Parameter Editor",
    description: ["Convert URL query parameters to JSON or build a query string from JSON."],
    metaDescription:
      "Parse URL query parameters into JSON or build a query string from JSON. Repeated names become arrays and + decodes to a space.",
  },
  {
    id: "jwt",
    group: "Encoding",
    label: "JWT",
    route: "/jwt/",
    title: "JWT Decoder",
    description: ["Decode JWT headers and payloads without signature verification."],
    metaDescription:
      "Decode JWT headers and payloads into formatted JSON to inspect token claims. Decoding only: signatures are not verified.",
  },
  {
    id: "python",
    group: "Conversion",
    label: "Python → JSON",
    route: "/python-json/",
    title: "Python Literal to JSON Converter",
    description: ["Convert dictionaries from Python PDB or print output into JSON."],
    metaDescription:
      "Convert Python dict and list literals from print() or PDB output into JSON and back. Handles True, False, None, and tuples without eval.",
  },
  {
    id: "timestamp",
    group: "Conversion",
    label: "Timestamp",
    route: "/timestamp/",
    title: "Z Time and Unix Timestamp Converter",
    description: ["Convert strict UTC Z time, Unix seconds, and Unix milliseconds."],
    metaDescription:
      "Convert Unix timestamps in seconds or milliseconds to UTC Z time (ISO 8601) and back, with explicit format selection instead of guessing.",
  },
  {
    id: "tailwind",
    group: "Conversion",
    label: "Tailwind colors",
    route: "/tailwind/",
    title: "Tailwind Color Converter",
    description: ["Browse Tailwind CSS colors and convert a hex color to the closest Tailwind token."],
    metaDescription:
      "Browse Tailwind CSS 4 colors and convert any hex color to the closest Tailwind token using OKLab distance.",
  },
] as const satisfies readonly ToolDefinition[];

/** Returns registry definition for tool ID. */
export function getTool(id: ToolId): (typeof TOOLS)[number] {
  return TOOLS.find((tool) => tool.id === id)!;
}
