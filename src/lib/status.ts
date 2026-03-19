import type { Park, TrailStatus, TrailStatusResult } from '../data/parks';

export function getNavUrl(park: Park): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${park.lat},${park.lng}&travelmode=driving`;
}

export function getTrailStatus(park: Park): TrailStatusResult {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (!park.closureStart || !park.closureEnd) {
    if (month === 3 || (month === 4 && day <= 10)) {
      return { status: "caution", label: "Mud Season", sublabel: "No formal closure — use judgment on wet trails" };
    }
    return { status: "open", label: "Likely Open", sublabel: "No formal spring closure" };
  }

  let inClosure = false;
  if (park.closureStart.month > park.closureEnd.month) {
    inClosure = month >= park.closureStart.month || month < park.closureEnd.month ||
      (month === park.closureEnd.month && day <= park.closureEnd.day);
  } else {
    inClosure =
      (month > park.closureStart.month || (month === park.closureStart.month && day >= park.closureStart.day)) &&
      (month < park.closureEnd.month || (month === park.closureEnd.month && day <= park.closureEnd.day));
  }

  if (inClosure) {
    const year = now.getFullYear();
    let endDate: Date;
    if (park.closureStart.month > park.closureEnd.month && month >= park.closureStart.month) {
      endDate = new Date(year + 1, park.closureEnd.month - 1, park.closureEnd.day);
    } else {
      endDate = new Date(year, park.closureEnd.month - 1, park.closureEnd.day);
    }
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    let sublabel = `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`;
    if (park.closureType === "formal") sublabel += " (mandatory)";
    if (park.closureType === "seasonal") sublabel += " (seasonal use)";
    if (park.closureRule.includes("as posted")) sublabel += " — may extend";
    return { status: "closed", label: "Closed", sublabel };
  }

  if (
    (month === park.closureEnd.month && day > park.closureEnd.day) ||
    (month === park.closureEnd.month + 1 && day <= 14)
  ) {
    if (park.closureType === "formal") {
      return { status: "caution", label: "Recently Reopened", sublabel: "Check for posted extensions before riding" };
    }
    return { status: "open", label: "Open", sublabel: "Season underway" };
  }

  return { status: "open", label: "Open", sublabel: "No active restrictions" };
}

export function getSeasonInfo() {
  const now = new Date();
  const year = now.getFullYear();
  const mar1 = new Date(year, 2, 1);
  const mar31 = new Date(year, 2, 31);
  const apr14 = new Date(year, 3, 14);
  const total = apr14.getTime() - mar1.getTime();
  const elapsed = Math.max(0, Math.min(now.getTime() - mar1.getTime(), total));
  const pct = (elapsed / total) * 100;
  const closureEndPct = ((mar31.getTime() - mar1.getTime()) / total) * 100;

  const inClosure = pct <= closureEndPct;

  return { pct, closureEndPct, inClosure };
}

const STATUS_ORDER: Record<TrailStatus, number> = { closed: 0, caution: 1, open: 2 };

export function sortByStatus(parks: Park[]): Park[] {
  return [...parks].sort(
    (a, b) => STATUS_ORDER[getTrailStatus(a).status] - STATUS_ORDER[getTrailStatus(b).status]
  );
}

/**
 * Sort by status first (closed → caution → open), then by distance (nearest first).
 * `distances` maps park.id → miles from user's origin.
 */
export function sortByStatusAndDistance(
  parks: Park[],
  distances: Map<string, number>,
): Park[] {
  return [...parks].sort((a, b) => {
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
