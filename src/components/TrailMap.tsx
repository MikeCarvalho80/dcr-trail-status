import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, GeolocateControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { Park } from '../data/parks';
import { getTrailStatus } from '../lib/status';
import { estimateDriveMinutes } from '../lib/geo';

interface TrailMapProps {
  parks: Park[];
  distances: Map<string, number>;
  onParkClick: (parkId: string) => void;
  highlightParkId?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  open: '#2ecc71',
  caution: '#f1c40f',
  closed: '#f25c4d',
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

const CLUSTER_MAX_ZOOM = 12;

type MapStyleKey = 'outdoors' | 'satellite' | 'topo' | 'dark';

const MAP_STYLES: { key: MapStyleKey; label: string; icon: string; url: string }[] = [
  { key: 'outdoors', label: 'Terrain', icon: '⛰', url: 'mapbox://styles/mapbox/outdoors-v12' },
  { key: 'satellite', label: 'Satellite', icon: '🛰', url: 'mapbox://styles/mapbox/satellite-streets-v12' },
  { key: 'topo', label: 'Topo', icon: '📍', url: 'mapbox://styles/mapbox/standard' },
  { key: 'dark', label: 'Dark', icon: '🌙', url: 'mapbox://styles/mapbox/dark-v11' },
];

export function TrailMap({ parks, distances, onParkClick, highlightParkId }: TrailMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [popupPark, setPopupPark] = useState<Park | null>(null);
  const [activeStyle, setActiveStyle] = useState<MapStyleKey>(() => {
    return (localStorage.getItem('dcr-map-style') as MapStyleKey) || 'outdoors';
  });
  const prevParksRef = useRef<string>('');

  // Force remount when style changes to avoid broken layer state
  const [styleKey, setStyleKey] = useState(0);

  function handleStyleChange(key: MapStyleKey) {
    setActiveStyle(key);
    localStorage.setItem('dcr-map-style', key);
    setPopupPark(null);
    setStyleKey((k) => k + 1); // remount map
  }

  // Build GeoJSON for clustering
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: parks.map((park) => {
      const trail = getTrailStatus(park);
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [park.lng, park.lat],
        },
        properties: {
          id: park.id,
          name: park.name,
          status: trail.status,
          color: STATUS_COLORS[trail.status],
        },
      };
    }),
  }), [parks]);

  // Fit bounds when filtered parks change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || parks.length === 0) return;

    const key = parks.map((p) => p.id).sort().join(',');
    if (key === prevParksRef.current) return;
    prevParksRef.current = key;

    const lats = parks.map((p) => p.lat);
    const lngs = parks.map((p) => p.lng);

    if (parks.length === 1) {
      map.flyTo({ center: [lngs[0], lats[0]], zoom: 13, duration: 800 });
    } else {
      map.fitBounds(
        [[Math.min(...lngs) - 0.1, Math.min(...lats) - 0.1],
         [Math.max(...lngs) + 0.1, Math.max(...lats) + 0.1]],
        { padding: 40, duration: 800 }
      );
    }
  }, [parks]);

  // Fly to highlighted park
  useEffect(() => {
    if (!highlightParkId || !mapRef.current) return;
    const park = parks.find((p) => p.id === highlightParkId);
    if (park) {
      mapRef.current.flyTo({ center: [park.lng, park.lat], zoom: 13, duration: 600 });
      setPopupPark(park);
    }
  }, [highlightParkId, parks]);

  const handleMarkerClick = useCallback((park: Park) => {
    setPopupPark(park);
  }, []);

  const handleClusterClick = useCallback((e: mapboxgl.MapMouseEvent) => {
    const map = mapRef.current;
    if (!map) return;
    const features = map.queryRenderedFeatures(e.point, { layers: ['cluster-circles'] });
    if (!features.length) return;

    const clusterId = features[0].properties?.cluster_id;
    const source = map.getSource('parks') as mapboxgl.GeoJSONSource;
    if (!source || !clusterId) return;

    source.getClusterExpansionZoom(clusterId).then((zoom) => {
      const coords = (features[0].geometry as GeoJSON.Point).coordinates;
      map.flyTo({ center: [coords[0], coords[1]], zoom: zoom + 1, duration: 500 });
    });
  }, []);

  // Enable 3D terrain after map loads
  const handleMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Add terrain source and enable 3D
    if (!map.getSource('mapbox-dem')) {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
    }
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

    // Add sky layer for 3D effect
    if (!map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });
    }
  }, []);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-xl border border-bg-elevated bg-bg-secondary h-[350px] flex items-center justify-center">
        <span className="font-mono text-[12px] text-text-muted">Map requires VITE_MAPBOX_TOKEN</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-bg-elevated relative" style={{ height: 350 }}>
      <Map
        key={styleKey}
        ref={mapRef}
        initialViewState={{ longitude: -71.06, latitude: 42.36, zoom: 7.5, pitch: 40 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={MAP_STYLES.find((s) => s.key === activeStyle)!.url}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={true}
        interactiveLayerIds={['cluster-circles']}
        onClick={handleClusterClick}
        onLoad={handleMapLoad}
        maxPitch={60}
      >
        <FullscreenControl position="top-left" />
        <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />
        <GeolocateControl position="top-right" trackUserLocation={false} />
        <ScaleControl position="bottom-left" unit="imperial" />

        {/* Clustered source */}
        <Source
          id="parks"
          type="geojson"
          data={geojson}
          cluster={true}
          clusterMaxZoom={CLUSTER_MAX_ZOOM}
          clusterRadius={50}
        >
          <Layer
            id="cluster-circles"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-color': '#1a1915',
              'circle-radius': ['step', ['get', 'point_count'], 20, 10, 26, 30, 32],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#a09a90',
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
              'text-size': 13,
            }}
            paint={{
              'text-color': '#e8e6e1',
            }}
          />
        </Source>

        {/* Individual markers */}
        {parks.map((park) => {
          const trail = getTrailStatus(park);
          const color = STATUS_COLORS[trail.status];
          const isHighlighted = highlightParkId === park.id;
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
                  width: isHighlighted ? 24 : 18,
                  height: isHighlighted ? 24 : 18,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: `2px solid ${isHighlighted ? '#fff' : 'rgba(255,255,255,0.9)'}`,
                  boxShadow: isHighlighted
                    ? `0 0 14px ${color}, 0 0 4px rgba(255,255,255,0.5)`
                    : `0 0 8px ${color}80`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
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

      {/* Layer switcher */}
      <div className="absolute top-12 left-2 flex flex-col gap-1">
        {MAP_STYLES.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => handleStyleChange(key)}
            className={`
              font-mono text-[11px] font-semibold px-2.5 py-1.5 rounded-md shadow-sm transition-colors
              ${activeStyle === key
                ? 'bg-[#12110e] text-[#e8e6e1] border border-[#a09a90]'
                : 'bg-white/90 text-gray-700 border border-black/10 hover:bg-white'}
            `}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Status legend */}
      <div className="absolute bottom-8 right-2 bg-[#12110e]/90 border border-[#1a1915] rounded-lg px-2.5 py-2 pointer-events-none">
        <div className="space-y-1">
          {(['open', 'caution', 'closed'] as const).map((status) => (
            <div key={status} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              <span className="font-mono text-[11px] text-[#e8e6e1] capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
