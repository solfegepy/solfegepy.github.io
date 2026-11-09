# Design System

## Product Direction

- Codec64 is a browser-only conversion and inspection workbench for developers and technical users.
- Primary jobs: paste, select formats, convert, inspect, select/copy, and consult precise reference material.
- Personality: precise, compact, calm, trustworthy, practical.
- Follow the paste, convert, inspect and copy flow; keep source and result equally legible; frame actual boundaries.
- Keep documentation readable without surrounding every section with a card.
- Preserve brand assets, routes, content, conversion semantics, and privacy guarantees.

## Color

### Families

Measured with `palette.py hues` (OKLCH hue at shade 500):

- Neutral: `gray` (264.4°) in both themes.
- Primary: `sky` (237.3°), confirmed brand "Clear Sky". Stock Tailwind family; no generated brand scale.
- Secondary: `teal` (182.5°), −55° from primary.
- Accent: `violet` (292.7°), +55° from primary; semantic role name `highlight` because HeroUI's `--accent` is the primary action color.
- Status: `red` danger, `amber` warning, `green` success, `blue` info (blue, not sky, so info never reads as the primary).

Harmony: analogous on both sides of sky. Teal and violet sit equidistant from sky, so all three families share a cool temperature and similar chroma while keeping distinct jobs. Rejected alternative: "Blue Hour Plus" (violet secondary, amber highlight) — warmer highlight with more pop, but the user preferred the all-cool, quieter Lagoon.

### Usage

| Role             | Token                                                                              | Surfaces / components                                                               | Dosage             |
| ---------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------ |
| Neutral canvas   | `paper`                                                                            | page background, disabled fill                                                      | ~80% total neutral |
| Neutral surface  | `panel`                                                                            | sidebar, header, grouped surfaces, Shortcuts strip base                             |                    |
| Neutral field    | `field`                                                                            | editable fields, quiet buttons                                                      |                    |
| Text             | `ink`, `muted`                                                                     | all text                                                                            |                    |
| Boundary         | `line`                                                                             | borders, dividers, control boundaries                                               |                    |
| Secondary region | `panel-target`                                                                     | converter target region, JWT output panels                                          | ~12% teal          |
| Secondary        | `secondary`, `secondary-soft`, `secondary-soft-foreground`, `secondary-foreground` | tool icons in nav, page-header and FAQ icon tiles, Swap button, cookie "Reject all" |                    |
| Primary          | `primary`, `primary-strong`, `primary-soft`                                        | Convert, active nav, links, focus, toggles, quiet hover                             | ~6% sky            |
| Highlight        | `highlight`                                                                        | brand "64", editor footer counts, list markers, 404 "Error 404" eyebrow             | ~2% violet         |
| Status           | `danger*`, `warning*`, `success*`, `info*`                                         | inline status, JWT warning, privacy notice, env banner                              | sparse             |

Colored regions: output panels and icon tiles are the deliberate teal regions; source editors stay neutral; the active nav item is the only sky-tinted region in navigation.

States:

- Primary button: default `primary` fill + `paper` text; hover `primary-strong`; focus 2px `primary` outline, 2px offset; active no color change; disabled `paper` fill, `muted` text, `line` border.
- Secondary button (Swap, Reject all): default `secondary-soft` fill, `secondary-soft-foreground` text, `secondary` border; hover `secondary` fill + `secondary-foreground` text; focus as primary; disabled as primary.
- Quiet button / icon button: default `field` (quiet ActionButton keeps `panel`) fill, `ink` text, `line` border; hover `primary` border + text; active `primary-soft` fill; focus as primary.
- Inputs/selects: `field` fill, `line` border, focus 2px `primary` outline.
- Links: `primary` text with underline; hover `primary-strong`.
- Navigation: default `ink` text, `secondary` icon; active `primary-soft` fill, `primary` text and icon, weight 600, `aria-current`.

### Semantic Tokens

Target stylesheet: `ui/src/styles/globals.css`. Runtime variables set in `:root` (light) and `:root[data-theme="dark"]`, exposed through `@theme static` as `--color-<token>: var(--<token>)`.

