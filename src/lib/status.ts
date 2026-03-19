import type { Park, ClosureDate, ClosureWindow, TrailStatus, TrailStatusResult, Region } from '../data/parks';

export function getNavUrl(park: Park): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}&travelmode=driving`;
}

function isInDateRange(month: number, day: number, start: ClosureDate, end: ClosureDate): boolean {
  if (start.month > end.month) {
    // Cross-year range (e.g., Dec 1 – Mar 15)
    return month >= start.month || month < end.month ||
      (month === end.month && day <= end.day);
  }
  return (
    (month > start.month || (month === start.month && day >= start.day)) &&
    (month < end.month || (month === end.month && day <= end.day))
  );
}

function daysUntilEnd(now: Date, end: ClosureDate, start: ClosureDate): number {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  let endDate: Date;
  if (start.month > end.month && month >= start.month) {
    endDate = new Date(year + 1, end.month - 1, end.day);
  } else {
    endDate = new Date(year, end.month - 1, end.day);
  }
  return Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

function isRecentlyEnded(month: number, day: number, end: ClosureDate): boolean {
  return (
    (month === end.month && day > end.day) ||
    (month === end.month + 1 && day <= 14)
  );
}

/** Region-aware mud season windows */
function getMudSeason(region: Region): { start: ClosureDate; end: ClosureDate } | null {
  if (region === 'Cape & Islands') return null; // Sandy soil drains fast
  if (region.includes('Maine')) return { start: { month: 3, day: 1 }, end: { month: 5, day: 15 } };
  if (region === 'Southern VT') return { start: { month: 3, day: 15 }, end: { month: 5, day: 15 } };
  // Default for NE + mid-Atlantic
  return { start: { month: 3, day: 1 }, end: { month: 4, day: 15 } };
}

export function getTrailStatus(park: Park): TrailStatusResult {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Check additional closures first (hunting, winter, etc.)
  if (park.additionalClosures) {
    for (const closure of park.additionalClosures) {
      if (isInDateRange(month, day, closure.start, closure.end)) {
        const daysLeft = daysUntilEnd(now, closure.end, closure.start);
        let sublabel = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`;
        if (closure.type === "formal") sublabel += " (mandatory)";
        if (closure.type === "seasonal") sublabel += " (seasonal)";
        const endStr = `${closure.end.month}/${closure.end.day}`;
        const status: TrailStatus = closure.type === 'advisory' ? 'caution' : 'closed';
        return {
          status,
          label: closure.type === 'advisory' ? closure.label : "Closed",
          sublabel: closure.type === 'advisory'
            ? `${closure.label} — ${closure.rule}`
            : sublabel,
          reason: `${closure.label}: ${closure.rule} (${closure.start.month}/${closure.start.day}–${endStr}). Verify with the land manager as dates can change.`,
        };
      }
    }
  }

  // Check primary closure window
  if (!park.closureStart || !park.closureEnd) {
    // Advisory park — check region-aware mud season
    const mudSeason = getMudSeason(park.region);
    if (mudSeason && isInDateRange(month, day, mudSeason.start, mudSeason.end)) {
      return {
        status: "caution",
        label: "Mud Season",
        sublabel: "No formal closure — use judgment on wet trails",
        reason: `This park has no posted closure dates. It is mud season for the ${park.region} region (${mudSeason.start.month}/${mudSeason.start.day}–${mudSeason.end.month}/${mudSeason.end.day}), so we flag it as caution. Conditions vary — always check with the land manager before riding.`,
      };
    }
    return {
      status: "open",
      label: "Likely Open",
      sublabel: "No formal closure",
      reason: "This park has no posted closure dates and we are outside the typical mud season window for this region. Confirm current conditions locally before riding.",
    };
  }

  // Primary closure check
  if (isInDateRange(month, day, park.closureStart, park.closureEnd)) {
    const daysLeft = daysUntilEnd(now, park.closureEnd, park.closureStart);
    let sublabel = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`;
    if (park.closureType === "formal") sublabel += " (mandatory)";
    if (park.closureType === "seasonal") sublabel += " (seasonal use)";
    if (park.closureRule.includes("as posted")) sublabel += " — may extend";
    const endStr = `${park.closureEnd.month}/${park.closureEnd.day}`;
    return {
      status: "closed",
      label: "Closed",
      sublabel,
      reason: `Today falls within the posted closure window (${park.closureStart.month}/${park.closureStart.day}–${endStr}). This is based on published dates — verify with the land manager as dates can change.`,
    };
  }

  // Recently reopened check (primary closure)
  if (isRecentlyEnded(month, day, park.closureEnd)) {
    if (park.closureType === "formal") {
      return {
        status: "caution",
        label: "Recently Reopened",
        sublabel: "Check for posted extensions before riding",
        reason: `The posted closure ended on ${park.closureEnd.month}/${park.closureEnd.day}, but we are within two weeks of that date. Formal closures can be extended — check on-site signage or the land manager's website before riding.`,
      };
    }
    return {
      status: "open",
      label: "Open",
      sublabel: "Season underway",
      reason: `The posted closure ended on ${park.closureEnd.month}/${park.closureEnd.day} and we are past that date. Trail conditions may still be wet — use your judgment and confirm locally.`,
    };
  }

  // Check if an upcoming additional closure is within 2 weeks
  if (park.additionalClosures) {
    for (const closure of park.additionalClosures) {
      const startDate = new Date(now.getFullYear(), closure.start.month - 1, closure.start.day);
      const daysUntilStart = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilStart > 0 && daysUntilStart <= 14) {
        return {
          status: "caution",
          label: "Closure Approaching",
          sublabel: `${closure.label} starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`,
          reason: `${closure.label} (${closure.rule}) begins on ${closure.start.month}/${closure.start.day}. Plan rides accordingly.`,
        };
      }
    }
  }

  return {
    status: "open",
    label: "Open",
    sublabel: "No active restrictions",
    reason: "We are well outside any posted closure windows. Conditions can still change — always verify before riding.",
  };
}

