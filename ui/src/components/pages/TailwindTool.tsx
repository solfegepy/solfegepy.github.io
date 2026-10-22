import { CopyIcon } from "lucide-react";
import { useRef, useState } from "react";

import { InlineStatus } from "../ui/InlineStatus";
import { TailwindAnchorSwatches, TailwindWheel } from "./TailwindWheel";

import {
  formatHsl,
  matchTailwindColor,
  TAILWIND_PALETTE,
  TAILWIND_VERSION,
  type TailwindFamily,
  type TailwindMatchResult,
} from "../../lib/tailwind";

const FAMILIES = [...new Set(TAILWIND_PALETTE.map(({ family }) => family))];
const SHADES = [...new Set(TAILWIND_PALETTE.flatMap(({ shade }) => (shade === null ? [] : [shade])))];
const INITIAL_FAMILY: TailwindFamily = "red";
const INITIAL_SHADE = 500;
const FIELD_CLASSES =
  "border-line bg-field text-ink focus-visible:ring-primary min-h-11 w-full rounded-control border px-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

function entryFor(family: TailwindFamily, shade: number | null) {
  return TAILWIND_PALETTE.find((entry) => entry.family === family && entry.shade === shade)!;
}

/** Lets visitors inspect Tailwind palette colors and match hex values. */
export function TailwindTool() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<TailwindMatchResult>({ status: "empty" });
  const [copyStatus, setCopyStatus] = useState("");
  const [copyError, setCopyError] = useState("");
  const copyRequest = useRef(0);
  const selected = result.status === "matched" ? result.entry : null;
  const family = selected?.family ?? INITIAL_FAMILY;
  const shade = selected?.shade ?? INITIAL_SHADE;
  const numberedFamily = family !== "black" && family !== "white";

  function updateInput(value: string) {
    clearCopyFeedback();
    setInput(value);
    setResult(matchTailwindColor(value));
  }

  function selectEntry(entry: (typeof TAILWIND_PALETTE)[number]) {
    clearCopyFeedback();
    setInput(entry.hex);
    setResult({ status: "matched", inputHex: entry.hex, entry, match: "exact" });
  }

  function clearCopyFeedback() {
    copyRequest.current += 1;
    setCopyStatus("");
    setCopyError("");
  }

  async function copyValue(value: string, label: "Token" | "Hex") {
    const request = ++copyRequest.current;
    setCopyStatus("");
    setCopyError("");

    try {
      if (!navigator.clipboard?.writeText) {
        setCopyError("Clipboard access is unavailable. Select the value to copy it manually.");
        return;
      }
      await navigator.clipboard.writeText(value);
      if (copyRequest.current === request) setCopyStatus(`${label} copied.`);
    } catch {
      if (copyRequest.current === request) setCopyError("Could not copy. Select the value to copy it manually.");
    }
  }

  return (
    <section data-testid="tailwind-tool" aria-label="Tailwind color converter" className="min-w-0 space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-36 shrink-0 space-y-2">
              <label htmlFor="tailwind-hex" className="text-ink block font-semibold">
                Hex color
              </label>
              <input
                id="tailwind-hex"
                data-testid="tailwind-hex-input"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                value={input}
                onChange={(event) => updateInput(event.currentTarget.value)}
                aria-describedby="tailwind-hex-help"
                placeholder="#3b82f6"
                className={FIELD_CLASSES}
              />
              <p id="tailwind-hex-help" className="text-muted text-sm">
                A three or six digit hex color.
              </p>
            </div>
            {result.status === "matched" && <ColorPreview hex={result.inputHex} showHex={false} />}
          </div>

          <fieldset className="space-y-3">
            <legend className="text-ink font-semibold">Select a Tailwind color</legend>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label htmlFor="tailwind-family" className="text-muted mb-1 block text-sm">
                  Family
                </label>
                <select
                  id="tailwind-family"
                  data-testid="tailwind-family-select"
                  className={FIELD_CLASSES}
                  value={family}
                  onChange={(event) => {
                    const nextFamily = event.currentTarget.value as TailwindFamily;
                    selectEntry(entryFor(nextFamily, nextFamily === "black" || nextFamily === "white" ? null : shade));
                  }}
                >
                  {FAMILIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tailwind-shade" className="text-muted mb-1 block text-sm">
                  Shade
                </label>
                <select
                  id="tailwind-shade"
                  data-testid="tailwind-shade-select"
                  className={FIELD_CLASSES}
                  value={shade ?? ""}
                  disabled={!numberedFamily}
                  onChange={(event) => selectEntry(entryFor(family, Number(event.currentTarget.value)))}
                >
                  {SHADES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {result.status === "empty" ? (
            <p
              data-testid="tailwind-inspection-prompt"
              className="text-muted rounded-control border-line bg-panel border p-4"
            >
              Select a Tailwind color or enter a hex value to inspect it.
            </p>
          ) : result.status === "invalid" ? (
            <p
              data-testid="tailwind-input-error"
              role="alert"
              className="text-danger rounded-control border-danger bg-danger-soft border p-3 text-sm"
            >
              A three or six digit hex color.
            </p>
          ) : (
            <section
              aria-label="Color match"
              data-testid="tailwind-result"
              className="rounded-surface border-line bg-panel space-y-4 border p-4"
            >
              <div aria-live="polite" className="space-y-2">
                <p data-testid="tailwind-match-kind" className="text-muted text-sm">
                  {result.match === "exact" ? "Exact match" : "Closest match"}
                </p>
                <ColorPreview hex={result.entry.hex} />
                <div className="flex items-center gap-1">
                  <span data-testid="tailwind-token" className="text-ink font-mono text-lg font-semibold">
                    {result.entry.token}
                  </span>
                  <CopyButton
                    testId="tailwind-copy-token"
                    label="Copy tailwind color token"
                    onClick={() => void copyValue(result.entry.token, "Token")}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span data-testid="tailwind-hex" className="text-ink font-mono text-sm">
                    {result.entry.hex}
                  </span>
                  <CopyButton
                    testId="tailwind-copy-hex"
                    label="Copy hex"
                    onClick={() => void copyValue(result.entry.hex, "Hex")}
                  />
                </div>
              </div>
              <InlineStatus error={copyError} status={copyStatus} />
            </section>
          )}
        </div>

        <section aria-label="Tailwind color wheels" data-testid="tailwind-wheels" className="space-y-3">
          <p className="text-muted text-sm">
            Each wheel groups families by color. Shades run from 50 inside to 950 outside.
          </p>
          <div className="grid min-w-0 gap-3">
            <TailwindWheel kind="chromatic" selected={selected} onSelect={selectEntry} />
            <TailwindWheel kind="neutral" selected={selected} onSelect={selectEntry} />
          </div>
          <TailwindAnchorSwatches selected={selected} onSelect={selectEntry} />
        </section>
      </div>

      <p className="text-muted max-w-prose text-sm">
        Closest colors are selected using OKLab distance, which estimates perceived color difference. Hex values are
        sRGB approximations of Tailwind&apos;s OKLCH colors.
      </p>
      <p className="text-muted text-sm">
        Colors from{" "}
        <a
          data-testid="tailwind-version-link"
          href={`https://github.com/tailwindlabs/tailwindcss/releases/tag/v${TAILWIND_VERSION}`}
          target="_blank"
          rel="noreferrer"
          className="text-primary font-semibold underline underline-offset-2"
        >
          Tailwind CSS {TAILWIND_VERSION}
        </a>
      </p>
    </section>
  );
}

function ColorPreview({ hex, showHex = true }: { hex: string; showHex?: boolean }) {
  return (
    <div data-testid="tailwind-color-preview" className="min-w-0 space-y-2">
      <div aria-hidden="true" className="rounded-control border-line h-16 border" style={{ backgroundColor: hex }} />
      {showHex && <p className="text-ink font-mono text-sm break-all">{hex}</p>}
      <p className="text-muted font-mono text-sm break-all">{formatHsl(hex)}</p>
    </div>
  );
}

function CopyButton({ testId, label, onClick }: { testId: string; label: string; onClick: () => void }) {
  return (
    <button
      data-testid={testId}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="text-muted hover:text-primary focus-visible:outline-primary rounded-control inline-flex min-h-11 min-w-11 items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <CopyIcon aria-hidden="true" size={17} />
    </button>
  );
}
