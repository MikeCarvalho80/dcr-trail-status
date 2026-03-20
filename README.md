# TrailClear

Is it clear to ride? TrailClear tracks mountain bike trail closures, mud season advisories, and hunting season alerts across the Northeast US. 119 parks, 11 states. Set your ZIP code, pick a range, and see which trails are open before you ride.

**Live:** [dcr-trail-status.vercel.app](https://dcr-trail-status.vercel.app/)

## What it does

State agencies (DCR, NH State Parks, NPS, CT DEEP) and municipalities impose seasonal trail closures each spring to protect trails during mud season. This app monitors **51 parks across all 6 New England states** and shows their current status based on calendar-driven closure rules.

### Status types

| Status | Meaning |
|--------|---------|
| **Closed** | Mandatory closure in effect — formal mandate, city rule, or NPS order |
| **Caution** | Mud season advisory or recently reopened — ride with judgment |
| **Open** | No active restrictions |

Every park card includes a **"Why This Status"** explanation so you understand the logic and can verify it yourself. Formal and seasonal closures include **source attribution** linking to the official policy.

### Features

**Discovery & filtering:**
- Full-text search across park names, regions, managers, and parking locations
- Interactive map view (Leaflet + OpenStreetMap — free, no API key)
- Region filters across 15 regions
- Difficulty filter (Beginner / Intermediate / Advanced / Expert)
- Trail length filter (< 10 mi / 10–25 mi / 25–50 mi / 50+ mi)
- "Show rideable only" toggle to hide closed parks

**Location & distance:**
- ZIP code input with distance radius selector (15–150 mi)
- Haversine distance and estimated drive time for every park
- Supports all New England ZIP codes (MA, NH, VT, RI, CT, ME)

**Park details (expandable cards):**
- Closure policy, status reasoning, and source attribution
- Difficulty, NEMBA chapter, trail miles, parking address
- Last verified date for data freshness
- Google Maps navigation link to parking coordinates
- Weather forecast link (NWS — free, no API key)
- Share button (Web Share API on mobile, clipboard on desktop)

**Personalization:**
- Favorite parks (star icon) — pinned to top, saved in localStorage
- Shareable URLs — all filter state encoded in URL params
- Preferences (ZIP, radius, favorites, rideable toggle) persist across sessions

**Status monitoring:**
- Live countdown timers for active closures
- Season timeline visualization (Mar 1 – May 25)
- Automatic daily refresh at 6 AM ET
- Summary stats showing open / caution / closed counts

**PWA:**
- Installable — add to home screen on iOS, Android, or desktop
- Works offline via service worker caching
- Portrait-optimized dark theme for outdoor readability

### Disclaimer

Trail status information is derived from publicly available sources and may not reflect real-time conditions. Always verify closures with local land managers before riding. Use at your own risk.

No accounts, no tracking, no data collection. Your ZIP code and preferences are stored only on your device (localStorage) and never leave your browser.

## Parks covered (51)

**Massachusetts (33):** Neponset River, Blue Hills, Stony Brook, Cutler Park, Needham Town Forest, Middlesex Fells, Wompatuck, Lynn Woods, Harold Parker, Great Brook Farm, Vietnam (Milford), Ames Nowell, Borderland, F. Gilbert Hills, Massasoit, Upton, Leominster, Douglas, Russell Mill, Callahan, Rocky Woods, October Mountain, Brimfield, Groton Town Forest, Freetown-Fall River, West Barnstable (Trail of Tears), Otis/Crane WMA, Nickerson State Park, Maple Swamp, Willow Street, Punkhorn Parklands, Beebe Woods, Correllus State Forest (Martha's Vineyard)

**New Hampshire (4):** Bear Brook, Mine Falls, Pawtuckaway, Fort Rock

**Maine (8):** Mount Agamenticus, Bradbury Mountain, Gorham Trail Network, Pineland Farms, Camden Snow Bowl, Bond Brook, Acadia National Park (Carriage Roads), Carrabassett Valley

**Rhode Island (3):** Big River, Lincoln Woods, Arcadia

**Connecticut (2):** Nassahegon, Case Mountain

**Vermont (1):** Kingdom Trails

### Regions (15)

Greater Boston · South Shore · North Shore · MetroWest · Central MA · Pioneer Valley · Berkshires · Cape & Islands · Southern NH · Rhode Island · Connecticut · Southern VT · Southern Maine · Midcoast Maine · Western Maine

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm run test
```

83 tests across 7 files covering:
- Park data integrity (required fields, unique IDs, coordinates, closure dates, sources)
- Status logic (advisory/formal/seasonal parks, cross-year closures, recently-reopened windows)
- Season timeline calculations
- Sort order with favorites pinning
- Geo calculations (haversine distance, drive time estimates)
- Trail length parsing and filter matching
- ZIP code lookup validation
- Search functionality (name, region, manager, parking)
- URL state reading and parameter parsing

## Contributing

Know a park that's missing? See wrong closure dates? **[Read the contributing guide](CONTRIBUTING.md).**

Ways to help:
- **[Add a new park](../../issues/new?template=new-park.yml)** — fill out a form, no coding required
- **[Report a closure update](../../issues/new?template=closure-update.yml)** — help keep dates accurate
- **[Fix inaccurate data](../../issues/new?template=data-correction.yml)** — wrong parking lot, bad URL, etc.
- **Submit a PR** — edit `src/data/parks.ts` directly

## Tech stack

- [React](https://react.dev) 18 + TypeScript
- [Vite](https://vite.dev) 5 + [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [Tailwind CSS](https://tailwindcss.com) 3
- [Framer Motion](https://www.framer.com/motion/) for animations
- [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/) for map view
- [Lucide](https://lucide.dev/) icons
- [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) for tests
- Zero backend — all data bundled, works offline

### External services (all free, no API keys)

| Service | Used for |
|---------|----------|
| [OpenStreetMap](https://www.openstreetmap.org/) | Map tiles |
| [Google Maps](https://maps.google.com/) | Navigation links to parking |
| [NWS / weather.gov](https://weather.gov/) | Weather forecast links |
| [Google Fonts](https://fonts.google.com/) | JetBrains Mono typeface |

## License

MIT
