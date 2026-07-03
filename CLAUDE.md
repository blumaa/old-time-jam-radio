# The Old-Time Dial

Mobile-first PWA practice tool for old-time musicians. Skeuomorphic 1940s tabletop radio interface.

## Stack
- Next.js 16 (App Router), React 19, TypeScript
- Vanilla CSS only (no Tailwind, no CSS-in-JS)
- GSAP (Draggable + InertiaPlugin for rotary controls)
- SoundTouchJS (pitch-preserved speed control)
- Web Audio API
- Cloudflare R2 (audio storage + manifest)
- Vitest + Testing Library (TDD)

## Conventions
- TDD: write tests first, then implement
- KISS, SOLID, DRY, SSOT
- Smart + Presentational component pattern (Radio.tsx = smart, all controls = presentational)
- Types defined in `app/radio/types.ts` (SSOT)
- Vanilla CSS in `styles/` folder with CSS custom properties
- Co-located tests in `__tests__/` folders
- No React Context — props only (shallow tree)

## Commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm test` — run Vitest
- `npm run lint` — ESLint

## Architecture
- `app/radio/` — main radio feature (smart component + presentational components + hooks + audio engine)
- `app/admin/` — password-protected admin page for manifest management
- `app/api/` — API routes for R2 manifest read/write
- `styles/` — vanilla CSS files
- `scripts/` — Python offline tooling (key detection, Slippery Hill scraper)

@~/.claude/AGENTS-COMPACT.md
