import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { PARKS } from '../data/parks';
import type { Park, ClosureDate } from '../data/parks';
import { STATUS_CONFIG } from '../lib/status';

function isInMonth(month: number, start: ClosureDate, end: ClosureDate): boolean {
  if (start.month > end.month) {
    return month >= start.month || month <= end.month;
  }
  return month >= start.month && month <= end.month;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function ClosureCalendar() {
  const now = new Date();
  const [startMonth, setStartMonth] = useState(now.getMonth()); // 0-indexed
  const [startYear, setStartYear] = useState(now.getFullYear());

  const months = useMemo(() => {
    const result: { month: number; year: number; label: string }[] = [];
    for (let i = 0; i < 6; i++) {
      const m = (startMonth + i) % 12;
      const y = startYear + Math.floor((startMonth + i) / 12);
      result.push({ month: m + 1, year: y, label: `${MONTH_NAMES[m]}` });
    }
    return result;
  }, [startMonth, startYear]);

  // Find parks with closures active in the visible months
  const parksWithClosures = useMemo(() => {
    const visibleMonths = new Set(months.map((m) => m.month));
    const result: { park: Park; label: string; type: string; months: number[] }[] = [];

    for (const park of PARKS) {
      if (park.closureStart && park.closureEnd) {
        const activeMonths = Array.from(visibleMonths).filter((m) =>
          isInMonth(m, park.closureStart!, park.closureEnd!)
        );
        if (activeMonths.length > 0) {
          result.push({
            park,
            label: park.closureType === 'formal' ? 'Formal' : 'Seasonal',
            type: park.closureType,
            months: activeMonths,
          });
        }
      }
      if (park.additionalClosures) {
        for (const c of park.additionalClosures) {
          const activeMonths = Array.from(visibleMonths).filter((m) =>
            isInMonth(m, c.start, c.end)
          );
          if (activeMonths.length > 0) {
            result.push({
              park,
              label: c.label,
              type: c.type,
              months: activeMonths,
            });
          }
        }
      }
    }
    return result.sort((a, b) => a.park.name.localeCompare(b.park.name));
  }, [months]);

  function prev() {
    if (startMonth === 0) { setStartMonth(11); setStartYear(startYear - 1); }
    else setStartMonth(startMonth - 1);
  }
  function next() {
    if (startMonth === 11) { setStartMonth(0); setStartYear(startYear + 1); }
    else setStartMonth(startMonth + 1);
  }

  return (
    <section aria-label="Closure calendar" className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
          Closure Calendar
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="text-text-muted hover:text-text-primary" aria-label="Previous months">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="font-mono text-[11px] text-text-muted">
            {months[0].label} – {months[5].label} {months[5].year}
          </span>
          <button onClick={next} className="text-text-muted hover:text-text-primary" aria-label="Next months">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {parksWithClosures.length === 0 ? (
        <p className="font-mono text-[11px] text-text-muted py-2">No closures in this window.</p>
      ) : (
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left font-mono text-[11px] text-text-muted font-semibold uppercase tracking-[0.05em] pb-1.5 pr-3 whitespace-nowrap">Park</th>
                {months.map((m) => (
                  <th key={`${m.month}-${m.year}`} className="font-mono text-[11px] text-text-muted font-semibold uppercase text-center pb-1.5 w-10">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parksWithClosures.map(({ park, label, type, months: activeMonths }, i) => (
                <tr key={`${park.id}-${label}-${i}`} className="border-t border-bg-elevated/50">
                  <td className="font-mono text-[11px] text-text-primary py-1 pr-3 whitespace-nowrap max-w-[140px] truncate" title={park.name}>
                    {park.name}
                    <span className="text-text-muted ml-1">({label})</span>
                  </td>
                  {months.map((m) => {
                    const isActive = activeMonths.includes(m.month);
                    const colorClass = type === 'formal' || type === 'seasonal'
                      ? 'bg-status-closed/40'
                      : 'bg-status-caution/40';
                    return (
                      <td key={`${m.month}-${m.year}`} className="text-center py-1">
                        {isActive && (
                          <div className={`mx-auto w-6 h-3 rounded ${colorClass}`} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
