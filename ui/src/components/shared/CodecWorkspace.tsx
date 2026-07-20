import { ArrowRightLeftIcon, CopyIcon } from "lucide-react";
import { type ChangeEvent, useState } from "react";

import type { ConversionResult } from "../../lib/types";
import { ActionButton } from "../ui/ActionButton";
import { InlineStatus } from "../ui/InlineStatus";
import { TextareaField } from "../ui/TextareaField";

interface CodecWorkspaceProps {
  name: string;
  inputPlaceholder: string;
  formats: FormatOptions;
  forward: (input: string) => ConversionResult;
  reverse: (input: string) => ConversionResult;
  convertFormats?: (input: string, source: ChannelFormat, target: ChannelFormat) => ConversionResult;
  allowAnyPair?: boolean;
  examples: {
    forward: string;
    reverse: string;
  };
}

export type ChannelFormat =
  | "plain"
  | "base64"
  | "base64url"
  | "decoded"
  | "rfc3986"
  | "uri"
  | "form"
  | "query"
  | "json"
  | "python"
  | "ztime"
  | "timestamp-seconds"
  | "timestamp-milliseconds";

interface FormatOption {
  value: ChannelFormat;
  label: string;
}

type FormatOptions = readonly [FormatOption, FormatOption, ...FormatOption[]];

interface FormatSelectProps {
  channel: "Top" | "Bottom";
  formats: FormatOptions;
  name: string;
  value: ChannelFormat;
  onChange: (value: ChannelFormat) => void;
}

const SELECT_CLASSES =
  "border-line bg-field text-ink focus:border-primary focus:ring-primary/15 min-h-11 w-full rounded-lg border px-3 py-2 font-mono text-sm font-semibold outline-none transition focus:ring-3";

const isChannelFormat = (value: unknown, formats: FormatOptions): value is ChannelFormat =>
  formats.some((format) => format.value === value);

function FormatSelect({ channel, formats, name, value, onChange }: FormatSelectProps) {
  return (
    <select
      data-testid={`${name}-${channel.toLowerCase()}-format`}
      aria-label={`${channel} channel format`}
      className={SELECT_CLASSES}
      value={value}
      onChange={(event) => {
        if (isChannelFormat(event.target.value, formats)) onChange(event.target.value);
      }}
    >
      {formats.map((format) => (
        <option key={format.value} value={format.value}>
          {format.label}
        </option>
      ))}
    </select>
  );
}

export function CodecWorkspace({
  name,
  inputPlaceholder,
  formats,
  forward,
  reverse,
  convertFormats,
  allowAnyPair = false,
  examples,
}: CodecWorkspaceProps) {
  const [input, setInput] = useState(examples.forward);
  const [output, setOutput] = useState(examples.reverse);
  const [topFormat, setTopFormat] = useState<ChannelFormat>(formats[0].value);
  const [bottomFormat, setBottomFormat] = useState<ChannelFormat>(formats[1].value);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [needsConversion, setNeedsConversion] = useState(false);

  const changeInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
    setNeedsConversion(true);
  };

  // ponytail: main-thread conversion targets ≤1 MB; use Web Workers if larger inputs become necessary.
  const convert = () => {
    const result = convertFormats
      ? convertFormats(input, topFormat, bottomFormat)
      : topFormat === formats[0].value
        ? forward(input)
        : reverse(input);
    setError(result.ok ? "" : result.error);
    setOutput(result.ok ? result.value : "");
    setStatus("");
    setNeedsConversion(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setError("");
      setStatus("Copied");
    } catch {
      setStatus("");
      setError("Clipboard unavailable. Select output and copy manually.");
    }
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
    setStatus("");
    setNeedsConversion(false);
  };

  const swap = () => {
    setInput(output);
    setOutput(input);
    setTopFormat(bottomFormat);
    setBottomFormat(topFormat);
    setError("");
    setStatus("");
    setNeedsConversion(false);
  };

  const changeTopFormat = (format: ChannelFormat) => {
    if (format === topFormat) return;
    setTopFormat(format);
    if (allowAnyPair) {
      if (format === bottomFormat) setBottomFormat(formats.find((option) => option.value !== format)!.value);
    } else if (format !== formats[0].value) setBottomFormat(formats[0].value);
    else if (bottomFormat === formats[0].value) setBottomFormat(formats[1].value);
    setError("");
    setStatus("");
    setNeedsConversion(true);
  };

  const changeBottomFormat = (format: ChannelFormat) => {
    if (format === bottomFormat) return;
    setBottomFormat(format);
    if (allowAnyPair) {
      if (format === topFormat) setTopFormat(formats.find((option) => option.value !== format)!.value);
    } else if (format !== formats[0].value) setTopFormat(formats[0].value);
    else if (topFormat === formats[0].value) setTopFormat(formats[1].value);
    setError("");
    setStatus("");
    setNeedsConversion(true);
  };

  return (
    <section
      data-testid={`${name}-workspace`}
      className="border-line bg-panel min-w-0 space-y-4 rounded-xl border p-3 shadow-sm md:p-5"
      aria-label={`${name} converter`}
    >
      <div data-testid="codec-workspace-channels" className="workspace-grid">
        <div
          data-testid={`${name}-top-channel`}
          className="border-line bg-field grid min-w-0 gap-3 rounded-lg border p-3"
          role="group"
          aria-label="Source"
        >
          <div className="grid gap-2">
            <h2 className="text-ink font-mono text-xs font-semibold tracking-widest uppercase">Source</h2>
            <FormatSelect channel="Top" formats={formats} name={name} value={topFormat} onChange={changeTopFormat} />
          </div>
          <TextareaField
            ariaLabel="Input"
            value={input}
            onChange={changeInput}
            placeholder={inputPlaceholder}
            testId={`${name}-input`}
          />
        </div>
        <div
          data-testid="codec-workspace-actions"
          className="workspace-actions flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Conversion actions"
        >
          <button
            data-testid="codec-workspace-swap"
            type="button"
            aria-label="Swap"
            title="Swap input and output"
            onClick={swap}
            className="icon-button bg-primary rotate-90 rounded-full md:rotate-0"
          >
            <ArrowRightLeftIcon aria-hidden="true" size={19} strokeWidth={1.8} />
          </button>
          <ActionButton tone="primary" onClick={convert} disabled={!needsConversion}>
            Convert
          </ActionButton>
          <ActionButton onClick={clear}>Clear</ActionButton>
        </div>
        <div
          data-testid={`${name}-bottom-channel`}
          className="border-line bg-field grid min-w-0 gap-3 rounded-lg border p-3"
          role="group"
          aria-label="Target"
        >
          <div className="grid gap-2">
            <h2 className="text-ink font-mono text-xs font-semibold tracking-widest uppercase">Target</h2>
            <FormatSelect
              channel="Bottom"
              formats={formats}
              name={name}
              value={bottomFormat}
              onChange={changeBottomFormat}
            />
          </div>
          <div className="relative min-w-0">
            <TextareaField
              ariaLabel="Output"
              value={output}
              placeholder="Conversion appears here"
              disabled
              testId={`${name}-output`}
              className="pr-16"
            />
            <button
              data-testid="codec-workspace-copy"
              type="button"
              aria-label="Copy output"
              title="Copy output"
              onClick={copy}
              disabled={!output}
              className="text-muted hover:text-primary focus-visible:outline-primary disabled:bg-paper absolute top-3 right-3 inline-flex size-11 appearance-none items-center justify-center border-0 bg-transparent p-0 transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
            >
              <CopyIcon aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </div>
      <InlineStatus error={error} status={status} />
    </section>
  );
}
