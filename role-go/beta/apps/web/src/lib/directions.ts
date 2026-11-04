/** Links externos de "Como chegar" (só com endereço liberado). */
export type DirectionsTarget = {
  lat: number;
  lng: number;
  /** Nome do local (Uber/99 nickname). */
  label?: string;
  /** Endereço legível (cópia / fallback). */
  address?: string;
};

export type DirectionApp = {
  id: 'uber' | '99' | 'google' | 'apple' | 'waze';
  name: string;
  href: string;
};

export function directionLinks(t: DirectionsTarget): DirectionApp[] {
  const { lat, lng } = t;
  const dest = `${lat},${lng}`;
  const nick = encodeURIComponent(t.label || t.address || 'Destino');
  return [
    {
      id: 'uber',
      name: 'Uber',
      href: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${nick}`,
    },
    {
      id: '99',
      name: '99',
      href: `https://m.99app.com/ride?dest_lat=${lat}&dest_lng=${lng}&dest_title=${nick}`,
    },
    {
      id: 'google',
      name: 'Google Maps',
      href: `https://www.google.com/maps/dir/?api=1&destination=${dest}`,
    },
    {
      id: 'apple',
      name: 'Apple Mapas',
      href: `https://maps.apple.com/?daddr=${dest}&q=${nick}`,
    },
    {
      id: 'waze',
      name: 'Waze',
      href: `https://waze.com/ul?ll=${dest}&navigate=yes`,
    },
  ];
}
