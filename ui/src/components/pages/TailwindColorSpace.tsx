import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  BackSide,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  Spherical,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

import {
  hexToHsl,
  hexHue,
  oklchToHex,
  parseOklch,
  SHADES,
  TAILWIND_PALETTE,
  type TailwindFamily,
  type TailwindPaletteEntry,
} from "../../lib/tailwind";

// Scene radius of the grid cylinder; each space scales its chroma range to fill it.
const GRID_RADIUS = 3;
// Scene height of the lightness axis, from black at the bottom to white at the top.
const LIGHTNESS_HEIGHT = 6;
// Grid cylinder radius in chroma, just beyond the most saturated color of each space: Tailwind's chromatic colors
// reach about 0.32 and its neutrals 0.046, so the neutral space magnifies chroma 6 times to keep its tints apart.
const SPACES = {
  chromatic: { name: "Chromatic", gridChroma: 0.3, note: "" },
  neutral: { name: "Neutral", gridChroma: 0.05, note: " Chroma is magnified 6 times so the subtle tints stay apart." },
} as const;
const GRID_HUE_STEP = 30;
// The sRGB primaries and secondaries give the hue circle familiar landmarks; OKLCH spreads them unevenly.
const HUE_REFERENCES = ["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF"] as const;
const HUE_REFERENCE_LIST = new Intl.ListFormat("en", { type: "conjunction" }).format(HUE_REFERENCES);
// Hue ring band and label distance, as multiples of the grid radius.
const HUE_RING_WIDTH = 0.08;
const HUE_LABEL_RADIUS = 1.25;
const HUE_LABEL_CLASSES =
  "bg-panel/80 text-ink flex items-center gap-1 rounded-sm px-1 font-mono text-xs leading-tight select-none";
const GRID_COLOR = "#94a3b8";
const DOT_RADIUS = 0.14;
const SELECTED_SCALE = 1.8;
// Visible against both the light and dark panels.
const OUTLINE_COLOR = "#64748b";
// Pointer travel beyond this many pixels is a rotation drag, not a selection click.
const CLICK_TOLERANCE = 5;
const CANVAS_CLASSES = "block aspect-square w-full cursor-grab active:cursor-grabbing";
const CAMERA_BUTTON_CLASSES =
  "border-line bg-field text-ink hover:border-primary hover:text-primary focus-visible:outline-primary rounded-control min-h-11 min-w-11 border px-3 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2";
// Camera angle from the top of the lightness axis, in radians.
const CAMERA_VIEWS = [
  ["Bottom", Math.PI],
  ["Side", Math.PI / 2],
  ["Top", 0],
] as const;

type SpaceView = {
  camera: PerspectiveCamera;
  dots: Map<Object3D, TailwindPaletteEntry>;
  highlight: (token: string | null) => void;
  lookFrom: (polarAngle: number) => void;
};

type TailwindColorSpaceProps = {
  kind: keyof typeof SPACES;
  model: "oklch" | "hsl";
  families: readonly TailwindFamily[];
  selected: TailwindPaletteEntry | null;
  onSelect: (entry: TailwindPaletteEntry) => void;
};

