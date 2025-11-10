# Repository Guidelines

Toilet-go-where is a Vite-powered React app that locates nearby public toilets using Gemini APIs. Follow the practices below to keep contributions predictable and production-ready.

## Project Structure & Modules
- `App.tsx` holds global state (location, filters) and wires UI flow; treat it as the orchestration layer.
- `components/MapView.tsx` renders the Leaflet map; add new UI pieces as sibling components under `components/`.
- `services/geminiService.ts` centralizes AI calls; extend this module rather than calling APIs directly from views.
- `types.ts` defines shared interfaces; introduce new domain types here for consistency.
- Static assets live in `index.html` and `metadata.json`; configuration is in `vite.config.ts`.

## Build, Test, and Development Commands
- `npm install` pulls dependencies; rerun after adding packages so lockfiles stay current.
- `npm run dev` starts Vite with hot reload at `http://localhost:5173`.
- `npm run build` emits production assets to `dist/`; use before shipping or testing deployment.
- `npm run preview` serves the built files locally to validate the production bundle.

## Coding Style & Naming Conventions
- Use TypeScript with ES modules, 2-space indentation, and semicolons (match existing files).
- Components and hooks use `PascalCase`; helper functions stay `camelCase`; booleans read positively (`isFinding`).
- Stick to React function components with hooks; co-locate UI-specific styles via Tailwind-friendly class strings.
- Keep API and map logic in service/helpers; only pass serializable props into components.

## Testing Guidelines
- No automated tests exist yet; favor React Testing Library + Vitest when adding coverage.
- Place specs beside the subject file (e.g., `components/MapView.spec.tsx`) and mirror the filename.
- Aim for baseline coverage of new logic branches and mocked network calls.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`) as in `feat: Initialize findtoilet application`.
- Each PR should describe the user-facing change, list key commands run (`npm run build`, tests), and link tracking issues.
- Include screenshots or screen recordings when UI shifts, and note any new env vars or migrations.

## Security & Configuration
- Store secrets in `.env.local`; the app expects `GEMINI_API_KEY=your-key`.
- Never commit `.env` files or API responses; redact request IDs when sharing logs.
