import { useState, useEffect } from 'react';
import { fetchClosureHistory } from '../lib/closureHistory';
import type { TrailStatus } from '../data/parks';

interface ClosureHistoryChartProps {
  parkId: string;
}

const STATUS_COLORS: Record<TrailStatus, string> = {
  open: '#22c55e',
  caution: '#f59e0b',
  closed: '#ef4444',
};

export function ClosureHistoryChart({ parkId }: ClosureHistoryChartProps) {
  const [data, setData] = useState<{ date: string; status: TrailStatus }[] | null>(null);

  useEffect(() => {
    fetchClosureHistory(parkId, 90).then(setData);
  }, [parkId]);

  if (data === null) {
    return (
      <div className="font-mono text-[11px] text-text-muted animate-pulse">
        Loading history...
      </div>
    );
  }

  if (data.length < 2) {
    return (
      <div className="font-mono text-[11px] text-text-muted">
        Not enough data for history chart
      </div>
    );
  }

  const barWidth = Math.max(2, Math.min(6, Math.floor(280 / data.length)));
  const gap = 1;
  const svgWidth = data.length * (barWidth + gap);
  const svgHeight = 20;

  // Count streaks for summary
  const statusCounts = { open: 0, caution: 0, closed: 0 };
  for (const d of data) statusCounts[d.status]++;

  return (
    <div>
      <div className="font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-rose-400 mb-1.5">
        Status History ({data.length}d)
      </div>
      <div className="overflow-x-auto">
        <svg
          width={svgWidth}
          height={svgHeight}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="block"
          aria-label={`Status history: ${statusCounts.open}d open, ${statusCounts.caution}d caution, ${statusCounts.closed}d closed`}
          role="img"
        >
          {data.map((d, i) => (
            <rect
              key={d.date}
              x={i * (barWidth + gap)}
              y={0}
              width={barWidth}
              height={svgHeight}
              rx={1}
              fill={STATUS_COLORS[d.status]}
              opacity={0.85}
            >
              <title>{d.date}: {d.status}</title>
            </rect>
          ))}
        </svg>
      </div>
      <div className="flex gap-3 mt-1 font-mono text-[12px] text-text-muted">
        {statusCounts.open > 0 && (
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-status-open mr-0.5" />{statusCounts.open}d open</span>
        )}
        {statusCounts.caution > 0 && (
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-status-caution mr-0.5" />{statusCounts.caution}d caution</span>
        )}
        {statusCounts.closed > 0 && (
          <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-status-closed mr-0.5" />{statusCounts.closed}d closed</span>
        )}
      </div>
    </div>
  );
}
