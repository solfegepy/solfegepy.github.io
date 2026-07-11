import { useState, useSyncExternalStore } from "react";

import { CONVERSION_EXAMPLES } from "../../constants";
import { convertTimestamp, type TimestampFormat } from "../../lib/codecs";
import { CodecWorkspace, type ChannelFormat } from "../shared/CodecWorkspace";

const FORMATS = [
  { value: "ztime", label: "Z time" },
  { value: "timestamp-seconds", label: "Unix seconds" },
  { value: "timestamp-milliseconds", label: "Unix milliseconds" },
] as const;

const timestampFormat = (format: ChannelFormat): TimestampFormat => format as TimestampFormat;
const EMPTY_EXAMPLES = { forward: "", reverse: "" };
const subscribe = () => () => undefined;
const getServerExamples = () => EMPTY_EXAMPLES;

export function TimestampTool() {
  const [pageLoadExamples] = useState(() =>
    typeof window === "undefined" ? EMPTY_EXAMPLES : CONVERSION_EXAMPLES.timestamp(),
  );
  const examples = useSyncExternalStore(subscribe, () => pageLoadExamples, getServerExamples);

  return (
    <CodecWorkspace
      key={examples.forward}
      name="timestamp"
      inputPlaceholder="UTC Z time or Unix timestamp"
      formats={FORMATS}
      forward={(input) => convertTimestamp(input, "ztime", "timestamp-seconds")}
      reverse={(input) => convertTimestamp(input, "timestamp-seconds", "ztime")}
      convertFormats={(input, source, target) =>
        convertTimestamp(input, timestampFormat(source), timestampFormat(target))
      }
      allowAnyPair
      examples={examples}
    />
  );
}
