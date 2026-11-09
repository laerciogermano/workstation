import type { ProductCardDTO } from '@notinhas/contracts';
import { CATEGORIES } from '@notinhas/domain';
import type { IconName } from '../../ui/Icon';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { PageSkeleton } from '../../app/Shell';
import { useAnchor } from '../../lib/location';
import { homeProducts, productPricePins } from '../../lib/map-pins';
import { useProductViewMode } from '../../lib/product-view';
import { useHome, useMe, useRanking } from '../../lib/queries';
import { Empty, ErrorBanner } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { MapBanner } from '../../ui/MapBanner';
import { ProductCard } from '../../ui/ProductCard';
import { ProductViewToggle } from '../../ui/ProductViewToggle';
import { Wordmark } from '../../ui/Wordmark';
import { ThemePicker } from '../../ui/ThemePicker';
import { AddToListSheet } from '../listas/AddToListSheet';
import { SEARCH_INPUT_ATTR } from './SearchPage';

/** T-10 · REQ-056: Promoções → Mais comprados → categorias; grade de 2 linhas rolando na horizontal. */
export function HomePage() {
  const home = useHome();
  const ranking = useRanking();
  const me = useMe();
  const anchor = useAnchor();
  const navigate = useNavigate();
  const [adding, setAdding] = useState<ProductCardDTO | null>(null);
  const [view] = useProductViewMode();
  const [active, setActive] = useState('promocoes');
  const [betaOpen, setBetaOpen] = useState(() => {
    try {
      return localStorage.getItem('nt:beta-banner') !== '0';
    } catch {
      return true;
    }
  });
  const refs = useRef(new Map<string, HTMLElement>());
  const productPins = useMemo(
    () => productPricePins(homeProducts(home.data), ranking.data, { limit: 24 }),
    [home.data, ranking.data],
  );

  const dismissBeta = () => {
    setBetaOpen(false);
    try {
      localStorage.setItem('nt:beta-banner', '0');
    } catch {
      /* private mode */
    }
  };

  /**
   * REQ-064 — abre /busca e foca o campo no mesmo gesto (teclado iOS).
   * `flushSync: true` no React Router 7 monta a SearchPage a tempo do focus().
   */
  const openSearch = () => {
    navigate('/busca', { flushSync: true });
    document.querySelector<HTMLInputElement>(`input[${SEARCH_INPUT_ATTR}]`)?.focus({ preventScroll: true });
  };

  const sections = home.data
    ? [
        { id: 'promocoes', name: 'Promoções', icon: 'down' as IconName, sub: 'abaixo da mediana · 14 dias', products: home.data.promotions, hl: true },
        { id: 'mais', name: 'Mais comprados', icon: 'award' as IconName, sub: 'mais vezes nas notas', products: home.data.mostBought, hl: false },
        ...home.data.categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: (CATEGORIES.find((x) => x.id === c.id)?.icon ?? 'box') as IconName,
          sub: `${c.products.length} produtos`,
          products: c.products,
          hl: false,
        })),
      ]
    : [];

  // chips acompanham a rolagem
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-40% 0px -55% 0px' },
    );
    refs.current.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [home.data]);

  return (
    <>
      <header className="top brandtop">
        <Wordmark />
        <span className="sp" />
        {me.data?.user && (
          <Link to="/pontos" className="ptschip" aria-label="Pontos">
            <Icon name="award" />
            <span className="tnum">{me.data.points}</span>
          </Link>
        )}
        <Link to="/mapa" viewTransition className="ib" aria-label="Mapa de produtos">
          <Icon name="pin" />
        </Link>
        <ThemePicker />
        <Link to="/perfil" viewTransition className="ib" aria-label="Perfil e configurações">
          <Icon name="user" />
        </Link>
      </header>

      {betaOpen && (
        <div className="banner beta" role="status">
          <Icon name="info" />
          <span>
            <b>Beta</b> · versão em desenvolvimento
          </span>
          <span className="beta-ver tnum" title={`build ${__BUILD_ID__}`}>
            v{__APP_VERSION__} · {__BUILD_ID__}
          </span>
          <button type="button" className="ib" onClick={dismissBeta} aria-label="Fechar aviso">
            <Icon name="x" />
          </button>
        </div>
      )}

      <label className="search" style={{ viewTransitionName: 'search' }}>
        <Icon name="search" />
        <input
          type="search"
          readOnly
          value=""
          placeholder="Buscar produto ou código de barras"
          aria-label="Buscar produto ou código de barras"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          onFocus={openSearch}
          onClick={openSearch}
        />
      </label>

      {anchor.mode === 'padrao' && (
        <Link to="/perfil/localizacao" className="banner">
          <Icon name="nav" />
          <span>
            Mostrando preços perto do <b>{anchor.label}</b>. Use sua localização para ver o que fica mais perto.
          </span>
          <Icon name="next" />
        </Link>
      )}

      <MapBanner
        to="/mapa"
        pins={productPins}
        center={anchor}
        radiusKm={Math.min(anchor.radiusKm, 4)}
        caption={`${productPins.length} produto${productPins.length === 1 ? '' : 's'} perto`}
      />

      {home.isPending && <PageSkeleton bare />}
      <ErrorBanner error={home.error} />

      {home.data && sections.length > 0 && (
        <>
          <nav className="chips" aria-label="Seções">
            {sections.map((s) => (
              <button key={s.id} className={`chip ${active === s.id ? 'on' : ''}`} onClick={() => refs.current.get(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                <Icon name={s.icon} />
                {s.name}
              </button>
            ))}
          </nav>
          <ProductViewToggle />
        </>
      )}

      {home.data && home.data.promotions.length === 0 && (
        <Empty icon="receipt" title="Ainda não há preços aqui.">
          Escaneie a primeira nota do bairro — cada cupom vira preço para todo mundo.
        </Empty>
      )}

      {sections.map((s) =>
        s.products.length ? (
          <section
            key={s.id}
            id={s.id}
            ref={(el) => {
              if (el) refs.current.set(s.id, el);
            }}
            style={{ scrollMarginTop: 12 }}
          >
            <div className="sec">
              <h2 className="h1 sechead" style={{ fontSize: 22 }}>
                <Icon name={s.icon} />
                {s.name}
              </h2>
              <span className="meta-r">{s.sub}</span>
            </div>
            <div className={`hscroll view-${view} ${view !== 'list' && s.products.length < 5 ? 'one' : ''}`}>
              {s.products.map((p) => (
                <ProductCard key={p.gtin} p={p} onAdd={setAdding} showHighlight={s.hl} view={view} />
              ))}
            </div>
          </section>
        ) : null,
      )}

      {home.data && (
        <p className="foot-note">
          {home.data.stats.products} produtos · {home.data.stats.stores} lojas · {home.data.stats.receipts} notas no índice. Preço de balcão, com loja e data.
        </p>
      )}
      <AddToListSheet product={adding} onClose={() => setAdding(null)} />
    </>
  );
}
