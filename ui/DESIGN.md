---
name: Codec Bench
description: Browser-only developer conversions with precise, clean, low-friction controls.
colors:
  paper: "oklch(97.5% 0.006 85)"
  panel: "oklch(98.8% 0.003 85)"
  field: "oklch(100% 0 0)"
  ink: "oklch(20.8% 0.042 265.755)"
  muted: "oklch(44.6% 0.043 257.281)"
  line: "oklch(64% 0.009 80)"
  instrument-blue: "oklch(48.8% 0.243 264.376)"
  instrument-blue-strong: "oklch(42.4% 0.199 265.638)"
  syntax-orange: "oklch(55.3% 0.195 38.402)"
  syntax-orange-strong: "oklch(47% 0.157 37.304)"
  success: "oklch(48.8% 0.243 264.376)"
  danger: "oklch(47% 0.157 37.304)"
  dark-paper: "oklch(13.2% 0.025 260)"
  dark-panel: "oklch(18.5% 0.028 260)"
  dark-field: "oklch(23.5% 0.03 260)"
  dark-ink: "oklch(96.8% 0.007 247.896)"
  dark-muted: "oklch(70.4% 0.04 256.788)"
  dark-line: "oklch(52% 0.035 258)"
  dark-instrument-blue: "oklch(70.7% 0.165 254.624)"
  dark-instrument-blue-strong: "oklch(80.9% 0.105 251.813)"
  dark-syntax-orange: "oklch(75% 0.183 55.934)"
  dark-syntax-orange-strong: "oklch(83.7% 0.128 66.29)"
  dark-success: "oklch(70.7% 0.165 254.624)"
  dark-danger: "oklch(83.7% 0.128 66.29)"
typography:
  display:
    fontFamily: "IBM Plex Sans, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "IBM Plex Sans, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.333
    letterSpacing: "-0.025em"
  title:
    fontFamily: "IBM Plex Sans, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "IBM Plex Sans, Segoe UI, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  control:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.429
  label:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "0.1em"
  code:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.714
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  pill: "9999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.instrument-blue}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.instrument-blue-strong}"
    textColor: "{colors.paper}"
  button-quiet:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.75rem"
  textarea:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "1rem"
  select:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    typography: "{typography.control}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.75rem"
  workspace:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1.25rem"
---

# Design System: Codec Bench

## Overview

**Creative North Star: "Clean Room"**

Codec Bench behaves like a clean room for technical data: crisp, modern, fast, and free of distractions. Warm Paper in light mode and Deep Navy in dark mode separate tools from fields while Instrument Blue identifies action and Syntax Orange carries identity and caution.

Controls stay restrained and familiar. Clear hierarchy, conventional interactions, and consistent 2.75rem targets let developers begin work without learning an interface. Responsive behavior changes structure at 48rem; typography stays stable and task-focused.

The system rejects cluttered converter sites such as base64decode.org: dense secondary content, weak hierarchy, dated square buttons, and outdated dropdown styling.

**Key Characteristics:**

- Clear source → action → target workflow
- Warm Paper light surfaces and Deep Navy dark surfaces
- Instrument Blue for action; Syntax Orange for identity and caution
- Restrained, familiar controls with consistent 2.75rem targets
- Crisp structural borders with purposeful lift

## Colors

Warm Paper and Deep Navy provide quiet structure; Instrument Blue signals interaction; Syntax Orange marks brand identity, caution, and destructive feedback.

### Primary

- **Instrument Blue** (`colors.instrument-blue`): primary actions, focus rings, interactive hover states, and active data channels.
- **Strong Instrument Blue** (`colors.instrument-blue-strong`): primary-action hover state only.

### Secondary

- **Syntax Orange** (`colors.syntax-orange`): brand slash, page context, and limited caution emphasis.
- **Strong Syntax Orange** (`colors.syntax-orange-strong`): danger text and high-contrast orange states.

### Neutral

- **Warm Paper** (`colors.paper`): calm off-white page canvas in light mode.
- **Warm Panel** (`colors.panel`): near-white navigation, workspaces, and grouped content in light mode.
- **Clean Field** (`colors.field`): editable controls and active navigation.
- **Deep Slate Ink** (`colors.ink`): headings and primary text.
- **Quiet Slate** (`colors.muted`): supporting text and inactive controls.
- **Structural Line** (`colors.line`): dividers, field borders, and structural outlines with 3:1 boundary contrast.
- **Deep Navy counterparts** (`colors.dark-paper` through `colors.dark-danger`): preserve semantic roles under dark color scheme; never swap role meaning.

### Named Rules

**The Action Color Rule.** Instrument Blue belongs to primary actions, current selection, focus, and state feedback. It is never ambient decoration.

**The Orange Signal Rule.** Syntax Orange stays rare: brand slash, page context, caution, and danger only.

## Typography

