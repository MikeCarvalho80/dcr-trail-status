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

  const handleInputChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 5);
    setInputValue(digits);
    if (digits.length === 5) {
      onZipChange(digits);
    }
  };

  return (
    <section aria-label="Distance filter" className="space-y-3">
      <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.05em] text-text-secondary">
        Location & Range
      </div>

      <div className="flex items-center gap-3">
        {/* ZIP input */}
        <div className="flex items-center gap-2">
          <label
            htmlFor="zip-input"
            className="font-mono text-[12px] text-text-muted uppercase tracking-[0.05em]"
          >
            ZIP
          </label>
          <input
            id="zip-input"
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            className={`
              w-[72px] px-2 py-1.5 rounded-md
              bg-bg-secondary border font-mono text-[14px] font-semibold text-text-primary
              focus:outline-none focus:ring-1 focus:ring-text-primary/30
              ${isValidZip ? 'border-bg-elevated' : 'border-status-closed/50'}
            `}
            placeholder="02136"
            maxLength={5}
            aria-invalid={!isValidZip}
          />
          {!isValidZip && inputValue.length === 5 && (
            <span className="font-mono text-[11px] text-status-closed">
              Unknown ZIP
            </span>
          )}
        </div>

        <div className="flex-1" />

        {/* Park count */}
        <div className="font-mono text-[12px] text-text-muted">
          <span className="text-text-primary font-semibold">{parkCount}</span> parks
        </div>
      </div>

      {/* Radius selector */}
      <div className="flex gap-1.5 flex-wrap">
        {RADIUS_OPTIONS.map((r) => {
          const isActive = radiusMiles === r;
          return (
            <button
              key={r}
              onClick={() => onRadiusChange(r)}
              className={`
                font-mono text-[12px] font-semibold
                py-1 px-2.5 rounded-full
                transition-colors duration-200
                focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-text-primary/50
                ${isActive
                  ? 'bg-bg-elevated text-text-primary border border-text-muted/30'
                  : 'bg-transparent text-text-secondary hover:text-text-primary/70 border border-transparent'
                }
              `}
              aria-pressed={isActive}
            >
              {r} mi
            </button>
          );
        })}
      </div>
    </section>
  );
}
