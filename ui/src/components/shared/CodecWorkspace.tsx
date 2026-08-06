import { ArrowRightIcon, ArrowRightLeftIcon, CopyIcon, EraserIcon, PlayIcon } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useState } from "react";

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
  "border-line bg-field text-ink focus:border-primary focus:ring-primary/15 min-h-11 w-full rounded-control border px-3 py-2 font-mono text-sm font-semibold outline-none transition-colors focus:ring-3 md:w-auto md:min-w-44";
const CHANNEL_HEADER_CLASSES =
  "border-line flex flex-col gap-2 border-b p-3 md:flex-row md:items-center md:justify-between";
const CHANNEL_HEADING_GROUP_CLASSES = "flex items-center gap-2";
const CHANNEL_HEADING_CLASSES = "text-ink text-base font-bold";
const CHANNEL_STATE_CLASSES = "border-line bg-panel text-muted rounded-full border px-2 py-0.5 font-mono text-xs";

const isChannelFormat = (value: unknown, formats: FormatOptions): value is ChannelFormat =>
  formats.some((format) => format.value === value);

function FormatSelect({ channel, formats, name, value, onChange }: FormatSelectProps) {
  return (
    <select
      data-testid={`${name}-${channel.toLowerCase()}-format`}
      aria-label={channel === "Top" ? "Source format" : "Target format"}
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

interface EditorMetadataProps {
  name: string;
  channel: "source" | "target";
  value: string;
}

function EditorMetadata({ name, channel, value }: EditorMetadataProps) {
  const lines = value.length === 0 ? 0 : value.split("\n").length;
  const bytes = new TextEncoder().encode(value).byteLength;
  return (
    <footer
      data-testid={`${name}-${channel}-metadata`}
      className="border-line text-muted flex min-h-10 flex-wrap items-center gap-x-5 gap-y-1 border-t px-4 py-2 font-mono text-xs"
    >
      <span>{`${lines} ${lines === 1 ? "line" : "lines"}`}</span>
      <span>{`${bytes} ${bytes === 1 ? "byte" : "bytes"}`}</span>
      <span>UTF-8</span>
    </footer>
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

  const handleShortcut = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && needsConversion) {
      event.preventDefault();
      convert();
    }
  };

  return (
    <section
      data-testid={`${name}-workspace`}
      className="workspace-container min-w-0 space-y-3"
      aria-label={`${name} converter`}
      onKeyDown={handleShortcut}
    >
      <div data-testid="codec-workspace-channels" className="workspace-grid">
        <div
          data-testid={`${name}-top-channel`}
          className="border-line bg-field focus-within:border-primary focus-within:ring-primary/15 rounded-surface grid min-w-0 overflow-hidden border transition-colors focus-within:ring-3"
          role="group"
          aria-label="Source"
        >
          <div className={CHANNEL_HEADER_CLASSES}>
            <div className={CHANNEL_HEADING_GROUP_CLASSES}>
              <h2 className={CHANNEL_HEADING_CLASSES}>Source</h2>
              <span className={CHANNEL_STATE_CLASSES}>Editable</span>
            </div>
            <FormatSelect channel="Top" formats={formats} name={name} value={topFormat} onChange={changeTopFormat} />
          </div>
          <TextareaField
            ariaLabel="Source input"
            value={input}
            onChange={changeInput}
            placeholder={inputPlaceholder}
            testId={`${name}-input`}
            variant="editor"
          />
          <EditorMetadata name={name} channel="source" value={input} />
        </div>
        <div
          data-testid="codec-workspace-actions"
          className="workspace-actions flex flex-wrap items-center justify-center gap-2"
          role="group"
          aria-label="Conversion actions"
        >
          <span className="conversion-node" aria-hidden="true">
            <ArrowRightIcon size={18} strokeWidth={2} />
          </span>
          <button
            data-testid="codec-workspace-swap"
            type="button"
            aria-label="Swap source and target"
            title="Swap source and target"
            onClick={swap}
            className="icon-button"
          >
            <ArrowRightLeftIcon aria-hidden="true" size={19} strokeWidth={1.8} />
          </button>
          <ActionButton title="Convert" tone="primary" onClick={convert} disabled={!needsConversion}>
            <PlayIcon aria-hidden="true" size={17} strokeWidth={2} />
            Convert
          </ActionButton>
          <ActionButton title="Clear" onClick={clear}>
            <EraserIcon aria-hidden="true" size={17} strokeWidth={1.8} />
            Clear
          </ActionButton>
        </div>
        <div
          data-testid={`${name}-bottom-channel`}
          className="border-line bg-field rounded-surface grid min-w-0 overflow-hidden border transition-colors"
          role="group"
          aria-label="Target"
        >
          <div className={CHANNEL_HEADER_CLASSES}>
            <div className={CHANNEL_HEADING_GROUP_CLASSES}>
              <h2 className={CHANNEL_HEADING_CLASSES}>Target</h2>
              <span className={CHANNEL_STATE_CLASSES}>Read only</span>
            </div>
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
              ariaLabel="Target output"
              value={output}
              placeholder="Conversion appears here"
              disabled
              testId={`${name}-output`}
              className="disabled:bg-field pr-16"
              variant="editor"
            />
            <button
              data-testid="codec-workspace-copy"
              type="button"
              aria-label="Copy output"
              title="Copy output"
              onClick={copy}
              disabled={!output}
              className="text-muted hover:text-primary focus-visible:outline-primary disabled:bg-paper rounded-control absolute top-3 right-3 inline-flex size-11 appearance-none items-center justify-center border-0 bg-transparent p-0 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
            >
              <CopyIcon aria-hidden="true" size={18} strokeWidth={1.8} />
            </button>
          </div>
          <EditorMetadata name={name} channel="target" value={output} />
        </div>
      </div>
      <InlineStatus error={error} status={status} />
      <aside
        data-testid="workspace-shortcuts"
        aria-label="Keyboard shortcuts"
        className="border-line bg-panel text-muted rounded-control flex min-h-11 flex-wrap items-center gap-x-6 gap-y-2 border px-4 py-2 text-sm"
      >
        <strong className="text-ink">Shortcuts</strong>
        <span className="inline-flex items-center gap-2">
          <kbd>Ctrl</kbd>
          <kbd>Enter</kbd>
          <span>Convert</span>
        </span>
      </aside>
    </section>
  );
}