| Token                       | Light        | Dark         |
| --------------------------- | ------------ | ------------ |
| `paper`                     | `gray-50`    | `gray-950`   |
| `panel`                     | `gray-100`   | `gray-900`   |
| `field`                     | `white`      | `gray-800`   |
| `ink`                       | `gray-950`   | `gray-50`    |
| `muted`                     | `gray-600`   | `gray-300`   |
| `line`                      | `gray-500`   | `gray-400`   |
| `primary`                   | `sky-700`    | `sky-400`    |
| `primary-strong`            | `sky-800`    | `sky-300`    |
| `primary-soft`              | `sky-50`     | `sky-950`    |
| `panel-target`              | `teal-50`    | `teal-950`   |
| `secondary`                 | `teal-700`   | `teal-400`   |
| `secondary-foreground`      | `white`      | `teal-950`   |
| `secondary-soft`            | `teal-50`    | `teal-950`   |
| `secondary-soft-foreground` | `teal-800`   | `teal-200`   |
| `highlight`                 | `violet-600` | `violet-400` |
| `danger`                    | `red-700`    | `red-400`    |
| `danger-foreground`         | `white`      | `red-950`    |
| `danger-soft`               | `red-50`     | `red-950`    |
| `danger-soft-foreground`    | `red-800`    | `red-200`    |
| `success`                   | `green-700`  | `green-400`  |
| `success-foreground`        | `white`      | `green-950`  |
| `success-soft`              | `green-50`   | `green-950`  |
| `success-soft-foreground`   | `green-800`  | `green-200`  |
| `warning`                   | `amber-400`  | `amber-400`  |
| `warning-foreground`        | `amber-950`  | `amber-950`  |
| `warning-soft`              | `amber-50`   | `amber-950`  |
| `warning-soft-foreground`   | `amber-900`  | `amber-200`  |
| `info-soft`                 | `blue-50`    | `blue-950`   |
| `info-soft-foreground`      | `blue-800`   | `blue-200`   |

Primary button text uses `paper` (existing rule). Status messages use `border-<s>-soft-foreground bg-<s>-soft text-<s>-soft-foreground`.

HeroUI v3 contract (variables HeroUI owns; set them, do not shadow them with other meanings), in both theme blocks:

- `--accent: var(--primary)`, `--accent-foreground: var(--paper)`, `--focus: var(--primary)`, `--link: var(--primary)`.
- `--background: var(--paper)`, `--foreground: var(--ink)`, `--surface: var(--panel)`, `--field-background: var(--field)`, `--border: var(--line)`, `--muted` = project muted value.
- `--danger`, `--success`, `--warning` and their `-foreground`, `-soft`, `-soft-foreground` forms carry the values above directly (names match HeroUI).

The project's own `--accent` (violet) and `--accent-strong` are retired in favour of `highlight`.

### Contrast

Computed with `palette.py contrast` (foreground:background).

Light: `ink` on `white` 20.13, on `panel` 18.29, on `panel-target` 19.32; `muted` on `white` 7.56, on `panel` 6.87, on `panel-target` 7.26; `paper` on `primary` 5.61, on `primary-strong` 7.20; `primary` on `white` 5.85, on `panel` 5.32, on `primary-soft` 5.49; `secondary` icon on `panel` 4.90, on `secondary-soft` 5.17; `secondary-soft-foreground` on `secondary-soft` 7.23; `secondary-foreground` on `secondary` 5.39; `highlight` on `white` 5.88, on `panel` 5.34, on `panel-target` 5.65; `line` on `white` 4.84, on `panel` 4.39; `danger-soft-foreground` on `danger-soft` 7.67; `success-soft-foreground` 6.78; `warning-soft-foreground` 8.77; `info-soft-foreground` 8.11; `danger-foreground` on `danger` 6.42; `warning-foreground` on `warning` 8.73.

Dark: `ink` on `field` 14.07, on `panel` 17.00, on `panel-target` 13.87; `muted` on `field` 9.98, on `panel` 12.06, on `panel-target` 9.83; `paper` on `primary` 9.22, on `primary-strong` 12.08; `primary` on `panel` 8.13, on `field` 6.73, on `primary-soft` 6.37; `primary` focus ring on `paper` 9.22; `secondary` icon on `panel` 9.51, on `secondary-soft` 7.76; `secondary-soft-foreground` on `secondary-soft` 11.50; `secondary-foreground` on `secondary` 7.76; `highlight` on `panel` 6.22, on `panel-target` 5.08; `line` on `field` 5.64, on `panel` 6.82, on `panel-target` 5.56; `danger-soft-foreground` 11.14; `success-soft-foreground` 12.32; `warning-soft-foreground` 12.03; `info-soft-foreground` 10.35; `danger-foreground` on `danger` 5.58.

Non-color signals: danger/success/warning/info keep their lucide icon and text plus `role=alert` or polite status; active nav keeps weight 600 and `aria-current`; focus is an outline (shape), not a color shift; tools keep icon + label; output region keeps its "Target" header and separator.

