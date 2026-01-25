# findit — Find toilets (and ATMs) near you, fast

A mobile-first web app that helps you quickly locate nearby public toilets when you’re out and need one.

This project is intentionally framed like a **citizen digital service prototype**: minimal friction, privacy-aware location use, and clear paths to improve data quality over time.

## Why this exists (problem)
When nature calls, the problem is time-sensitive and stressful. People often rely on:
- fragmented information (random blog posts, outdated listings)
- “walk around and hope”
- asking staff (not always possible)

A simple “nearest toilets, right now” experience is a small but real-quality-of-life digital service.

## Who it’s for (users)
Primary users:
- commuters and people in transit
- families with young kids
- elderly users
- tourists / unfamiliar with the area

Secondary users (operators, if this were productionized):
- facility operators who want faster feedback on incorrect listings

## What it does
- Requests your approximate location (browser geolocation)
- Shows nearby points on a map
- Supports categories:
  - **Toilets** (with filters like wheelchair/diaper where available)
  - **ATMs** (as an alternate “nearby essentials” demo category)

## Data sources (current)
This is a prototype and uses a mix of sources:
- **OpenStreetMap (Overpass)** for POI discovery (e.g., ATMs)
- An LLM-assisted step (Gemini) for:
  - reverse geocoding (turning coordinates into a friendly place name)
  - toilet discovery/normalization (prototype approach)

In a public-service setting, I’d prioritize **deterministic sources** (official datasets, contracted providers, or curated POIs) and treat LLM usage as optional.

## Privacy & security notes
- Location is sensitive data.
- The app is designed to work without accounts.
- In a production version, we would:
  - avoid storing raw location server-side
  - minimize logs that might contain coordinates
  - provide clear consent and an opt-out path

## Accessibility & reliability
This should work well in real-world conditions:
- handles denied geolocation (shows status and does not crash)
- aims for low-tap, fast discovery

Future accessibility improvements:
- large text mode
- higher contrast mode
- keyboard navigation and screen reader labeling

## How to know it’s working (outcomes)
If deployed as a citizen-facing service, I’d track:
- time-to-first-result (from page load to nearest POIs shown)
- time-to-action (tap a toilet/ATM pin or open directions)
- “useful result rate” (user indicates the listing was accurate/open)
- coverage density (POIs per area) and correction rate

## Next iterations
- **Data quality loop**: “Is this listing accurate/open?” feedback to improve POIs
- **Graceful fallback**: allow searching by MRT station / landmark when location is denied
- **Accessibility upgrades**: large text + contrast, better labels, reduced motion
- **Offline-ish support**: cache last known results (with clear privacy messaging)

## Run locally
**Prerequisites:** Node.js

1. Install dependencies
   ```bash
   npm install
   ```
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run the app
   ```bash
   npm run dev
   ```

## Deploy
This repo includes a helper script to dispatch the GitHub Pages workflow:

```bash
./scripts/run-pages-workflow.sh [branch]
```

The branch defaults to `main`.

## Tech stack
- React + TypeScript
- Vite
- Map rendering in `components/MapView`
- Services in `services/` (Gemini + OSM)

## Service notes
This repo is written like a small public-facing service:
- user need first, then implementation
- privacy and accessibility as default constraints
- measurable outcomes and an iteration plan
