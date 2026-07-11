import { CONVERSION_EXAMPLES } from "../../constants";
import { decodeBase64, encodeBase64, type Base64Variant } from "../../lib/codecs";
import { CodecWorkspace, type ChannelFormat } from "../shared/CodecWorkspace";

const FORMATS = [
  { value: "plain", label: "Plain text" },
  { value: "base64", label: "Base64 encoded" },
  { value: "base64url", label: "Base64url encoded" },
] as const;

const variant = (format: ChannelFormat): Base64Variant => (format === "base64url" ? "url-safe" : "standard");

export function Base64Tool() {
  return (
    <CodecWorkspace
      name="base64"
      inputPlaceholder="Text or Base64 data"
      formats={FORMATS}
      forward={(input) => encodeBase64(input, "standard")}
      reverse={(input) => decodeBase64(input, "standard")}
      convertFormats={(input, source, target) =>
        source === "plain" ? encodeBase64(input, variant(target)) : decodeBase64(input, variant(source))
      }
      examples={CONVERSION_EXAMPLES.base64}
    />
  );
}
