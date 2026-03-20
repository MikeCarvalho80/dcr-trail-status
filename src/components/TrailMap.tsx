import { useMemo, useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, GeolocateControl, ScaleControl } from 'react-map-gl/mapbox';
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

  return (
    <div className="rounded-xl overflow-hidden border border-bg-elevated" style={{ height: 350 }}>
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/outdoors-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={true}
      >
        {/* Built-in Mapbox controls — positioned in map chrome */}
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-right" showCompass={true} />
        <GeolocateControl position="top-right" trackUserLocation={false} />
        <ScaleControl position="bottom-left" />

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
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: `0 0 8px ${color}80`,
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
              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                lineHeight: 1.5,
                color: '#e8e6e1',
              }}>
                <strong style={{ fontSize: 13 }}>{popupPark.name}</strong>
                <div style={{ color: color, fontWeight: 600, fontSize: 12, marginTop: 2 }}>
                  {trail.label}
                </div>
                <div style={{ color: '#a8a295', marginTop: 2 }}>
                  {popupPark.miles} mi · {popupPark.difficulty.split('-')[0]}
                  {dist != null && <> · ~{Math.round(dist)} mi · ~{estimateDriveMinutes(dist)} min</>}
                </div>
                <button
                  onClick={() => onParkClick(popupPark.id)}
                  style={{
                    marginTop: 8,
                    padding: '8px 12px',
                    fontSize: 12,
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: color,
                    color: '#0d0c0a',
                    border: 'none',
                    borderRadius: 6,
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
