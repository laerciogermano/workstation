import { CATEGORIES } from '@notinhas/domain';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { brl, dateShort, km, pct, when } from '../../lib/format';
import { useAnchor } from '../../lib/location';
import { pricePinText } from '../../lib/map-pins';
import { useProduct } from '../../lib/queries';
import { Chip, ErrorBanner, Photo, Price, Skel, StateView } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { MapView, type MapPin } from '../../ui/MapView';
import { PriceChart } from '../../ui/PriceChart';
import { TopBar } from '../../ui/TopBar';
import { AddToListSheet } from '../listas/AddToListSheet';

const FRESH = [
  { d: 7, label: '7 dias' },
  { d: 14, label: '14 dias' },
  { d: 30, label: '30 dias' },
  { d: 0, label: 'Todos' },
];

/** T-14 (+T-13 histórico, T-12 registros, T-30 perto) — ficha canônica, não o texto cru da DANFE. */
export default function ProductPage() {
  const { gtin = '' } = useParams();
  const q = useProduct(gtin);
  const anchor = useAnchor();
  const [adding, setAdding] = useState(false);
  const [fresh, setFresh] = useState(30);
  const [now] = useState(() => Date.now());
  const d = q.data;

  const pins = useMemo<MapPin[]>(() => {
    if (!d) return [];
    const ps: MapPin[] = d.comparison
      .filter((c) => c.lat !== null && c.lng !== null)
      .map((c) => ({
        id: c.store.id,
        lat: c.lat ?? 0,
        lng: c.lng ?? 0,
        text: pricePinText(c.priceCents),
        kind: c.isBest ? 'best' : 'price',
        label: `${c.store.name}: ${brl(c.priceCents)}`,
      }));
    return [...ps, { id: 'you', lat: anchor.lat, lng: anchor.lng, text: '', kind: 'you', label: 'Você' }];
  }, [d, anchor]);
  const hasMap = pins.some((p) => p.kind !== 'you');

  if (q.isPending)
    return (
      <>
        <TopBar title="" />
        <Skel h={210} w={210} r={22} />
        <Skel h={26} w="80%" />
        <Skel h={90} r={18} />
      </>
    );
  if (q.error || !d)
    return (
      <>
        <TopBar title="Produto" />
        <ErrorBanner error={q.error} />
        <StateView icon="search" title="Produto não encontrado" />
      </>
    );

  const p = d.product;
  const catName = CATEGORIES.find((c) => c.id === p.category)?.short ?? p.category;
  const nearest = [...d.comparison].filter((c) => c.distanceKm !== null).sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0)).slice(0, 2);
  const records = d.history.filter((h) => !fresh || now - new Date(h.observedAt).getTime() <= fresh * 86_400_000);

  return (
    <>
      <TopBar title="" right={<button className="ib" onClick={() => setAdding(true)} aria-label="Adicionar à lista"><Icon name="list" /></button>} />
      <div className="cols2">
        <div>
          <div className="hero">
            <Photo url={p.photoUrl} category={p.category} size="xl" alt={p.title} />
          </div>
          <h1 className="ptitle">{p.title}</h1>
          <p className="meta">
            {[p.brand, catName, p.subcategory].filter(Boolean).join(' · ')} · EAN <span className="mono">{p.gtin}</span>
          </p>

          {d.best ? (
            <div className="bestbox">
              <div>
                <Price cents={d.best.priceCents} menor className="xl" />
                <Chip kind="menor">menor preço</Chip>
              </div>
              <p>
                <Link to={`/lojas/${d.best.store.id}`} className="b" style={{ color: 'inherit' }}>
                  {d.best.store.name}
                </Link>
                {d.best.store.neighborhood && ` · ${d.best.store.neighborhood}`} · {when(d.best.observedAt)} {dateShort(d.best.observedAt)}
                {d.best.distanceKm !== null && ` · ${km(d.best.distanceKm)}`}
              </p>
              {d.medianCents !== null && (
                <p className="meta tnum">
                  mediana 14 dias {brl(d.medianCents)}
                  {d.highlight && ` · ${pct(d.highlight.ratio)}`}
                </p>
              )}
              {d.best.isStale && <Chip kind="warn">desatualizado · mais de 14 dias</Chip>}
            </div>
          ) : (
            <p className="banner warn mt12">Sem preço nos últimos meses.</p>
          )}

          {hasMap && <MapView pins={pins} center={anchor} radiusKm={Math.min(anchor.radiusKm, 4)} />}

          <div className="sec">
            <h2>Histórico</h2>
            <span className="meta-r">{d.history.length} registros</span>
          </div>
          <div className="card">
            <PriceChart history={d.history} medianCents={d.medianCents} />
          </div>

          <details className="card ficha">
            <summary>
              Ficha do produto <Icon name="next" />
            </summary>
            <dl>
              <dt>Marca</dt>
              <dd>{p.brand ?? '—'}</dd>
              <dt>Categoria</dt>
              <dd>{[catName, p.subcategory].filter(Boolean).join(' › ')}</dd>
              <dt>EAN</dt>
              <dd className="mono">{p.gtin}</dd>
              {p.ncm && (
                <>
                  <dt>NCM</dt>
                  <dd className="mono">{p.ncm}</dd>
                </>
              )}
              <dt>Fontes</dt>
              <dd>{p.sources.join(', ') || 'DANFE'}</dd>
            </dl>
          </details>
        </div>

        <div>
          <div className="sec">
            <h2>Comparação</h2>
            <span className="meta-r">última nota de cada loja</span>
          </div>
          {d.comparison.map((c) => (
            <Link key={c.store.id} to={`/lojas/${c.store.id}`} className={`row ${c.isBest ? 'hl' : ''}`}>
              <div className="grow">
                <p className="b">{c.store.name}</p>
                <p className="meta">
                  {c.store.neighborhood ? `${c.store.neighborhood} · ` : ''}
                  {when(c.observedAt)}
                  {c.distanceKm !== null && ` · ${km(c.distanceKm)}`}
                </p>
                {c.isStale && <Chip kind="warn">desatualizado</Chip>}
              </div>
              <Price cents={c.priceCents} menor={c.isBest} className="lg" />
            </Link>
          ))}

          <div className="sec">
            <h2>Perto de você</h2>
            <Link to="/perfil/localizacao" className="lnk">
              {anchor.mode === 'gps' ? 'GPS' : anchor.label.split(',')[0]}
            </Link>
          </div>
          {nearest.map((c) => (
            <div key={c.store.id} className="row">
              <Icon name="pin" />
              <div className="grow">
                <p className="b">{c.store.name}</p>
                <p className="meta">{km(c.distanceKm)} · {when(c.observedAt)}</p>
              </div>
              <Price cents={c.priceCents} menor={c.isBest} />
              <a className="ib" href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" aria-label={`Como chegar em ${c.store.name}`}>
                <Icon name="nav" />
              </a>
            </div>
          ))}

          <div className="sec">
            <h2>Últimos registros</h2>
          </div>
          <div className="chips wrap" role="group" aria-label="Frescor">
            {FRESH.map((f) => (
              <button key={f.d} className={`chip ${fresh === f.d ? 'on' : ''}`} onClick={() => setFresh(f.d)}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="card list">
            {records.length === 0 && <p className="li meta">Nenhum registro nesse período.</p>}
            {records.map((h, i) => (
              <div className="li" key={i}>
                <Icon name="receipt" />
                <div className="grow">
                  <p className="b">{h.store.name}</p>
                  <p className="meta">NFC-e · {dateShort(h.observedAt)} · {when(h.observedAt)}</p>
                </div>
                <Price cents={h.priceCents} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footbar">
        <button className="btn p" onClick={() => setAdding(true)}>
          <Icon name="plus" />
          Adicionar à lista
        </button>
      </div>
      <AddToListSheet product={adding ? { gtin: p.gtin, title: p.title } : null} onClose={() => setAdding(false)} />
    </>
  );
}
