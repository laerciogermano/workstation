import { isValidGtin } from '@notinhas/domain';
import { CATEGORIES } from '@notinhas/domain';
import type { ProductCardDTO } from '@notinhas/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { brl, when } from '../../lib/format';
import { useProductViewMode } from '../../lib/product-view';
import { clearSearchCache, useSearch } from '../../lib/queries';
import { Chip, Empty, ErrorBanner, Skel } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useGo } from '../../ui/nav';
import { ProductCard } from '../../ui/ProductCard';
import { ProductViewToggle } from '../../ui/ProductViewToggle';
import { Sheet } from '../../ui/Sheet';
import { AddToListSheet } from '../listas/AddToListSheet';
import { useCameraScanner, Viewfinder } from '../nota/scanner';

/** Seletor estável para a home focar o campo no mesmo toque (teclado iOS). */
export const SEARCH_INPUT_ATTR = 'data-nt-search';

/** T-11 · T-72 — nome, marca ou EAN (8–14 dígitos com DV); itens sem EAN à parte (Q6). */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const cat = params.get('categoria');
  const [ordem, setOrdem] = useState<'preco' | 'distancia'>('preco');
  const deferred = useDeferredValue(q);
  const active = deferred.trim().length > 0 || !!cat;
  const res = useSearch(deferred, cat, ordem);
  const qc = useQueryClient();
  const [adding, setAdding] = useState<ProductCardDTO | null>(null);
  const [view] = useProductViewMode();
  const [scan, setScan] = useState(false);
  const go = useGo();
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
  }, []);

  // Ao sair da busca, zera cache para não reaparecer lixo na próxima abertura.
  useEffect(() => () => clearSearchCache(qc), [qc]);

  // Sem query/categoria: limpa resíduos de buscas anteriores imediatamente.
  useEffect(() => {
    if (!active) clearSearchCache(qc);
  }, [active, qc]);

  const set = (k: string, v: string | null) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    // Nova busca / limpar: tira resultados da query anterior antes do fetch.
    if (k === 'q' || k === 'categoria') clearSearchCache(qc);
    setParams(p, { replace: true });
  };
  const digits = /^\d{8,14}$/.test(q.trim());
  const data = active ? res.data : undefined;
  const nothing = data && data.products.length === 0;

  return (
    <>
      <header className="top">
        <button className="ib" onClick={() => go(-1)} aria-label="Voltar">
          <Icon name="back" />
        </button>
        <label className="search" style={{ viewTransitionName: 'search' }}>
          <Icon name="search" />
          <input
            ref={inputRef}
            {...{ [SEARCH_INPUT_ATTR]: '' }}
            value={q}
            onChange={(e) => set('q', e.target.value)}
            placeholder="Leite, Coca-Cola, 789…"
            aria-label="Buscar produto ou código de barras"
            inputMode="search"
            enterKeyHint="search"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            autoFocus
          />
          {q && (
            <button onClick={() => set('q', null)} aria-label="Limpar">
              <Icon name="x" />
            </button>
          )}
        </label>
        <button className="ib" onClick={() => setScan(true)} aria-label="Ler código de barras">
          <Icon name="barcode" />
        </button>
      </header>

      {digits && (
        <p className={`hint ${isValidGtin(q.trim()) ? 'g' : 'err-t'}`} role="status">
          {isValidGtin(q.trim()) ? 'Código de barras válido.' : 'Esse código tem o dígito verificador errado — confira os números.'}
        </p>
      )}

      <nav className="chips" aria-label="Categorias">
        {CATEGORIES.slice(0, 12).map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? 'on' : ''}`} onClick={() => set('categoria', cat === c.id ? null : c.id)}>
            {c.short}
          </button>
        ))}
      </nav>

      {!q && !cat && <Empty icon="search" title="O que você quer pagar menos?">Busque por nome, marca ou digite o código de barras.</Empty>}
      <ErrorBanner error={active ? res.error : null} />
      {active && res.isFetching && !data && (
        <div className="pgrid">
          {[0, 1, 2, 3].map((i) => (
            <div className="pc" key={i}>
              <Skel h={130} r={10} />
              <Skel h={12} w="70%" />
            </div>
          ))}
        </div>
      )}

      {data && data.products.length > 0 && (
        <>
          <div className="sec">
            <h2>{data.products.length} produtos</h2>
            <div className="flex" style={{ marginLeft: 'auto', gap: 6 }}>
              <button className={`chip ${ordem === 'preco' ? 'on' : ''}`} onClick={() => setOrdem('preco')}>
                Menor preço
              </button>
              <button className={`chip ${ordem === 'distancia' ? 'on' : ''}`} onClick={() => setOrdem('distancia')}>
                Mais perto
              </button>
            </div>
          </div>
          <ProductViewToggle />
          <div className={`pgrid view-${view}`}>
            {data.products.map((p) => (
              <ProductCard key={p.gtin} p={p} onAdd={setAdding} view={view} />
            ))}
          </div>
        </>
      )}

      {nothing && active && (
        <div className="state">
          <span className="sticon">
            <Icon name="receipt" />
          </span>
          <h2>Ninguém registrou esse preço ainda</h2>
          <p>Os preços vêm das notas que as pessoas escaneiam. Se você comprou, a sua nota coloca esse produto no mapa.</p>
          <Link to="/nota" className="btn p sm">
            <Icon name="qr" />
            Escanear nota
          </Link>
        </div>
      )}

      {data && data.unlinked.length > 0 && (
        <>
          <div className="sec">
            <h2>Parecidos sem código de barras</h2>
            <Chip kind="warn">confiança menor</Chip>
          </div>
          <p className="lede">Mesma descrição na nota, mas ninguém ligou ao código de barras ainda — a comparação entre lojas pode não ser do mesmo produto.</p>
          {data.unlinked.map((u) => (
            <Link key={`${u.store.id}-${u.storeCode}`} to={`/lojas/${u.store.id}?item=${encodeURIComponent(u.storeCode)}`} className="row">
              <div className="grow">
                <p className="b">{u.displayName}</p>
                <p className="meta">
                  {u.store.name} · {when(u.observedAt)} · <span className="mono">{u.description}</span>
                </p>
              </div>
              <span className="price tnum">{brl(u.priceCents)}</span>
            </Link>
          ))}
        </>
      )}

      <BarcodeSearchSheet
        open={scan}
        onClose={() => setScan(false)}
        onCode={(c) => {
          set('q', c);
          setScan(false);
        }}
      />
      <AddToListSheet product={adding} onClose={() => setAdding(null)} />
    </>
  );
}

function BarcodeSearchSheet({ open, onClose, onCode }: { open: boolean; onClose: () => void; onCode: (c: string) => void }) {
  const { videoRef, state } = useCameraScanner('ean', (hit) => isValidGtin(hit.code) && onCode(hit.code), open);
  return (
    <Sheet open={open} onClose={onClose} title="Ler código de barras">
      <div className="cam short">
        <video ref={videoRef} muted playsInline />
        <Viewfinder mode="ean" hit={false} />
        <p>{state === 'denied' || state === 'unsupported' ? 'Câmera indisponível — digite o código na busca.' : 'Aponte para o código de barras da embalagem'}</p>
      </div>
    </Sheet>
  );
}
