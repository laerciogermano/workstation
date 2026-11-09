import type { QuoteDTO } from '@notinhas/contracts';
import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { api } from '../../lib/api';
import { brl, km, pct, when } from '../../lib/format';
import { useList, useSetListItem } from '../../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorBanner, Empty, Photo, Price, Skel, StateView, Stepper } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useGo } from '../../ui/nav';
import { Segmented } from '../../ui/Segmented';
import { TopBar } from '../../ui/TopBar';

/** T-42 uma loja · T-41 dividir entre lojas · T-54 gate de crédito — RN-13 (nunca inventa preço). */
export default function ListPage() {
  const { id = '' } = useParams();
  const q = useList(id);
  const setItem = useSetListItem();
  const [mode, setMode] = useState<'uma' | 'dividir'>('uma');
  const qc = useQueryClient();
  const go = useGo();
  const d = q.data;

  if (q.isPending) return <><TopBar title="" /><Skel h={64} r={14} /><Skel h={200} r={18} /></>;
  if (!d) return <><TopBar title="Lista" /><ErrorBanner error={q.error} /><StateView icon="list" title="Lista não encontrada" /></>;

  const title = (g: string) => d.items.find((i) => i.gtin === g)?.title ?? g;
  const photo = (g: string) => d.items.find((i) => i.gtin === g)?.photoUrl ?? null;

  return (
    <>
      <TopBar
        title={d.name}
        sub={`${d.items.length} produto${d.items.length === 1 ? '' : 's'}`}
        right={
          <button
            className="ib ghost"
            aria-label="Apagar lista"
            onClick={async () => {
              if (!confirm(`Apagar a lista “${d.name}”?`)) return;
              await api(`/listas/${id}`, { method: 'DELETE' });
              await qc.invalidateQueries({ queryKey: ['personal'] });
              go('/listas', { replace: true });
            }}
          >
            <Icon name="trash" />
          </button>
        }
      />
      <div className="cols2">
        <div>
          {d.items.length === 0 && (
            <Empty icon="list" title="Lista vazia.">
              Adicione produtos pelo + nos cards. <Link to="/busca">Buscar produtos</Link>
            </Empty>
          )}
          {d.items.length > 0 && (
            <div className="card list">
              {d.items.map((i) => (
                <div className="li" key={i.gtin}>
                  <Photo url={i.photoUrl} size="xs" />
                  <Link to={`/produto/${i.gtin}`} className="grow b" style={{ color: 'inherit', fontSize: 13.5 }}>
                    {i.title}
                  </Link>
                  <Stepper value={i.quantity} onChange={(v) => setItem.mutate({ listId: id, gtin: i.gtin, quantity: v })} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          {d.items.length > 0 && !d.quote && <CreditGate />}
          {d.quote && (
            <>
              <Segmented
                value={mode}
                onChange={setMode}
                options={[
                  { value: 'uma', label: 'Uma loja', icon: 'store' },
                  { value: 'dividir', label: 'Dividir entre lojas', icon: 'split' },
                ]}
              />
              {d.quote.split.uncovered.length > 0 && (
                <div className="banner warn">
                  <Icon name="alert" />
                  <span>
                    Sem preço recente para {d.quote.split.uncovered.map(title).join(', ')}. Esses itens ficam fora da conta — não inventamos preço.
                  </span>
                </div>
              )}
              {mode === 'uma' ? <OneStore quote={d.quote} title={title} /> : <Split quote={d.quote} title={title} photo={photo} />}
              <p className="foot-note">{d.credits} cotações restantes este mês · cada nota ou código de barras rende mais.</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function OneStore({ quote, title }: { quote: QuoteDTO; title: (g: string) => string }) {
  return (
    <>
      {quote.byStore.map((s) => {
        const best = s.store.id === quote.referenceStoreId;
        return (
          <Link key={s.store.id} to={`/lojas/${s.store.id}`} className={`qrow ${best ? 'best' : ''}`} style={{ color: 'inherit' }}>
            <div className="grow">
              <p className="b">
                {s.store.name} <span className="meta">{km(s.distanceKm)}</span>
              </p>
              <p className="meta">
                {s.found} de {s.found + s.missing.length} itens
              </p>
              <span className="cov">
                <i style={{ width: `${Math.round(s.coverage * 100)}%` }} />
              </span>
              {s.missing.length > 0 && <p className="missing">Falta: {s.missing.map(title).join(', ')}</p>}
            </div>
            <Price cents={s.totalCents} menor={best} className="lg" />
          </Link>
        );
      })}
    </>
  );
}

function Split({ quote, title, photo }: { quote: QuoteDTO; title: (g: string) => string; photo: (g: string) => string | null }) {
  const ref = quote.byStore.find((s) => s.store.id === quote.referenceStoreId);
  return (
    <>
      <div className="splitsum">
        <span className="meta">Dividindo em {quote.split.stores.length} loja{quote.split.stores.length > 1 ? 's' : ''}</span>
        <Price cents={quote.split.totalCents} menor className="xl" />
        {ref && quote.savingCents > 0 ? (
          <p className="save">
            <b className="tnum">−{brl(quote.savingCents)}</b>
            <span>
              {pct(-quote.savingRatio)} vs tudo no {ref.store.name} ({brl(ref.totalCents)})
            </span>
          </p>
        ) : (
          <p className="meta">Dividir não economiza nada aqui — compre tudo no {ref?.store.name}.</p>
        )}
        {quote.partial && <p className="meta">Comparação parcial: a melhor loja única não tem todos os itens; a economia considera só os itens que ela tem.</p>}
        <p className="meta">
          {quote.split.stores.length} parada{quote.split.stores.length > 1 ? 's' : ''}
          {quote.split.totalDistanceKm !== null && ` · ${km(quote.split.totalDistanceKm)} somando as distâncias`}
        </p>
      </div>
      {quote.split.stores.map((s) => (
        <div className="card list" key={s.store.id}>
          <div className="li head">
            <span className="grow b">
              {s.store.name} <span className="meta">{km(s.distanceKm)}</span>
            </span>
            <span className="price tnum">{brl(s.subtotalCents)}</span>
          </div>
          {s.lines.map((l) => (
            <div className="li" key={l.gtin}>
              <Photo url={photo(l.gtin)} size="xs" />
              <div className="grow">
                <p className="b">{title(l.gtin)}</p>
                <p className="meta tnum">
                  {l.quantity} × {brl(l.unitCents)} · {when(l.observedAt)}
                </p>
              </div>
              <Price cents={l.subtotalCents} menor />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

/** T-54 — pedido suave; nunca bloqueia a busca de preço. */
function CreditGate() {
  return (
    <div className="card pad">
      <div className="state" style={{ padding: '8px 0' }}>
        <span className="sticon warn">
          <Icon name="award" />
        </span>
        <h2>Suas cotações do mês acabaram</h2>
        <p>Quem contribui mantém o índice vivo: cada nota escaneada vale 10 pontos e cada código de barras, 5. Buscar preço continua liberado.</p>
        <Link to="/nota" className="btn p sm">
          <Icon name="qr" />
          Escanear uma nota
        </Link>
        <Link to="/notas" className="btn gh">
          Vincular códigos das minhas notas
        </Link>
      </div>
    </div>
  );
}
