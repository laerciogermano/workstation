import { Link } from 'react-router';
import { POINTS } from '@notinhas/domain';
import { dateShort } from '../../lib/format';
import { useMe, usePoints } from '../../lib/queries';
import { ErrorBanner, Skel } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { TopBar } from '../../ui/TopBar';

/** T-53 · REQ-052 — pontos viram crédito de cotação; contribuição paga o uso. */
export default function PointsPage() {
  const q = usePoints();
  const me = useMe();
  return (
    <>
      <TopBar title="Pontos e contribuição" />
      <ErrorBanner error={q.error} />
      {q.isPending && <Skel h={120} r={18} />}
      {q.data && (
        <>
          <div className="ptshead">
            <b className="tnum">{q.data.balance}</b>
            <span className="meta">pontos · {q.data.credits} cotações disponíveis este mês</span>
          </div>
          {!me.data?.user && (
            <Link to="/conta/criar" className="banner">
              <Icon name="info" />
              <span>Seus pontos estão neste navegador. Crie uma conta para guardar.</span>
            </Link>
          )}
          <div className="earn">
            <div>
              <Icon name="qr" />
              <b>+{POINTS.receipt}</b>
              <span>por nota nova escaneada</span>
            </div>
            <div>
              <Icon name="barcode" />
              <b>+{POINTS.eanLink}</b>
              <span>por código de barras vinculado</span>
            </div>
          </div>
          <div className="sec">
            <h2>Extrato</h2>
          </div>
          <div className="card list">
            {q.data.events.length === 0 && <p className="li meta">Nenhuma contribuição ainda.</p>}
            {q.data.events.map((e, i) => (
              <div className="li" key={i}>
                <Icon name={e.kind === 'receipt' ? 'receipt' : 'barcode'} />
                <span className="grow">
                  <span className="b">{e.label}</span>
                  <span className="meta" style={{ display: 'block' }}>
                    {dateShort(e.createdAt)}
                  </span>
                </span>
                <span className="b g tnum">+{e.points}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