**Display Font:** IBM Plex Sans with Segoe UI and system fallbacks  
**Body Font:** IBM Plex Sans with Segoe UI and system fallbacks  
**Label/Mono Font:** JetBrains Mono with SFMono-Regular and Consolas fallbacks

**Character:** Friendly sans typography keeps navigation and prose immediately readable. Monospace controls expose technical structure without turning the whole interface into a terminal.

IBM Plex Sans and JetBrains Mono load once per document from Google Fonts with `display=swap` and preconnect hints. System fallbacks keep text visible and the application usable when the CDN is slow or blocked. This approved external request can expose visitor network metadata to Google; converter input never enters font requests.

### Hierarchy

- **Display** (`typography.display`): page titles only; balanced wrapping and tight but readable spacing.
- **Headline** (`typography.headline`): major explanatory sections.
- **Title** (`typography.title`): cards, decoded groups, and FAQ questions.
- **Body** (`typography.body`): instructions and explanation; prose stays within roughly 65 characters.
- **Control** (`typography.control`): buttons and format selectors.
- **Label** (`typography.label`): compact source, target, and navigation-group labels; uppercase is reserved for these structural labels.
- **Code** (`typography.code`): editable data, output, and inline technical values.

### Named Rules

**The Technical Voice Rule.** Monospace belongs to data and compact controls. Never use it for long explanations or whole-page atmosphere.

## Elevation

Lifted surfaces separate active work from supporting content. Workspaces, cards, and active navigation use a shallow structural shadow; the mobile drawer uses the stronger overlay shadow. Tonal contrast and borders remain visible, so shadows support hierarchy instead of manufacturing it.

### Shadow Vocabulary

- **Raised Low** (`0 1px 3px rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): workspaces, content containers, and active navigation.
- **Drawer Lift** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): mobile navigation drawer only.

### Named Rules

**The Lifted, Never Floaty Rule.** Use one structural border plus compact shadow vocabulary. Never add wide ambient glow or decorative glass blur.

## Components

Components feel restrained and familiar: standard controls, consistent dimensions, clear states, no invented interaction grammar.

### Buttons

- **Shape:** gently curved rectangle (`rounded.md`) with 2.75rem minimum height.
- **Primary:** Instrument Blue fill, paper text, and matching border; use for one leading action such as Convert.
- **Hover / Focus:** strong blue hover; 2px Instrument Blue outline with 2px offset; 150–200ms state transitions; 1px downward active movement where specified.
- **Quiet:** panel fill, ink text, and Structural Line border; hover shifts border and text to Instrument Blue.
- **Disabled:** paper fill, muted text, line border, and no pointer affordance.

### Cards / Containers

- **Corner Style:** compact 0.75rem workspace corners; nested channels use 0.5rem.
- **Background:** panel for outer workspaces, field for source and target channels.
- **Shadow Strategy:** Raised Low on outer containers; nested channels rely on borders only.
- **Border:** single Structural Line stroke.
- **Internal Padding:** 0.75rem on mobile and 1.25rem from 48rem.

### Inputs / Fields

- **Style:** field background, line border, 0.5rem corners, and monospace content. Textareas use 1rem padding; selectors use 0.5rem by 0.75rem.
- **Focus:** border shifts to Instrument Blue with a restrained 3px translucent blue ring.
- **Error / Disabled:** danger uses Strong Syntax Orange; disabled fields use paper and muted text without hiding content.

### Navigation

Desktop navigation uses a fixed 16rem sidebar and 2.75rem links. Inactive links are quiet; hover gains a field surface; active links use field fill, raised-low shadow, stronger type, and restrained Syntax Orange emphasis. Below 48rem, navigation becomes a focus-trapped drawer with explicit close and backdrop controls.

### Conversion Workspace

Source and target fields sit inside one shared lifted workspace. Mobile stacks source, actions, and target; desktop places actions between equal-width channels. Swap, Convert, and Clear remain distinct actions with direct labels and predictable state.

## Do's and Don'ts

### Do:

- **Do** preserve source → action → target hierarchy on every converter.
- **Do** use 2.75rem minimum targets, visible focus, keyboard operation, and WCAG 2.2 AA contrast.
- **Do** reserve Instrument Blue for action and Syntax Orange for identity, caution, and danger.
- **Do** keep technical data monospace and explanatory text sans-serif.
- **Do** support light, dark, 320px-wide, 200% text, and reduced-motion contexts.

### Don't:

- **Don't** build cluttered converter sites such as base64decode.org with dense secondary content or weak hierarchy.
- **Don't** use dated square buttons or outdated dropdown styling.
- **Don't** add decorative gradients, glassmorphism, wide glow, or animated spectacle.
- **Don't** place explanatory content inside the primary conversion path when it can follow the workspace.
- **Don't** invent unfamiliar controls when native buttons, selects, textareas, details, and links cover the task.
