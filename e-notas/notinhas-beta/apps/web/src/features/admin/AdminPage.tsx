import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { api } from '../../lib/api';
import { dateTime } from '../../lib/format';
import { useAdmin, useMe } from '../../lib/queries';
import { Chip, ErrorBanner, StateView } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useToast } from '../../ui/Toast';
import { Wordmark } from '../../ui/Wordmark';

type Tab = 'metricas' | 'falhas' | 'moderacao';

/** T-61 métricas · T-62 fila de falhas · T-63 moderação — desktop, role admin (US-ADM.01..03). */
export default function AdminPage() {
  const me = useMe();
  const [tab, setTab] = useState<Tab>('metricas');
  if (me.isPending) return null;
  if (me.data?.user?.role !== 'admin')
    return (
      <StateView icon="lock" title="Área restrita">
        <p>Entre com uma conta de administrador.</p>
        <Link to="/conta/entrar" className="btn p sm">
          Entrar
        </Link>
      </StateView>
    );
  const NAV: { id: Tab; label: string; icon: 'chart' | 'alert' | 'shield' }[] = [
    { id: 'metricas', label: 'Métricas', icon: 'chart' },
    { id: 'falhas', label: 'Fila de falhas', icon: 'alert' },
    { id: 'moderacao', label: 'Moderação', icon: 'shield' },
  ];
  return (
    <div className="deskapp">
      <aside>
        <Link to="/">
          <Wordmark />
        </Link>
        <p className="admtag">backoffice</p>
        {NAV.map((n) => (
          <button key={n.id} className={`dnav ${tab === n.id ? 'on' : ''}`} onClick={() => setTab(n.id)}>
            <Icon name={n.icon} />
            {n.label}
          </button>
        ))}
      </aside>
      <main>{tab === 'metricas' ? <Metrics /> : tab === 'falhas' ? <Failures /> : <Moderation />}</main>
    </div>
  );
}

function Metrics() {
  const { metrics } = useAdmin();
  const m = metrics.data;
  const max = Math.max(1, ...(m?.receiptsByDay.map((d) => d.count) ?? [1]));
  return (
    <>
      <h1 className="dh">Métricas da base</h1>
      <ErrorBanner error={metrics.error} />
      {m && (
        <>
          <div className="dkpis">
            {[
              ['Lojas', m.stores],
              ['Notas', m.receipts],
              ['Itens', m.items],
              ['Vínculos EAN', m.links],
              ['Fichas de produto', m.products],
              ['Contas', m.users],
              ['Navegadores', m.visitors],
            ].map(([l, v]) => (
              <div className="dk" key={l}>
                <span>{l}</span>
                <b className="tnum">{v}</b>
              </div>
            ))}
            <div className="dk">
              <span>Cobertura de EAN</span>
              <b className="tnum">{Math.round(m.eanCoverage * 100)}%</b>
            </div>
          </div>
          <p className="lede">
            O gargalo é a cobertura de EAN: só itens com código de barras entram na comparação entre lojas. {m.pendingFailures} notas na fila de falhas · {m.openFlags} pendências de moderação.
          </p>
          <div className="card pad">
            <p className="b mb12">Notas por dia (14 dias)</p>
            <div className="bars" style={{ height: 180 }}>
              {m.receiptsByDay.map((d) => (
                <div className="bcol" key={d.day}>
                  <span className="tnum">{d.count || ''}</span>
                  <i style={{ height: `${(d.count / max) * 100}%` }} />
                  <span>{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Failures() {
  const { failures } = useAdmin();
  const qc = useQueryClient();
  const toast = useToast();
  return (
    <>
      <h1 className="dh">Fila de falhas</h1>
      <p className="lede">Notas que a SEFAZ não entregou. Reprocessar é idempotente (deduplica pela chave).</p>
      <ErrorBanner error={failures.error} />
      <table className="dt">
        <thead>
          <tr>
            <th>Chave</th>
            <th>Erro</th>
            <th>Tentativas</th>
            <th>Atualizado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {failures.data?.map((f) => (
            <tr key={f.id} className={f.status === 'resolved' ? 'done' : ''}>
              <td className="mono">{f.accessKey ? `${f.accessKey.slice(0, 8)}…${f.accessKey.slice(-8)}` : '—'}</td>
              <td>
                <Chip kind={f.status === 'failed' ? 'warn' : 'meta'}>{f.errorCode}</Chip> {f.errorMessage}
              </td>
              <td className="tnum">{f.attempts}</td>
              <td>{dateTime(f.updatedAt)}</td>
              <td>
                {f.status !== 'resolved' && (
                  <button
                    className="btn s xs"
                    onClick={async () => {
                      const r = await api<{ ok: boolean; message: string }>(`/admin/falhas/${f.id}/reprocessar`, { method: 'POST', body: {} });
                      toast({ text: r.message });
                      await qc.invalidateQueries({ queryKey: ['admin'] });
                    }}
                  >
                    Reprocessar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Moderation() {
  const { flags } = useAdmin();
  const qc = useQueryClient();
  const act = async (id: number, action: 'keep' | 'replace' | 'hide') => {
    await api(`/admin/moderacao/${id}`, { method: 'POST', body: { action } });
    await qc.invalidateQueries({ queryKey: ['admin'] });
  };
  return (
    <>
      <h1 className="dh">Moderação</h1>
      <p className="lede">Conflitos de vínculo EAN (o primeiro vale até a revisão) e preços fora da curva. Ocultar tira do índice público sem apagar a nota.</p>
      <ErrorBanner error={flags.error} />
      <table className="dt">
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Alvo</th>
            <th>Quando</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {flags.data?.map((f) => (
            <tr key={f.id} className={f.status === 'resolved' ? 'done' : ''}>
              <td>
                <Chip kind={f.kind === 'ean_divergent' ? 'meta' : 'warn'}>{f.kind === 'ean_divergent' ? 'EAN divergente' : 'Preço fora da curva'}</Chip>
              </td>
              <td>{f.summary}</td>
              <td>{dateTime(f.createdAt)}</td>
              <td>
                {f.status === 'open' && (
                  <div className="flex" style={{ gap: 6 }}>
                    <button className="btn s xs" onClick={() => act(f.id, 'keep')}>
                      Manter
                    </button>
                    {f.kind === 'ean_divergent' ? (
                      <button className="btn s xs" onClick={() => act(f.id, 'replace')}>
                        Trocar
                      </button>
                    ) : (
                      <button className="btn danger xs" onClick={() => act(f.id, 'hide')}>
                        Ocultar
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
