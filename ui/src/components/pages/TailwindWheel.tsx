import { lazy, Suspense, useEffect, useRef, useState, type MouseEvent } from "react";

import {
  CHROMATIC_FAMILIES,
  SHADES,
  TAILWIND_PALETTE,
  type TailwindFamily,
  type TailwindPaletteEntry,
} from "../../lib/tailwind";

// three.js only downloads once a visitor opens the 3D view.
const TailwindOklchSpace = lazy(() =>
  import("./TailwindOklchSpace").then((module) => ({ default: module.TailwindOklchSpace })),
);

const NEUTRAL_FAMILIES = [
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "taupe",
  "mauve",
  "olive",
  "mist",
] as const satisfies readonly TailwindFamily[];
const CANVAS_INSET = 8;
const INNER_RADIUS = 0.19;
const OUTER_RADIUS = 0.88;
const SECTOR_GAP = 0.018;
const RING_GAP = 0.012;
const CANVAS_CLASSES = "block aspect-square w-full";
const PANEL_CLASSES = "border-line bg-panel min-w-0 rounded-surface border p-3";
const VIEW_BUTTON_CLASSES =
  "focus-visible:outline-primary min-h-11 min-w-11 px-3 font-mono text-sm focus-visible:outline-2 focus-visible:outline-offset-2";
const VIEWS = ["2D", "3D"] as const;
const ANCHOR_BUTTON_CLASSES =
  "border-line bg-field text-ink focus-visible:ring-primary flex min-h-11 min-w-11 items-center gap-2 rounded-control border px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

type WheelView = (typeof VIEWS)[number];

type TailwindWheelProps = {
  kind: "chromatic" | "neutral";
  selected: TailwindPaletteEntry | null;
  onSelect: (entry: TailwindPaletteEntry) => void;
};

