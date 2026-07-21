import { CopyIcon } from "lucide-react";
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
  return (
    <section
      data-testid={`jwt-${id}-group`}
      className={`border-line bg-field grid min-w-0 overflow-hidden rounded-xl border ${compact ? "md:col-span-2" : ""}`}
    >
      <div className="border-line flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2">
        <h2 className="text-ink font-display text-lg font-bold">{label}</h2>
        <button
          data-testid={`jwt-copy-${id}`}
          type="button"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
          onClick={onCopy}
          disabled={!value}
          className="text-muted hover:text-primary focus-visible:outline-primary disabled:bg-paper inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-mono text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
        >
          <CopyIcon aria-hidden="true" size={17} />
          Copy
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
    <section data-testid="jwt-tool" aria-label="JWT decoder" className="min-w-0 space-y-4">
      <div className="border-line bg-field overflow-hidden rounded-xl border">
        <div className="border-line flex min-h-12 items-center border-b px-4">
          <h2 className="text-ink font-display text-lg font-bold">Token</h2>
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
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div data-testid="jwt-actions" className="flex flex-wrap gap-2">
          <ActionButton
            data-testid="jwt-decode"
            tone="primary"
            onClick={decode}
            disabled={!input.trim() || input === lastAttemptInput}
          >
            Decode
          </ActionButton>
          <ActionButton data-testid="jwt-clear" onClick={clear}>
            Clear
          </ActionButton>
        </div>
        <aside
          data-testid="jwt-guidance"
          className="border-accent bg-danger-soft text-accent-strong rounded-lg border px-4 py-2 text-sm font-medium"
        >
          <p data-testid="jwt-warning">Decoded only. Signature not verified.</p>
        </aside>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <JwtOutputField label="Header" value={output.header} onCopy={() => copy("Header", output.header)} />
        <JwtOutputField label="Payload" value={output.payload} onCopy={() => copy("Payload", output.payload)} />
        <JwtOutputField label="Signature" value={output.signature} onCopy={() => copy("Signature", output.signature)} />
      </div>
      <InlineStatus error={error} status={status} />
    </section>
  );
}
