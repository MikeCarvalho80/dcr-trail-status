import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon, ExternalLinkIcon, NavigationIcon, StarIcon,
  Share2Icon, CloudSunIcon, CheckCircleIcon, SunriseIcon, SunsetIcon, LinkIcon, BugIcon,
  ThumbsUpIcon, ThumbsDownIcon, MessageCircleIcon,
} from 'lucide-react';
import type { Park } from '../data/parks';
import { PARKS } from '../data/parks';
import { getTrailStatus, getNavUrl, STATUS_CONFIG } from '../lib/status';
import { getSunTimes } from '../lib/sun';
import { getConnectedParks } from '../lib/connectivity';
import { estimateDriveMinutes } from '../lib/geo';
import { getNearbyParks } from '../lib/proximityCache';
import { useScrapedConditions } from '../lib/useScrapedConditions';
import { isParkStale, isParkUrlBroken } from '../lib/dataHealth';
import { isParkNew } from '../lib/whatsNew';
import { ConditionReporter } from './ConditionReporter';

const ClosureHistoryChart = lazy(() => import('./ClosureHistoryChart').then((m) => ({ default: m.ClosureHistoryChart })));

interface ParkCardProps {
  park: Park;
  distanceMiles?: number;
  driveMinutes?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isVisited: boolean;
  onToggleVisited: () => void;
  statusChanged?: { from: string; to: string };
  forceExpanded?: boolean;
  onExpanded?: () => void;
  onNavigateToPark?: (parkId: string) => void;
  reportCount?: number;
  likes?: { up: number; down: number };
  myVote?: 1 | -1 | null;
  onVote?: (parkId: string, vote: 1 | -1) => void;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
        {label}
      </div>
      <div className="font-mono text-[13px] text-text-primary">{value}</div>
    </div>
  );
}

function formatVerifiedDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getWeatherUrl(park: Park): string {
  return `https://forecast.weather.gov/MapClick.php?lat=${park.lat}&lon=${park.lng}`;
}

