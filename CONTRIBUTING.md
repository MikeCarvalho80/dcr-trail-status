# Contributing to Trail Status

Thanks for helping keep New England trail data accurate. Here's how to contribute.

## Adding a new park or trail system

The easiest way to contribute — no coding required.

### Option 1: Open an issue

[Create a "New Park" issue](../../issues/new?template=new-park.yml) and fill in as much as you know. We'll add it.

### Option 2: Submit a PR

1. Fork and clone the repo
2. Edit `src/data/parks.ts`
3. Add a new entry to the `PARKS` array following this template:

```typescript
{
  id: "your-park-id",           // kebab-case, unique
  name: "Park Name",
  region: "Greater Boston",     // see Region type at top of file
  state: "MA",                  // MA, NH, VT, RI, CT, or ME
  manager: "DCR",               // managing agency
  url: "https://...",           // official park page
  lat: 42.0000,                // trailhead/parking lat
  lng: -71.0000,               // trailhead/parking lng
  parking: "Lot name, address",
  closureType: "advisory",     // "formal", "seasonal", or "advisory"
  closureRule: "Description of closure policy",
  closureStart: null,          // { month: 3, day: 1 } or null
  closureEnd: null,            // { month: 3, day: 31 } or null
  notes: "Local knowledge for riders",
  difficulty: "Intermediate",
  miles: "10+",
  nemba: "Chapter Name",       // or "N/A"
}
```

**Getting accurate coordinates:** Go to Google Maps, right-click the main MTB parking lot, and click the coordinates to copy them.

## Updating closure dates or policies

If you know a park's closure policy has changed, please either:
- Open a [Closure Update issue](../../issues/new?template=closure-update.yml)
- Submit a PR editing the relevant park entry in `src/data/parks.ts`

## Fixing inaccurate data

Wrong parking lot? Bad URL? Incorrect NEMBA chapter? Open an issue or PR. All corrections welcome.

## Development setup

```bash
git clone https://github.com/zeesalt/dcr-trail-status.git
cd dcr-trail-status
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

### Project structure

```
src/
  App.tsx                  # Main app with filtering pipeline
  components/
    ParkCard.tsx           # Expandable trail card
    SummaryStats.tsx       # Open/Caution/Closed counts
    SeasonTimeline.tsx     # Closure season progress bar
    RegionFilters.tsx      # Region filter chips
    DistanceControls.tsx   # ZIP code + radius selector
  data/
    parks.ts               # All park data + types
    zipcodes.ts            # New England ZIP → lat/lng lookup
  lib/
    status.ts              # Trail status logic + sorting
    geo.ts                 # Haversine distance calculation
    useUserPrefs.ts        # localStorage persistence
```

### Build & verify

```bash
npm run build    # production build
npm run preview  # preview the build locally
```

## Guidelines

- **Accuracy over completeness** — only add parks you've ridden or can verify. Bad data is worse than missing data.
- **One park per PR** is fine. Batch PRs also welcome.
- **Closure policies matter** — if a park has a formal closure (DCR mandate, city ordinance), mark it `formal` with exact dates. If it's just mud season etiquette, use `advisory`.
- **Keep notes useful** — write what you'd tell a friend before their first ride there. Terrain, hazards, local quirks.
- **Test the build** — run `npm run build` before submitting to make sure TypeScript is happy.

## Code of conduct

Be respectful. We're all here because we like riding bikes in the woods.