### Redesign Plan

Audit summary (rendered at 375 and 1280 px, light and dark, all 14 routes): components already use semantic tokens (only `lib/tailwind.ts` has literals, which is tool data). Problems solved: (1) brand near-invisible — sky now owns actions/links/focus and teal regions add character; (2) rainbow tool identity — retired for one teal identity; (3) HeroUI variable collisions — mapped into HeroUI's contract; (4) violet with no clear job — now `highlight` only. Survives: violet-free semantic token names `paper`, `panel`, `field`, `ink`, `muted`, `line`, `primary`, `primary-strong`, `primary-soft`, `panel-target`; status soft tints; focus rule; disabled rule.

Per file:

- `ui/src/styles/globals.css`: replace light/dark values; add `secondary*`, `highlight`, `*-soft-foreground`, `*-foreground`, `info-soft*` tokens; remove `accent`, `accent-strong`, all 24 `tool-*` tokens; add HeroUI mappings; cookie banner secondary button → secondary roles.
- `ui/src/lib/presentation.ts`: drop per-tool `accentClasses`; one shared identity class string.
- `ui/src/components/pages/CodecApp.tsx`: nav icons `text-secondary` (active: `text-primary`); brand "64" `text-highlight`; page-identity tile secondary classes; privacy notice success → info; list markers `marker:text-highlight`.
- `ui/src/components/pages/FaqContent.tsx`: icon tile → shared identity classes.
- `ui/src/components/pages/JwtTool.tsx`: `text-tool-jwt` → `text-secondary`; warning → soft-foreground pattern.
- `ui/src/components/pages/AboutContent.tsx`: `marker:text-accent` → `marker:text-highlight`.
- `ui/src/pages/404.astro`: `text-accent-strong`, `text-accent` → `text-highlight`.
- `ui/src/components/ui/ActionButton.tsx`: add `secondary` tone; `ui/src/components/shared/CodecWorkspace.tsx`: Swap uses it; footer counts `text-highlight`.
- `ui/src/components/ui/InlineStatus.tsx`, `ui/src/components/pages/TailwindTool.tsx`, `ui/src/components/shared/EnvBanner.tsx`: status soft-foreground pattern.

Retired tokens and consumers: `accent`/`accent-strong` (CodecApp, AboutContent, 404.astro); `tool-*` (presentation.ts, JwtTool.tsx). Migrate consumers before deleting definitions.

### Rationale

- Brand alternatives beaten: Signal Teal (first pick, later changed), Terminal Indigo, Linen Blue (current), Byte Cyan, Codec Violet and seven warmer options. Sky won for a friendly, low-learning-curve feel that still reads technical.
- Provenance: `ui-ux-pro-max --design-system` suggested orange operation color on dark; used only as mood input. Final families come from the measured-hue harmony procedure and 12-candidate showcases (`.aidd/colors-brand.html`, `.aidd/colors-palette-*.html`).
- Teal and violet flank sky at ±55°, so the palette stays cool and calm (fits a utility) while giving secondary regions and highlights distinct, non-status jobs.

Decisions intentionally deferred:

- A softer decorative divider token (e.g. `gray-200`) separate from `line`; `line` keeps 3:1 everywhere for now.
- Separate `primary-active` fill shade; primary active state keeps no movement and no extra color.
- HeroUI component adoption; only variable mapping is done now.

## Typography

- Heading/body: "IBM Plex Sans", "Segoe UI", ui-sans-serif, system-ui, sans-serif.
- Data/code: "JetBrains Mono", "SFMono-Regular", Consolas, monospace.
- Retain Astro Fonts API self-hosted npm loading for both families at weights 400, 500, 600, 700. No remote CSS.
- Page title: 1.75rem/1.2 below 48rem; 2rem/1.2 from 48rem; weight 700, normal tracking.
- Section heading: 1.25rem/1.4, weight 600. Subheading: 1rem/1.5, weight 600.
- Body: 1rem/1.6, weight 400. Navigation/buttons/fields/code: 0.875rem/1.5, weight 500 for controls,
  400 for data. Metadata: 0.75rem/1.5, weight 400. Group labels: 0.75rem/1.5, weight 600, normal case/tracking.
- Sans for navigation, buttons and prose. Mono for technical values, format names, snippets and metadata.
- Keep font-display, font-sans and font-mono names. Use semantic type utilities instead of local size/leading pairs.

## Spacing and Shape

