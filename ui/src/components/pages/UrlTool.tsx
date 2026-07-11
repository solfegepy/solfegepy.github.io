import { CONVERSION_EXAMPLES } from "../../constants";
import { decodeUrl, encodeUrl, type UrlEncodingVariant } from "../../lib/codecs";
import { CodecWorkspace, type ChannelFormat } from "../shared/CodecWorkspace";

const ENCODED_FORMATS = [
  { value: "rfc3986", label: "RFC 3986 component" },
  { value: "uri", label: "Full URI" },
  { value: "form", label: "Form URL encoded" },
] as const satisfies readonly { value: UrlEncodingVariant; label: string }[];

const FORMATS = [{ value: "decoded", label: "Plain text" }, ...ENCODED_FORMATS] as const;

const isUrlEncodingVariant = (format: ChannelFormat): format is UrlEncodingVariant =>
  ENCODED_FORMATS.some(({ value }) => value === format);

function convertUrl(input: string, source: ChannelFormat, target: ChannelFormat) {
  if (source === "decoded" && isUrlEncodingVariant(target)) return encodeUrl(input, target);
  if (target === "decoded" && isUrlEncodingVariant(source)) return decodeUrl(input, source);
  return { ok: false as const, error: "Choose plain text and one URL encoding." };
}

export function UrlTool() {
  return (
    <CodecWorkspace
      name="url"
      inputPlaceholder="Text or percent-encoded data"
      formats={FORMATS}
      forward={(input) => encodeUrl(input, "rfc3986")}
      reverse={(input) => decodeUrl(input, "rfc3986")}
      convertFormats={convertUrl}
      examples={CONVERSION_EXAMPLES.url}
    />
  );
}