/** Plots the given families in OKLCH or HSL, joining the shades of each family with a line. */
export function TailwindColorSpace({ kind, model, families, selected, onSelect }: TailwindColorSpaceProps) {
  const { name, gridChroma, note } = SPACES[kind];
  const gridRadius = model === "hsl" ? (kind === "neutral" ? 0.85 : 1) : gridChroma;
  const scale = GRID_RADIUS / gridRadius;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<SpaceView | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const [hovered, setHovered] = useState<TailwindPaletteEntry | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const spaceSelection = selected !== null && families.includes(selected.family) ? selected : null;
  const selectedToken = spaceSelection?.token ?? null;

  useEffect(() => {
    const canvas = canvasRef.current;
    // Native selectors remain usable where ResizeObserver is unavailable.
    if (canvas === null || typeof ResizeObserver === "undefined") return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch {
      // Browsers with WebGL disabled keep the rest of the tool working. WebGL support is only known once
      // a context is requested, so this one-shot failure cannot be derived during render.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWebglFailed(true);
      return;
    }
    renderer.setPixelRatio(window.devicePixelRatio || 1);

    const scene = new Scene();
    const camera = new PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 4, 14);
    const controls = new OrbitControls(camera, canvas);
    // Seen from above, the floor reaches lower on screen than the top; a lower target centres the grid.
    controls.target.set(0, -0.5, 0);
    controls.update();
    controls.enablePan = false;
    // Wheel scrolling keeps moving the page instead of zooming the plot.
    controls.enableZoom = false;

    scene.add(buildGrid(gridRadius, scale));
    scene.add(buildHueRing(model));
    for (const [index, hex] of HUE_REFERENCES.entries()) {
      const label = buildHueLabel(hex);
      const angle = model === "hsl" ? index * 60 : hexHue(hex);
      label.position.copy(colorPoint(0, gridRadius * HUE_LABEL_RADIUS, angle, scale));
      scene.add(label);
    }
    const labelRenderer = new CSS2DRenderer();
    // Labels sit over the canvas but let drags and clicks reach it.
    labelRenderer.domElement.className = "pointer-events-none absolute inset-0";
    labelRenderer.domElement.setAttribute("aria-hidden", "true");
    labelRenderer.domElement.dataset.testid = `tailwind-${kind}-3d-hue-labels`;
    canvas.after(labelRenderer.domElement);
    const dots = buildDots(families, model, scale);
    for (const dot of dots.keys()) scene.add(dot);
    for (const family of families) {
      scene.add(
        buildLine(
          SHADES.map((shade) => paletteEntry(family, shade)),
          model,
          scale,
        ),
      );
    }

    const render = () => {
      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    const highlight = (token: string | null) => {
      for (const [dot, entry] of dots) {
        const isSelected = entry.token === token;
        dot.scale.setScalar(isSelected ? SELECTED_SCALE : 1);
        for (const outline of dot.children) outline.visible = isSelected;
      }
      render();
    };
    const lookFrom = (polarAngle: number) => {
      const offset = new Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      offset.phi = polarAngle;
      camera.position.copy(controls.target).add(new Vector3().setFromSpherical(offset));
      // update() nudges the camera just off the poles, where looking straight along the axis has no "up".
      controls.update();
      render();
    };
    const resize = () => {
      const width = canvas.clientWidth;
      if (width === 0) return;
      renderer.setSize(width, width, false);
      labelRenderer.setSize(width, width);
      render();
    };
    controls.addEventListener("change", render);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    viewRef.current = { camera, dots, highlight, lookFrom };
    resize();

    return () => {
      viewRef.current = null;
      observer.disconnect();
      labelRenderer.domElement.remove();
      controls.dispose();
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof Line) {
          (object.geometry as BufferGeometry).dispose();
          (object.material as MeshBasicMaterial | LineBasicMaterial).dispose();
        }
      });
      renderer.dispose();
    };
  }, [families, gridRadius, kind, model, scale]);

  useEffect(() => viewRef.current?.highlight(selectedToken), [model, selectedToken]);

  function entryAtPointer(event: PointerEvent<HTMLCanvasElement>): TailwindPaletteEntry | null {
    const view = viewRef.current;
    if (view === null) return null;
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointer = new Vector2(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    const raycaster = new Raycaster();
    raycaster.setFromCamera(pointer, view.camera);
    const [hit] = raycaster.intersectObjects([...view.dots.keys()], false);
    return hit === undefined ? null : (view.dots.get(hit.object) ?? null);
  }

  if (webglFailed) {
    return (
      <p data-testid={`tailwind-${kind}-3d-unavailable`} role="alert" className="text-muted text-sm">
        The 3D view needs WebGL, which this browser has disabled. Use the 2D wheel instead.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          data-testid={`tailwind-${kind}-3d`}
          role="img"
          aria-label={`${name} ${model.toUpperCase()} space. Each dot is one color: hue sets its angle and ${model === "hsl" ? "saturation" : "chroma"} its distance from the lightness axis, which runs from black at the bottom to white at the top. Lines join the shades of each family. A hue ring on the floor marks where ${HUE_REFERENCE_LIST} fall.${model === "hsl" && kind === "neutral" ? " Saturation is magnified about 1.18 times; the outer grid represents 85% saturation." : note} Drag to rotate. ${spaceSelection === null ? "No token selected in this space" : `Selected ${spaceSelection.token}, ${spaceSelection.hex}`}.`}
          title={hovered?.token}
          onPointerDown={(event) => {
            pointerDownRef.current = { x: event.clientX, y: event.clientY };
          }}
          onPointerUp={(event) => {
            const start = pointerDownRef.current;
            pointerDownRef.current = null;
            if (start === null || Math.hypot(event.clientX - start.x, event.clientY - start.y) > CLICK_TOLERANCE)
              return;
            const entry = entryAtPointer(event);
            if (entry !== null) onSelect(entry);
          }}
          onPointerMove={(event) => setHovered(entryAtPointer(event))}
          onPointerLeave={() => setHovered(null)}
          className={CANVAS_CLASSES}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted min-w-0 grow basis-48 text-sm">
          {model === "hsl"
            ? "In HSL, hue sets the angle, saturation grows outward, and lightness sets height. The floor ring shows each hue; labels mark the screen’s pure colors."
            : "In OKLCH, equal steps up the axis are perceived equally lighter, chroma grows outward, and hue turns around. The floor ring shows each hue; labels mark where the screen’s pure colors fall."}
          {model === "hsl" && kind === "neutral"
            ? " Saturation is magnified about 1.18 times; the outer grid represents 85% saturation."
            : note}
        </p>
        <div role="group" aria-label={`${name} camera view`} className="flex flex-wrap justify-end gap-2">
          {CAMERA_VIEWS.map(([label, polarAngle]) => (
            <button
              key={label}
              type="button"
              data-testid={`tailwind-${kind}-3d-view-${label}`}
              title={`View from ${label.toLowerCase()}`}
              onClick={() => viewRef.current?.lookFrom(polarAngle)}
              className={CAMERA_BUTTON_CLASSES}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Builds one dot per color of the given families, each with a hidden selection outline. */
function buildDots(
  families: readonly TailwindFamily[],
  model: "oklch" | "hsl",
  scale: number,
): Map<Object3D, TailwindPaletteEntry> {
  const dots = new Map<Object3D, TailwindPaletteEntry>();
  const dotGeometry = new SphereGeometry(DOT_RADIUS, 16, 12);
  // A slightly larger back-facing sphere reads as an outline around the dot.
  const outlineGeometry = new SphereGeometry(DOT_RADIUS * 1.35, 16, 12);
  const outlineMaterial = new MeshBasicMaterial({ color: OUTLINE_COLOR, side: BackSide });

  for (const entry of TAILWIND_PALETTE) {
    if (!families.includes(entry.family)) continue;
    // Unlit material keeps each dot at its exact palette hex.
    const dot = new Mesh(dotGeometry, new MeshBasicMaterial({ color: entry.hex }));
    dot.position.copy(colorPosition(entry, model, scale));
    const outline = new Mesh(outlineGeometry, outlineMaterial);
    outline.visible = false;
    dot.add(outline);
    dots.set(dot, entry);
  }
  return dots;
}

/** Builds a flat band around the grid floor, colored with the hue at each angle. */
function buildHueRing(model: "oklch" | "hsl"): Mesh {
  const geometry = new RingGeometry(GRID_RADIUS, GRID_RADIUS * (1 + HUE_RING_WIDTH), 90, 1);
  const positions = geometry.getAttribute("position");
  const colors: number[] = [];
  for (let index = 0; index < positions.count; index++) {
    const hue = (Math.atan2(positions.getY(index), positions.getX(index)) * 180) / Math.PI;
    const color =
      model === "hsl"
        ? new Color().setHSL(((hue + 360) % 360) / 360, 1, 0.5, SRGBColorSpace)
        : new Color(oklchToHex(`oklch(70% 0.12 ${hue})`));
    colors.push(...color.toArray());
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  // The ring is drawn in the XY plane; laying it flat maps its angle onto the hue angle used by oklchPoint.
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, -LIGHTNESS_HEIGHT / 2, 0);
  return new Mesh(geometry, new MeshBasicMaterial({ vertexColors: true, side: DoubleSide }));
}

/** Builds a screen-facing label with a swatch and the hex of a reference color. */
function buildHueLabel(hex: string): CSS2DObject {
  const swatch = document.createElement("span");
  swatch.className = "border-line size-2.5 rounded-full border";
  swatch.style.backgroundColor = hex;
  const label = document.createElement("span");
  label.className = HUE_LABEL_CLASSES;
  label.append(swatch, hex);
  return new CSS2DObject(label);
}

/** Joins entries in order with a line that fades through their colors. */
function buildLine(entries: readonly TailwindPaletteEntry[], model: "oklch" | "hsl", scale: number): Line {
  const geometry = new BufferGeometry().setFromPoints(entries.map((entry) => colorPosition(entry, model, scale)));
  const colors = entries.flatMap((entry) => new Color(entry.hex).toArray());
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  return new Line(geometry, new LineBasicMaterial({ vertexColors: true }));
}

/** Draws the OKLCH cylinder: its lightness axis, lightness rings and hue lines on its wall, and chroma rings and hue
 * spokes on its floor. */
function buildGrid(gridRadius: number, scale: number): LineSegments {
  const points: Vector3[] = [];
  const point = (lightness: number, radius: number, hue: number) => colorPoint(lightness, radius, hue, scale);
  const circle = (lightness: number, radius: number) => {
    for (let hue = 0; hue < 360; hue += 5) {
      points.push(point(lightness, radius, hue), point(lightness, radius, hue + 5));
    }
  };
  for (const lightness of [0, 0.25, 0.5, 0.75, 1]) circle(lightness, gridRadius);
  for (const radius of [gridRadius / 3, (gridRadius * 2) / 3]) circle(0, radius);
  points.push(point(0, 0, 0), point(1, 0, 0));
  for (let hue = 0; hue < 360; hue += GRID_HUE_STEP) {
    points.push(point(0, gridRadius, hue), point(1, gridRadius, hue));
    points.push(point(0, 0, hue), point(0, gridRadius, hue));
  }
  const material = new LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.4 });
  return new LineSegments(new BufferGeometry().setFromPoints(points), material);
}

function colorPosition(entry: TailwindPaletteEntry, model: "oklch" | "hsl", scale: number): Vector3 {
  if (model === "hsl") {
    const { hue, saturation, lightness } = hexToHsl(entry.hex);
    return colorPoint(lightness, saturation, hue, scale);
  }
  const { lightness, chroma, hue } = parseOklch(entry.oklch)!;
  return colorPoint(lightness, chroma, hue, scale);
}

/** Places a color in the scene using its model radius and hue angle. */
function colorPoint(lightness: number, radius: number, hue: number, scale: number): Vector3 {
  const angle = (hue * Math.PI) / 180;
  const scaledRadius = radius * scale;
  return new Vector3(
    scaledRadius * Math.cos(angle),
    (lightness - 0.5) * LIGHTNESS_HEIGHT,
    -scaledRadius * Math.sin(angle),
  );
}

function paletteEntry(family: TailwindFamily, shade: number): TailwindPaletteEntry {
  return TAILWIND_PALETTE.find((entry) => entry.family === family && entry.shade === shade)!;
}
