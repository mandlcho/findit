# findit — fast nearby toilets (and ATMs)

A lightweight, mobile-first web app for quickly finding nearby toilets when you’re out and time matters.

It prioritizes:
- **fast time-to-value** (few taps, quick results)
- **clear relevance** (nearby, filtered)
- **privacy-aware defaults** (no accounts, minimal data retention)
- **accessibility as a baseline** (works under real-world constraints)

## Context / problem
When nature calls, people often rely on fragmented info (outdated lists, random blog posts), or walking around and hoping. That’s a poor experience in a time-sensitive moment.

This project explores a simple public-facing service: “nearest toilets, right now”.

## Users
Primary:
- commuters and people in transit
- families with young kids
- elderly users
- tourists / unfamiliar with the area

Secondary (if productionized):
- facility operators who want quicker feedback when listings are wrong

## Goals (success criteria)
If this shipped as a public service, success looks like:
- **Time-to-first-result**: user sees nearby results quickly after load
- **Time-to-action**: user taps a location or opens directions with minimal friction
- **Useful result rate**: users confirm results are accurate/open
- **Coverage / data quality**: improved completeness and lower correction rate over time

Guardrails:
- avoid collecting/storing sensitive location data unnecessarily
- maintain acceptable latency and graceful degradation when permissions are denied

## Non-goals (for now)
- user accounts, personalization, or history
- “perfect data” (this prototype expects imperfect POIs and focuses on iteration)
- complex routing, indoor navigation, or facility ownership workflows

## What it does (current MVP)
- requests approximate location (browser geolocation)
- displays nearby POIs on a map
- supports categories:
  - **Toilets** (with filters like wheelchair/diaper where available)
  - **ATMs** (secondary “nearby essentials” category)

## Data sources (current approach)
This prototype uses deterministic, public sources by default:
- **OpenStreetMap (Overpass)** for POIs (toilets, ATMs)
- **Nominatim** (OpenStreetMap) for reverse geocoding (friendly place names and addresses)

### Nominatim usage notes (reliability + compliance)
This project adds basic client-side safeguards:
- in-memory caching for reverse geocode results (rounded lat/lng + TTL)
- debouncing reverse-geocode lookups triggered by popups

Note: Nominatim’s policy asks for a descriptive User-Agent. In a browser app, the `User-Agent` header cannot be overridden by JavaScript; for production usage you should route requests through your own backend/proxy where you can set a compliant User-Agent and enforce rate limits.

If productionized, I’d also add stronger caching + rate limiting, and optionally incorporate official/curated datasets to improve coverage and attribute quality.

## Privacy, security, accessibility (operational considerations)
- Location is sensitive. The app is designed to work without accounts.
- Handles denied geolocation without breaking the experience.
- Accessibility improvements to prioritize next:
  - large text + higher contrast
  - keyboard navigation + screen reader labeling

## Risks & constraints
- POI accuracy varies (stale listings, missing attributes)
- location permission denial reduces usefulness
- external API dependencies (latency, quotas, reliability)
- accessibility requirements need deliberate QA

## Rollout / iteration plan (if this were real)
1) MVP: show nearby results reliably, capture lightweight feedback
2) Data quality loop: user-reported corrections, validation, dedupe
3) Accessibility hardening + performance improvements
4) Expand coverage and add deterministic datasets

## Run locally
Prerequisites: Node.js

```bash
npm install
npm run dev
```

## Deploy
```bash
./scripts/run-pages-workflow.sh [branch]
```

## Tech stack
- React + TypeScript + Vite
- Map rendering in `components/MapView`
- Services in `services/` (Overpass + Nominatim)
