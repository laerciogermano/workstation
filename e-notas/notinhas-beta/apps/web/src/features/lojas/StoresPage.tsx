import { RADIUS_OPTIONS_KM } from '@notinhas/domain';
import { useState } from 'react';
import { Link } from 'react-router';
import { setAnchor, useAnchor } from '../../lib/location';
import { useRanking } from '../../lib/queries';
import { Empty, ErrorBanner, Skel } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { StoreRow } from './StoreRow';

/** T-31 · RN-10 — mais baratas no raio, calculado ao vivo a partir das notas. */
export default function StoresPage() {
  const anchor = useAnchor();
  const q = useRanking();
  const [filter, setFilter] = useState('');
  const rows = (q.data ?? []).filter((r) => r.store.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <>
      <div className="h1row" style={{ marginTop: 12 }}>
        <h1 className="h1">Lojas</h1>
        <Link to="/lojas/mapa" viewTransition className="ib" aria-label="Ver no mapa">
          <Icon name="pin" />
        </Link>
      </div>
      <label className="search">
        <Icon name="search" />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Buscar estabelecimento" aria-label="Buscar estabelecimento" />
      </label>
      <div className="chips" role="group" aria-label="Raio">
        {RADIUS_OPTIONS_KM.map((k) => (
          <button key={k} className={`chip ${anchor.radiusKm === k ? 'on' : ''}`} onClick={() => setAnchor({ radiusKm: k })}>
            {k} km
          </button>
        ))}
        <Link to="/perfil/localizacao" className="chip">
          <Icon name="nav" />
          {anchor.mode === 'gps' ? 'GPS' : anchor.label.split(',')[0]}
        </Link>
      </div>
      <p className="lede">Mais baratas primeiro. O índice compara o preço de cada loja com a mediana da região nos mesmos produtos (últimos 14 dias).</p>
      <ErrorBanner error={q.error} />
      {q.isPending && [0, 1, 2].map((i) => <Skel key={i} h={96} r={16} />)}
      {q.data && rows.length === 0 && <Empty icon="store" title="Nenhuma loja nesse raio.">Aumente o raio ou escaneie uma nota de uma loja daqui.</Empty>}
      {rows.map((r) => (
        <StoreRow key={r.store.id} r={r} />
      ))}
    </>
  );
}
