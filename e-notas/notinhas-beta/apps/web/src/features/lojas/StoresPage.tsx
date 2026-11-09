import { RADIUS_OPTIONS_KM } from '@notinhas/domain';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { setAnchor, useAnchor } from '../../lib/location';
import { establishmentPins } from '../../lib/map-pins';
import { useRanking } from '../../lib/queries';
import { Empty, ErrorBanner, Skel } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { MapBanner } from '../../ui/MapBanner';
import { StoreRow } from './StoreRow';

/** T-31 · RN-10 — estabelecimentos mais baratos no raio; mapa no topo com 1 pin por loja. */
export default function StoresPage() {
  const anchor = useAnchor();
  const q = useRanking();
  const [filter, setFilter] = useState('');
  const rows = (q.data ?? []).filter((r) => r.store.name.toLowerCase().includes(filter.toLowerCase()));
  const pins = useMemo(() => establishmentPins(q.data), [q.data]);

  return (
    <>
      <div className="h1row" style={{ marginTop: 12 }}>
        <h1 className="h1">Estabelecimentos</h1>
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
      <MapBanner
        to="/lojas/mapa"
        pins={pins}
        center={anchor}
        radiusKm={Math.min(anchor.radiusKm, 4)}
        caption={`${pins.length} estabelecimento${pins.length === 1 ? '' : 's'} no raio`}
      />
      <p className="lede">Mais baratos primeiro. O índice compara o preço de cada estabelecimento com a mediana da região nos mesmos produtos (últimos 14 dias).</p>
      <ErrorBanner error={q.error} />
      {q.isPending && [0, 1, 2].map((i) => <Skel key={i} h={96} r={16} />)}
      {q.data && rows.length === 0 && <Empty icon="store" title="Nenhum estabelecimento nesse raio.">Aumente o raio ou escaneie uma nota de uma loja daqui.</Empty>}
      {rows.map((r) => (
        <StoreRow key={r.store.id} r={r} />
      ))}
    </>
  );
}