/** Shows a family-and-shade wheel; the chromatic one can switch to a 3D OKLCH plot. */
export function TailwindWheel({ kind, selected, onSelect }: TailwindWheelProps) {
  const [view, setView] = useState<WheelView>("2D");
  const title = kind === "chromatic" ? "Chromatic wheel" : "Neutral wheel";

  return (
    <figure data-testid={`tailwind-${kind}-wheel`} className={PANEL_CLASSES}>
      <figcaption className="mb-2 flex items-center justify-between gap-2">
        <span className="text-ink font-semibold">{title}</span>
        {kind === "chromatic" && (
          <div
            role="group"
            aria-label={`${title} view`}
            className="border-line rounded-control flex overflow-hidden border"
          >
            {VIEWS.map((option) => (
              <button
                key={option}
                type="button"
                data-testid={`tailwind-wheel-view-${option}`}
                title={`Show ${option} view`}
                aria-pressed={view === option}
                onClick={() => setView(option)}
                className={`${VIEW_BUTTON_CLASSES} ${view === option ? "bg-primary-soft text-primary font-semibold" : "bg-field text-muted hover:text-ink"}`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </figcaption>
      {view === "3D" ? (
        <Suspense fallback={<div aria-busy="true" className={CANVAS_CLASSES} />}>
          <TailwindOklchSpace selected={selected} onSelect={onSelect} />
        </Suspense>
      ) : (
        <FlatWheel kind={kind} title={title} selected={selected} onSelect={onSelect} />
      )}
    </figure>
  );
}

/** Draws a family-and-shade wheel while leaving selection state with its parent. */
function FlatWheel({ kind, title, selected, onSelect }: TailwindWheelProps & { title: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState<TailwindPaletteEntry | null>(null);
  const families = kind === "chromatic" ? CHROMATIC_FAMILIES : NEUTRAL_FAMILIES;
  const wheelSelection = selected !== null && new Set<TailwindFamily>(families).has(selected.family) ? selected : null;

  useEffect(() => {
    const canvas = canvasRef.current;
    // Native selectors remain usable where ResizeObserver is unavailable.
    if (canvas === null || typeof ResizeObserver === "undefined") return;
    const context = canvas.getContext("2d");
    if (context === null) return;

    const draw = () => drawWheel(canvas, context, families, wheelSelection?.token ?? null);
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    window.addEventListener("resize", draw);
    draw();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [families, wheelSelection?.token]);

  function entryAtPointer(event: MouseEvent<HTMLCanvasElement>): TailwindPaletteEntry | null {
    const canvas = canvasRef.current;
    if (canvas === null) return null;

    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const center = bounds.width / 2;
    const dx = x - center;
    const dy = y - center;
    const radius = Math.hypot(dx, dy) / (center - CANVAS_INSET);
    if (radius <= INNER_RADIUS || radius >= OUTER_RADIUS) return null;

    const rawAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const angle = (rawAngle + Math.PI * 2) % (Math.PI * 2);
    const sectorSize = (Math.PI * 2) / families.length;
    const sectorOffset = angle / sectorSize;
    const sectorRemainder = sectorOffset - Math.floor(sectorOffset);
    if (sectorRemainder < SECTOR_GAP / 2 / sectorSize || sectorRemainder > 1 - SECTOR_GAP / 2 / sectorSize) return null;

    const ringOffset = ((radius - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS)) * SHADES.length;
    const ring = Math.floor(ringOffset);
    const ringRemainder = ringOffset - ring;
    if (ringRemainder < RING_GAP || ringRemainder > 1 - RING_GAP || ring < 0 || ring >= SHADES.length) return null;

    const family = families[Math.floor(sectorOffset)];
    const shade = SHADES[ring];
    if (family === undefined || shade === undefined) return null;
    return TAILWIND_PALETTE.find((candidate) => candidate.family === family && candidate.shade === shade) ?? null;
  }

  return (
    <div className="[container-type:inline-size] relative">
      <canvas
        ref={canvasRef}
        data-testid={`tailwind-${kind}-canvas`}
        role="img"
        aria-label={`${title}. Shades radiate from 50 inside to 950 outside. ${wheelSelection === null ? "No token selected on this wheel" : `Selected ${wheelSelection.token}, ${wheelSelection.hex}`}.`}
        title={hovered?.token}
        onPointerUp={(event) => {
          const entry = entryAtPointer(event);
          if (entry !== null) onSelect(entry);
        }}
        onMouseMove={(event) => setHovered(entryAtPointer(event))}
        onMouseLeave={() => setHovered(null)}
        className={CANVAS_CLASSES}
      />
      {families.map((family, index) => {
        const angle = ((index + 0.5) / families.length) * Math.PI * 2 - Math.PI / 2;
        const rotation = (angle * 180) / Math.PI + (Math.sin(angle) > 0 ? -90 : 90);
        return (
          <span
            key={family}
            className="text-muted pointer-events-none absolute leading-none whitespace-nowrap"
            style={{
              fontSize: "clamp(0.75rem, 3.5cqw, 0.875rem)",
              left: `${50 + Math.cos(angle) * 47}%`,
              top: `${50 + Math.sin(angle) * 47}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            }}
          >
            {family}
          </span>
        );
      })}
    </div>
  );
}

/** Provides separate selectable swatches for black and white. */
export function TailwindAnchorSwatches({
  selected,
  onSelect,
}: {
  selected: TailwindPaletteEntry | null;
  onSelect: (entry: TailwindPaletteEntry) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-ink text-sm font-semibold">Black and white</legend>
      <div className="flex flex-wrap gap-2">
        {(["black", "white"] as const).map((family) => {
          const entry = TAILWIND_PALETTE.find((candidate) => candidate.family === family)!;
          const isSelected = selected?.token === entry.token;
          return (
            <button
              key={family}
              type="button"
              data-testid={`tailwind-${family}-swatch`}
              aria-label={`Select ${family}`}
              title={entry.token}
              aria-pressed={isSelected}
              onClick={() => onSelect(entry)}
              className={`${ANCHOR_BUTTON_CLASSES} ${isSelected ? "ring-primary ring-2 ring-offset-2" : ""}`}
            >
              <span
                aria-hidden="true"
                className="border-line size-6 shrink-0 rounded-sm border"
                style={{ backgroundColor: entry.hex }}
              />
              <span>
                <span className="block font-semibold">{family}</span>
                <span className="font-mono">{entry.hex}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function drawWheel(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  families: readonly TailwindFamily[],
  selectedToken: string | null,
) {
  const width = canvas.clientWidth;
  if (width === 0) return;
  const pixelRatio = window.devicePixelRatio || 1;
  const height = width;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  const center = width / 2;
  const radius = center - CANVAS_INSET;
  const innerRadius = radius * INNER_RADIUS;
  const outerRadius = radius * OUTER_RADIUS;
  const sectorSize = (Math.PI * 2) / families.length;
  const ringWidth = (outerRadius - innerRadius) / SHADES.length;
  const startAngle = -Math.PI / 2;

  families.forEach((family, familyIndex) => {
    const sectorStart = startAngle + familyIndex * sectorSize + SECTOR_GAP / 2;
    const sectorEnd = startAngle + (familyIndex + 1) * sectorSize - SECTOR_GAP / 2;
    SHADES.forEach((shade, shadeIndex) => {
      const entry = TAILWIND_PALETTE.find((candidate) => candidate.family === family && candidate.shade === shade);
      if (entry === undefined) return;
      const inner = innerRadius + shadeIndex * ringWidth + RING_GAP * ringWidth;
      const outer = innerRadius + (shadeIndex + 1) * ringWidth - RING_GAP * ringWidth;
      context.beginPath();
      context.arc(center, center, outer, sectorStart, sectorEnd);
      context.arc(center, center, inner, sectorEnd, sectorStart, true);
      context.closePath();
      context.fillStyle = entry.hex;
      context.fill();

      if (entry.token === selectedToken) {
        context.lineWidth = Math.max(1.5, width / 150);
        context.strokeStyle = "#ffffff";
        context.stroke();
        context.lineWidth = Math.max(0.75, width / 300);
        context.strokeStyle = "#111827";
        context.stroke();
      }
    });
  });
}
