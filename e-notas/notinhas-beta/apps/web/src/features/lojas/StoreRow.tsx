import type { StoreRankDTO } from '@notinhas/contracts';
import { Link } from 'react-router';
import { km, pct } from '../../lib/format';
import { Progress } from '../../ui/bits';

export const rankText = (r: StoreRankDTO) =>
  r.position === null ? 'dados insuficientes para comparar' : `${r.position}ª mais barata · ${r.of - r.position + 1}ª mais cara da região`;

/** Linha do ranking RN-10: posição, índice vs mediana regional e progresso de EAN (REQ-046). */
export function StoreRow({ r }: { r: StoreRankDTO }) {
  const idx = r.index;
  return (
    <Link to={`/lojas/${r.store.id}`} viewTransition className="rrow">
      <span className={`pos ${r.position === 1 ? 'g' : ''}`}>{r.position ?? '–'}</span>
      <div className="grow">
        <p className="b">{r.store.name}</p>
        <p className="meta">
          {[r.store.neighborhood, r.distanceKm !== null ? km(r.distanceKm) : 'sem localização'].filter(Boolean).join(' · ')}
        </p>
        <p className="rk">{rankText(r)}</p>
        <Progress done={r.progress.withEan} total={r.progress.items} receipts={r.progress.receipts} compact />
      </div>
      {idx !== null && (
        <span className={`idx tnum ${idx < 0 ? 'g' : idx > 0.05 ? 'w' : ''}`}>
          {pct(idx)}
          <small>vs mediana</small>
        </span>
      )}
    </Link>
  );
}
