import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { brl, km, when } from '../../lib/format';
import { useAnchor } from '../../lib/location';
import { pricePinText, youPin } from '../../lib/map-pins';
import { useProduct } from '../../lib/queries';
import { ErrorBanner, Photo, Price, Skel, StateView } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { MapView, type MapPin } from '../../ui/MapView';
import { TopBar } from '../../ui/TopBar';

/** T-30 — mapa cheio “onde comprar perto” deste produto (expansão do banner da T-14). */
export default function ProductNearbyMapPage() {
  const { gtin = '' } = useParams();
  const q = useProduct(gtin);
  const anchor = useAnchor();
  const [sel, setSel] = useState<number | null>(null);
  const d = q.data;

  const pins = useMemo<MapPin[]>(() => {
    if (!d) return [youPin(anchor)];
    const ps = d.comparison
      .filter((c) => c.lat !== null && c.lng !== null)
      .map((c) => ({
        id: c.store.id,
        lat: c.lat ?? 0,
        lng: c.lng ?? 0,
        text: pricePinText(c.priceCents),
        kind: (sel === c.store.id || c.isBest ? 'best' : 'price') as MapPin['kind'],
        label: `${c.store.name}: ${brl(c.priceCents)}`,
        photoUrl: d.product.photoUrl,
        onClick: () => setSel(c.store.id),
      }));
    return [...ps, youPin(anchor)];
  }, [d, anchor, sel]);

  if (q.isPending) return <><TopBar title="Perto de você" /><Skel h={360} r={16} /></>;
  if (q.error || !d) {
    return (
      <>
        <TopBar title="Perto de você" />
        <ErrorBanner error={q.error} />
        <StateView icon="pin" title="Produto não encontrado" />
      </>
    );
  }

  const selected = d.comparison.find((c) => c.store.id === sel) ?? d.comparison.find((c) => c.isBest) ?? d.comparison[0] ?? null;
  const storeCount = d.comparison.filter((c) => c.lat !== null).length;

  return (
    <>
      <TopBar title="Perto de você" sub={d.product.title} />
      <div style={{ position: 'relative' }}>
        <MapView pins={pins} center={anchor} radiusKm={Math.min(anchor.radiusKm, 4)} className="tall" />
        {selected && (
          <Link to={`/lojas/${selected.store.id}`} className="mapcard">
            <Photo url={d.product.photoUrl} category={d.product.category} size="sm" />
            <span className="grow">
              <span className="b" style={{ display: 'block' }}>
                {selected.store.name}
              </span>
              <span className="meta">
                {when(selected.observedAt)}
                {selected.distanceKm !== null && ` · ${km(selected.distanceKm)}`}
                {` · ${storeCount} loja${storeCount === 1 ? '' : 's'}`}
              </span>
            </span>
            <Price cents={selected.priceCents} menor={selected.isBest} />
            <span className="ib" aria-hidden>
              <Icon name="nav" />
            </span>
          </Link>
        )}
      </div>
    </>
  );
}
