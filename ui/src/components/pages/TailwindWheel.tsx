import { useEffect, useRef, type PointerEvent } from "react";

import { TAILWIND_PALETTE, type TailwindFamily, type TailwindPaletteEntry } from "../../lib/tailwind";

const CHROMATIC_FAMILIES = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const satisfies readonly TailwindFamily[];

// Ordered by hue (warm to cool), starting from untinted neutral so the wheel closes without a jump.
const NEUTRAL_FAMILIES = [
  "neutral",
  "taupe",
  "stone",
  "olive",
  "mist",
  "slate",
  "gray",
  "zinc",
  "mauve",
] as const satisfies readonly TailwindFamily[];
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const CANVAS_INSET = 8;
const INNER_RADIUS = 0.19;
const OUTER_RADIUS = 0.88;
const SECTOR_GAP = 0.018;
const RING_GAP = 0.012;
const CANVAS_CLASSES = "block aspect-square w-full";
const PANEL_CLASSES = "border-line bg-panel min-w-0 rounded-surface border p-3";
const ANCHOR_BUTTON_CLASSES =
  "border-line bg-field text-ink focus-visible:ring-primary flex min-h-11 min-w-11 items-center gap-2 rounded-control border px-3 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

type TailwindWheelProps = {
  kind: "chromatic" | "neutral";
  selected: TailwindPaletteEntry | null;
  onSelect: (entry: TailwindPaletteEntry) => void;
};

/** Draws a family-and-shade wheel while leaving selection state with its parent. */
export function TailwindWheel({ kind, selected, onSelect }: TailwindWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const families = kind === "chromatic" ? CHROMATIC_FAMILIES : NEUTRAL_FAMILIES;
  const title = kind === "chromatic" ? "Chromatic wheel" : "Neutral wheel";
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

  function selectAtPointer(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const center = bounds.width / 2;
    const dx = x - center;
    const dy = y - center;
    const radius = Math.hypot(dx, dy) / (center - CANVAS_INSET);
    if (radius <= INNER_RADIUS || radius >= OUTER_RADIUS) return;

    const rawAngle = Math.atan2(dy, dx) + Math.PI / 2;
    const angle = (rawAngle + Math.PI * 2) % (Math.PI * 2);
    const sectorSize = (Math.PI * 2) / families.length;
    const sectorOffset = angle / sectorSize;
    const sectorRemainder = sectorOffset - Math.floor(sectorOffset);
    if (sectorRemainder < SECTOR_GAP / 2 / sectorSize || sectorRemainder > 1 - SECTOR_GAP / 2 / sectorSize) return;

    const ringOffset = ((radius - INNER_RADIUS) / (OUTER_RADIUS - INNER_RADIUS)) * SHADES.length;
    const ring = Math.floor(ringOffset);
    const ringRemainder = ringOffset - ring;
    if (ringRemainder < RING_GAP || ringRemainder > 1 - RING_GAP || ring < 0 || ring >= SHADES.length) return;

    const family = families[Math.floor(sectorOffset)];
    const shade = SHADES[ring];
    if (family === undefined || shade === undefined) return;
    const entry = TAILWIND_PALETTE.find((candidate) => candidate.family === family && candidate.shade === shade);
    if (entry !== undefined) onSelect(entry);
  }

  return (
    <figure data-testid={`tailwind-${kind}-wheel`} className={PANEL_CLASSES}>
      <figcaption className="text-ink mb-2 font-semibold">{title}</figcaption>
      <canvas
        ref={canvasRef}
        data-testid={`tailwind-${kind}-canvas`}
        role="img"
        aria-label={`${title}. Shades radiate from 50 inside to 950 outside. ${wheelSelection === null ? "No token selected on this wheel" : `Selected ${wheelSelection.token}, ${wheelSelection.hex}`}.`}
        onPointerUp={selectAtPointer}
        className={CANVAS_CLASSES}
      />
      <p className="text-muted mt-2 text-xs leading-relaxed">{families.join(" · ")}</p>
    </figure>
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
              title={`Select ${family}`}
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
