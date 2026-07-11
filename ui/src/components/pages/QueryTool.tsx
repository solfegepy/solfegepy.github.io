import { CONVERSION_EXAMPLES } from "../../constants";
import { parseQuery, serializeQuery } from "../../lib/codecs";
import { CodecWorkspace } from "../shared/CodecWorkspace";

const FORMATS = [
  { value: "query", label: "Query string" },
  { value: "json", label: "JSON" },
] as const;

export function QueryTool() {
  return (
    <CodecWorkspace
      name="query"
      inputPlaceholder="Full URL, query string, or JSON object"
      formats={FORMATS}
      forward={parseQuery}
      reverse={serializeQuery}
      examples={CONVERSION_EXAMPLES.query}
    />
  );
}
