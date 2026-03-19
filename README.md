# DCR Trail Status

A React dashboard for tracking mountain bike trail spring closures and mud season advisories across parks within one hour of Hyde Park, Boston.

## What it does

DCR (Department of Conservation and Recreation) and other local agencies impose seasonal trail closures each spring to protect trails during mud season. This app monitors 11 parks and shows their current status in real time based on calendar-driven closure rules.

**Status types:**

| Status | Meaning |
|--------|---------|
| **Closed** | Mandatory closure in effect (formal DCR mandate or city rule) |
| **Caution** | Mud season advisory or recently reopened — ride with judgment |
| **Open** | No active restrictions |

**Features:**

- Live status for each park based on today's date and known closure windows
- Countdown timer showing days remaining in active closures
- Season timeline visualization tracking progress through the March closure period
- Region filters (South, North, West, NW, SW)
- Expandable park cards with closure policy, difficulty, NEMBA chapter, trail miles, and parking info
- Google Maps navigation links to each park's primary MTB parking area
- Direct links to official park pages

## Parks covered

| Park | Manager | Distance | Difficulty |
|------|---------|----------|------------|
| Neponset River Reservation | DCR | 5 min | Intermediate-Advanced |
| Blue Hills Reservation | DCR | 10 min | Intermediate-Advanced |
| Stony Brook Reservation | DCR | 15 min | Beginner-Intermediate |
| Cutler Park Reservation | DCR | 25 min | Beginner-Intermediate |
| Needham Town Forest | Town of Needham | 30 min | Intermediate-Advanced |
| Middlesex Fells Reservation | DCR | 30 min | Easy-Moderate |
| Wompatuck State Park | DCR | 35 min | Beginner-Intermediate |
| Lynn Woods Reservation | City of Lynn | 35 min | Advanced-Expert |
| Harold Parker State Forest | DCR | 45 min | Intermediate-Advanced |
| Great Brook Farm State Park | DCR | 50 min | Beginner-Intermediate |
| Vietnam (Milford) | Town of Milford | 50 min | Intermediate-Expert |

## Closure logic

- **Blue Hills & Middlesex Fells** — Formal DCR closure March 1-31. The Fells carries an "or as posted" clause meaning staff can extend beyond 3/31.
- **Lynn Woods** — City of Lynn bans biking Dec 1 - Mar 31. Check with rangers for exact reopening.
- **Great Brook Farm** — Trails reserved for XC skiing Dec 1 - Mar 15.
- **All others** — No formal closure. Mud season advisory runs through March and into early April.

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

## Tech stack

- [React](https://react.dev) 19
- [Vite](https://vite.dev) 8
- Zero external UI dependencies — all styling is inline

## License

MIT
