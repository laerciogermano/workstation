import { RADIUS_OPTIONS_KM } from '@notinhas/domain';
import { useState } from 'react';
import { BAIRROS_SJP, requestGps, setAnchor, useAnchor } from '../../lib/location';
import { ErrorBanner } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useGo } from '../../ui/nav';
import { TopBar } from '../../ui/TopBar';

/** T-05 · RN-09 — opcional, nunca bloqueia: GPS com permissão explícita, bairro, ou centro do município. */
export default function LocationPage() {
  const a = useAnchor();
  const [err, setErr] = useState<Error | null>(null);
  const [busy, setBusy] = useState(false);
  const go = useGo();
  return (
    <>
      <TopBar title="Localização" />
      <p className="lede">Usamos a localização só para ordenar lojas e preços por distância. Ela fica neste aparelho — o servidor recebe uma posição aproximada por consulta e não guarda.</p>
      <button
        className="row"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            await requestGps();
            go(-1);
          } catch (e) {
            setErr(e as Error);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Icon name="nav" />
        <span className="grow">
          <span className="b">Usar minha localização</span>
          <span className="meta" style={{ display: 'block' }}>
            {a.mode === 'gps' ? 'Ativa' : 'Pede permissão ao navegador'}
          </span>
        </span>
        {a.mode === 'gps' && <Icon name="check" />}
      </button>
      <ErrorBanner error={err} />
      <p className="lbl">Ou escolha o bairro</p>
      {BAIRROS_SJP.map((b) => (
        <button key={b.label} className={`radio ${a.mode !== 'gps' && a.label === b.label ? 'on' : ''}`} onClick={() => setAnchor({ mode: 'bairro', ...b })}>
          <span />
          {b.label}
        </button>
      ))}
      <p className="lbl">Raio: {a.radiusKm} km</p>
      <div className="chips wrap">
        {RADIUS_OPTIONS_KM.map((k) => (
          <button key={k} className={`chip ${a.radiusKm === k ? 'on' : ''}`} onClick={() => setAnchor({ radiusKm: k })}>
            {k} km
          </button>
        ))}
      </div>
    </>
  );
}
