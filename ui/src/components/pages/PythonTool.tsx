import { CONVERSION_EXAMPLES } from "../../constants";
import { parsePython, serializePython } from "../../lib/codecs";
import { CodecWorkspace } from "../shared/CodecWorkspace";

const FORMATS = [
  { value: "python", label: "Python literal" },
  { value: "json", label: "JSON" },
] as const;

export function PythonTool() {
  return (
    <CodecWorkspace
      name="python"
      inputPlaceholder="Python literal or JSON"
      formats={FORMATS}
      forward={parsePython}
      reverse={serializePython}
      examples={CONVERSION_EXAMPLES.python}
    />
  );
}
