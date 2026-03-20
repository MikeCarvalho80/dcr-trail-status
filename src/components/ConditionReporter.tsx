import { useState, useEffect } from 'react';
import { MessageCircleIcon, SendIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon, UsersIcon } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { submitReport, getReports } from '../lib/conditionReports';
import type { AggregatedReports, ConditionReport } from '../lib/conditionReports';
import type { TrailStatus } from '../data/parks';
import { useRealtimeReports } from '../lib/useRealtimeReports';

const STATUS_OPTIONS: { value: TrailStatus; label: string; icon: typeof CheckCircleIcon; color: string }[] = [
  { value: 'open', label: 'Open', icon: CheckCircleIcon, color: 'text-status-open' },
  { value: 'caution', label: 'Caution', icon: AlertTriangleIcon, color: 'text-status-caution' },
  { value: 'closed', label: 'Closed', icon: XCircleIcon, color: 'text-status-closed' },
];

interface ConditionReporterProps {
  parkId: string;
  parkName: string;
}

function deduplicateReports(existing: ConditionReport[], incoming: ConditionReport[]): ConditionReport[] {
  const ids = new Set(existing.map((r) => r.id));
  const merged = [...existing];
  for (const r of incoming) {
    if (!ids.has(r.id)) {
      merged.unshift(r);
      ids.add(r.id);
    }
  }
  return merged;
}

function recalcConsensus(reports: ConditionReport[]): TrailStatus | null {
  if (reports.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const r of reports) counts[r.status] = (counts[r.status] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as TrailStatus | undefined ?? null;
}

export function ConditionReporter({ parkId, parkName }: ConditionReporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<TrailStatus | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reports, setReports] = useState<AggregatedReports | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Client-side rate limit state (avoids repeated failed attempts in same session)
  const [sessionRateLimited, setSessionRateLimited] = useState(false);

  // Realtime subscription — only active when panel is open
  const realtimeReports = useRealtimeReports(parkId, isOpen && isSupabaseConfigured);

  // Merge realtime reports into state
  useEffect(() => {
    if (realtimeReports.length > 0 && reports) {
      const merged = deduplicateReports(reports.recent, realtimeReports);
      setReports({
        total: merged.length,
        recent: merged.slice(0, 5),
        consensus: recalcConsensus(merged),
        lastReportedAt: merged[0]?.created_at ?? null,
      });
    }
  }, [realtimeReports]);

  // Fetch existing reports when panel opens
  useEffect(() => {
    if (!isOpen || !isSupabaseConfigured) return;
    getReports(parkId).then(setReports);
  }, [isOpen, parkId, submitted]);

  if (!isSupabaseConfigured) return null;

  async function handleSubmit() {
    if (!selectedStatus || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    const result = await submitReport(parkId, selectedStatus, note.trim());
    setSubmitting(false);

    if (result.ok) {
      setSubmitted(true);
      const submittedStatus = selectedStatus;
      const submittedNote = note.trim();
      setNote('');
      setSelectedStatus(null);
      // After a brief delay, offer share
      setTimeout(() => {
        if (navigator.share) {
          const shareText = `Just reported ${parkName} as ${submittedStatus} on TrailClear${submittedNote ? ` — ${submittedNote}` : ''}`;
          navigator.share({ title: 'TrailClear Report', text: shareText }).catch(() => {});
        }
        setSubmitted(false);
      }, 2000);
    } else if (result.rateLimited) {
      setSessionRateLimited(true);
      setErrorMsg(result.error ?? 'Please wait ~4 hours before reporting again.');
    } else {
      setErrorMsg(result.error ?? 'Failed to submit report.');
    }
  }

  function timeAgo(dateStr: string): string {
    const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="mt-3">
      {/* Toggle button — pill style for visibility */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 font-mono text-[12px] font-semibold text-text-secondary border border-bg-elevated hover:border-text-muted/30 hover:text-text-primary px-4 py-2.5 rounded-lg transition-colors"
      >
        <MessageCircleIcon className="w-4 h-4" />
        Report Conditions
        {reports && reports.total > 0 && (
          <span className="bg-bg-elevated rounded-full px-2 py-0.5 text-[12px]">
            {reports.total}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-2 bg-bg-primary border border-bg-elevated rounded-lg p-3 space-y-3">
          {/* Recent reports summary */}
          {reports && reports.total > 0 && (
            <div className="flex items-start gap-2 pb-2 border-b border-text-muted/25">
              <UsersIcon className="w-3.5 h-3.5 text-text-muted mt-0.5 flex-shrink-0" />
              <div className="font-mono text-[11px] text-text-secondary space-y-0.5">
                <div>
                  <span className="font-semibold">{reports.total}</span> report{reports.total !== 1 ? 's' : ''} in the last 48h
                  {reports.consensus && (
                    <span className={`ml-1 font-semibold ${
                      reports.consensus === 'open' ? 'text-status-open' :
                      reports.consensus === 'caution' ? 'text-status-caution' : 'text-status-closed'
                    }`}>
                      — riders say {reports.consensus}
                    </span>
                  )}
                </div>
                {reports.recent.slice(0, 3).map((r) => (
                  <div key={r.id} className={realtimeReports.some((rt) => rt.id === r.id) ? 'animate-pulse' : ''}>
                    <span className={
                      r.status === 'open' ? 'text-status-open' :
                      r.status === 'caution' ? 'text-status-caution' : 'text-status-closed'
                    }>{r.status}</span>
                    {r.note && <span> — {r.note}</span>}
                    <span className="text-text-muted/60 ml-1">{timeAgo(r.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submission form */}
          {sessionRateLimited || submitted ? (
            <div className={`font-mono text-[11px] flex items-center gap-1.5 ${submitted ? 'text-status-open' : 'text-status-caution'}`}>
              <CheckCircleIcon className="w-3.5 h-3.5" />
              {submitted ? 'Report submitted — thanks!' : errorMsg || 'You reported recently. Check back in a few hours.'}
            </div>
          ) : (
            <>
              <div>
                <div className="font-mono text-[12px] uppercase tracking-[0.05em] text-text-muted mb-1.5">
                  How are conditions at {parkName}?
                </div>
                <div className="flex gap-2">
                  {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => setSelectedStatus(value)}
                      className={`
                        flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg border font-mono text-[12px] font-semibold
                        transition-all duration-150
                        ${selectedStatus === value
                          ? `${color} border-current bg-bg-elevated`
                          : 'text-text-muted border-bg-elevated hover:border-text-muted/30'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {selectedStatus && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Optional note (e.g., 'muddy but rideable')"
                      maxLength={140}
                      className="flex-1 bg-bg-secondary border border-bg-elevated rounded-lg px-3 py-2.5 font-mono text-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary/30"
                    />
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-status-open/20 text-status-open font-mono text-[12px] font-semibold hover:bg-status-open/30 disabled:opacity-50 transition-colors"
                    >
                      <SendIcon className="w-4 h-4" />
                      {submitting ? '...' : 'Send'}
                    </button>
                  </div>
                  {errorMsg && (
                    <div className="font-mono text-[11px] text-status-closed">{errorMsg}</div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
