import { CopyIcon } from "lucide-react";
import { useState, type ChangeEvent } from "react";

import { decodeJwt } from "../../lib/codecs";
import type { DecodedJwt } from "../../lib/types";
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
  return (
    <section
      data-testid={`jwt-${id}-group`}
      className="border-line bg-panel grid min-w-0 gap-2 rounded-xl border p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-ink font-display text-xl font-bold">{label}</h2>
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
        className="min-h-32 break-all whitespace-pre-wrap md:min-h-40"
      />
    </section>
  );
}

export function JwtTool() {
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
    <section
      data-testid="jwt-tool"
      aria-label="JWT decoder"
      className="border-line bg-panel min-w-0 space-y-5 rounded-xl border p-3 shadow-sm md:p-5"
    >
      <TextareaField
        ariaLabel="JWT token"
        value={input}
        onChange={changeInput}
        placeholder="Paste compact JWT"
        testId="jwt-input"
        className="min-h-40 break-all md:min-h-48"
      />
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
        className="border-accent/40 bg-accent/10 text-accent-strong rounded-lg border px-4 py-3 font-medium"
      >
        <p data-testid="jwt-warning">Decoded only. Signature not verified.</p>
      </aside>
      <JwtOutputField label="Header" value={output.header} onCopy={() => copy("Header", output.header)} />
      <JwtOutputField label="Payload" value={output.payload} onCopy={() => copy("Payload", output.payload)} />
      <JwtOutputField label="Signature" value={output.signature} onCopy={() => copy("Signature", output.signature)} />
      <InlineStatus error={error} status={status} />
    </section>
  );
}
