import type { OfferDTO } from '@notinhas/contracts';
import { useMemo, useState } from 'react';
import { brl, dateShort } from '../lib/format';

/** T-13: cada ponto = menor preço do dia (NFC-e); tracejado = mediana 14 d. Toque mostra loja e data. */
export function PriceChart({ history, medianCents }: { history: OfferDTO[]; medianCents: number | null }) {
  const [on, setOn] = useState<number | null>(null);
  const points = useMemo(() => {
    const byDay = new Map<string, OfferDTO>();
    for (const o of history) {
      const d = o.observedAt.slice(0, 10);
      const cur = byDay.get(d);
      if (!cur || o.priceCents < cur.priceCents) byDay.set(d, o);
    }
    return [...byDay.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  }, [history]);
  if (points.length < 2) return <p className="meta">Ainda há poucos registros para desenhar o histórico.</p>;

  const prices = points.map((p) => p.priceCents).concat(medianCents ? [medianCents] : []);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const t0 = new Date(points[0]?.observedAt ?? 0).getTime();
  const t1 = new Date(points[points.length - 1]?.observedAt ?? 0).getTime();
  const x = (o: OfferDTO) => (t1 === t0 ? 50 : ((new Date(o.observedAt).getTime() - t0) / (t1 - t0)) * 100);
  const y = (c: number) => (max === min ? 50 : 90 - ((c - min) / (max - min)) * 80);
  const low = Math.min(...points.map((p) => p.priceCents));
  const sel = on !== null ? points[on] : null;

  return (
    <div className="chart">
      <div className="plot">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Histórico de ${points.length} dias com registro, de ${brl(Math.max(...points.map((p) => p.priceCents)))} a ${brl(low)}`}>
          {medianCents && <line className="medline" x1="0" x2="100" y1={y(medianCents)} y2={y(medianCents)} />}
          <polyline className="line" points={points.map((p) => `${x(p)},${y(p.priceCents)}`).join(' ')} />
        </svg>
        {points.map((p, i) => (
          <button
            key={p.observedAt + i}
            className={`dot ${p.priceCents === low ? 'low' : ''} ${on === i ? 'on' : ''}`}
            style={{ left: `${x(p)}%`, top: `${y(p.priceCents)}%` }}
            onClick={() => setOn(on === i ? null : i)}
            aria-label={`${brl(p.priceCents)} em ${p.store.name}, ${dateShort(p.observedAt)}`}
          />
        ))}
        {sel && (
          <span className="tip tnum" style={{ left: `${Math.min(80, Math.max(20, x(sel)))}%` }}>
            {brl(sel.priceCents)} · {sel.store.name} · {dateShort(sel.observedAt)}
          </span>
        )}
      </div>
      <div className="axis meta tnum">
        <span>{dateShort(points[0]?.observedAt)}</span>
        {medianCents && <span>- - mediana 14 d {brl(medianCents)}</span>}
        <span>{dateShort(points[points.length - 1]?.observedAt)}</span>
      </div>
    </div>
  );
}
