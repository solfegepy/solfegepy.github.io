import {
  BracesIcon,
  CircleAlertIcon,
  CopyIcon,
  EraserIcon,
  FileJsonIcon,
  FingerprintIcon,
  KeyRoundIcon,
  ScanTextIcon,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";

import { decodeJwt } from "../../lib/codecs";
import type { DecodedJwt } from "../../lib/types";
import { JWT_DECODE_TOOL, registerWebMcpTool } from "../../lib/webmcp";
import { ActionButton } from "../ui/ActionButton";
import { InlineStatus } from "../ui/InlineStatus";
import { TextareaField } from "../ui/TextareaField";

const SYNTHETIC_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlfQ.c3ludGhldGljLXNpZ25hdHVyZQ";

interface JwtOutput {
  header: string;
  payload: string;
  signature: string;
}

interface JwtOutputFieldProps {
  label: "Header" | "Payload" | "Signature";
  value: string;
  onCopy: () => void;
}

const OUTPUT_ICONS = {
  Header: BracesIcon,
  Payload: FileJsonIcon,
  Signature: FingerprintIcon,
} as const satisfies Record<JwtOutputFieldProps["label"], LucideIcon>;
const OUTPUT_HEADING_CLASSES = "text-ink font-display text-subheading flex items-center gap-2 font-semibold";
const JWT_ICON_CLASSES = "text-tool-jwt";

const formatOutput = ({ header, payload, signature }: DecodedJwt): JwtOutput => ({
  header: JSON.stringify(header, null, 2),
  payload: JSON.stringify(payload, null, 2),
  signature,
});

function createSyntheticOutput(): JwtOutput {
  const result = decodeJwt(SYNTHETIC_JWT);
  if (!result.ok) throw new Error("Invalid synthetic JWT fixture");
  return formatOutput(result.value);
}

const EMPTY_OUTPUT: JwtOutput = { header: "", payload: "", signature: "" };

function JwtOutputField({ label, value, onCopy }: JwtOutputFieldProps) {
  const id = label.toLowerCase();
  const compact = label === "Signature";
  const Icon = OUTPUT_ICONS[label];
  return (
    <section
      data-testid={`jwt-${id}-group`}
      className={`border-line bg-panel-target rounded-surface grid min-w-0 overflow-hidden border ${compact ? "md:col-span-2" : ""}`}
    >
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2">
        <h2 className={OUTPUT_HEADING_CLASSES}>
          <Icon aria-hidden="true" className={JWT_ICON_CLASSES} size={18} strokeWidth={1.8} />
          {label}
        </h2>
        <button
          data-testid={`jwt-copy-${id}`}
          type="button"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
          onClick={onCopy}
          disabled={!value}
          className="text-muted hover:text-primary focus-visible:outline-primary disabled:bg-paper rounded-control inline-flex size-11 shrink-0 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
        >
          <CopyIcon aria-hidden="true" size={17} />
        </button>
      </div>
      <TextareaField
        ariaLabel={`${label} output`}
        value={value}
        placeholder={`${label} appears here`}
        readOnly
        testId={`jwt-${id}-output`}
        className="break-all whitespace-pre-wrap"
        variant="editor"
        height={compact ? "compact" : "medium"}
      />
    </section>
  );
}

export function JwtTool() {
  useEffect(() => registerWebMcpTool(JWT_DECODE_TOOL), []);

  const [input, setInput] = useState(SYNTHETIC_JWT);
  const [output, setOutput] = useState<JwtOutput>(createSyntheticOutput);
  const [lastAttemptInput, setLastAttemptInput] = useState(SYNTHETIC_JWT);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const changeInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    setError("");
    setStatus("");
  };

  const decode = () => {
    const result = decodeJwt(input);
    setLastAttemptInput(input);
    setStatus("");
    setError(result.ok ? "" : result.error);
    setOutput(result.ok ? formatOutput(result.value) : EMPTY_OUTPUT);
  };

  const clear = () => {
    setInput("");
    setOutput(EMPTY_OUTPUT);
    setLastAttemptInput("");
    setError("");
    setStatus("");
  };

  const copy = async (label: JwtOutputFieldProps["label"], value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setError("");
      setStatus(`${label} copied.`);
    } catch {
      setStatus("");
      setError("Copy failed.");
    }
  };

  return (
    <section data-testid="jwt-tool" aria-label="JWT decoder" className="min-w-0 space-y-6">
      <div className="border-line bg-field focus-within:border-primary focus-within:ring-primary/15 rounded-surface overflow-hidden border transition-colors focus-within:ring-3">
        <div className="border-line flex min-h-12 items-center border-b px-4">
          <h2 className={OUTPUT_HEADING_CLASSES}>
            <KeyRoundIcon aria-hidden="true" className={JWT_ICON_CLASSES} size={18} strokeWidth={1.8} />
            Token
          </h2>
        </div>
        <TextareaField
          ariaLabel="JWT token"
          value={input}
          onChange={changeInput}
          placeholder="Paste compact JWT"
          testId="jwt-input"
          className="break-all"
          variant="editor"
          height="medium"
        />
        <div data-testid="jwt-actions" className="border-line flex flex-wrap gap-2 border-t p-3">
          <ActionButton
            data-testid="jwt-decode"
            title="Decode"
            tone="primary"
            onClick={decode}
            disabled={!input.trim() || input === lastAttemptInput}
          >
            <ScanTextIcon aria-hidden="true" size={17} strokeWidth={1.8} />
            Decode
          </ActionButton>
          <ActionButton data-testid="jwt-clear" title="Clear" onClick={clear}>
            <EraserIcon aria-hidden="true" size={17} strokeWidth={1.8} />
            Clear
          </ActionButton>
        </div>
      </div>
      <aside
        data-testid="jwt-guidance"
        className="border-warning bg-warning-soft text-warning rounded-control text-control flex items-start gap-2 border px-4 py-2 font-medium"
      >
        <CircleAlertIcon aria-hidden="true" className="mt-1 shrink-0" size={17} />
        <p data-testid="jwt-warning">Decoded only. Signature not verified.</p>
      </aside>
      <div className="grid gap-4 md:grid-cols-2">
        <JwtOutputField label="Header" value={output.header} onCopy={() => copy("Header", output.header)} />
        <JwtOutputField label="Payload" value={output.payload} onCopy={() => copy("Payload", output.payload)} />
        <JwtOutputField label="Signature" value={output.signature} onCopy={() => copy("Signature", output.signature)} />
      </div>
      <InlineStatus error={error} status={status} />
    </section>
  );
}
