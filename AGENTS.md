# Repository Guidelines

## Project Structure & Module Organization

Application lives in `ui/`, an Astro 7 site with React islands and Tailwind CSS 4. Put routes in `ui/src/pages/`, page components in `ui/src/components/pages/`, shared compositions in `ui/src/components/shared/`, and reusable controls in `ui/src/components/ui/`. Layouts, styles, and codec logic belong in `src/layouts/`, `src/styles/`, and `src/lib/`. Static files live in `ui/public/`.

Keep unit tests beside source as `*.test.ts` or `*.test.tsx`. Browser tests live in `ui/e2e/`; Playwright page objects live in `ui/pages/`. Generated `.astro/`, `dist/`, and `test-results/` content must not be edited.

## Build, Test, and Development Commands

Run commands from `ui/` with pnpm:

- `pnpm dev --host 0.0.0.0` — start Astro development server.
- `pnpm build` — create production output in `dist/`.
- `pnpm typecheck` — run Astro and TypeScript checks.
- `pnpm test` — run Vitest unit/component tests once.
- `pnpm exec playwright test --max-failures=1` — run end-to-end tests.
- `pnpm exec eslint .` — lint TypeScript and React code.
- `pnpm exec prettier --check .` — verify formatting; use `--write` to fix it.

## Coding Style & Naming Conventions

Use strict TypeScript; avoid `any`. Prettier enforces two-space indentation, semicolons, trailing commas, and a 120-character line width. Use PascalCase for React component files and exported components, camelCase for functions and variables, and descriptive feature names rather than visual names. Prefer Tailwind utilities and existing values from `globals.css`. Use `lucide-react` icons instead of inline SVG.

Keep implementation minimal. Reuse platform features and installed dependencies before adding abstractions or packages. Add `data-testid` to components, buttons, and tables used by browser tests.

## Testing Guidelines

Use Vitest with Testing Library for unit and component behavior. Use Playwright page objects for browser flows; tests express intent and own assertions. Follow red-green-refactor. During debugging, stop at first failure with `pnpm test -- --bail=1` or Playwright `--max-failures=1`. Add regression tests beside every bug fix.

## Git & Deploy

Never run GIT or deploy. The user will review changes before deploying.

## Security & Deployment

Conversions must remain browser-only; never transmit user input. `codec64.com` deploys as static content through GitHub Pages, which controls response headers and CDN caching. Preserve `public/CNAME`, `.nojekyll`, and security exceptions documented in `zap.conf`.