export function getSeasonInfo() {
  const now = new Date();
  const month = now.getMonth() + 1;

  // Determine current season phase
  if (month >= 3 && month <= 5) {
    // Spring: show mud season timeline
    const year = now.getFullYear();
    const mar1 = new Date(year, 2, 1);
    const may31 = new Date(year, 4, 31);
    const apr1 = new Date(year, 3, 1);
    const apr15 = new Date(year, 3, 15);
    const total = may31.getTime() - mar1.getTime();
    const elapsed = Math.max(0, Math.min(now.getTime() - mar1.getTime(), total));
    const pct = (elapsed / total) * 100;
    const closureEndPct = ((apr1.getTime() - mar1.getTime()) / total) * 100;
    const cautionEndPct = ((apr15.getTime() - mar1.getTime()) / total) * 100;
    const inClosure = pct <= closureEndPct;
    const inCaution = !inClosure && pct <= cautionEndPct;
    return { season: 'spring' as const, pct, closureEndPct, cautionEndPct, inClosure, inCaution };
  }

  if (month >= 10 && month <= 12) {
    // Fall: hunting season window
    const year = now.getFullYear();
    const oct1 = new Date(year, 9, 1);
    const dec31 = new Date(year, 11, 31);
    const nov1 = new Date(year, 10, 1);
    const total = dec31.getTime() - oct1.getTime();
    const elapsed = Math.max(0, Math.min(now.getTime() - oct1.getTime(), total));
    const pct = (elapsed / total) * 100;
    const archeryEndPct = ((nov1.getTime() - oct1.getTime()) / total) * 100;
    return { season: 'fall' as const, pct, archeryEndPct };
  }

  // Summer or winter — no special timeline
  return { season: (month >= 6 && month <= 9 ? 'summer' : 'winter') as 'summer' | 'winter' };
}

const STATUS_ORDER: Record<TrailStatus, number> = { closed: 0, caution: 1, open: 2 };

export function sortByStatus(parks: Park[]): Park[] {
  return [...parks].sort(
    (a, b) => STATUS_ORDER[getTrailStatus(a).status] - STATUS_ORDER[getTrailStatus(b).status]
  );
}

export function sortByStatusAndDistance(
  parks: Park[],
  distances: Map<string, number>,
  favorites?: Set<string>,
): Park[] {
  return [...parks].sort((a, b) => {
    if (favorites && favorites.size > 0) {
      const aFav = favorites.has(a.id) ? 0 : 1;
      const bFav = favorites.has(b.id) ? 0 : 1;
      if (aFav !== bFav) return aFav - bFav;
    }
    const statusDiff =
      STATUS_ORDER[getTrailStatus(a).status] - STATUS_ORDER[getTrailStatus(b).status];
    if (statusDiff !== 0) return statusDiff;
    return (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity);
  });
}

export const STATUS_CONFIG: Record<TrailStatus, {
  text: string;
  bg: string;
  border: string;
  dot: string;
  badgeBg: string;
  glow: string;
}> = {
  open: {
    text: 'text-status-open',
    bg: 'bg-status-open-bg',
    border: 'border-status-open/[0.27]',
    dot: 'bg-status-open',
    badgeBg: 'bg-status-open-bg',
    glow: '0 0 12px rgba(46, 204, 113, 0.3)',
  },
  caution: {
    text: 'text-status-caution',
    bg: 'bg-status-caution-bg',
    border: 'border-status-caution/[0.27]',
    dot: 'bg-status-caution',
    badgeBg: 'bg-status-caution-bg',
    glow: '0 0 12px rgba(241, 196, 15, 0.3)',
  },
  closed: {
    text: 'text-status-closed',
    bg: 'bg-status-closed-bg',
    border: 'border-status-closed/[0.27]',
    dot: 'bg-status-closed',
    badgeBg: 'bg-status-closed-bg',
    glow: '0 0 12px rgba(242, 92, 77, 0.3)',
  },
};
