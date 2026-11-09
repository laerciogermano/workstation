import { Link } from 'react-router';
import { Icon } from './Icon';
import { MapView, type MapPin } from './MapView';

/** Faixa de mapa no topo (T-31 / home) — toque abre o mapa cheio. */
export function MapBanner({
  to,
  pins,
  center,
  radiusKm,
  caption,
}: {
  to: string;
  pins: MapPin[];
  center: { lat: number; lng: number };
  radiusKm?: number;
  caption: string;
}) {
  if (pins.length === 0) return null;
  return (
    <Link to={to} viewTransition className="mapbanner" aria-label={caption}>
      <MapView pins={pins} center={center} {...(radiusKm !== undefined ? { radiusKm } : {})} interactive={false} className="banner" />
      <span className="cap">
        <Icon name="expand" />
        {caption}
      </span>
    </Link>
  );
}
