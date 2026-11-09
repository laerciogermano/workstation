import type { ReceiptItemDTO } from '@notinhas/contracts';
import { formatAccessKey } from '@notinhas/domain';
import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router';
import { brl, dateTime } from '../../lib/format';
import { useMe, useReceipt } from '../../lib/queries';
import { Chip, ErrorBanner, Photo, Progress, Skel, StateView } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { QuotePanel } from '../../ui/QuotePanel';
import { TopBar } from '../../ui/TopBar';
import { LinkEanSheet, type LinkTarget } from './LinkEanSheet';

const ORIGIN: Record<string, string> = { barcode_scan: 'scan', suggestion: 'sugestão', manual: 'manual' };

/** T-22 nota ingerida · T-26 duplicada · T-55 detalhe — progresso de EAN e “Vincular” por item (RN-02). */
export default function ReceiptResultPage() {
  const { id = '' } = useParams();
  const nav = useLocation().state as { status?: 'created' | 'duplicate'; points?: number } | null;
  const q = useReceipt(id);
  const me = useMe();
  const [target, setTarget] = useState<LinkTarget | null>(null);
  const [queue, setQueue] = useState<ReceiptItemDTO[]>([]);
  const r = q.data;

  if (q.isPending)
    return (
      <>
        <TopBar title="Nota" />
        <Skel h={60} r={14} />
        <Skel h={300} r={14} />
      </>
    );
  if (!r)
    return (
      <>
        <TopBar title="Nota" />
        <ErrorBanner error={q.error} />
        <StateView icon="receipt" title="Nota não encontrada">
          <p>Só quem leu a nota vê o detalhe dela.</p>
        </StateView>
      </>
    );

  /** Pendentes por código interno (RN-12 / RF-E01-12): um vínculo cobre todas as linhas com o mesmo cód. */
  const pendingByCode = (() => {
    const seen = new Set<string>();
    return r.items.filter((i) => {
      if (i.gtin || seen.has(i.storeCode)) return false;
      seen.add(i.storeCode);
      return true;
    });
  })();
  const pendingItems = pendingByCode;
  const toTarget = (i: ReceiptItemDTO, replace = false): LinkTarget => ({
    storeId: r.store.id,
    storeCode: i.storeCode,
    description: i.description,
    displayName: i.displayName,
    replace,
    currentGtin: i.gtin,
  });
  const startQueue = () => {
    const [first, ...rest] = pendingItems;
    if (!first) return;
    setQueue(rest);
    setTarget(toTarget(first));
  };
  const next = (linkedCode?: string) => {
    const rest = linkedCode ? queue.filter((i) => i.storeCode !== linkedCode) : queue;
    const [first, ...tail] = rest;
    setQueue(tail);
    setTarget(first ? toTarget(first) : null);
  };

  return (
    <>
      <TopBar title={nav?.status === 'created' ? 'Nota recebida' : nav?.status === 'duplicate' ? 'Nota já lida' : 'Detalhe da nota'} sub={nav ? undefined : r.store.name} />

      {nav?.status === 'duplicate' && (
        <div className="banner">
          <Icon name="info" />
          <span>
            <b>Essa nota já estava no índice.</b> Nenhum preço novo foi contado (a mesma nota não vale duas vezes), mas ela está no seu histórico. Sem pontos desta vez.
          </span>
        </div>
      )}

      {nav?.status === 'created' && (
        <>
          <div className="okhead">
            <span className="okbig">
              <Icon name="check" />
            </span>
            <div>
              <p className="b">
                {r.store.name}
                {r.store.neighborhood && ` · ${r.store.neighborhood}`}
              </p>
              <p className="meta tnum">
                {dateTime(r.issuedAt)} · nº {r.number} · {r.items.length} itens{r.totalCents !== null && ` · ${brl(r.totalCents)}`}
              </p>
            </div>
          </div>
          {(nav.points ?? 0) > 0 && (
            <div className="pts-earned">
              <Icon name="award" />
              <span>
                <b>+{nav.points} pontos</b> {me.data?.user ? 'na sua conta' : 'guardados neste navegador'}
              </span>
              {!me.data?.user && (
                <Link to="/conta/criar" className="lnk">
                  Criar conta
                </Link>
              )}
            </div>
          )}
        </>
      )}

      {!nav?.status && (
        <div className="receipt">
          <p className="b center">{r.store.name}</p>
          <p className="meta center">{r.store.address}</p>
          <div className="hr" />
          <p className="meta tnum">
            nº {r.number} · série {r.series} · {dateTime(r.issuedAt)}
          </p>
          <p className="meta mono" style={{ wordBreak: 'break-all' }}>
            {formatAccessKey(r.accessKey)}
          </p>
          <p className="meta">CPF do consumidor: não guardamos (é descartado na leitura).</p>
        </div>
      )}

      <Progress done={r.eanProgress.done} total={r.eanProgress.total} />

      {/* Ordem: info da nota (acima) → comparar preços → lista de itens. */}
      <div className="sec">
        <h2>Comparar preços</h2>
      </div>
      <QuotePanel
        quote={r.quote}
        credits={r.credits}
        hasItems={r.items.length > 0}
        needEanHint={r.eanProgress.done === 0}
        title={(g) => r.items.find((i) => i.gtin === g)?.displayName ?? g}
        photo={(g) => r.items.find((i) => i.gtin === g)?.photoUrl ?? null}
      />

      <div className="sec">
        <h2>Itens</h2>
        <span className="meta-r">
          {pendingItems.length
            ? `${pendingItems.length} cód. interno${pendingItems.length === 1 ? '' : 's'} sem EAN`
            : 'todos os códigos internos com EAN'}
        </span>
      </div>
      <div className="card list">
        {r.items.map((i) => (
          <div className="li" key={i.id}>
            <Photo url={i.photoUrl} size="xs" />
            <div className="grow">
              {i.gtin ? (
                <Link to={`/produto/${i.gtin}`} className="b" style={{ color: 'inherit', display: 'block' }}>
                  {i.displayName}
                </Link>
              ) : (
                <p className="b">{i.displayName}</p>
              )}
              <p className="meta tnum">
                {i.quantity} × {brl(i.unitCents)} · cód. {i.storeCode} {i.origin && <Chip kind="meta">{ORIGIN[i.origin]}</Chip>}
              </p>
            </div>
            {i.gtin ? (
              <button className="btn s xs" onClick={() => setTarget(toTarget(i, true))} aria-label="Alterar código de barras">
                Alterar
              </button>
            ) : (
              <button className="btn s xs" onClick={() => setTarget(toTarget(i))}>
                Vincular
              </button>
            )}
          </div>
        ))}
        {r.totalCents !== null && (
          <div className="li">
            <span className="grow b">Total</span>
            <span className="price tnum">{brl(r.totalCents)}</span>
          </div>
        )}
      </div>

      <div className="footbar">
        {pendingItems.length > 0 && (
          <button className="btn p" onClick={startQueue}>
            <Icon name="barcode" />
            Vincular {pendingItems.length} cód. interno{pendingItems.length > 1 ? 's' : ''}
          </button>
        )}
        <Link to="/notas" className="btn gh">
          Ver Minhas notas
        </Link>
      </div>

      <LinkEanSheet
        key={target?.storeCode ?? 'none'}
        target={target}
        onClose={() => {
          setTarget(null);
          setQueue([]);
        }}
        onLinked={() => {
          const code = target?.storeCode;
          const rest = code ? queue.filter((i) => i.storeCode !== code) : queue;
          if (!rest.length) {
            setQueue([]);
            return;
          }
          next(code);
          return 'next';
        }}
      />
    </>
  );
}
