import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import type { Park } from '../data/parks';
import { getTrailStatus } from '../lib/status';
import 'leaflet/dist/leaflet.css';

interface TrailMapProps {
  parks: Park[];
  distances: Map<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#2ecc71',
  caution: '#f1c40f',
  closed: '#f25c4d',
};

function FitBounds({ parks }: { parks: Park[] }) {
  const map = useMap();
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

export function TrailMap({ parks, distances }: TrailMapProps) {
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds parks={parks} />
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
                  {trail.label} · {park.miles} mi · {park.difficulty}
                  {dist != null && <><br />~{Math.round(dist)} mi away</>}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
