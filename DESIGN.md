# Design System

## Product Direction

- **Product:** Codec Bench, browser-only text encoding and developer-data conversion tools.
- **Audience:** Developers and technical users working quickly with Base64, URLs, query parameters, JWTs, Python
  literals, JSON, and timestamps.
- **Primary jobs:** Paste data, choose explicit formats, convert, inspect, copy, and understand supported semantics.
- **Brand personality:** precise, quiet, trustworthy, technical, fast.
- **Creative north star — Clean Room:** keep source → action → target obvious; separate data fields from supporting
  content; show privacy and limitations plainly; avoid decorative UI that competes with data.

## Visual Foundation

### Color

All names below are semantic utilities emitted by `ui/src/styles/globals.css`. Components use these names, never
raw palette colors. Light and dark values are Tailwind CSS 4 default swatches.

| Token                      | Light / dark                                           | Use                                             |
| -------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| `paper`                    | `stone-50` / `slate-950`                               | Page canvas, disabled fill                      |
| `panel`                    | `neutral-50` / `slate-900`                             | Navigation and grouped surfaces                 |
| `field`                    | `white` / `slate-800`                                  | Editable fields and active surfaces             |
| `ink`                      | `slate-900` / `slate-50`                               | Primary text and headings                       |
| `muted`                    | `slate-600` / `slate-400`                              | Supporting text and inactive controls           |
| `line`                     | `stone-500` / `slate-500`                              | Borders, dividers, control boundaries           |
| `primary`                  | `blue-700` / `blue-400`                                | Primary action, selection, links, focus         |
| `primary-strong`           | `blue-800` / `blue-300`                                | Primary hover and emphasis                      |
| `primary-soft`             | `blue-50` / `blue-950`                                 | Selected and informative backgrounds            |
| `accent`                   | `orange-600` / `orange-400`                            | Brand slash and limited large-text context      |
| `accent-strong`            | `orange-700` / `orange-300`                            | Normal-size accent text when contrast is needed |
| `success` / `success-soft` | `green-700` on `green-50` / `green-300` on `green-950` | Completed operations                            |
| `warning` / `warning-soft` | `amber-800` on `amber-50` / `amber-300` on `amber-950` | Unverified or caution states                    |
| `danger` / `danger-soft`   | `red-700` on `red-50` / `red-300` on `red-950`         | Errors and destructive states                   |

Tool identity uses a foreground, soft background, and matching border for each tool: Base64 `cyan-800/50` and
`cyan-300/950`; URL `blue-700/50` and `blue-300/950`; Query `amber-800/50` and `amber-300/950`; JWT
`rose-700/50` and `rose-300/950`; Python `emerald-700/50` and `emerald-300/950`; Timestamp `violet-700/50`
and `violet-300/950`; FAQ `sky-800/50` and `sky-300/950`. Identity color never carries state meaning alone.

Normal text and interactive states must meet WCAG AA: 4.5:1 for normal text and 3:1 for large text, icons,
focus indicators, and control boundaries. `accent` is decorative or large/bold only; use `accent-strong` for normal
text. Theme roles keep identical meaning in light and dark modes.

### Typography

- Heading/body: `"IBM Plex Sans", "Segoe UI", ui-sans-serif, system-ui, sans-serif`.
- Technical/control: `"JetBrains Mono", "SFMono-Regular", Consolas, monospace`.
- Display: `2.25rem/1.25`, weight 700; page title only. Headline: `1.5rem/1.333`, weight 700. Title:
  `1.25rem/1.4`, weight 700. Body: `1rem/1.75`, weight 400. Control/code: `0.875rem/1.714`, weights 400–600.
  Structural label: `0.75rem/1.333`, weight 600, `0.1em` tracking.
- Sans handles prose and navigation; monospace handles data, metadata, compact labels, and controls. Prose width
  targets 65 characters. Uppercase appears only on short structural labels.
- Google Fonts load once in `Layout.astro` with `display=swap`; listed system fallbacks remain usable offline.

### Spacing and Shape

- Base spacing: `0.25rem`; common steps: `0.5rem`, `0.75rem`, `1rem`, `1.25rem`, `2rem`, `3rem`.
- Main content: mobile gutter `1rem`, desktop gutter `2rem`; readable content maximum `72rem`; prose maximum
  `65ch`. Desktop sidebar width `16rem`.
- Layout: one column by default; at `48rem`, persistent sidebar and wider compositions. Conversion workspaces use
  their `44rem` container query to become equal source/target columns around a `7.5rem` action rail.