- Base spacing 0.25rem; steps 0.25, 0.5, 0.75, 1, 1.5, 2, 3rem.
- Gutters 1rem mobile, 2rem from 48rem; main maximum 80rem, prose maximum 65ch.
- Desktop sidebar 15rem; mobile brand header minimum 4rem. Drawer width min(20rem, calc(100vw - 2rem)).
- Page header to primary content 1.5rem; major sections 2rem; related controls 0.5rem; field headers/panels 1rem.
- Control radius 0.375rem; surface radius 0.5rem; tags 9999px. Keep radius-control and radius-surface names.
- Border width 1px with the existing line role. One outside workspace boundary; use internal dividers, not nested cards.
- Default surface, field and sidebar shadow: none. Drawer elevation: 0 1rem 2rem -1rem var(--ink).
- Represent all named layout/type/radius/elevation values once in globals.css. Standard spacing uses Tailwind's
  existing 0.25rem scale; do not redefine its steps per component.

## Interaction

- Shared converter: one outside surface with source, result and compact Convert/Swap/Clear actions. Place actions
  directly after the source editor and before its metadata, so Tab from edited input reaches Convert. Copy output
  stays in the target header. Keep visual, DOM and tab order aligned.
  Preserve existing accessible labels, test IDs and Ctrl/Cmd+Enter, with a visible shortcut hint.
- Below container width 44rem editors stack; at 44rem use two equal minmax(0, 1fr) columns without an action rail.
  Each editor retains its format header and metadata footer. Use internal separators and existing field/panel-target roles.
- Editor minimum height 10rem stacked and 20rem side by side. At container widths ≥ 44rem, source and target panes share
  header, editor, actions and metadata rows through CSS subgrid; target editor spans editor and actions rows. Only the
  source editor resizes vertically. Read-only target and JWT editors remain focusable and selectable without resize.
  Wrap or locally scroll technical values.
- Format controls wrap under their label when required; never squeeze labels or clip values. Minimum control height 2.75rem.
- Navigation: retain existing grouping and labels, unbox the 1rem Lucide icons, preserve tool identity roles and
  primary-soft active background, weight 600 and aria-current. Default weight 500.
- Theme: first visit follows prefers-color-scheme; an explicit theme choice is stored and always wins. The inline
  bootstrap script applies the theme before first paint on every route, including /404.
- Theme control: one sun/moon icon button, without a separate Appearance heading. Retain the existing state-dependent
  aria-label and title (Use light theme / Use dark theme), focus indicator and 2.75rem target. Keep it in the existing
  navigation footer locations; avoid a full-width stretched button or a separate label row.
- Consent: concise copy and compact layout using the existing library. Preserve disclosure of Google analytics and
  personalised advertising, IP/browser information, exclusion of converter input, and how to change or withdraw
  consent. Keep the policy link for full details. Accept all and Reject all retain equal size; Reject all uses the secondary background. Manage choices
  stays visible. Keep existing categories, tracker gating, cookie lifetimes, revision and settings behaviour.
  Use library layout options before scoped CSS; preserve keyboard access and allow internal scrolling on short screens.
- Documentation uses open sections with 2rem separation and a 1px line divider; examples, command snippets and
  warnings may retain bounded surfaces. FAQ keeps native details/summary and existing grouping/content.
- Default: existing field/panel fill and ink. Hover: existing primary border/text for quiet controls, primary-strong
  fill for primary action. Active: existing primary-soft fill for quiet actions; no movement required.
- Focus: 2px outline in existing primary role, 2px offset. Focusable editor frames may use focus-within; target
  must still expose a clearly visible focus indicator. Never rely on a color shift alone.
- Disabled: existing paper fill, muted text and line border; no opacity reduction. Keep current disabled conditions.
- Loading: stable dimensions, existing label with aria-busy; do not introduce artificial delay or new loaders.
- Empty: retain format-specific placeholders, zero metadata and disabled copy; retain existing search no-match message.
  Selectors with no chosen value show a placeholder, never a value that implies a selection.
- Error: nearby existing message with role=alert, danger roles and text. Success: existing polite status and success roles.
- Control transitions 120ms; overlay transitions 180ms; easing cubic-bezier(0.22, 1, 0.36, 1).
  Reduced motion disables spatial transforms and collapses transitions to 0.01ms; no animated page entrances.

## Responsive Behavior

