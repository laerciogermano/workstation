import type { ProductCardDTO } from '@notinhas/contracts';
import { Link } from 'react-router';
import { dateShort, km, pct, when } from '../lib/format';
import { Chip, Photo, Price } from './bits';
import { Icon } from './Icon';

/** Card de produto: foto, % vs mediana, nome, menor preço em verde, loja · data · distância (RN-05). */
export function ProductCard({ p, onAdd, showHighlight = true }: { p: ProductCardDTO; onAdd?: (p: ProductCardDTO) => void; showHighlight?: boolean }) {
  const b = p.best;
  const h = showHighlight ? p.highlight : null;
  return (
    <Link to={`/produto/${p.gtin}`} viewTransition className="pc">
      <div className="phwrap">
        <Photo url={p.photoUrl} category={p.category} alt="" />
        {h && <span className="badge-off tnum">{pct(h.ratio)}</span>}
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
      <div>{h ? <Chip kind="menor">promoção</Chip> : <Chip kind="menor">menor preço</Chip>}</div>
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
