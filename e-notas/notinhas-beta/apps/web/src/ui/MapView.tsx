import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';
import { Circle, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';

export interface MapPin {
  id: string | number;
  lat: number;
  lng: number;
  text: string;
  kind: 'price' | 'best' | 'store' | 'you';
  label: string;
  onClick?: () => void;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const icon = (p: MapPin) =>
  L.divIcon({
    className: `mpin ${p.kind === 'best' ? 'g' : p.kind === 'store' ? 'store' : p.kind === 'you' ? 'you' : ''}`,
    html: `<span>${esc(p.text)}</span>`,
    iconSize: [0, 0],
  });

function Fit({ pins }: { pins: MapPin[] }) {
  const map = useMap();
  useEffect(() => {
    if (pins.length === 0) return;
    const b = L.latLngBounds(pins.map((p) => [p.lat, p.lng]));
    map.fitBounds(b.pad(0.25), { maxZoom: 15, animate: false });
  }, [map, pins]);
  return null;
}

/** Mapa OSM (Leaflet) — pins de preço/loja; âncora do usuário e raio (RN-09). */
export function MapView({ pins, center, radiusKm, className = '', interactive = true }: { pins: MapPin[]; center: { lat: number; lng: number }; radiusKm?: number; className?: string; interactive?: boolean }) {
  return (
    <div className={`mapbox ${className}`}>
      <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom={interactive} dragging={interactive} zoomControl={interactive} attributionControl>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {radiusKm && <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ color: 'var(--nt-blue)', weight: 1.5, dashArray: '6 6', fillOpacity: 0.04 }} />}
        {pins.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={icon(p)} title={p.label} alt={p.label} {...(p.onClick ? { eventHandlers: { click: p.onClick } } : {})} />
        ))}
        <Fit pins={pins} />
      </MapContainer>
    </div>
  );
}