- Mobile first; only viewport breakpoint md at 48rem. Workspace container query remains 44rem.
- Below 48rem retain sticky 4rem brand/header and native modal navigation drawer. Above it use persistent 15rem sidebar.
- Keep converter guidance inside the main column, 2rem after the workspace, so navigation stays sticky through the full page.
- Keep the theme icon button and cookie settings in existing shell locations.
- Action groups wrap with 0.5rem gaps. At 375px editors stack; at 1280px equal source/result columns use recovered space.
- Review the shell and converters at 768px/1024px and both sides of viewport/container transitions, not just endpoints.
- Fresh-visit consent at 375×812 and 390×844 takes at most half the viewport and leaves the heading and Source label
  visible. Keep 2.75rem consent targets; at 320px or enlarged text, prioritise reachable content over that height target.
- JWT has full-width input, actions consistent with the reviewed arrangement, warning, then Header/Payload equal
  columns at md and Signature below; stack on mobile.
- Tailwind keeps its existing mobile stack and desktop two-column controls/visualizations, modes and camera controls.
- No page overflow at 320px or 200% text. Tables/snippets scroll within named regions; keep content and column semantics.
- Standalone controls at least 2.75rem high, icon controls also 2.75rem wide, with 0.5rem gaps. Inline prose links keep
  normal text flow.

## Accessibility

- Retain landmarks, single page h1, ordered headings, skip link, associated labels, descriptions and scoped table headers.
- Keep DOM, visual and tab order aligned. No positive tabindex. Every action works without a pointer.
- Drawer retains focus containment, Escape/backdrop close, focus restoration and background scroll lock.
- Horizontal data regions need an accessible name and keyboard scroll access when content overflows.
- Preserve native disclosure interaction, clipboard error recovery, polite status and immediate error announcements.
- Preserve zoom, forced-color usability, fallback fonts and reduced motion. Do not claim a full accessibility certification.

## Imagery and Icons

- Retain ui/public/logo.png and favicon. BrandLogo remains decorative beside visible Codec64 text.
- Use installed lucide-react icons, imported with Icon suffix, 1rem for navigation/compact controls and 1.25rem
  for principal actions, stroke width 2. Decorative icons are aria-hidden.
- No new imagery, custom SVG, emoji, decorative 3D or icon dependency. Existing functional color-space 3D remains.

## Implementation Notes

- Astro 7 static routes, React 19, HeroUI v3, Tailwind CSS 4; preserve installed versions.
- globals.css is loaded once through Layout.astro; retain Tailwind then HeroUI import order and Astro font setup.
- Add @theme entries for --text-page-title (1.75rem), --text-section-title (1.25rem), --text-subheading (1rem),
  --text-body (1rem), --text-control (0.875rem), --text-meta (0.75rem), with their specified --line-height companions.
  Override --text-page-title to 2rem at md. Use the corresponding semantic utilities in components.
- Keep --font-display, --font-sans, --font-mono, --radius-control, --radius-surface and --breakpoint-md names.
  Add --container-workbench:80rem and --container-reading:65ch, --spacing-sidebar:15rem,
  --spacing-editor-stacked:10rem, --spacing-editor-split:20rem, --spacing-target:2.75rem.
  Define --shadow-surface:none and --shadow-drawer:0 1rem 2rem -1rem var(--ink).
- Keep --default-transition-duration at 120ms; define --duration-overlay:180ms. Keep existing easing variable.
- HeroUI owns --radius and --field-radius: set both to var(--radius-control) after imports, in both themes;
  set --surface-shadow and --field-shadow to none, --overlay-shadow to var(--shadow-drawer).
  Map HeroUI color variables as listed in `## Color`. Verify these names against installed HeroUI styles before editing.
- Consent radius bindings already use project tokens; retain them. Presentation changes are confined to consent copy,
  library layout options and scoped globals.css rules; no tracker/category, consent revision or policy change is needed.
- Theme fallback lives once in lib/theme.ts and is shared by readTheme and THEME_BOOTSTRAP_SCRIPT.
- Use existing ui/shared/pages boundaries, native platform features, existing controls and strict TypeScript.
- Deferred: convert-as-you-type, additional breakpoints, imagery, font changes, richer motion.

## Rationale

- Rendered/source audit supports wider editors, shorter mobile fields and a clear split between workspaces and reading.
- The saturated dark output fill was the heaviest element on every converter; a tint keeps the source/result
  distinction without dominating. Light output (violet-50) already reads calm and stays.
- Following the system theme on first visit is the platform default visitors expect; the stored choice keeps control.
- Compact consent improves the first mobile visit while retaining every choice. An icon-only theme control removes
  a redundant label row; its accessible name already explains the action.
- 48rem viewport breakpoint and 44px targets come from project rules. No new font or component dependency earns its cost.
