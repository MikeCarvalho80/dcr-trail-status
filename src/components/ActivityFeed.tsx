import { useState, useEffect } from 'react';
import { MessageCircleIcon } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PARKS } from '../data/parks';
import type { TrailStatus } from '../data/parks';

interface FeedReport {
  id: string;
  park_id: string;
  status: TrailStatus;
  note: string;
  created_at: string;
}

const STATUS_LABELS: Record<TrailStatus, { text: string; color: string }> = {
  open: { text: 'Open', color: 'text-status-open' },
  caution: { text: 'Caution', color: 'text-status-caution' },
  closed: { text: 'Closed', color: 'text-status-closed' },
};

function timeAgo(dateStr: string): string {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface ActivityFeedProps {
  onParkClick: (parkId: string) => void;
  totalReportsThisWeek: number;
}

export function ActivityFeed({ onParkClick, totalReportsThisWeek }: ActivityFeedProps) {
  const [reports, setReports] = useState<FeedReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    supabase
      .from('condition_reports')
      .select('id, park_id, status, note, created_at')
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data, error }) => {
        if (!error && data) setReports(data as FeedReport[]);
        setLoading(false);
      });
  }, []);

  if (!isSupabaseConfigured || (loading === false && reports.length === 0)) return null;

  const parkNameMap = new Map(PARKS.map((p) => [p.id, p.name]));

  return (
    <section aria-label="Community activity" className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <MessageCircleIcon className="w-4 h-4 text-status-open" />
        <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
          Live from the Trails
        </div>
        {totalReportsThisWeek > 0 && (
          <span className="font-mono text-[11px] text-text-muted">
            · {totalReportsThisWeek} reports this week
          </span>
        )}
      </div>

      {loading ? (
        <div className="font-mono text-[11px] text-text-muted animate-pulse">Loading activity...</div>
      ) : (
        <div className="space-y-1.5">
          {reports.map((r) => {
            const parkName = parkNameMap.get(r.park_id) ?? r.park_id;
            const { text, color } = STATUS_LABELS[r.status] ?? STATUS_LABELS.open;
            return (
              <button
                key={r.id}
                onClick={() => onParkClick(r.park_id)}
                className="flex items-start gap-2 w-full text-left py-1.5 px-2 -mx-2 rounded-lg hover:bg-bg-elevated/50 transition-colors"
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
                  r.status === 'open' ? 'bg-status-open' :
                  r.status === 'caution' ? 'bg-status-caution' : 'bg-status-closed'
                }`} />
                <div className="min-w-0 flex-1">
                  <span className="font-mono text-[12px] text-text-primary font-semibold">
                    {parkName}
                  </span>
                  <span className={`font-mono text-[12px] ${color} ml-1.5`}>
                    {text}
                  </span>
                  {r.note && (
                    <span className="font-mono text-[11px] text-text-muted ml-1.5">
                      — {r.note.length > 50 ? r.note.slice(0, 50) + '…' : r.note}
                    </span>
                  )}
                </div>
                <span className="font-mono text-[11px] text-text-muted flex-shrink-0">
                  {timeAgo(r.created_at)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
