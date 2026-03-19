import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ExternalLinkIcon, NavigationIcon } from 'lucide-react';
import type { Park } from '../data/parks';
import { getTrailStatus, getNavUrl, STATUS_CONFIG } from '../lib/status';

interface ParkCardProps {
  park: Park;
  distanceMiles?: number;
  driveMinutes?: number;
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

export function ParkCard({ park, distanceMiles, driveMinutes }: ParkCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const trail = getTrailStatus(park);
  const config = STATUS_CONFIG[trail.status];

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

          {/* Chevron */}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 ml-1"
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
            <div className="px-4 pb-3">
              <div className="border-t border-bg-elevated my-2.5" />

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                <DetailItem label="Difficulty" value={park.difficulty} />
                <DetailItem label="NEMBA Chapter" value={park.nemba} />
                <DetailItem label="Trail Miles" value={park.miles} />
                <DetailItem label="Parking" value={park.parking} />
              </div>

              {/* Closure policy */}
              <div className="mt-3">
                <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                  Closure Policy
                </div>
                <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                  {park.closureRule}
                </p>
              </div>

              {/* Why this status */}
              <div className="mt-3">
                <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                  Why This Status
                </div>
                <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                  {trail.reason}
                </p>
              </div>

              {/* Source */}
              {park.source && (
                <div className="mt-2">
                  <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                    Source
                  </div>
                  <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                    {park.source}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div className="mt-2">
                <div className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-0.5">
                  Notes
                </div>
                <p className="font-mono text-[12px] text-text-secondary leading-relaxed">
                  {park.notes}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <a
                  href={getNavUrl(park)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`
                    inline-flex items-center gap-1.5
                    font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                    px-3 py-1.5 rounded-md border
                    ${config.border} ${config.text}
                    transition-colors duration-200
                    hover:opacity-80
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30
                  `}
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
                  className={`
                    inline-flex items-center gap-1.5
                    font-mono text-[12px] font-semibold uppercase tracking-[0.05em]
                    px-3 py-1.5 rounded-md border
                    border-bg-elevated text-text-secondary
                    transition-colors duration-200
                    hover:text-text-primary hover:border-text-muted
                    focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/30
                  `}
                  aria-label={`View ${park.name} official page`}
                >
                  <ExternalLinkIcon className="w-4 h-4" />
                  Park Info
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
