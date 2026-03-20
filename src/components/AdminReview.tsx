import { useState, useEffect } from 'react';
import { CheckIcon, XIcon, ClockIcon } from 'lucide-react';
import { getPendingSubmissions, approveSubmission, rejectSubmission } from '../lib/parkSubmissions';
import type { ParkSubmission } from '../lib/parkSubmissions';

export function AdminReview() {
  const [submissions, setSubmissions] = useState<ParkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    getPendingSubmissions().then((data) => {
      setSubmissions(data);
      setLoading(false);
    });
  }, []);

  async function handleApprove(id: string) {
    setActionId(id);
    const ok = await approveSubmission(id, reviewNotes);
    if (ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    setActionId(null);
    setReviewNotes('');
  }

  async function handleReject(id: string) {
    setActionId(id);
    const ok = await rejectSubmission(id, reviewNotes);
    if (ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    setActionId(null);
    setReviewNotes('');
  }

  const inputClass = "w-full bg-bg-primary border border-bg-elevated rounded-lg px-3 py-2 font-mono text-[12px] text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-text-primary/30";

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-[800px] mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="font-mono text-[22px] font-bold text-text-primary">
            Review Submissions
          </h1>
          <p className="font-mono text-[12px] text-text-secondary mt-1">
            Approve or reject community-submitted parks.
          </p>
          <a
            href="?admin"
            className="font-mono text-[12px] text-status-open hover:underline mt-1 inline-block"
          >
            Back to Add Park form
          </a>
        </header>

        {loading && (
          <div className="font-mono text-[12px] text-text-muted animate-pulse">
            Loading submissions...
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-6 text-center">
            <ClockIcon className="w-6 h-6 text-text-muted mx-auto mb-2" />
            <p className="font-mono text-[13px] text-text-secondary">No pending submissions</p>
          </div>
        )}

        <div className="space-y-4">
          {submissions.map((sub) => (
            <div key={sub.id} className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-4">
              {/* Park preview */}
              <div className="mb-3">
                <div className="font-mono text-[16px] font-bold text-text-primary">
                  {sub.park_name}
                </div>
                <div className="font-mono text-[11px] text-text-muted mt-0.5">
                  {sub.region} · {sub.state} · {sub.manager}
                </div>
                <div className="font-mono text-[11px] text-text-secondary mt-1">
                  {sub.difficulty} · {sub.miles} mi · {sub.closure_type}
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-2 mb-3 bg-bg-primary/50 rounded-lg p-3">
                <div>
                  <span className="font-mono text-[12px] uppercase text-text-muted">Parking</span>
                  <p className="font-mono text-[11px] text-text-primary">{sub.parking}</p>
                </div>
                <div>
                  <span className="font-mono text-[12px] uppercase text-text-muted">Coords</span>
                  <p className="font-mono text-[11px] text-text-primary">{sub.lat}, {sub.lng}</p>
                </div>
                <div>
                  <span className="font-mono text-[12px] uppercase text-text-muted">Closure Rule</span>
                  <p className="font-mono text-[11px] text-text-primary">{sub.closure_rule}</p>
                </div>
                <div>
                  <span className="font-mono text-[12px] uppercase text-text-muted">URL</span>
                  <a href={sub.url} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[11px] text-status-open hover:underline block truncate">
                    {sub.url}
                  </a>
                </div>
                {sub.notes && (
                  <div className="col-span-2">
                    <span className="font-mono text-[12px] uppercase text-text-muted">Notes</span>
                    <p className="font-mono text-[11px] text-text-secondary">{sub.notes}</p>
                  </div>
                )}
              </div>

              {/* Submitted date */}
              <div className="font-mono text-[12px] text-text-muted mb-3">
                Submitted {new Date(sub.created_at).toLocaleString()}
              </div>

              {/* Review notes + actions */}
              <div className="flex gap-2">
                <input
                  className={inputClass + ' flex-1'}
                  placeholder="Reviewer notes (optional)"
                  value={actionId === sub.id ? reviewNotes : ''}
                  onChange={(e) => { setActionId(sub.id); setReviewNotes(e.target.value); }}
                />
                <button
                  onClick={() => handleApprove(sub.id)}
                  disabled={actionId === sub.id && actionId !== null}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-open/20 text-status-open font-mono text-[11px] font-semibold hover:bg-status-open/30 disabled:opacity-50 transition-colors"
                >
                  <CheckIcon className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => handleReject(sub.id)}
                  disabled={actionId === sub.id && actionId !== null}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-status-closed/20 text-status-closed font-mono text-[11px] font-semibold hover:bg-status-closed/30 disabled:opacity-50 transition-colors"
                >
                  <XIcon className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
