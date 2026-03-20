import { useMemo, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
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

// Use Mapbox Outdoors style for terrain detail, fallback to free OSM tiles
const MAP_STYLE = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12?access_token=${MAPBOX_TOKEN}`
  : 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json';

import { useState } from 'react';

export function TrailMap({ parks, distances, onParkClick }: TrailMapProps) {
  const [popupPark, setPopupPark] = useState<Park | null>(null);

  // Compute bounds for initial view
  const bounds = useMemo(() => {
    if (parks.length === 0) return null;
    const lats = parks.map((p) => p.lat);
    const lngs = parks.map((p) => p.lng);
    return {
      minLat: Math.min(...lats) - 0.15,
      maxLat: Math.max(...lats) + 0.15,
      minLng: Math.min(...lngs) - 0.15,
      maxLng: Math.max(...lngs) + 0.15,
    };
  }, [parks]);

  const initialViewState = useMemo(() => {
    if (!bounds) return { longitude: -71.06, latitude: 42.36, zoom: 8 };
    return {
      longitude: (bounds.minLng + bounds.maxLng) / 2,
      latitude: (bounds.minLat + bounds.maxLat) / 2,
      zoom: 7.5,
    };
  }, [bounds]);

  const handleMarkerClick = useCallback((park: Park) => {
    setPopupPark(park);
  }, []);

  if (!MAP_STYLE) {
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
        mapStyle={MAP_STYLE}
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