- Radius: small `0.375rem`, control `0.75rem`, surface `1rem`, pill `9999px`. One border per boundary.
- Elevation: `shadow-sm` for active work surfaces and navigation; `shadow-lg` only for mobile drawer. No glow,
  glass blur, or decorative gradient.

## Interaction

- **Buttons:** one primary action per context; quiet secondary actions use field fill and line border. Minimum
  `2.75rem` height; icon-only controls also minimum `2.75rem` width and require accessible names.
- **Inputs:** visible label or group name, field fill, line border, monospace value, explicit format selector. Focus
  changes border to primary and adds a 3px soft primary ring. Never use placeholder as sole label.
- **Links/navigation:** underline links in prose. Navigation uses quiet default, field hover, and primary-soft active
  state with `aria-current`.
- **Cards:** panel outside, field inside; border carries structure, shadow carries hierarchy. Entire cards are not
  clickable unless one clear destination exists.
- **Overlays:** native dialog semantics, focus containment, Escape/backdrop close, trigger focus restoration, page
  scroll lock. Drawer uses strong elevation only.
- **States:** hover = color/border shift; focus = visible 2px outline with 2px offset; active = optional 1px downward
  movement; disabled = muted text, paper fill, line border, no pointer affordance; loading = keep dimensions stable
  and expose `aria-busy`; empty = brief next action, never blank; error = nearby plain-language message with
  `role="alert"`; success = nearby `aria-live` status. Color always pairs with text or iconography.
- Motion duration `180ms`, easing `cubic-bezier(0.22, 1, 0.36, 1)`. Use motion only for state or spatial
  continuity. Under `prefers-reduced-motion: reduce`, transitions collapse to `0.01ms`; add no scroll spectacle.

## Responsive Behavior

- Mobile first. One viewport breakpoint: `md` at `48rem`, per project UI rules. Component container query at
  `44rem` controls conversion workspace only.
- Below `48rem`: sticky header, modal navigation drawer, stacked source/actions/target, full-width selectors, `1rem`
  gutters. At and above `48rem`: persistent `16rem` sidebar, larger gutters, inline selectors.
- Support 320px width without horizontal page scroll and 200% text without loss of content or controls. Technical
  values may wrap or scroll inside their own field.
- Interactive targets: minimum `2.75rem × 2.75rem`; adjacent targets: minimum `0.5rem` gap.

## Accessibility

- Use semantic landmarks, heading order, native controls, associated labels, and `aria-describedby` for help or
  errors. Conversion order and tab order must match.
- All work remains keyboard-operable. Provide skip link; do not add positive `tabindex`; restore focus after modal
  close. Keyboard shortcuts supplement visible controls and never replace them.
- Focus indicators remain visible in both themes. Do not remove outlines without equivalent replacement.
- Announce errors immediately and success/status updates politely. Do not communicate tool, validation, or state by
  color alone.
- Preserve browser zoom, reduced-motion preference, high-contrast usability, and readable fallbacks when remote
  fonts fail.

## Imagery and Icons

- Use installed `lucide-react` outline icons, imported with `Icon` suffix. Standard sizes: `1rem`, `1.125rem`, or
  `1.25rem`; stroke width `1.8–2`.
- Icons support labels; they do not replace labels except in familiar compact controls with accessible names and
  tooltips. No emoji, hand-authored SVG, stock photography, 3D art, or decorative illustration in core workflows.

## Implementation Notes

- Stack: Astro 7 static output, React 19 islands, HeroUI v3, Tailwind CSS 4.
- Single global stylesheet: `ui/src/styles/globals.css`, loaded once by `ui/src/layouts/Layout.astro`.
- Global stylesheet imports `tailwindcss`, then `@heroui/styles`; semantic utilities are emitted from one
  `@theme static` block. Components may use HeroUI v3 compound components without a provider.
- Prefer HeroUI semantic variants and existing local controls. Keep conversions browser-only; never send input to
  external services.
- Decisions intentionally deferred: self-hosting fonts; richer motion; additional viewport breakpoints; imagery.
  Add only after measured product need.

## Rationale

Direction preserves Codec Bench's established Clean Room system. UI UX Pro Max developer-tool guidance supports
minimalism, dark-mode readiness, blue focus, direct documentation, 44px targets, visible focus, nearby announced
errors, and explicit labels. Its generic newsletter and exaggerated-editorial matches conflict with fast technical
conversion work, so they are excluded. Tailwind default swatches replace prior custom OKLCH values for reproducible
theme utilities and clearer maintenance.
