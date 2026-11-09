import type { ProductCardDTO, UnlinkedItemDTO } from '@notinhas/contracts';
import { useDeferredValue, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { brl, km, when } from '../../lib/format';
import { useAnchor } from '../../lib/location';
import { jitter, pricePinText } from '../../lib/map-pins';
import { useStore, useSuggestions } from '../../lib/queries';
import { Chip, Empty, ErrorBanner, Progress, Skel, StateView } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { MapBanner } from '../../ui/MapBanner';
import type { MapPin } from '../../ui/MapView';
import { ProductCard } from '../../ui/ProductCard';
import { Segmented } from '../../ui/Segmented';
import { TopBar } from '../../ui/TopBar';
import { AddToListSheet } from '../listas/AddToListSheet';
import { LinkEanSheet, type LinkTarget } from '../nota/LinkEanSheet';
import { rankText } from './StoreRow';

/** Pins da vitrine: produtos com preço nesta loja (espalhados no mesmo ponto) + pin do estabelecimento. */
function storeVitrinePins(
  store: { id: number; name: string; lat: number | null; lng: number | null; position: number | null },
  products: { gtin: string; title: string; here: { priceCents: number } }[],
): MapPin[] {
  if (store.lat === null || store.lng === null) return [];
  const lat = store.lat;
  const lng = store.lng;
  const productPins: MapPin[] = products.slice(0, 24).map((p, i) => {
    const at = jitter(lat, lng, i + 1);
    return {
      id: p.gtin,
      lat: at.lat,
      lng: at.lng,
      text: pricePinText(p.here.priceCents),
      kind: 'price' as const,
      label: `${p.title} · ${store.name}`,
    };
  });
  const min = Math.min(...productPins.map((p) => products.find((x) => x.gtin === p.id)?.here.priceCents ?? Infinity));
  return [
    {
      id: `store-${store.id}`,
      lat,
      lng,
      text: store.position ? String(store.position) : '·',
      kind: 'store',
      label: store.name,
    },
    ...productPins.map((p) => ({
      ...p,
      kind: (products.find((x) => x.gtin === p.id)?.here.priceCents === min ? 'best' : 'price') as MapPin['kind'],
    })),
  ];
}

/** T-33 vitrine · T-34 item sem EAN com sugestão inline (REQ-039/043). Só leitura de preços (sem checkout — ADR-009). */
export default function StorePage() {
  const { id = '0' } = useParams();
  const [params] = useSearchParams();
  const focus = params.get('item');
  const [tab, setTab] = useState<'com' | 'sem'>(focus ? 'sem' : 'com');
  const [term, setTerm] = useState('');
  const q = useStore(Number(id), useDeferredValue(term));
  const anchor = useAnchor();
  const [adding, setAdding] = useState<ProductCardDTO | null>(null);
  const [target, setTarget] = useState<LinkTarget | null>(null);
  const [open, setOpen] = useState<string | null>(focus);
  const d = q.data;
  const pins = useMemo(
    () => (d ? storeVitrinePins({ ...d.rank.store, position: d.rank.position }, d.withEan) : []),
    [d],
  );

  if (q.isPending) return <><TopBar title="" /><Skel h={120} r={16} /><Skel h={300} r={16} /></>;
  if (!d) return <><TopBar title="Loja" /><ErrorBanner error={q.error} /><StateView icon="store" title="Loja não encontrada" /></>;
  const s = d.rank.store;
  const mapCenter = s.lat !== null && s.lng !== null ? { lat: s.lat, lng: s.lng } : anchor;

  return (
    <>
      <TopBar
        title={s.name}
        sub={s.neighborhood ?? undefined}
        right={
          s.lat !== null && (
            <a className="ib" href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noreferrer" aria-label="Como chegar">
              <Icon name="nav" />
            </a>
          )
        }
      />
      <MapBanner
        to="/lojas/mapa"
        pins={pins}
        center={mapCenter}
        radiusKm={Math.min(anchor.radiusKm, 4)}
        caption={
          pins.length > 1
            ? `${d.withEan.length} produto${d.withEan.length === 1 ? '' : 's'} neste estabelecimento`
            : s.name
        }
      />
      <div className="card pad">
        <p className="meta">{s.address}</p>
        <p className="rk">
          {rankText(d.rank)}
          {d.rank.distanceKm !== null && ` · ${km(d.rank.distanceKm)}`}
        </p>
        <Progress done={d.rank.progress.withEan} total={d.rank.progress.items} receipts={d.rank.progress.receipts} />
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'com', label: `Com código (${d.withEan.length})`, icon: 'barcode' },
          { value: 'sem', label: `Sem código (${d.withoutEan.length})`, icon: 'tag' },
        ]}
      />
      <label className="search">
        <Icon name="search" />
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={`Buscar em ${s.name}`} aria-label="Buscar nesta loja" />
      </label>

      {tab === 'com' &&
        (d.withEan.length ? (
          <div className="pgrid">
            {d.withEan.map((p) => (
              <ProductCard key={p.gtin} p={{ ...p, best: p.best ? { ...p.best, priceCents: p.here.priceCents, observedAt: p.here.observedAt, store: { id: s.id, name: s.name, neighborhood: s.neighborhood } } : null, highlight: p.best?.store.id === s.id ? p.highlight : null }} onAdd={setAdding} />
            ))}
          </div>
        ) : (
          <Empty icon="barcode" title="Nenhum item com código ainda." />
        ))}

      {tab === 'sem' && (
        <>
          <p className="lede">A nota fiscal não traz código de barras. Vincule o código da embalagem para esse preço entrar na comparação entre lojas.</p>
          {d.withoutEan.length === 0 && <Empty icon="check" title="Todos os itens já têm código de barras." />}
          {d.withoutEan.map((u) => (
            <UnlinkedRow
              key={u.storeCode}
              u={u}
              open={open === u.storeCode}
              onToggle={() => setOpen(open === u.storeCode ? null : u.storeCode)}
              onLink={() => setTarget({ storeId: s.id, storeCode: u.storeCode, description: u.description, displayName: u.displayName })}
            />
          ))}
        </>
      )}
      <AddToListSheet product={adding} onClose={() => setAdding(null)} />
      <LinkEanSheet target={target} onClose={() => setTarget(null)} />
    </>
  );
}

function UnlinkedRow({ u, open, onToggle, onLink }: { u: UnlinkedItemDTO; open: boolean; onToggle: () => void; onLink: () => void }) {
  const sugg = useSuggestions(u.store.id, u.storeCode, open);
  const top = sugg.data?.[0];
  return (
    <div className="nrow">
      <button onClick={onToggle} style={{ textAlign: 'left' }} aria-expanded={open}>
        <p className="b">{u.displayName}</p>
        <p className="meta">
          <span className="mono">{u.description}</span> · cód. {u.storeCode} · {when(u.observedAt)}
        </p>
      </button>
      <span className="price tnum">{brl(u.priceCents)}</span>
      {open && (
        <div className="suginline">
          <span>
            {sugg.isPending ? 'Procurando sugestão…' : top ? (
              <>
                <Icon name="info" />
                Parece <b>{top.title}</b> <Chip kind="meta">{Math.round(top.score * 100)}%</Chip>
              </>
            ) : (
              'Sem sugestão pela descrição.'
            )}
          </span>
          <button className="btn p xs" onClick={onLink}>
            Vincular
          </button>
        </div>
      )}
    </div>
  );
}
