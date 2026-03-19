import { useEffect, useState } from 'react';

/**
 * Returns a Date that updates once daily at the given hour in the
 * specified IANA time-zone (defaults to 6 AM Eastern).
 */
export function useDailyRefresh(
  hour = 6,
  timeZone = 'America/New_York',
): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    function msUntilNext(): number {
      const current = new Date();

      // Build a formatter that gives us the wall-clock hour in the target zone
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      }).formatToParts(current);

      const h = Number(parts.find((p) => p.type === 'hour')!.value);
      const m = Number(parts.find((p) => p.type === 'minute')!.value);
      const s = Number(parts.find((p) => p.type === 'second')!.value);

      // Seconds remaining until the target hour today (or tomorrow)
      const targetSec = hour * 3600;
      const currentSec = h * 3600 + m * 60 + s;
      const diffSec =
        targetSec > currentSec
          ? targetSec - currentSec
          : 24 * 3600 - currentSec + targetSec;

      return diffSec * 1000;
    }

    let timer: ReturnType<typeof setTimeout>;

    function schedule() {
      timer = setTimeout(() => {
        setNow(new Date());
        schedule(); // queue the next day
      }, msUntilNext());
    }

    schedule();
    return () => clearTimeout(timer);
  }, [hour, timeZone]);

  return now;
}
