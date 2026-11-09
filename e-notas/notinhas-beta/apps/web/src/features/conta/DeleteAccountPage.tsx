import { useState } from 'react';
import { api } from '../../lib/api';
import { session } from '../../lib/session';
import { useMe } from '../../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorBanner, StateView } from '../../ui/bits';
import { useGo } from '../../ui/nav';
import { TopBar } from '../../ui/TopBar';

/** T-56 · US-01.12 (LGPD) — o que some e o que fica; confirmação digitando EXCLUIR. */
export default function DeleteAccountPage() {
  const me = useMe();
  const [typed, setTyped] = useState('');
  const [err, setErr] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const qc = useQueryClient();
  const go = useGo();
  if (me.data && !me.data.user) return <StateView icon="user" title="Você não está logado" />;
  return (
    <>
      <TopBar title="Excluir conta e dados" />
      <div className="card pad">
        <p className="b mb8">Some para sempre</p>
        <ul className="ticks bad">
          <li>Sua conta e e-mail</li>
          <li>Minhas notas, listas e gastos</li>
          <li>Pontos e créditos</li>
          <li>Vínculos de navegador (fingerprint) e IPs</li>
        </ul>
      </div>
      <div className="card pad">
        <p className="b mb8">Fica (já é anônimo)</p>
        <ul className="ticks">
          <li>Os preços das notas no índice público — sem nada que leve até você</li>
        </ul>
      </div>
      <label className="lbl" htmlFor="del">
        Digite EXCLUIR para confirmar
      </label>
      <div className="field">
        <input id="del" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </div>
      <ErrorBanner error={err} />
      <button
        className="btn danger mt12"
        disabled={typed !== 'EXCLUIR' || busy}
        onClick={async () => {
          setBusy(true);
          try {
            await api('/me', { method: 'DELETE', body: { confirmation: 'EXCLUIR' } });
            session.set(null);
            await qc.invalidateQueries();
            go('/', { replace: true });
          } catch (e) {
            setErr(e);
          } finally {
            setBusy(false);
          }
        }}
      >
        Excluir definitivamente
      </button>
    </>
  );
}
