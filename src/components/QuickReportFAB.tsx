import { useState } from 'react';
import { MessageCirclePlusIcon, XIcon, CheckCircleIcon, AlertTriangleIcon, XCircleIcon, SendIcon } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';
import { submitReport } from '../lib/conditionReports';
import { PARKS } from '../data/parks';
import type { TrailStatus } from '../data/parks';

const STATUS_OPTIONS: { value: TrailStatus; label: string; icon: typeof CheckCircleIcon; color: string }[] = [
  { value: 'open', label: 'Open', icon: CheckCircleIcon, color: 'text-status-open' },
  { value: 'caution', label: 'Caution', icon: AlertTriangleIcon, color: 'text-status-caution' },
  { value: 'closed', label: 'Closed', icon: XCircleIcon, color: 'text-status-closed' },
];

export function QuickReportFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [parkId, setParkId] = useState('');
  const [status, setStatus] = useState<TrailStatus | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  if (!isSupabaseConfigured) return null;

  async function handleSubmit() {
    if (!parkId || !status || submitting) return;
    setSubmitting(true);
    const res = await submitReport(parkId, status, note.trim());
    setSubmitting(false);

    if (res.ok) {
      setResult({ ok: true, msg: 'Report submitted!' });
      setTimeout(() => {
        setIsOpen(false);
        setResult(null);
        setParkId('');
        setStatus(null);
        setNote('');
      }, 1500);
    } else {
      setResult({ ok: false, msg: res.error ?? 'Failed to submit' });
    }
  }

  function handleShareAfterReport() {
    const park = PARKS.find((p) => p.id === parkId);
    if (!park || !status) return;
    const text = `Just reported ${park.name} as ${status} on TrailClear${note ? ` — ${note}` : ''}`;
    if (navigator.share) {
      navigator.share({ title: 'TrailClear Report', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
    }
  }

  return (
    <>
      {/* FAB button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-status-open text-bg-primary rounded-full p-4 shadow-lg hover:bg-status-open/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-open/50"
        aria-label="Quick condition report"
      >
        <MessageCirclePlusIcon className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-bg-secondary border border-bg-elevated rounded-t-2xl sm:rounded-2xl w-full sm:max-w-[400px] p-5 mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-[14px] font-bold text-text-primary">Quick Report</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 text-text-muted hover:text-text-primary">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {result ? (
              <div className="text-center py-4 space-y-3">
                <div className={`font-mono text-[13px] font-semibold ${result.ok ? 'text-status-open' : 'text-status-closed'}`}>
                  {result.msg}
                </div>
                {result.ok && (
                  <button
                    onClick={handleShareAfterReport}
                    className="font-mono text-[12px] font-semibold text-text-secondary hover:text-text-primary border border-bg-elevated px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Share with your riding group
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Park selector */}
                <div>
                  <label className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1.5 block">
                    Park
                  </label>
                  <select
                    value={parkId}
                    onChange={(e) => setParkId(e.target.value)}
                    className="w-full bg-bg-primary border border-bg-elevated rounded-lg px-3 py-2.5 font-mono text-[12px] text-text-primary focus:outline-none focus:ring-1 focus:ring-text-primary/30"
                  >
                    <option value="">Select a park…</option>
                    {PARKS.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status buttons */}
                <div>
                  <label className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-text-muted mb-1.5 block">
                    Conditions
                  </label>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        onClick={() => setStatus(value)}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg border font-mono text-[12px] font-semibold
                          transition-all duration-150
                          ${status === value
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

                {/* Note */}
                <div>
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Optional note (e.g., 'muddy but rideable')"
                    maxLength={140}
                    className="w-full bg-bg-primary border border-bg-elevated rounded-lg px-3 py-2.5 font-mono text-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary/30"
                  />
                </div>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!parkId || !status || submitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-status-open/20 text-status-open font-mono text-[13px] font-semibold hover:bg-status-open/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <SendIcon className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
