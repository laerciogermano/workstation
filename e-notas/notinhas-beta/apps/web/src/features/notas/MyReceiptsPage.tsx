import { Link } from 'react-router';
import { brl, dateShort, when } from '../../lib/format';
import { useMe, useMyReceipts } from '../../lib/queries';
import { Empty, ErrorBanner, Progress, Skel } from '../../ui/bits';
import { Icon } from '../../ui/Icon';

/** T-50 · RN-14 — histórico pessoal (fingerprint ou conta), só o titular vê. */
export default function MyReceiptsPage() {
  const q = useMyReceipts();
  const me = useMe();
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = (q.data ?? []).filter((r) => r.issuedAt?.startsWith(month));
  const total = thisMonth.reduce((a, r) => a + (r.totalCents ?? 0), 0);

  return (
    <>
      <div className="h1row" style={{ marginTop: 12 }}>
        <h1 className="h1">Minhas notas</h1>
        <Link to="/nota" className="btn p sm">
          <Icon name="qr" />
          Nova
        </Link>
      </div>
      {!me.data?.user && (q.data?.length ?? 0) > 0 && (
        <Link to="/conta/criar" className="banner">
          <Icon name="finger" />
          <span>Essas notas estão guardadas neste navegador. Crie uma conta para não perder e ver em outros aparelhos.</span>
          <Icon name="next" />
        </Link>
      )}
      {q.data && q.data.length > 0 && (
        <Link to="/gastos" viewTransition className="monthcard">
          <div>
            <span className="meta">Gasto em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</span>
            <span className="price tnum" style={{ fontSize: 26 }}>
              {brl(total)}
            </span>
            <span className="meta">{thisMonth.length} notas · ver gastos por mês e por loja</span>
          </div>
          <Icon name="chart" />
        </Link>
      )}
      <ErrorBanner error={q.error} />
      {q.isPending && [0, 1, 2].map((i) => <Skel key={i} h={84} r={14} />)}
      {q.data?.length === 0 && (
        <Empty icon="receipt" title="Nenhuma nota ainda.">
          Escaneie o QR do cupom: você guarda o que comprou e ajuda todo mundo a achar o menor preço.
        </Empty>
      )}
      {q.data?.map((r) => (
        <Link key={r.id} to={`/notas/${r.id}`} viewTransition className="nrow2">
          <div className="flex">
            <span className="grow b">{r.store.name}</span>
            {r.totalCents !== null && <span className="price tnum">{brl(r.totalCents)}</span>}
          </div>
          <p className="meta">
            {dateShort(r.issuedAt)} · {when(r.issuedAt)} · {r.itemCount} itens · nº {r.number}
          </p>
          <Progress done={r.withEan} total={r.itemCount} compact />
        </Link>
      ))}
    </>
  );
}
