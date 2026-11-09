# Design System

## Product Direction

- Codec64 is a browser-only conversion and inspection workbench for developers and technical users.
- Primary jobs: paste, select formats, convert, inspect, select/copy, and consult precise reference material.
- Personality: precise, compact, calm, trustworthy, practical.
- Follow the paste, convert, inspect and copy flow; keep source and result equally legible; frame actual boundaries.
- Keep documentation readable without surrounding every section with a card.
- Preserve brand assets, routes, content, conversion semantics, and privacy guarantees.

## Color

All names below are semantic utilities emitted by `ui/src/styles/globals.css`. Components use these names, never
raw palette colors. Light and dark values use Tailwind CSS 4 default swatches except the mixed dark output panel.

| Token                      | Light / dark                                           | Use                                     |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| `paper`                    | `stone-50` / `slate-950`                               | Page canvas, disabled fill              |
| `panel`                    | `stone-100` / `slate-900`                              | Navigation and grouped surfaces         |
| `field`                    | `white` / `slate-800`                                  | Editable fields and active surfaces     |
| `ink`                      | `stone-950` / `slate-50`                               | Primary text and headings               |
| `muted`                    | `stone-600` / `slate-300`                              | Supporting text and inactive controls   |
| `line`                     | `stone-500` / `slate-400`                              | Borders, dividers, control boundaries   |
| `primary`                  | `blue-700` / `blue-300`                                | Primary action, selection, links, focus |
| `primary-strong`           | `blue-800` / `blue-200`                                | Primary hover and emphasis              |
| `primary-soft`             | `blue-50` / `blue-950`                                 | Selected and informative backgrounds    |
| `accent`                   | `violet-700` / `violet-200`                            | Secondary emphasis                      |
| `accent-strong`            | `violet-800` / `violet-200`                            | Brand numerals and secondary text       |
| `success` / `success-soft` | `green-700` on `green-50` / `green-300` on `green-950` | Completed operations                    |
| `warning` / `warning-soft` | `amber-800` on `amber-50` / `amber-300` on `amber-950` | Unverified or caution states            |
| `danger` / `danger-soft`   | `red-700` on `red-50` / `red-300` on `red-950`         | Errors and destructive states           |

The approved themes are **Linen** (light) and **Blue Hour** (dark). Linen uses one stone neutral family;
Blue Hour uses one slate neutral family. Blue primary actions and violet secondary regions use analogous harmony:
Tailwind shade-500 hue anchors are blue 259.8° and violet 292.7° (32.9° apart). Cyan was considered but violet
preserves the selected Blue Hour identity. Aim for 80% neutral, 15% violet-tinted regions, and 5% blue actions.
No third brand accent. Status and tool identity colors remain sparse functional layers.

`panel-target` maps to `violet-50` in Linen and a 40% `violet-950` / 60% `slate-900` Oklab mix in Blue Hour for
conversion output regions. Their text uses `ink` and `muted`; source fields remain neutral. Primary button text uses
`paper`, including cookie-consent buttons. Existing semantic token names remain the theme contract in
`ui/src/styles/globals.css`.

Measured WCAG contrast (sRGB, palette skill): Linen body on panel 18.11:1, muted on violet output 6.97:1,
button text 6.54:1 (hover 8.47:1), violet emphasis on panel 8.40:1. Blue Hour body on output 16.05:1,
muted on output 11.30:1, button text 11.14:1 (hover 14.18:1), violet emphasis on panel 12.83:1.
Output borders are 4.38:1 in Linen and 6.39:1 in Blue Hour; borders require 3:1 and are not text colors.

Tool identity uses a foreground, soft background, and matching border for each tool: Base64 `cyan-800/50` and
`cyan-300/950`; URL `blue-700/50` and `blue-300/950`; Query `amber-800/50` and `amber-300/950`; JWT
`rose-700/50` and `rose-300/950`; Python `emerald-700/50` and `emerald-300/950`; Timestamp `violet-700/50`
and `violet-300/950`; FAQ `sky-800/50` and `sky-300/950`. Identity color never carries state meaning alone.

Normal text and interactive states must meet WCAG AA: 4.5:1 for normal text and 3:1 for large text, icons,
focus indicators, and control boundaries. `accent` is decorative or large/bold only; use `accent-strong` for normal
text. Theme roles keep identical meaning in light and dark modes.

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

- Shared converter: one outside surface with source, result and compact Convert/Swap/Clear actions; Copy output
  stays in the target header. A full-width top toolbar is the starting prototype, not a fixed tab-order requirement.
  In the early Base64 review, compare source-adjacent actions if reaching Convert after editing requires awkward
  backtracking. Select and document the arrangement before extending it; keep visual, DOM and tab order aligned.
  Preserve existing accessible labels, test IDs and Ctrl/Cmd+Enter, with a visible shortcut hint.
- Below container width 44rem editors stack; at 44rem use two equal minmax(0, 1fr) columns without an action rail.
  Each editor retains its format header and metadata footer. Use internal separators and existing field/panel-target roles.
- Editor minimum height 10rem stacked and 20rem side by side. Retain vertical resize for source; target is read-only,
  focusable and selectable. JWT outputs also remain read-only and selectable. Wrap or locally scroll technical values.
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
  consent. Keep the policy link for full details. Accept all and Reject all retain equal prominence; Manage choices
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
  Do not override HeroUI color variables. Verify these names against installed HeroUI styles before editing.
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
