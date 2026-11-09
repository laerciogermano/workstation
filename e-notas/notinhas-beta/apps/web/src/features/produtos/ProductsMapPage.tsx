import type { ProductCardDTO } from '@notinhas/contracts';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { brl, km, when } from '../../lib/format';
import { useAnchor } from '../../lib/location';
import { useHome, useRanking } from '../../lib/queries';
import { Photo, Price } from '../../ui/bits';
import { MapView, type MapPin } from '../../ui/MapView';
import { TopBar } from '../../ui/TopBar';

/** T-15 — pins = lojas com o menor preço de algum produto; toque mostra os produtos daquele local. */
export default function ProductsMapPage() {
  const home = useHome();
  const ranking = useRanking();
  const anchor = useAnchor();
  const [sel, setSel] = useState<number | null>(null);

  const byStore = useMemo(() => {
    const m = new Map<number, ProductCardDTO[]>();
    for (const p of [...(home.data?.promotions ?? []), ...(home.data?.mostBought ?? [])]) {
      if (!p.best) continue;
      const arr = m.get(p.best.store.id) ?? [];
      if (!arr.some((x) => x.gtin === p.gtin)) arr.push(p);
      m.set(p.best.store.id, arr);
    }
    return m;
  }, [home.data]);

  const pins: MapPin[] = [
    ...(ranking.data ?? [])
      .filter((r) => r.store.lat !== null && byStore.has(r.store.id))
      .map((r) => ({
        id: r.store.id,
        lat: r.store.lat ?? 0,
        lng: r.store.lng ?? 0,
        text: `${byStore.get(r.store.id)?.length ?? 0}`,
        kind: 'best' as const,
        label: `${r.store.name}: ${byStore.get(r.store.id)?.length} produtos com menor preço`,
        onClick: () => setSel(r.store.id),
      })),
    { id: 'you', lat: anchor.lat, lng: anchor.lng, text: '', kind: 'you', label: 'Você' },
  ];
  const selStore = ranking.data?.find((r) => r.store.id === sel);
  const products = sel ? (byStore.get(sel) ?? []) : [];

  return (
    <>
      <TopBar title="Mapa de produtos" sub="números = produtos com o menor preço na loja" />
      <div style={{ position: 'relative' }}>
        <MapView pins={pins} center={anchor} className="tall" />
        {selStore && (
          <div className="mapcard" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
            <Link to={`/lojas/${selStore.store.id}`} className="b">
              {selStore.store.name} · <span className="meta">{km(selStore.distanceKm)}</span>
            </Link>
            {products.slice(0, 3).map((p) => (
              <Link key={p.gtin} to={`/produto/${p.gtin}`} className="flex">
                <Photo url={p.photoUrl} category={p.category} size="xs" />
                <span className="grow" style={{ fontSize: 13 }}>
                  {p.title}
                  <br />
                  <span className="meta">{p.best && when(p.best.observedAt)}</span>
                </span>
                {p.best && <Price cents={p.best.priceCents} menor />}
              </Link>
            ))}
            {products.length > 3 && <span className="meta">+{products.length - 3} produtos · {brl(products.reduce((a, p) => a + (p.best?.priceCents ?? 0), 0))} somados</span>}
          </div>
        )}
      </div>
    </>
  );
}
