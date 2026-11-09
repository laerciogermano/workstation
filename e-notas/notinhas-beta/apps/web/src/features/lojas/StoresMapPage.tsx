import { useState } from 'react';
import { Link } from 'react-router';
import { km } from '../../lib/format';
import { useAnchor } from '../../lib/location';
import { useRanking } from '../../lib/queries';
import { MapView, type MapPin } from '../../ui/MapView';
import { TopBar } from '../../ui/TopBar';
import { rankText } from './StoreRow';

/** T-32 — lojas no mapa com a posição do ranking; toque abre o resumo. */
export default function StoresMapPage() {
  const anchor = useAnchor();
  const q = useRanking();
  const [sel, setSel] = useState<number | null>(null);
  const pins: MapPin[] = [
    ...(q.data ?? [])
      .filter((r) => r.store.lat !== null && r.store.lng !== null)
      .map((r) => ({
        id: r.store.id,
        lat: r.store.lat ?? 0,
        lng: r.store.lng ?? 0,
        text: r.position ? String(r.position) : '·',
        kind: r.position === 1 ? ('best' as const) : ('store' as const),
        label: `${r.store.name}, ${rankText(r)}`,
        onClick: () => setSel(r.store.id),
      })),
    { id: 'you', lat: anchor.lat, lng: anchor.lng, text: '', kind: 'you', label: 'Você' },
  ];
  const s = q.data?.find((r) => r.store.id === sel);
  return (
    <>
      <TopBar title="Mapa de lojas" sub={`raio de ${anchor.radiusKm} km`} />
      <div style={{ position: 'relative' }}>
        <MapView pins={pins} center={anchor} radiusKm={anchor.radiusKm} className="tall" />
        {s && (
          <Link to={`/lojas/${s.store.id}`} className="mapcard">
            <span className={`pos ${s.position === 1 ? 'g' : ''}`}>{s.position ?? '–'}</span>
            <span className="grow">
              <span className="b">{s.store.name}</span>
              <span className="meta" style={{ display: 'block' }}>
                {km(s.distanceKm)} · {rankText(s)}
              </span>
            </span>
          </Link>
        )}
      </div>
    </>
  );
}
