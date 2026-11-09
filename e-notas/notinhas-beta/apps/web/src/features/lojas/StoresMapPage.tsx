import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { km } from '../../lib/format';
import { useAnchor } from '../../lib/location';
import { establishmentPins, youPin } from '../../lib/map-pins';
import { useRanking } from '../../lib/queries';
import { MapView } from '../../ui/MapView';
import { TopBar } from '../../ui/TopBar';
import { rankText } from './StoreRow';

/** T-32 — 1 pin por estabelecimento (não produto); popup com ranking. */
export default function StoresMapPage() {
  const anchor = useAnchor();
  const q = useRanking();
  const [sel, setSel] = useState<number | null>(null);
  const pins = useMemo(
    () => [...establishmentPins(q.data, { selectedId: sel, onSelect: setSel }), youPin(anchor)],
    [q.data, sel, anchor],
  );
  const s = q.data?.find((r) => r.store.id === sel);
  return (
    <>
      <TopBar title="Mapa de estabelecimentos" sub={`raio de ${anchor.radiusKm} km · 1 pin por loja`} />
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
