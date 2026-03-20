import { useMemo, useState, useCallback, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl/mapbox';
import { MaximizeIcon, MinimizeIcon } from 'lucide-react';
import type { Park } from '../data/parks';
import { getTrailStatus } from '../lib/status';
import { estimateDriveMinutes } from '../lib/geo';

interface TrailMapProps {
  parks: Park[];
  distances: Map<string, number>;
  onParkClick: (parkId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#2ecc71',
  caution: '#f1c40f',
  closed: '#f25c4d',
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

export function TrailMap({ parks, distances, onParkClick }: TrailMapProps) {
  const [popupPark, setPopupPark] = useState<Park | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close fullscreen on Escape
  useEffect(() => {
    if (!isFullscreen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsFullscreen(false);
    }
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll while fullscreen
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const initialViewState = useMemo(() => {
    if (parks.length === 0) return { longitude: -71.06, latitude: 42.36, zoom: 8 };
    const lats = parks.map((p) => p.lat);
    const lngs = parks.map((p) => p.lng);
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: 7.5,
    };
  }, [parks]);

  const handleMarkerClick = useCallback((park: Park) => {
    setPopupPark(park);
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-xl border border-bg-elevated bg-bg-secondary h-[350px] flex items-center justify-center">
        <span className="font-mono text-[12px] text-text-muted">Map requires VITE_MAPBOX_TOKEN</span>
      </div>
    );
  }

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50'
    : 'rounded-xl overflow-hidden border border-bg-elevated';

  return (
    <div className={containerClass} style={isFullscreen ? undefined : { height: 350 }}>
      {/* Fullscreen toggle button */}
      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-3 left-3 z-10 bg-white/90 hover:bg-white border border-black/10 rounded-md p-1.5 shadow-sm transition-colors"
        aria-label={isFullscreen ? 'Exit fullscreen map' : 'Fullscreen map'}
      >
        {isFullscreen
          ? <MinimizeIcon className="w-4 h-4 text-gray-700" />
          : <MaximizeIcon className="w-4 h-4 text-gray-700" />
        }
      </button>

      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={true}
      >
        <NavigationControl position="top-right" showCompass={false} />

        {parks.map((park) => {
          const trail = getTrailStatus(park);
          const color = STATUS_COLORS[trail.status];
          return (
            <Marker
              key={park.id}
              longitude={park.lng}
              latitude={park.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                handleMarkerClick(park);
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: `0 0 6px ${color}80`,
                  cursor: 'pointer',
                }}
              />
            </Marker>
          );
        })}

        {popupPark && (() => {
          const trail = getTrailStatus(popupPark);
          const color = STATUS_COLORS[trail.status];
          const dist = distances.get(popupPark.id);
          return (
            <Popup
              longitude={popupPark.lng}
              latitude={popupPark.lat}
              anchor="bottom"
              onClose={() => setPopupPark(null)}
              closeOnClick={false}
              maxWidth="240px"
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.4 }}>
                <strong>{popupPark.name}</strong>
                <br />
                {trail.label} · {popupPark.miles} mi · {popupPark.difficulty.split('-')[0]}
                {dist != null && <><br />~{Math.round(dist)} mi · ~{estimateDriveMinutes(dist)} min</>}
                <br />
                <button
                  onClick={() => onParkClick(popupPark.id)}
                  style={{
                    marginTop: 6,
                    padding: '5px 12px',
                    fontSize: 11,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: color,
                    color: '#0d0c0a',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  View Details
                </button>
              </div>
            </Popup>
          );
        })()}
      </Map>
    </div>
  );
}
