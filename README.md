# Trail Status — New England MTB

A PWA for tracking mountain bike trail closures and mud season advisories across New England. Set your ZIP code, pick a range, and see which trails are open before you ride.

## What it does

State agencies (DCR, NH State Parks, CT DEEP) and municipalities impose seasonal trail closures each spring to protect trails during mud season. This app monitors **36 parks across 5 states** and shows their current status based on calendar-driven closure rules.

**Status types:**

| Status | Meaning |
|--------|---------|
| **Closed** | Mandatory closure in effect (formal mandate or city rule) |
| **Caution** | Mud season advisory or recently reopened — ride with judgment |
| **Open** | No active restrictions |

**Features:**

- Live status for each park based on today's date and known closure windows
- Countdown timer showing days remaining in active closures
- ZIP code input with configurable distance radius (15–150 mi)
- Season timeline visualization tracking progress through closure season
- Region filters (Greater Boston, South Shore, North Shore, MetroWest, Central MA, Pioneer Valley, Berkshires, Southern NH, Rhode Island, Connecticut, Southern VT)
- Expandable park cards with closure policy, difficulty, NEMBA chapter, trail miles, and parking info
- Google Maps navigation links to each park's primary MTB parking area
- Installable as a PWA — works offline, add to home screen

## Parks covered

**Massachusetts (25):** Neponset River, Blue Hills, Stony Brook, Cutler Park, Needham Town Forest, Middlesex Fells, Wompatuck, Lynn Woods, Harold Parker, Great Brook Farm, Vietnam (Milford), Ames Nowell, Borderland, F. Gilbert Hills, Massasoit, Upton, Leominster, Douglas, Russell Mill, Callahan, Rocky Woods, October Mountain, Brimfield, Groton Town Forest, Freetown-Fall River

**New Hampshire (4):** Bear Brook, Mine Falls, Pawtuckaway, Fort Rock

**Rhode Island (3):** Big River, Lincoln Woods, Arcadia

**Connecticut (2):** Nassahegon, Case Mountain

**Vermont (1):** Kingdom Trails

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
- [Lucide](https://lucide.dev/) icons
- Zero backend — all data bundled, works offline

## License

MIT
