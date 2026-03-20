import { useState, useEffect } from 'react';
import { WifiOffIcon, XIcon } from 'lucide-react';

const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
const LAST_ONLINE_KEY = 'dcr-last-online';

function markOnline() {
  localStorage.setItem(LAST_ONLINE_KEY, String(Date.now()));
}

function getLastOnline(): number | null {
  const val = localStorage.getItem(LAST_ONLINE_KEY);
  return val ? parseInt(val, 10) : null;
}

export function StaleDataBanner() {
  const [isStale, setIsStale] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Mark current visit
    if (navigator.onLine) {
      markOnline();
    }

    const lastOnline = getLastOnline();
    if (lastOnline && Date.now() - lastOnline > STALE_THRESHOLD_MS) {
      setIsStale(true);
    }

    // Listen for going offline/online
    function handleOnline() { markOnline(); setIsStale(false); }
    function handleOffline() {
      const lo = getLastOnline();
      if (lo && Date.now() - lo > STALE_THRESHOLD_MS) setIsStale(true);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isStale || dismissed) return null;

  const lastOnline = getLastOnline();
  const hoursAgo = lastOnline ? Math.round((Date.now() - lastOnline) / (60 * 60 * 1000)) : null;

  return (
    <div className="bg-status-caution-bg border border-status-caution/30 rounded-xl px-4 py-3 mb-5">
      <div className="flex items-start gap-3">
        <WifiOffIcon className="w-5 h-5 text-status-caution flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[12px] text-text-primary font-semibold">
            Trail data may be outdated
          </p>
          <p className="font-mono text-[11px] text-text-muted mt-0.5">
            {hoursAgo
              ? `Last refreshed ${hoursAgo}h ago. Statuses may have changed.`
              : 'You appear to be offline. Data shown is cached.'}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-text-muted hover:text-text-primary flex-shrink-0 p-1"
          aria-label="Dismiss stale data warning"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
