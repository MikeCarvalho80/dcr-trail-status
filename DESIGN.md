# DCR Trail Status — Design System Prompt

> Use this as a prompt for MagicPatterns or any generative design tool to produce components and layouts for this app.

---

## App Overview

A mobile-first React dashboard that tracks mountain bike trail closures and mud season advisories for 11 parks near Boston. Users check it quickly before a ride to see which trails are open, under caution, or closed. Think: a weather app, but for trail conditions.

## Design Principles

1. **Status-first** — Trail status (Open / Caution / Closed) is the most important visual element. Every decision about color, hierarchy, and layout should make the current status instantly scannable.
2. **Dark, utilitarian aesthetic** — The app targets mountain bikers checking conditions on their phone. Dark backgrounds reduce glare outdoors. Monospace type and uppercase labels give it a technical, data-dashboard feel.
3. **Information density over decoration** — Compact cards, tight spacing, minimal icons. No hero images, no illustrations. Data speaks.
4. **Mobile-first, single-column** — Max-width 640px, centered. Every element must work at phone width first.

## Color System

### Backgrounds
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0d0c0a` | Page background |
| `bg-secondary` | `#12110e` | Card backgrounds, stat blocks |
| `bg-elevated` | `#1a1915` | Hover states, expanded sections |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#e8e6e1` | Headings, park names, primary data |
| `text-secondary` | `#5a5850` | Labels, metadata, muted info |
| `text-muted` | `#4a4840` | Tertiary info, disabled states |

### Status Colors (the core visual language)
| Status | Foreground | Background | Border (use at ~27% opacity) |
|--------|-----------|------------|-------------------------------|
| **Open** | `#2ecc71` | `#0a2e1a` | `#2ecc71` |
| **Caution** | `#f1c40f` | `#2e2a0a` | `#f1c40f` |
| **Closed** | `#e74c3c` | `#2e0a0a` | `#e74c3c` |

Each status color is used for: text labels, status dots, card borders, glow accents, and stat numbers. Apply the matching dark background behind status badges and inside cards to create a contained, high-contrast look.

### Glow Effect
Use `box-shadow` with the status color at low opacity for subtle glow on active/focused elements:
```css
box-shadow: 0 0 12px rgba(46, 204, 113, 0.3); /* Open example */
```

## Typography

| Element | Font | Size | Weight | Transform |
|---------|------|------|--------|-----------|
| Page title | monospace | 22px | 700 | — |
| Card title (park name) | monospace | 15px | 700 | — |
| Status label | monospace | 11px | 600 | uppercase, letter-spaced |
| Metadata / tags | monospace | 10–11px | 600 | uppercase |
| Secondary text | monospace | 9–10px | 400 | — |
| Stat number | monospace | 24–28px | 700 | — |

**Everything is monospace.** This is deliberate — it gives the app a terminal/dashboard feel that matches the functional, no-nonsense tone.

## Component Inventory

### 1. Summary Stats Bar
A 3-column grid at the top of the page. Each cell shows:
- A large number in the matching status color
- An uppercase label below ("OPEN", "CAUTION", "CLOSED")
- Dark card background with subtle border

### 2. Season Timeline
A horizontal progress bar showing where we are in the closure season:
- **Red zone**: Active closure period (Mar 1–31)
- **Yellow zone**: Caution / mud season (Apr 1–14)
- **Green zone**: Open season (after Apr 14)
- A glowing dot marks today's position on the bar
- Date labels below each zone boundary

### 3. Region Filter Chips
A horizontal row of pill-shaped filter buttons:
- Regions: All, South, North, West, NW, SW
- Active chip gets a light background (`bg-elevated`) and bright text
- Inactive chips are muted text on transparent background
- Compact sizing (small text, tight padding)

### 4. Park Card (collapsed)
The primary repeating element. Each card shows:
- **Left**: Status dot (small colored circle; pulses with animation when Closed)
- **Status badge**: Colored pill with status text (e.g., "CLOSED — 12 days left")
- **Manager tag**: Muted pill showing "DCR" or "Town of X"
- **Right-aligned**: Distance ("10 min") and trail miles
- **Park name**: Below the status row, bold monospace
- **Border**: Left or full border in the status color at low opacity
- **Border radius**: 12px
- **Tap/click**: Expands to show details

### 5. Park Card (expanded)
When expanded, additional content appears below a divider:
- **2-column grid** of detail items:
  - Difficulty rating
  - NEMBA chapter
  - Trail miles
  - Parking info
- **Closure policy**: A short text description of the park's seasonal rules
- **Action buttons row**:
  - "Navigate" button (links to Google Maps parking coordinates) with a small arrow SVG icon
  - "Park Info" button (links to official park page)
- Buttons are compact, outlined style with status-colored accents

### 6. Countdown Badge
Shown on cards with active closures:
- Text like "12 days left" or "Reopens Apr 1"
- Integrated into the status badge or shown as a secondary line
- Uses the status color

## Layout Structure

```
┌──────────────────────────────┐
│  DCR Trail Status      [title]│
│  Subtitle / date              │
├──────────────────────────────┤
│  [Open: 7] [Caution: 2] [Closed: 2]  ← Stats bar
├──────────────────────────────┤
│  ████████░░░░░░░  ← Season timeline
│  Mar 1    Apr 1   Apr 14
├──────────────────────────────┤
│  [All] [South] [North] ...   ← Filter chips
├──────────────────────────────┤
│  ┌─ Park Card ────────────┐  │
│  │ 🔴 CLOSED - 12d  DCR  │  │
│  │ Blue Hills Reservation │  │
│  └────────────────────────┘  │
│  ┌─ Park Card ────────────┐  │
│  │ 🟡 CAUTION       DCR  │  │
│  │ Stony Brook Reservation│  │
│  └────────────────────────┘  │
│  ... more cards ...          │
└──────────────────────────────┘
```

## Interaction & Motion

- **Card expand/collapse**: Chevron (`▾`) rotates 180° on toggle. Content slides in with a smooth transition.
- **Hover states**: Subtle background shift to `bg-elevated`, 0.2s ease transition.
- **Status dot pulse**: Closed-status dots animate with a pulsing keyframe (opacity + scale).
- **Timeline glow**: The "today" indicator on the timeline has a soft glow using box-shadow.

## Spacing & Sizing

- Page padding: `24px 16px`
- Card padding: `12px 16px`
- Card gap (between cards): `10–12px`
- Card border radius: `12px`
- Max content width: `640px`, centered
- Status dot size: `8px` circle
- Button padding: `8px 12px`

## Data Per Park

Each park card can display these fields:
- Park name
- Managing agency (DCR, Town of Needham, City of Lynn, Town of Milford)
- Current status (Open / Caution / Closed)
- Closure date range (if applicable)
- Days remaining in closure (countdown)
- Distance from Boston ("10 min", "35 min", etc.)
- Difficulty (Beginner-Intermediate, Intermediate-Advanced, Advanced-Expert)
- NEMBA chapter
- Trail miles
- Parking info / Google Maps link
- Official park page URL
- Closure policy description

## Tone

Functional. No fluff. Like a trail conditions radio dispatch — just the facts, color-coded for instant comprehension. The design should feel like it was built by someone who rides, not someone who designs apps about riding.
