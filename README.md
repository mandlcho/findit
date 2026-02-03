<div align="center">
<img width="256" height="256" alt="FindToilet Icon" src="./magnify-icon.png" />
</div>

# FindToilet (now _FindIt_) 🚽

> A personal hackathon project that solves a real-world problem: finding the nearest public toilets when you need them most.

## The Story: How This Started

### The Problem
During a weekend in Singapore, I faced an urgent situation—I desperately needed to find a public toilet nearby with no idea where to look. I could use Google Maps for restaurants, ATMs, or hospitals, but there was no easy way to search for public restrooms with specific amenities (free, wheelchair accessible, etc.). 

**Thought Process**: If something this common is hard to find, maybe others face the same problem. What if I could build a tool that combines real-time geolocation with AI to make toilet discovery effortless?

### Building It
Instead of another feature request, I decided to solve it myself. This hackathon project reverse-engineered the problem and built a working solution in a single sprint.

---

## What FindToilet Does

An AI-powered web app that:
- 📍 Locates nearby public toilets using your current position
- 🤖 Understands natural language queries ("find a wheelchair-accessible toilet near me")
- 🗺️ Displays results on an interactive map
- 🔍 Filters by amenities: free access, wheelchair accessibility, diaper changing facilities
- 🏗️ Reverse-engineers toilet locations from OpenStreetMap data

**Live Demo**: [FindToilet on GitHub Pages](https://mandlcho.github.io/findit/)

---

## Building FindToilet From Scratch: The Checklist

This is the architecture I reverse-engineered when rebuilding this app. Follow this to understand the full stack:

### Layer 1: Frontend Architecture
- [ ] **Entry Point** (`index.html` + `index.tsx`)
  - Set up React with TailwindCSS and Leaflet map styling
  - Configure importmap for CDN-based module loading
  - Root element for React mounting

- [ ] **Global State & Orchestration** (`App.tsx`)
  - Manage location state (geolocation permissions + coordinates)
  - Handle filter state (free, wheelchair, diaper)
  - Orchestrate user interactions (find, filter, map pan/zoom)
  - Toggle between toilet and ATM search modes

- [ ] **Map Component** (`components/MapView.tsx`)
  - Render Leaflet map with user location marker
  - Display toilet/ATM markers as popups
  - Handle viewport changes (pan, zoom, bounds)
  - Show addresses and facility details on hover/click

- [ ] **Type Definitions** (`types.ts`)
  - `Location`: { lat, lng }
  - `Toilet`: { id, name, location, address, fee, wheelchair, diaper, category }
  - `PlaceCategory`: "toilet" | "atm"

### Layer 2: Services (API Integration)
- [ ] **Geolocation & Reverse Geocoding** (`services/geminiService.ts`)
  - Request browser geolocation with permission checks
  - Call Nominatim API to convert coordinates → human-readable addresses
  - Query Overpass API for toilets near stations/amenities
  - Parse OSM data and map to Toilet schema

- [ ] **ATM Search Service** (`services/osmService.ts`)
  - Query Overpass API for ATM nodes/ways/relations
  - Extract operator, network, brand metadata
  - Convert OSM tags to standardized format

### Layer 3: Configuration & Build
- [ ] **TypeScript Configuration** (`tsconfig.json`)
  - Target ES2022
  - Enable JSX mode (react)
  - Path alias: `@` → project root

- [ ] **Vite Build Setup** (`vite.config.ts`)
  - Configure base path for GitHub Pages (`/findit/`)
  - Inject environment variables (GEMINI_API_KEY)
  - Dev server on port 3000
  - React plugin for JSX compilation

- [ ] **Package Dependencies** (`package.json`)
  - React 18 + ReactDOM
  - Vite (dev)
  - TypeScript (dev)
  - Leaflet + react-leaflet (maps)
  - @google/genai (AI integration—currently unused but prepared)

### Layer 4: Deployment Pipeline
- [ ] **GitHub Pages Workflow** (`.github/workflows/pages.yml`)
  - Trigger on push to `main` or manual dispatch
  - Node 20 + npm install → npm run build
  - Upload `dist/` artifact
  - Deploy to https://{owner}.github.io/findit/

- [ ] **Helper Script** (`scripts/run-pages-workflow.sh`)
  - Automate workflow dispatch with GitHub CLI
  - Poll for completion and output live deployment URL

### Layer 5: Assets & Branding
- [ ] **Icons**
  - `magnify-icon.svg` (vector, responsive)
  - `magnify-icon.png` (256×256 raster, favicon + apple-touch-icon)
  - Both referenced in `index.html`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript |
| **Build Tool** | Vite 6 |
| **Maps** | Leaflet + react-leaflet |
| **Data** | OpenStreetMap (Overpass API) |
| **Geocoding** | Nominatim API |
| **Styling** | Tailwind CSS |
| **Deployment** | GitHub Pages + GitHub Actions |

---

## Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn
- A browser with geolocation support

### Installation

```bash
git clone https://github.com/mandlcho/findit.git
cd findit
npm install
```

### Development

```bash
npm run dev
```

Opens http://localhost:3000 with hot reload.

### Build & Deploy

```bash
npm run build        # Create production bundle in dist/
npm run preview      # Test the production build locally
```

To deploy to GitHub Pages:

```bash
./scripts/run-pages-workflow.sh
```

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│   Browser (User)                    │
│  ┌───────────────────────────────┐  │
│  │  MapView.tsx (Leaflet)        │  │
│  │  ├─ User location marker      │  │
│  │  ├─ Toilet/ATM popups         │  │
│  │  └─ Interactive viewport      │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  App.tsx (Orchestration)      │  │
│  │  ├─ State: location, filters  │  │
│  │  ├─ Find button logic         │  │
│  │  └─ Filter controls           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
           ↓ (API calls)
┌─────────────────────────────────────┐
│   External APIs (No Backend)        │
├─────────────────────────────────────┤
│ • Overpass API → Toilet locations   │
│ • Nominatim API → Address lookup    │
│ • Geolocation API → User position   │
└─────────────────────────────────────┘
```

---

## Future Roadmap

- [ ] **Planned Toilet Visits**: Save and plan trips to verified restrooms
- [ ] **Community Reviews**: Allow users to rate toilets by cleanliness, wait time, amenities
- [ ] **Offline Mode**: Cache nearby toilet data for offline access
- [ ] **Real-time Updates**: Show occupancy status / average wait times (via OpenStreetMap community)
- [ ] **Smart Suggestions**: ML model trained on visit patterns to suggest best toilets
- [ ] **Mobile App**: React Native version for iOS/Android
- [ ] **Payment Integration**: Partner with public restroom providers for premium facilities
- [ ] **Accessibility Metrics**: Detailed accessibility info beyond wheelchair access
- [ ] **Environmental Impact**: Track carbon saved by using public restrooms vs. searching inefficiently
- [ ] **Internationalization**: Support for 20+ languages and regional toilet terminology

---

## Contributing

Found a bug? Have a feature idea? Contributions are welcome!

```bash
# Create a feature branch
git checkout -b feature/your-feature

# Make changes, commit, push
git push origin feature/your-feature

# Open a pull request
```

---

## License

MIT © 2025

---

## Acknowledgments

- **OpenStreetMap** for toilet location data
- **Leaflet** for lightweight, beautiful maps
- **Vite** for blazing-fast builds
- **Singapore's public restroom network** for existing, though hard-to-find, infrastructure

---

**Made with 🚽 during a weekend hackathon.**
