import { DownloadIcon, XIcon } from 'lucide-react';

interface PwaNudgeProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export function PwaNudge({ onInstall, onDismiss }: PwaNudgeProps) {
  return (
    <div className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-3 mb-5">
      <div className="flex items-start gap-3">
        <DownloadIcon className="w-5 h-5 text-status-open flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[12px] text-text-primary font-semibold">
            Add TrailClear to your home screen
          </p>
          <p className="font-mono text-[11px] text-text-muted mt-0.5">
            Works offline at the trailhead — no signal needed.
          </p>
          <button
            onClick={onInstall}
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-status-open mt-2 hover:underline"
          >
            Install App
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary flex-shrink-0"
          aria-label="Dismiss install prompt"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
