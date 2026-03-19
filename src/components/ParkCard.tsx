import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDownIcon, ExternalLinkIcon, NavigationIcon, StarIcon,
  Share2Icon, CloudSunIcon, CheckCircleIcon, SunriseIcon, SunsetIcon, LinkIcon,
} from 'lucide-react';
import type { Park } from '../data/parks';
import { PARKS } from '../data/parks';
import { getTrailStatus, getNavUrl, STATUS_CONFIG } from '../lib/status';
import { getSunTimes } from '../lib/sun';
import { getConnectedParks } from '../lib/connectivity';
import { haversineDistance, estimateDriveMinutes } from '../lib/geo';

interface ParkCardProps {
  park: Park;
  distanceMiles?: number;
  driveMinutes?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isVisited: boolean;
  onToggleVisited: () => void;
  statusChanged?: { from: string; to: string };
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

export function ParkCard({ park, distanceMiles, driveMinutes, isFavorite, onToggleFavorite, isVisited, onToggleVisited, statusChanged }: ParkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const trail = getTrailStatus(park);
  const config = STATUS_CONFIG[trail.status];

  const sunTimes = getSunTimes(park.lat, park.lng, new Date());
  const connectedIds = getConnectedParks(park.id);
  const connectedParks = connectedIds
    .map((id) => PARKS.find((p) => p.id === id))
    .filter(Boolean) as Park[];

  // Nearby parks (within 15 miles, excluding self and connected)
  const nearbyParks = PARKS
    .filter((p) => p.id !== park.id && !connectedIds.includes(p.id))
    .map((p) => ({ park: p, dist: haversineDistance(park.lat, park.lng, p.lat, p.lng) }))
    .filter((p) => p.dist <= 15)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3);

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
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left px-4 py-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30 focus-visible:ring-inset rounded-xl"
        aria-expanded={isExpanded}
        aria-label={`${park.name}: ${trail.label}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
      >
        {/* Status change badge */}
        {statusChanged && (
          <div className="font-mono text-[11px] text-status-caution mb-1">
            Changed: {statusChanged.from} → {statusChanged.to}
          </div>
        )}

        {/* Top row: status dot + badges + distance */}
        <div className="flex items-center gap-2">
          <span
            className={`
              w-2 h-2 rounded-full flex-shrink-0 ${config.dot}
              ${trail.status === 'closed' ? 'animate-pulse-dot' : ''}
            `}
            aria-hidden="true"
          />
          <span className="sr-only">{trail.status}</span>

          {/* Status badge */}
          <span
            className={`${config.badgeBg} ${config.text} font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded`}
          >
            {trail.label}
          </span>

          {/* Manager tag */}
          <span className="bg-bg-elevated text-text-secondary font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5 rounded">
            {park.manager}
          </span>

          <div className="flex-1" />

          {/* Distance + miles */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {distanceMiles != null && (
              <span className="font-mono text-[12px] text-text-secondary">
                ~{driveMinutes} min
              </span>
            )}
            <span className="font-mono text-[12px] text-text-muted">
              {park.miles} mi
            </span>
          </div>

          {/* Visit check */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onToggleVisited(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onToggleVisited(); } }}
            className="flex-shrink-0 cursor-pointer"
            aria-label={isVisited ? `Unmark ${park.name} as visited` : `Mark ${park.name} as visited`}
          >
            <CheckCircleIcon
              className={`w-4 h-4 transition-colors duration-200 ${isVisited ? 'text-status-open fill-status-open' : 'text-text-muted/40 hover:text-status-open/60'}`}
            />
          </span>

          {/* Favorite star */}
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); e.preventDefault(); onToggleFavorite(); } }}
            className="flex-shrink-0 cursor-pointer"
            aria-label={isFavorite ? `Remove ${park.name} from favorites` : `Add ${park.name} to favorites`}
          >
            <StarIcon
              className={`w-4 h-4 transition-colors duration-200 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-text-muted hover:text-amber-400/60'}`}
            />
          </span>

          {/* Chevron */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-0.5"
          >
            <ChevronDownIcon className="w-4 h-4 text-text-muted" />
          </motion.span>
        </div>

        {/* Park name */}
        <div className="font-mono text-[18px] font-bold text-text-primary mt-1.5 leading-tight">
          {park.name}
        </div>

        {/* Sublabel */}
        <div className="font-mono text-[12px] text-text-muted mt-0.5">
          {trail.sublabel}
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
              <div className="border-t border-bg-elevated my-2.5" />

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

              {/* ── Section 2: Getting There ── */}
              <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3">
                <div className="grid grid-cols-1 gap-y-2">
                  <DetailItem label="Parking" value={park.parking} />
                  <DetailItem label="Last Verified" value={formatVerifiedDate(park.lastVerified)} />
                </div>
              </div>

              {/* ── Section 3: Nearby & Connected (conditional) ── */}
              {(connectedParks.length > 0 || nearbyParks.length > 0) && (
                <div className="bg-bg-primary/50 rounded-lg px-3 py-2.5 mb-3">
                  {connectedParks.length > 0 && (
                    <div className={nearbyParks.length > 0 ? 'mb-2.5' : ''}>
                      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
                        <LinkIcon className="w-3 h-3 inline mr-1" />Connects To
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {connectedParks.map((cp) => {
                          const cpTrail = getTrailStatus(cp);
                          const cpConfig = STATUS_CONFIG[cpTrail.status];
                          return (
                            <span key={cp.id} className={`${cpConfig.badgeBg} ${cpConfig.text} font-mono text-[11px] font-semibold px-2 py-0.5 rounded`}>
                              {cp.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {nearbyParks.length > 0 && (
                    <div>
                      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1">
                        Nearby Parks
                      </div>
                      <div className="space-y-0.5">
                        {nearbyParks.map(({ park: np, dist }) => {
                          const npTrail = getTrailStatus(np);
                          const npConfig = STATUS_CONFIG[npTrail.status];
                          return (
                            <div key={np.id} className="flex items-center gap-2 font-mono text-[12px]">
                              <span className={`w-1.5 h-1.5 rounded-full ${npConfig.dot}`} />
                              <span className="text-text-primary">{np.name}</span>
                              <span className="text-text-muted">~{Math.round(dist)} mi · ~{estimateDriveMinutes(dist)} min</span>
                            </div>
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

                <div className="border-t border-bg-elevated/50 pt-2">
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
                  <div className="border-t border-bg-elevated/50 pt-2">
                    <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                      Source
                    </div>
                    <p className="font-mono text-[11px] text-text-muted leading-relaxed">
                      {park.source}
                    </p>
                  </div>
                )}
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
              <div className="flex flex-wrap gap-2">
                <a
                  href={getNavUrl(park)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-1.5 rounded-md border ${config.border} ${config.text} transition-colors duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30`}
                  aria-label={`Navigate to ${park.name} parking`}
                >
                  <NavigationIcon className="w-4 h-4" />
                  Navigate
                </a>
                <a
                  href={park.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-1.5 rounded-md border border-bg-elevated text-text-secondary transition-colors duration-200 hover:text-text-primary hover:border-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30"
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
                  className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-1.5 rounded-md border border-bg-elevated text-text-secondary transition-colors duration-200 hover:text-text-primary hover:border-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30"
                  aria-label={`Weather forecast for ${park.name}`}
                >
                  <CloudSunIcon className="w-4 h-4" />
                  Weather
                </a>
                <button
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold uppercase tracking-[0.05em] px-3 py-1.5 rounded-md border border-bg-elevated text-text-secondary transition-colors duration-200 hover:text-text-primary hover:border-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30"
                  aria-label={`Share ${park.name} status`}
                >
                  <Share2Icon className="w-4 h-4" />
                  {shareMsg || 'Share'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
