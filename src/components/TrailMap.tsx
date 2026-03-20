import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
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

function MapController({ parks }: { parks: Park[] }) {
  const map = useMap();

  // Invalidate size on mount (fixes blank tiles when toggled into view)
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);

  // Fit bounds when parks change
  useMemo(() => {
    if (parks.length === 0) return;
    const lats = parks.map((p) => p.lat);
    const lngs = parks.map((p) => p.lng);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats) - 0.2, Math.min(...lngs) - 0.2],
      [Math.max(...lats) + 0.2, Math.max(...lngs) + 0.2],
    ];
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [parks, map]);

  return null;
}

export function TrailMap({ parks, distances, onParkClick }: TrailMapProps) {
  const defaultCenter: [number, number] = [42.36, -71.06];

  return (
    <div className="rounded-xl overflow-hidden border border-bg-elevated" style={{ height: 300 }}>
      <MapContainer
        center={defaultCenter}
        zoom={8}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <MapController parks={parks} />
        {parks.map((park) => {
          const trail = getTrailStatus(park);
          const color = STATUS_COLORS[trail.status];
          const dist = distances.get(park.id);
          return (
            <CircleMarker
              key={park.id}
              center={[park.lat, park.lng]}
              radius={7}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                  <strong>{park.name}</strong>
                  <br />
                  {trail.label} · {park.miles} mi · {park.difficulty.split('-')[0]}
                  {dist != null && <><br />~{Math.round(dist)} mi · ~{estimateDriveMinutes(dist)} min</>}
                  <br />
                  <button
                    onClick={() => onParkClick(park.id)}
                    style={{
                      marginTop: 6,
                      padding: '4px 10px',
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
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