export function ParkCard({ park, distanceMiles, driveMinutes, isFavorite, onToggleFavorite, isVisited, onToggleVisited, statusChanged, forceExpanded, onExpanded, onNavigateToPark, reportCount, likes, myVote, onVote }: ParkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareMsg, setShareMsg] = useState('');

  // Handle forceExpanded from map/suggested rides clicks
  useEffect(() => {
    if (forceExpanded && !isExpanded) {
      setIsExpanded(true);
    }
  }, [forceExpanded]);

  const trail = getTrailStatus(park);
  const config = STATUS_CONFIG[trail.status];

  const sunTimes = getSunTimes(park.lat, park.lng, new Date());
  const connectedIds = getConnectedParks(park.id);
  const connectedParks = connectedIds
    .map((id) => PARKS.find((p) => p.id === id))
    .filter(Boolean) as Park[];

  const { conditions: conditionReports } = useScrapedConditions(park.id, isExpanded);

  // Nearby parks from precomputed cache (excludes connected)
  const nearbyParks = getNearbyParks(park.id)
    .filter((n) => !connectedIds.includes(n.parkId))
    .slice(0, 3)
    .map((n) => ({ park: PARKS.find((p) => p.id === n.parkId)!, dist: n.dist }))
    .filter((n) => n.park);

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const text = `${park.name} — ${trail.label}\n${trail.sublabel}\n${park.miles} mi · ${park.difficulty}\n${park.url}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: park.name, text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg('Copied!');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch {
      // user cancelled share
    }
  }

  return (
    <div
      className={`
        bg-bg-secondary ${config.border} border-l-2 border rounded-xl
        transition-colors duration-200
        ${isExpanded ? 'bg-bg-elevated' : 'hover:bg-bg-elevated'}
      `}
    >
      <button
        onClick={() => { setIsExpanded(!isExpanded); onExpanded?.(); }}
        className="w-full text-left px-4 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30 focus-visible:ring-inset rounded-xl"
        aria-expanded={isExpanded}
        aria-label={`${park.name}: ${trail.label}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
      >
        {/* Status change badge */}
        {statusChanged && (
          <div className="font-mono text-[11px] text-status-caution mb-1.5">
            Changed: {statusChanged.from} → {statusChanged.to}
          </div>
        )}

        {/* Row 1: Park name + action icons */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[17px] font-bold text-text-primary leading-tight flex items-center gap-2">
              {park.name}
              {isParkNew(park.id) && (
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] bg-status-open-bg text-status-open px-1.5 py-0.5 rounded flex-shrink-0">New</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {/* Visit check */}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onToggleVisited(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onToggleVisited(); } }}
              className="cursor-pointer p-2.5 -m-1.5 rounded-full hover:bg-bg-elevated/50"
              aria-label={isVisited ? `Unmark ${park.name} as visited` : `Mark ${park.name} as visited`}
            >
              <CheckCircleIcon
                className={`w-5 h-5 transition-colors duration-200 ${isVisited ? 'text-status-open fill-status-open' : 'text-text-muted/40 hover:text-status-open/60'}`}
              />
            </span>
            {/* Favorite star */}
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onToggleFavorite(); } }}
              className="cursor-pointer p-2.5 -m-1.5 rounded-full hover:bg-bg-elevated/50"
              aria-label={isFavorite ? `Remove ${park.name} from favorites` : `Add ${park.name} to favorites`}
            >
              <StarIcon
                className={`w-5 h-5 transition-colors duration-200 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-text-muted hover:text-amber-400/60'}`}
              />
            </span>
            {/* Chevron */}
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="p-2 -m-1"
            >
              <ChevronDownIcon className="w-5 h-5 text-text-muted" />
            </motion.span>
          </div>
        </div>

        {/* Row 2: Status bar */}
        <div className={`${config.badgeBg} rounded-lg px-2.5 py-1.5 mt-2 flex items-center gap-2`}>
          <span
            className={`
              w-2.5 h-2.5 rounded-full flex-shrink-0 ${config.dot}
              ${trail.status === 'closed' ? 'animate-pulse-dot' : ''}
            `}
            aria-hidden="true"
          />
          <span className="sr-only">{trail.status}</span>
          <span className={`${config.text} font-mono text-[12px] font-bold uppercase tracking-[0.05em]`}>
            {trail.label}
          </span>
          <span className="font-mono text-[12px] text-text-secondary truncate">
            {trail.sublabel}
          </span>
        </div>

        {/* Row 3: Feature pills */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          <span className="bg-bg-elevated text-text-secondary font-mono text-[11px] font-semibold px-2 py-0.5 rounded">
            {park.manager}
          </span>
          <span className="bg-bg-elevated text-text-primary font-mono text-[11px] font-semibold px-2 py-0.5 rounded">
            {park.miles} mi
          </span>
          <span className="bg-bg-elevated text-status-caution font-mono text-[11px] font-semibold px-2 py-0.5 rounded">
            {park.difficulty.split('-')[0]}
          </span>
          {distanceMiles != null && (
            <span className="bg-bg-elevated text-text-secondary font-mono text-[11px] px-2 py-0.5 rounded">
              ~{distanceMiles} mi · ~{driveMinutes} min
            </span>
          )}
        </div>

        {/* Row 4: Community signals */}
        <div className="flex items-center gap-3 mt-1.5">
          {reportCount != null && reportCount > 0 && (
            <span className="flex items-center gap-1 font-mono text-[11px] text-status-open">
              <MessageCircleIcon className="w-3 h-3" />{reportCount} report{reportCount !== 1 ? 's' : ''}
            </span>
          )}
          {reportCount === 0 && (
            <span className="font-mono text-[11px] text-text-muted/60 italic">
              Be first to report
            </span>
          )}
          {likes && (likes.up > 0 || likes.down > 0) && (
            <span className="flex items-center gap-2 font-mono text-[11px]">
              <span className="flex items-center gap-0.5 text-status-open"><ThumbsUpIcon className="w-3 h-3" />{likes.up}</span>
              <span className="flex items-center gap-0.5 text-status-closed"><ThumbsDownIcon className="w-3 h-3" />{likes.down}</span>
            </span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="border-t border-text-muted/25 my-2.5" />

              {/* ── Section 1: At a Glance ── */}
              <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <DetailItem label="Difficulty" value={park.difficulty} />
                  <DetailItem label="Trail Miles" value={park.miles} />
                  <DetailItem label="NEMBA Chapter" value={park.nemba} />
                  <div>
                    <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                      Daylight
                    </div>
                    <div className="flex items-center gap-2 font-mono text-[13px] text-text-primary">
                      <SunriseIcon className="w-3.5 h-3.5 text-status-caution" />
                      {sunTimes.sunrise}
                      <SunsetIcon className="w-3.5 h-3.5 text-status-closed ml-1" />
                      {sunTimes.sunset}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Condition Reports (scraped) ── */}
              {conditionReports.length > 0 && (
                <div className="bg-status-caution-bg/50 border border-status-caution/20 rounded-lg px-3 py-2.5 mb-3">
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-status-caution mb-1.5">
                    Active Alerts ({conditionReports.length})
                  </div>
                  <div className="space-y-2">
                    {conditionReports.map((report, i) => (
                      <div key={i}>
                        <p className="font-mono text-[12px] text-text-primary font-semibold leading-tight">
                          {report.title}
                        </p>
                        {report.body && (
                          <p className="font-mono text-[11px] text-text-secondary leading-relaxed mt-0.5">
                            {report.body.length > 200 ? report.body.slice(0, 200) + '...' : report.body}
                          </p>
                        )}
                        <p className="font-mono text-[12px] text-text-muted mt-0.5">
                          {report.date} · via {report.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Section 2: Getting There ── */}
              <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3">
                <div className="grid grid-cols-1 gap-y-2">
                  <DetailItem label="Parking" value={park.parking} />
                  <div>
                    <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                      Last Verified
                    </div>
                    <div className="font-mono text-[13px] text-text-primary flex items-center gap-2">
                      {formatVerifiedDate(park.lastVerified)}
                      {isParkStale(park.id) && (
                        <span className="font-mono text-[12px] text-status-caution bg-status-caution-bg px-1.5 py-0.5 rounded uppercase">Needs review</span>
                      )}
                      {isParkUrlBroken(park.id) && (
                        <span className="font-mono text-[12px] text-status-closed bg-status-closed-bg px-1.5 py-0.5 rounded uppercase">Link broken</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 3: Nearby & Connected (conditional) ── */}
              {(connectedParks.length > 0 || nearbyParks.length > 0) && (
                <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3">
                  {connectedParks.length > 0 && (
                    <div className={nearbyParks.length > 0 ? 'mb-2.5' : ''}>
                      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1.5">
                        <LinkIcon className="w-3 h-3 inline mr-1" />Connects To
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {connectedParks.map((cp) => {
                          const cpTrail = getTrailStatus(cp);
                          const cpConfig = STATUS_CONFIG[cpTrail.status];
                          return (
                            <button
                              key={cp.id}
                              onClick={(e) => { e.stopPropagation(); onNavigateToPark?.(cp.id); }}
                              className={`${cpConfig.badgeBg} ${cpConfig.text} font-mono text-[11px] font-semibold px-3 py-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity duration-200`}
                            >
                              {cp.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {nearbyParks.length > 0 && (
                    <div>
                      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1.5">
                        Nearby Parks
                      </div>
                      <div className="space-y-1">
                        {nearbyParks.map(({ park: np, dist }) => {
                          const npTrail = getTrailStatus(np);
                          const npConfig = STATUS_CONFIG[npTrail.status];
                          return (
                            <button
                              key={np.id}
                              onClick={(e) => { e.stopPropagation(); onNavigateToPark?.(np.id); }}
                              className="flex items-center gap-2 font-mono text-[12px] w-full text-left py-1.5 px-2 -mx-2 rounded-md hover:bg-bg-elevated/50 transition-colors duration-200 cursor-pointer"
                            >
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${npConfig.dot}`} />
                              <span className="text-text-primary">{np.name}</span>
                              <span className="text-text-muted ml-auto flex-shrink-0">~{Math.round(dist)} mi · ~{estimateDriveMinutes(dist)} min</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Section 4: Status & Closures ── */}
              <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3 space-y-2.5">
                <div>
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                    Why This Status
                  </div>
                  <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                    {trail.reason}
                  </p>
                </div>

                <div className="border-t border-text-muted/25 pt-2">
                  <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                    Closure Policy
                  </div>
                  <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                    {park.closureRule}
                  </p>
                  {park.additionalClosures && park.additionalClosures.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      {park.additionalClosures.map((c, i) => (
                        <p key={i} className="font-mono text-[12px] text-text-secondary leading-relaxed">
                          <span className="text-status-caution font-semibold">{c.label}:</span> {c.rule} ({c.start.month}/{c.start.day}–{c.end.month}/{c.end.day})
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {park.source && (
                  <div className="border-t border-text-muted/25 pt-2">
                    <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                      Source
                    </div>
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                      {park.source}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Section 4b: Closure History Chart ── */}
              <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3">
                <Suspense fallback={
                  <div className="font-mono text-[11px] text-text-muted animate-pulse">Loading history...</div>
                }>
                  <ClosureHistoryChart parkId={park.id} />
                </Suspense>
              </div>

              {/* ── Section 5: Notes ── */}
              <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3">
                <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                  Notes
                </div>
                <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                  {park.notes}
                </p>
              </div>

              {/* ── Section 6: Actions ── */}
              <div className="space-y-2.5">
                {/* Primary action: Navigate — full width, bold color */}
                <a
                  href={getNavUrl(park)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`flex items-center justify-center gap-2 font-mono text-[13px] font-bold uppercase tracking-[0.05em] px-4 py-3 rounded-lg ${config.badgeBg} ${config.text} border-2 ${config.border} transition-colors duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30`}
                  aria-label={`Navigate to ${park.name} parking`}
                >
                  <NavigationIcon className="w-5 h-5" />
                  Navigate to Parking
                </a>

                {/* Secondary actions — each with distinct color */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={park.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2.5 rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/25 transition-colors duration-200 hover:bg-blue-500/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400/30"
                    aria-label={`View ${park.name} official page`}
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                    Park Info
                  </a>
                  <a
                    href={getWeatherUrl(park)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 transition-colors duration-200 hover:bg-cyan-500/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400/30"
                    aria-label={`Weather forecast for ${park.name}`}
                  >
                    <CloudSunIcon className="w-4 h-4" />
                    Weather
                  </a>
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2.5 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/25 transition-colors duration-200 hover:bg-violet-500/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400/30"
                    aria-label={`Share ${park.name} status`}
                  >
                    <Share2Icon className="w-4 h-4" />
                    {shareMsg || 'Share'}
                  </button>
                  <a
                    href={`https://github.com/zeesalt/dcr-trail-status/issues/new?title=${encodeURIComponent(`[${park.name}] Data correction`)}&body=${encodeURIComponent(`**Park:** ${park.name}\n**Current data:** ${park.closureRule}\n**What's wrong:**\n\n**Source:**\n`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-2.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/25 transition-colors duration-200 hover:bg-orange-500/25 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-400/30"
                    aria-label={`Report issue with ${park.name} data`}
                  >
                    <BugIcon className="w-4 h-4" />
                    Report Issue
                  </a>
                </div>
              </div>

              {/* ── Section 7: Rate this park ── */}
              {onVote && (
                <div className="bg-bg-primary/50 rounded-lg px-3 py-3 mt-3">
                  <div className="font-mono text-[12px] text-text-muted uppercase tracking-[0.05em] font-semibold mb-2">
                    Rate this trail
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onVote(park.id, 1); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border font-mono text-[13px] font-bold transition-all ${
                        myVote === 1
                          ? 'bg-status-open/20 text-status-open border-status-open/40'
                          : 'bg-status-open/5 text-status-open/70 border-status-open/15 hover:bg-status-open/15'
                      }`}
                    >
                      <ThumbsUpIcon className={`w-5 h-5 ${myVote === 1 ? 'fill-status-open' : ''}`} />
                      {likes?.up ?? 0}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onVote(park.id, -1); }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg border font-mono text-[13px] font-bold transition-all ${
                        myVote === -1
                          ? 'bg-status-closed/20 text-status-closed border-status-closed/40'
                          : 'bg-status-closed/5 text-status-closed/70 border-status-closed/15 hover:bg-status-closed/15'
                      }`}
                    >
                      <ThumbsDownIcon className={`w-5 h-5 ${myVote === -1 ? 'fill-status-closed' : ''}`} />
                      {likes?.down ?? 0}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Section 8: Community Condition Reports ── */}
              <ConditionReporter parkId={park.id} parkName={park.name} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
