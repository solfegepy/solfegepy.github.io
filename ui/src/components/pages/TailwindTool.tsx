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
  "border-line bg-field text-ink focus-visible:ring-primary min-h-11 w-full rounded-control border font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
const SELECT_CLASSES = `${FIELD_CLASSES} px-3`;
const PREVIEW_CLASSES = "rounded-control border-line bg-paper h-16 border";
const GROUP_LABEL_CLASSES = "text-ink mb-2 block font-semibold";
const FIELD_LABEL_CLASSES = "text-muted mb-1 block text-sm";

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

  async function copyValue(value: string, label: "Token" | "Hex" | "HSL") {
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <section
            aria-label="Color input"
            data-testid="tailwind-input"
            className="rounded-surface border-line bg-panel space-y-6 border p-4"
          >
            <div>
              <label htmlFor="tailwind-hex" className={GROUP_LABEL_CLASSES}>
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
                className={`${FIELD_CLASSES} px-3`}
              />
              <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
                <p id="tailwind-hex-help" className="text-muted">
                  A three or six digit hex color.
                </p>
                {result.status === "matched" && (
                  <p data-testid="tailwind-color-preview" className="text-muted font-mono">
                    {formatHsl(result.inputHex)}
                  </p>
                )}
              </div>
            </div>

            <fieldset>
              <legend className={GROUP_LABEL_CLASSES}>Select a Tailwind color</legend>
              <div className="flex flex-wrap gap-3">
                <div className="min-w-0 grow basis-28">
                  <label htmlFor="tailwind-family" className={FIELD_LABEL_CLASSES}>
                    Family
                  </label>
                  <select
                    id="tailwind-family"
                    data-testid="tailwind-family-select"
                    className={SELECT_CLASSES}
                    value={family}
                    onChange={(event) => {
                      const nextFamily = event.currentTarget.value as TailwindFamily;
                      selectEntry(
                        entryFor(nextFamily, nextFamily === "black" || nextFamily === "white" ? null : shade),
                      );
                    }}
                  >
                    {FAMILIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0 grow basis-28">
                  <label htmlFor="tailwind-shade" className={FIELD_LABEL_CLASSES}>
                    Shade
                  </label>
                  <select
                    id="tailwind-shade"
                    data-testid="tailwind-shade-select"
                    className={SELECT_CLASSES}
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
            <div
              aria-hidden="true"
              data-testid="tailwind-input-swatch"
              className={PREVIEW_CLASSES}
              style={result.status === "matched" ? { backgroundColor: result.inputHex } : undefined}
            />
          </section>

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
                <div aria-hidden="true" className={PREVIEW_CLASSES} style={{ backgroundColor: result.entry.hex }} />
              </div>
              <dl className="divide-line divide-y">
                <ResultRow
                  id="token"
                  label="Token"
                  value={result.entry.token}
                  copyLabel="Copy tailwind color token"
                  onCopy={() => void copyValue(result.entry.token, "Token")}
                />
                <ResultRow
                  id="hex"
                  label="Hex"
                  value={result.entry.hex}
                  copyLabel="Copy hex"
                  onCopy={() => void copyValue(result.entry.hex, "Hex")}
                />
                <ResultRow
                  id="hsl"
                  label="HSL"
                  value={formatHsl(result.entry.hex)}
                  copyLabel="Copy HSL"
                  onCopy={() => void copyValue(formatHsl(result.entry.hex), "HSL")}
                />
              </dl>
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

interface ResultRowProps {
  id: string;
  label: string;
  value: string;
  copyLabel: string;
  onCopy: () => void;
}

function ResultRow({ id, label, value, copyLabel, onCopy }: ResultRowProps) {
  return (
    <div className="flex items-center gap-3">
      <dt className="text-muted w-14 shrink-0 text-sm">{label}</dt>
      <dd data-testid={`tailwind-${id}`} className="text-ink min-w-0 flex-1 font-mono text-sm break-all">
        {value}
      </dd>
      <CopyButton testId={`tailwind-copy-${id}`} label={copyLabel} onClick={onCopy} />
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
