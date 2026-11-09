import { brl, monthLabel } from '../../lib/format';
import { useSpending } from '../../lib/queries';
import { Empty, ErrorBanner, Skel } from '../../ui/bits';
import { TopBar } from '../../ui/TopBar';

/** T-52 · US-04.05/06 — derivado de Minhas notas, privado ao titular. */
export default function SpendingPage() {
  const q = useSpending();
  const d = q.data;
  const cur = new Date().toISOString().slice(0, 7);
  const months = (() => {
    const out: { month: string; totalCents: number }[] = [];
    const base = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(base.getFullYear(), base.getMonth() - i, 15).toISOString().slice(0, 7);
      out.push({ month: m, totalCents: d?.months.find((x) => x.month === m)?.totalCents ?? 0 });
    }
    return out;
  })();
  const max = Math.max(1, ...months.map((m) => m.totalCents));
  const storeMax = Math.max(1, ...(d?.byStore.map((s) => s.totalCents) ?? [1]));
  const catMax = Math.max(1, ...(d?.byCategory.map((s) => s.totalCents) ?? [1]));
  const nowTotal = months[months.length - 1]?.totalCents ?? 0;

  return (
    <>
      <TopBar title="Gastos" sub="das suas notas · só você vê" />
      <ErrorBanner error={q.error} />
      {q.isPending && <Skel h={220} r={14} />}
      {d && d.months.length === 0 && <Empty icon="chart" title="Sem notas nos últimos 6 meses." />}
      {d && d.months.length > 0 && (
        <div className="cols2">
          <div>
            <div className="card pad">
              <p className="meta">Este mês</p>
              <p className="price tnum" style={{ fontSize: 30 }}>
                {brl(nowTotal)}
              </p>
              <div className="bars mt12" role="img" aria-label="Gasto dos últimos 6 meses">
                {months.map((m) => (
                  <div className="bcol" key={m.month}>
                    <span className="tnum">{m.totalCents ? Math.round(m.totalCents / 100) : ''}</span>
                    <i className={m.month === cur ? 'cur' : ''} style={{ height: `${(m.totalCents / max) * 100}%` }} />
                    <span>{monthLabel(m.month)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="sec">
              <h2>Por loja</h2>
            </div>
            {d.byStore.map((s) => (
              <div className="hbar" key={s.store.id}>
                <span>
                  {s.store.name} <span className="meta">· {s.receipts} nota{s.receipts === 1 ? '' : 's'}</span>
                </span>
                <span className="price tnum">{brl(s.totalCents)}</span>
                <span className="track">
                  <i style={{ width: `${(s.totalCents / storeMax) * 100}%` }} />
                </span>
              </div>
            ))}
            <div className="sec">
              <h2>Por categoria</h2>
              <span className="meta-r">itens lidos das notas</span>
            </div>
            {d.byCategory.map((c) => (
              <div className="hbar" key={c.category}>
                <span>{c.category}</span>
                <span className="price tnum">{brl(c.totalCents)}</span>
                <span className="track">
                  <i style={{ width: `${(c.totalCents / catMax) * 100}%` }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
