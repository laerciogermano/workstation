import type { QuoteDTO } from '@notinhas/contracts';
import { useState } from 'react';
import { Link } from 'react-router';
import { brl, km, pct, when } from '../lib/format';
import { Photo, Price } from './bits';
import { Icon } from './Icon';
import { Segmented } from './Segmented';

type Props = {
  quote: QuoteDTO | null;
  credits: number;
  /** Tem itens cotáveis (EAN na nota / itens na lista). Sem isso, não mostra gate. */
  hasItems: boolean;
  title: (gtin: string) => string;
  photo: (gtin: string) => string | null;
  /** Quando há itens mas nenhum com EAN (só em notas). */
  needEanHint?: boolean;
};

/** T-42 uma loja · T-41 dividir · T-54 gate — UI compartilhada listas + notas. */
export function QuotePanel({ quote, credits, hasItems, title, photo, needEanHint }: Props) {
  const [mode, setMode] = useState<'uma' | 'dividir'>('uma');
  if (!hasItems) return null;
  if (needEanHint) {
    return (
      <div className="card pad">
        <div className="state" style={{ padding: '8px 0' }}>
          <span className="sticon">
            <Icon name="barcode" />
          </span>
          <h2>Vincule os códigos de barras</h2>
          <p>Com EAN nos itens, comparamos o preço desta nota em outras lojas e montamos a divisão mais barata — igual às listas.</p>
        </div>
      </div>
    );
  }
  if (!quote) return <CreditGate />;
  return (
    <>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'uma', label: 'Uma loja', icon: 'store' },
          { value: 'dividir', label: 'Dividir entre lojas', icon: 'split' },
        ]}
      />
      {quote.split.uncovered.length > 0 && (
        <div className="banner warn">
          <Icon name="alert" />
          <span>
            Sem preço recente para {quote.split.uncovered.map(title).join(', ')}. Esses itens ficam fora da conta — não inventamos preço.
          </span>
        </div>
      )}
      {mode === 'uma' ? <OneStore quote={quote} title={title} /> : <Split quote={quote} title={title} photo={photo} />}
      <p className="foot-note">{credits} cotações restantes este mês · cada nota ou código de barras rende mais.</p>
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
        <span className="meta">
          Dividindo em {quote.split.stores.length} loja{quote.split.stores.length > 1 ? 's' : ''}
        </span>
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
        {quote.partial && (
          <p className="meta">
            Comparação parcial: a melhor loja única não tem todos os itens; a economia considera só os itens que ela tem.
          </p>
        )}
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
        <p>
          Quem contribui mantém o índice vivo: cada nota escaneada vale 10 pontos e cada código de barras, 5. Buscar preço continua liberado.
        </p>
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
