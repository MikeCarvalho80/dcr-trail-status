import { useState } from 'react';

interface DistanceControlsProps {
  zipCode: string;
  radiusMiles: number;
  onZipChange: (zip: string) => void;
  onRadiusChange: (miles: number) => void;
  parkCount: number;
  isValidZip: boolean;
}

const RADIUS_OPTIONS = [15, 25, 50, 75, 100, 150];

export function DistanceControls({
  zipCode,
  radiusMiles,
  onZipChange,
  onRadiusChange,
  parkCount,
  isValidZip,
}: DistanceControlsProps) {
  const [inputValue, setInputValue] = useState(zipCode);
  const [customRadius, setCustomRadius] = useState('');
  const isCustom = !RADIUS_OPTIONS.includes(radiusMiles);

  const handleInputChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 5);
    setInputValue(digits);
    if (digits.length === 5) {
      onZipChange(digits);
    }
  };

  const handleCustomRadius = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setCustomRadius(digits);
    const n = parseInt(digits, 10);
    if (!isNaN(n) && n > 0) {
      onRadiusChange(n);
    }
  };

  return (
    <section
      aria-label="Distance filter"
      className="bg-bg-secondary border border-bg-elevated rounded-xl px-4 py-4 space-y-4"
    >
      {/* ZIP input row */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 flex-1">
          <label
            htmlFor="zip-input"
            className="font-mono text-[12px] text-text-secondary font-semibold uppercase tracking-[0.05em] shrink-0"
          >
            Your ZIP
          </label>
          <input
            id="zip-input"
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`
              w-[80px] px-3 py-2 rounded-lg
              bg-bg-elevated font-mono text-[16px] font-bold text-text-primary
              border-2 transition-colors duration-200
              focus:outline-none focus:border-text-secondary
              ${isValidZip ? 'border-text-muted/40' : 'border-status-closed/60'}
            `}
            placeholder="02136"
            maxLength={5}
            aria-invalid={!isValidZip}
          />
          {!isValidZip && inputValue.length === 5 && (
            <span className="font-mono text-[11px] text-status-closed font-semibold">
              Not found
            </span>
          )}
        </div>
      </div>

      {/* Radius selector */}
      <div>
        <div className="font-mono text-[11px] text-text-muted uppercase tracking-[0.05em] mb-2">
          Drive range
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {RADIUS_OPTIONS.map((r) => {
            const isActive = radiusMiles === r;
            return (
              <button
                key={r}
                onClick={() => { onRadiusChange(r); setCustomRadius(''); }}
                className={`
                  font-mono text-[13px] font-semibold
                  py-2.5 px-4 rounded-lg min-w-[52px]
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/50
                  ${isActive
                    ? 'bg-text-primary text-bg-primary'
                    : 'bg-bg-elevated text-text-secondary border border-text-muted/20 hover:border-text-muted/50 hover:text-text-primary'
                  }
                `}
                aria-pressed={isActive}
              >
                {r} mi
              </button>
            );
          })}
          <div className="flex items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              value={isCustom && !customRadius ? String(radiusMiles) : customRadius}
              onChange={(e) => handleCustomRadius(e.target.value)}
              onFocus={() => { if (!customRadius && isCustom) setCustomRadius(String(radiusMiles)); }}
              placeholder="Custom"
              className={`
                w-[70px] px-2 py-2.5 rounded-lg font-mono text-[13px] font-semibold text-center
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-text-primary/50
                ${isCustom
                  ? 'bg-text-primary text-bg-primary'
                  : 'bg-bg-elevated text-text-secondary border border-text-muted/20 placeholder:text-text-muted'
                }
              `}
              maxLength={4}
              aria-label="Custom drive range in miles"
            />
            <span className="font-mono text-[12px] text-text-muted">mi</span>
          </div>
        </div>
      </div>

      {/* Summary line */}
      <div className="font-mono text-[12px] text-text-muted pt-1 border-t border-text-muted/25">
        Showing <span className="text-text-primary font-semibold">{parkCount}</span> park{parkCount !== 1 ? 's' : ''} within{' '}
        <span className="text-text-primary font-semibold">{radiusMiles} mi</span> of{' '}
        <span className="text-text-primary font-semibold">{isValidZip ? zipCode : '—'}</span>
      </div>
    </section>
  );
}
