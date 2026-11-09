import type { ProductCardDTO } from '@notinhas/contracts';
import { Link } from 'react-router';
import type { ProductViewMode } from '../lib/product-view';
import { dateShort, km, pct, when } from '../lib/format';
import { Chip, Photo, Price } from './bits';
import { Icon } from './Icon';

/** Card de produto: foto, % vs mediana, nome, menor preço em verde, loja · data · distância (RN-05). */
export function ProductCard({
  p,
  onAdd,
  showHighlight = true,
  view = 'md',
}: {
  p: ProductCardDTO;
  onAdd?: (p: ProductCardDTO) => void;
  showHighlight?: boolean;
  view?: ProductViewMode;
}) {
  const b = p.best;
  const h = showHighlight ? p.highlight : null;

  if (view === 'list') {
    return (
      <Link to={`/produto/${p.gtin}`} viewTransition className="pc pc-list">
        <div className="phwrap">
          <Photo url={p.photoUrl} category={p.category} size="sm" alt="" />
        </div>
        <div className="pc-list-body">
          <div className="pc-list-top">
            {h ? <Chip kind="menor">promoção</Chip> : <Chip kind="menor">menor preço</Chip>}
            {h && <span className="badge-off tnum">{pct(h.ratio)}</span>}
          </div>
          <p className="pn">{p.title}</p>
          {b && (
            <p className="pm">
              {b.store.name} · {dateShort(b.observedAt)} · {when(b.observedAt)}
              {b.distanceKm !== null && ` · ${km(b.distanceKm)}`}
            </p>
          )}
        </div>
        <div className="pc-list-end">
          {b && <Price cents={b.priceCents} menor />}
          {onAdd && (
            <button
              type="button"
              className="add"
              aria-label={`Adicionar ${p.title} à lista`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd(p);
              }}
            >
              <Icon name="plus" />
            </button>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/produto/${p.gtin}`} viewTransition className={`pc pc-${view}`}>
      <div className="phwrap">
        <Photo url={p.photoUrl} category={p.category} alt="" />
        {onAdd && (
          <button
            type="button"
            className="add"
            aria-label={`Adicionar ${p.title} à lista`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(p);
            }}
          >
            <Icon name="plus" />
          </button>
        )}
      </div>
      <div className="pc-topline">
        {h ? <Chip kind="menor">promoção</Chip> : <Chip kind="menor">menor preço</Chip>}
        {h && <span className="badge-off tnum">{pct(h.ratio)}</span>}
      </div>
      <p className="pn">{p.title}</p>
      {b && (
        <>
          <p className="pp">
            <Price cents={b.priceCents} menor />
          </p>
          <p className="pm">
            {b.store.name} · {dateShort(b.observedAt)} · {when(b.observedAt)}
            {b.distanceKm !== null && ` · ${km(b.distanceKm)}`}
          </p>
          {b.isStale && <Chip kind="warn">desatualizado</Chip>}
        </>
      )}
    </Link>
  );
}
