import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { km, when } from '../../lib/format';
import { useAnchor } from '../../lib/location';
import { homeProducts, productPricePins, storeCenterPinsForProducts, youPin } from '../../lib/map-pins';
import { useHome, useRanking } from '../../lib/queries';
import { Photo, Price } from '../../ui/bits';
import { MapView } from '../../ui/MapView';
import { TopBar } from '../../ui/TopBar';

/** T-15 — loja no centro + produtos no anel (posições dos produtos intactas). */
export default function ProductsMapPage() {
  const home = useHome();
  const ranking = useRanking();
  const anchor = useAnchor();
  const products = useMemo(() => homeProducts(home.data), [home.data]);
  const [sel, setSel] = useState<string | null>(null);
  const pins = useMemo(
    () => [
      ...storeCenterPinsForProducts(products, ranking.data),
      ...productPricePins(products, ranking.data, { selectedGtin: sel, onSelect: setSel }),
      youPin(anchor),
    ],
    [products, ranking.data, sel, anchor],
  );
  const selected = products.find((p) => p.gtin === sel) ?? products[0] ?? null;

  return (
    <>
      <TopBar title="Mapa de produtos" sub="pins = produtos · toque para ver o card" />
      <div style={{ position: 'relative' }}>
        <MapView pins={pins} center={anchor} radiusKm={Math.min(anchor.radiusKm, 4)} className="tall" />
        {selected?.best && (
          <Link to={`/produto/${selected.gtin}`} className="mapcard">
            <Photo url={selected.photoUrl} category={selected.category} size="sm" />
            <span className="grow">
              <span className="b" style={{ display: 'block' }}>
                {selected.title}
              </span>
              <span className="meta">
                {selected.best.store.name} · {when(selected.best.observedAt)}
                {selected.best.distanceKm !== null && ` · ${km(selected.best.distanceKm)}`}
              </span>
            </span>
            <Price cents={selected.best.priceCents} menor />
          </Link>
        )}
      </div>
    </>
  );
}
