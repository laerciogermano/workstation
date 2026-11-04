import { DAY_FILTERS, type DayFilter, type EventCard, type Me, RADIUS_MAX_KM, RADIUS_MIN_KM } from '@rolego/contracts';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type JSX, type PointerEvent as RPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router';
import { useLoginGate } from '../../app/guards';
import { api, errorMessage } from '../../lib/http';
import { feedGroup, type FeedGroup, distanceLabel, whenLabel, priceLabel } from '../../lib/format';
import { t } from '../../lib/i18n/pt-BR';
import { keys, setMe, useCities, useEventTypes, useMe, useToggleInterest } from '../../lib/queries';
import { EventCover } from '../../ui/EventCover';
import { EventCardFeed, EventCardMini, eventPath, peoplePath } from '../../ui/EventCard';
import { Icon } from '../../ui/Icon';
import { Screen, Sheet, TabBar, TopBar } from '../../ui/layout';
import { AvatarStack, Badge, Button, Chip, cx, EmptyState, ErrorState, IconButton, NeonCard, RangeSlider, Section, Segmented, Skeleton, Stars, TextInput, Title, Toggle, ui } from '../../ui/primitives';
import { useToast } from '../../ui/toast';
import * as D from './api';
import { type GuestDiscovery, readGuest, writeGuest } from './guestPrefs';
import s from './discovery.module.css';

export default function DiscoveryRoutes(): JSX.Element {
  return (
    <Routes>
      <Route index element={<Explore view="feed" />} />
      <Route path="swipe" element={<Explore view="swipe" />} />
      <Route path="lista" element={<Explore view="list" />} />
      <Route path="busca" element={<Search />} />
      <Route path="onde" element={<Where />} />
      <Route path="*" element={<Navigate to="/explorar" replace />} />
    </Routes>
  );
}

type View = 'feed' | 'swipe' | 'list';
const DAY_LABEL: Record<DayFilter, string> = { today: 'Hoje', tomorrow: 'Amanhã', fri: 'Sex', sat: 'Sáb', sun: 'Dom', weekend: 'Fim de semana' };

function useSavePrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) => api<Me>('/me/preferences', { method: 'PATCH', body }),
    onSuccess: (me) => {
      setMe(qc, me);
      void qc.invalidateQueries({ queryKey: keys.discovery });
    },
  });
}

function useGuestTick() {
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const guest = useMemo(() => readGuest(), [tick]);
  return { guest, bump, tick };
}

function Explore({ view }: { view: View }): JSX.Element {
  const nav = useNavigate();
  const { data: me } = useMe();
  const { guest, bump } = useGuestTick();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const save = useSavePrefs();
  const f = me ? me.preferences.filters : guest.filters;
  const radiusKm = me ? me.preferences.radiusKm : guest.radiusKm;
  const activeCount = (f?.types.length ?? 0) + (f?.days.length ?? 0) + (f?.freeOnly ? 1 : 0);
  const { data: types } = useEventTypes();

  const originLabel = me
    ? me.preferences.originMode === 'override'
      ? me.preferences.overrideCity?.name
      : me.preferences.city?.name
    : guest.originMode === 'override'
      ? guest.cityName
      : guest.originMode === 'gps'
        ? 'Minha localização'
        : guest.cityName ?? 'Curitiba';
  const originSub = me
    ? `${me.preferences.originMode === 'gps' ? 'Minha localização' : me.preferences.originMode === 'override' ? 'Explorando' : 'Centro da cidade'} · ${radiusKm} km`
    : `${guest.originMode === 'gps' ? 'Minha localização' : guest.originMode === 'override' ? 'Explorando' : 'Centro da cidade'} · ${radiusKm} km`;

  const qc = useQueryClient();
  const onRemove = (patch: Partial<GuestDiscovery['filters']>) => {
    if (me) {
      save.mutate({ filters: patch });
      return;
    }
    writeGuest({ filters: { ...guest.filters, ...patch } });
    bump();
    void qc.invalidateQueries({ queryKey: keys.discovery });
  };

  const onWiden = (km: number) => {
    if (me) save.mutate({ radiusKm: km });
    else {
      writeGuest({ radiusKm: km });
      bump();
      void qc.invalidateQueries({ queryKey: keys.discovery });
    }
  };

  return (
    <>
      <Screen tabs={!!me} title={t.tabs.explore}>
        <div className={s.ehead}>
          <button type="button" className={s.locbtn} onClick={() => nav('/explorar/onde')} aria-label="Trocar onde explorar">
            <Icon name="pin" className={ui.cy} />
            <span>
              {originLabel ?? 'Curitiba'} <Icon name="chevd" size="s" />
              <small>{originSub}</small>
            </span>
          </button>
          <span className={ui.grow} />
          {!me ? (
            <Button small variant="secondary" onClick={() => nav('/entrar?next=/explorar')}>
              Entrar
            </Button>
          ) : null}
          <IconButton icon="search" label="Buscar" onClick={() => nav('/explorar/busca')} />
          <IconButton icon="filter" label="Filtros" badge={activeCount} onClick={() => setFiltersOpen(true)} />
        </div>
        {me?.preferences.originMode === 'override' && me.preferences.overrideCity ? (
          <div className={s.override}>
            <span>
              Explorando <b>{me.preferences.overrideCity.name}</b>
            </span>
            <button type="button" className={ui.link} onClick={() => save.mutate({ overrideCityId: null })}>
              Voltar para {me.preferences.city?.name ?? 'minha cidade'}
            </button>
          </div>
        ) : null}
        {!me && guest.originMode === 'override' && guest.cityName ? (
          <div className={s.override}>
            <span>
              Explorando <b>{guest.cityName}</b>
            </span>
            <button
              type="button"
              className={ui.link}
              onClick={() => {
                writeGuest({ originMode: 'city', cityId: undefined, cityName: undefined, cityUf: undefined });
                bump();
                void qc.invalidateQueries({ queryKey: keys.discovery });
              }}
            >
              Voltar ao padrão
            </button>
          </div>
        ) : null}
        <Segmented
          label="Modo de visualização"
          value={view}
          onChange={(v) => nav(v === 'feed' ? '/explorar' : v === 'swipe' ? '/explorar/swipe' : '/explorar/lista')}
          options={[
            { value: 'feed', label: t.views.feed, icon: 'feed' },
            { value: 'swipe', label: t.views.swipe, icon: 'cards' },
            { value: 'list', label: t.views.list, icon: 'list' },
          ]}
        />
        {activeCount ? (
          <div className={cx(ui.hscroll, ui.mt12)}>
            {f?.types.map((slug) => (
              <Chip key={slug} small on removable onClick={() => onRemove({ types: f.types.filter((x) => x !== slug) })}>
                {types?.find((x) => x.slug === slug)?.label ?? slug}
              </Chip>
            ))}
            {f?.days.map((d) => (
              <Chip key={d} small on removable onClick={() => onRemove({ days: f.days.filter((x) => x !== d) })}>
                {DAY_LABEL[d]}
              </Chip>
            ))}
            {f?.freeOnly ? (
              <Chip small on removable onClick={() => onRemove({ freeOnly: false })}>
                {t.free}
              </Chip>
            ) : null}
          </div>
        ) : null}
        {view === 'feed' ? <Feed onWiden={onWiden} radiusKm={radiusKm} guest={me ? null : guest} guestKey={me ? 'me' : JSON.stringify(guest)} /> : null}
        {view === 'swipe' ? <SwipeDeck guest={me ? null : guest} guestKey={me ? 'me' : JSON.stringify(guest)} /> : null}
        {view === 'list' ? <ListView guest={me ? null : guest} guestKey={me ? 'me' : JSON.stringify(guest)} /> : null}
      </Screen>
      <FiltersSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} guest={guest} onGuestChange={bump} />
      <TabBar />
    </>
  );
}

const nextRadius = (km: number) => Math.min(RADIUS_MAX_KM, km < 10 ? 10 : km < 25 ? 25 : km < 50 ? 50 : 100);

/** T-10 · Feed agrupado (Hoje / Amanhã / Este fim de semana / Próximos), ♥ otimista. */
function Feed({
  onWiden,
  radiusKm,
  guest,
  guestKey,
}: {
  onWiden: (km: number) => void;
  radiusKm: number;
  guest: GuestDiscovery | null;
  guestKey: string;
}): JSX.Element {
  const gate = useLoginGate();
  const q = useInfiniteQuery({
    queryKey: [...keys.discovery, 'feed', guestKey],
    queryFn: ({ pageParam }) => D.feed(pageParam, guest),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
  });
  const toggle = useToggleInterest();
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  const groups = useMemo(() => {
    const g: Record<FeedGroup, EventCard[]> = { today: [], tomorrow: [], weekend: [], next: [] };
    const now = new Date();
    for (const e of items) g[feedGroup(e.startsAt, e.endsAt, now)].push(e);
    return g;
  }, [items]);
  const sentinel = useInfiniteScroll(() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage());

  return (
    <>
      {gate.me ? <PendingReviewCard /> : null}
      {q.isLoading ? (
        <div className={ui.mt16}>
          <Skeleton height={190} />
          <Skeleton height={190} className={ui.mt16} />
        </div>
      ) : null}
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} /> : null}
      {q.isSuccess && !items.length ? (
        <EmptyState
          icon="compass"
          title={t.emptyFeedTitle(radiusKm)}
          hint={t.emptyFeedHint}
          action={
            radiusKm < RADIUS_MAX_KM ? (
              <Button variant="secondary" small onClick={() => onWiden(nextRadius(radiusKm))}>
                {t.widen(nextRadius(radiusKm))}
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {(['today', 'tomorrow', 'weekend', 'next'] as const).map((k) =>
        groups[k].length ? (
          <section key={k}>
            <Section accent={k === 'today' ? 'green' : k === 'tomorrow' ? 'cyan' : 'magenta'} right={`${groups[k].length} rolê${groups[k].length > 1 ? 's' : ''}`}>
              {t.groups[k]}
            </Section>
            {groups[k].map((e, i) => (
              <EventCardFeed
                key={e.id}
                e={e}
                eager={k === 'today' && i < 2}
                onToggleInterest={(on) => {
                  if (!gate.me) {
                    gate.requireLogin();
                    return;
                  }
                  toggle.mutate({ id: e.id, on });
                }}
              />
            ))}
          </section>
        ) : null,
      )}
      <div ref={sentinel} />
      {q.isFetchingNextPage ? <Skeleton height={120} /> : null}
    </>
  );
}

function useInfiniteScroll(onHit: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onHit);
  cb.current = onHit;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => es.some((x) => x.isIntersecting) && cb.current(), { rootMargin: '400px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/** Card "Como foi?" no topo do feed (US-03.10). */
function PendingReviewCard(): JSX.Element | null {
  const nav = useNavigate();
  const { data } = useQuery({ queryKey: keys.pendingReviews, queryFn: () => api<EventCard[]>('/me/reviews/pending') });
  const e = data?.[0];
  if (!e) return null;
  return (
    <NeonCard accent="yellow" className={cx(s.review, ui.mt12)} onClick={() => nav(`${eventPath(e)}/avaliar`)}>
      <span className={ui.row} style={{ width: '100%' }}>
        <EventCover coverUrl={e.coverThumbUrl} height={54} className={s.thumb} />
        <span className={ui.grow}>
          <span className={cx(ui.b, ui.small)} style={{ display: 'block' }}>
            {t.howWasIt(e.title)}
          </span>
          <Stars value={0} />
        </span>
        <Icon name="chev" className={ui.yl} />
      </span>
    </NeonCard>
  );
}

/** T-11 · Swipe: direita/♥ = interesse, esquerda/✕ = passar, ↺ desfaz. Botões e teclado como alternativa (a11y). */
function SwipeDeck({ guest, guestKey }: { guest: GuestDiscovery | null; guestKey: string }): JSX.Element {
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const gate = useLoginGate();
  const [deck, setDeck] = useState<EventCard[]>([]);
  const [history, setHistory] = useState<{ e: EventCard; action: 'like' | 'pass' }[]>([]);
  const [drag, setDrag] = useState({ x: 0, active: false });
  const start = useRef<{ x: number; y: number } | null>(null);
  const seen = useRef(new Set<string>());
  const q = useQuery({ queryKey: [...keys.discovery, 'swipe', guestKey], queryFn: () => D.swipe(guest), staleTime: 0 });

  useEffect(() => {
    seen.current = new Set();
    setDeck([]);
    setHistory([]);
  }, [guestKey]);

  useEffect(() => {
    if (!q.data) return;
    const fresh = q.data.filter((e) => !seen.current.has(e.id));
    fresh.forEach((e) => seen.current.add(e.id));
    if (fresh.length) setDeck((d) => [...d, ...fresh]);
  }, [q.data]);

  useEffect(() => {
    if (deck.length <= 3 && q.isSuccess && !q.isFetching) void q.refetch();
  }, [deck.length, q]);

  const act = useCallback(
    async (action: 'like' | 'pass') => {
      const top = deck[0];
      if (!top) return;
      if (!gate.me) {
        gate.requireLogin();
        return;
      }
      setDeck((d) => d.slice(1));
      setHistory((h) => [...h.slice(-9), { e: top, action }]);
      setDrag({ x: 0, active: false });
      try {
        if (action === 'like') await D.setInterest(top.id, true);
        else await D.setPass(top.id, true);
        void qc.invalidateQueries({ queryKey: [...keys.discovery, 'feed'] });
      } catch (e) {
        toast.error(errorMessage(e));
      }
    },
    [deck, qc, toast, gate],
  );

  const undo = useCallback(async () => {
    const last = history[history.length - 1];
    if (!last) return;
    if (!gate.me) {
      gate.requireLogin();
      return;
    }
    setHistory((h) => h.slice(0, -1));
    setDeck((d) => [last.e, ...d]);
    try {
      if (last.action === 'like') await D.setInterest(last.e.id, false);
      else await D.setPass(last.e.id, false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }, [history, toast, gate]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      if (ev.key === 'ArrowRight') void act('like');
      else if (ev.key === 'ArrowLeft') void act('pass');
      else if (ev.key === 'Enter' && deck[0]) nav(eventPath(deck[0]));
      else if (ev.key === 'Backspace' || (ev.key === 'z' && (ev.metaKey || ev.ctrlKey))) void undo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [act, undo, deck, nav]);

  const onDown = (ev: RPointerEvent) => {
    start.current = { x: ev.clientX, y: ev.clientY };
    (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);
    setDrag({ x: 0, active: true });
  };
  const onMove = (ev: RPointerEvent) => start.current && setDrag({ x: ev.clientX - start.current.x, active: true });
  const onUp = () => {
    const dx = drag.x;
    const moved = Math.abs(dx) > 8;
    start.current = null;
    if (dx > 110) void act('like');
    else if (dx < -110) void act('pass');
    else {
      setDrag({ x: 0, active: false });
      if (!moved && deck[0]) nav(eventPath(deck[0]));
    }
  };

  if (q.isLoading) return <Skeleton height={420} className={ui.mt12} />;
  if (q.isError) return <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />;
  const [top, second, third] = deck;
  return (
    <>
      <div className={s.deck}>
        {!top ? (
          <EmptyState icon="cards" title="Você viu tudo por aqui" hint="Amplie o raio ou troque os filtros para ver mais rolês." action={<Button variant="secondary" small onClick={() => nav('/explorar')}>Ver o feed</Button>} />
        ) : null}
        {third ? <SwipeCard e={third} className={s.back2} /> : null}
        {second ? <SwipeCard e={second} className={s.back1} /> : null}
        {top ? (
          <SwipeCard
            e={top}
            style={{ transform: `translateX(${drag.x}px) rotate(${drag.x / 18}deg)`, transition: drag.active ? 'none' : 'transform .25s' }}
            stamp={drag.x > 40 ? 'yes' : drag.x < -40 ? 'no' : null}
            handlers={{ onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: onUp }}
          />
        ) : null}
      </div>
      <div className={s.sactions}>
        <button type="button" className={cx(s.round, s.roundX)} aria-label="Passar (←)" onClick={() => void act('pass')} disabled={!top}>
          <Icon name="x" size="xl" />
        </button>
        <button type="button" className={cx(s.round, s.roundU)} aria-label="Desfazer" onClick={() => void undo()} disabled={!history.length}>
          <Icon name="undo" />
        </button>
        <button type="button" className={cx(s.round, s.roundH)} aria-label="Tenho interesse (→)" onClick={() => void act('like')} disabled={!top}>
          <Icon name="heart" size="xl" />
        </button>
      </div>
    </>
  );
}

function SwipeCard({ e, className, style, stamp, handlers }: { e: EventCard; className?: string; style?: React.CSSProperties; stamp?: 'yes' | 'no' | null; handlers?: Record<string, (ev: RPointerEvent) => void> }): JSX.Element {
  const nav = useNavigate();
  const price = priceLabel(e);
  const openPeople = (tab: 'going' | 'interested') => (ev: React.MouseEvent | RPointerEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    nav(peoplePath(e, tab));
  };
  return (
    <article className={cx(s.scard, className)} style={style} aria-label={e.title} {...handlers}>
      <EventCover coverUrl={e.coverUrl} thumbUrl={e.coverThumbUrl} height="100%" className={s.cover} eager />
      <div className={s.shade} />
      {stamp === 'yes' ? <div className={cx(s.stamp, s.stampYes)}>BORA!</div> : null}
      {stamp === 'no' ? <div className={cx(s.stamp, s.stampNo)}>PASSO</div> : null}
      <div className={s.stxt}>
        <div className={cx(ui.row, ui.mb8, ui.wrap)}>
          <Badge tone="cyan">{e.type.label}</Badge>
          {price ? <Badge tone="neutral">{e.isFree ? t.free : price.replace('a partir de ', '')}</Badge> : null}
          {e.ageRating !== 'free' ? <Badge tone="neutral">{t.ageRatings[e.ageRating]}</Badge> : null}
          {e.visibility === 'private' ? <Badge tone="yellow">{t.private}</Badge> : null}
        </div>
        <p className={s.stitle}>{e.title}</p>
        <p className={cx(ui.small, ui.soft, ui.mt4)}>
          {whenLabel(e.startsAt, e.endsAt)} · {e.visibility === 'private' ? e.venue.neighborhood : e.venue.name}
          {e.distanceKm !== null ? ` · ${distanceLabel(e.distanceKm, e.visibility)}` : ''}
        </p>
        <div className={cx(ui.row, ui.mt8, ui.wrap)} style={{ gap: 10 }}>
          {e.peoplePreview.length ? (
            <button type="button" className={ui.row} style={{ gap: 6, background: 'none', border: 0, padding: 0, color: 'inherit' }} aria-label={`Quem vai em ${e.title}`} onClick={openPeople('going')} onPointerDown={(ev) => ev.stopPropagation()}>
              <AvatarStack people={e.peoplePreview} />
            </button>
          ) : null}
          <span className={ui.small}>
            <button type="button" className={ui.mg} style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontWeight: 700, cursor: 'pointer' }} aria-label={`${e.counts.going} ${t.going}`} onClick={openPeople('going')} onPointerDown={(ev) => ev.stopPropagation()}>
              {e.counts.going} {t.going}
            </button>
            {' · '}
            <button type="button" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer' }} aria-label={`${e.counts.interested} com interesse`} onClick={openPeople('interested')} onPointerDown={(ev) => ev.stopPropagation()}>
              {e.counts.interested} com interesse
            </button>
          </span>
        </div>
      </div>
    </article>
  );
}

/** T-12 · Lista compacta, ordenável. */
function ListView({ guest, guestKey }: { guest: GuestDiscovery | null; guestKey: string }): JSX.Element {
  const [sort, setSort] = useState<'soonest' | 'nearest'>('soonest');
  const q = useInfiniteQuery({
    queryKey: [...keys.discovery, 'list', sort, guestKey],
    queryFn: ({ pageParam }) => D.list(sort, pageParam, guest),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => p.nextCursor ?? undefined,
  });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const sentinel = useInfiniteScroll(() => q.hasNextPage && !q.isFetchingNextPage && void q.fetchNextPage());
  return (
    <>
      <div className={cx(ui.row, ui.mt12)}>
        <span className={cx(ui.small, ui.muted)}>Ordenar:</span>
        <Chip small on={sort === 'soonest'} onClick={() => setSort('soonest')}>
          Mais cedo
        </Chip>
        <Chip small on={sort === 'nearest'} onClick={() => setSort('nearest')}>
          Mais perto
        </Chip>
      </div>
      {q.isLoading ? <Skeleton height={300} className={ui.mt12} /> : null}
      {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} /> : null}
      {q.isSuccess && !items.length ? <EmptyState title="Nenhum rolê com esses filtros" hint={t.emptyFeedHint} /> : null}
      <div className={ui.mt8}>
        {items.map((e) => (
          <EventCardMini key={e.id} e={e} rsvp={e.viewer.rsvp} />
        ))}
      </div>
      <div ref={sentinel} />
    </>
  );
}

/** T-13 · Filtros: tipo (multi), quando, distância e grátis; contagem ao vivo; salvos no perfil. */
function FiltersSheet({
  open,
  onClose,
  guest,
  onGuestChange,
}: {
  open: boolean;
  onClose: () => void;
  guest: GuestDiscovery;
  onGuestChange: () => void;
}): JSX.Element | null {
  const { data: me } = useMe();
  const { data: types } = useEventTypes();
  const save = useSavePrefs();
  const qc = useQueryClient();
  const toast = useToast();
  const [f, setF] = useState({ types: [] as string[], days: [] as DayFilter[], freeOnly: false, radiusKm: 20 });
  useEffect(() => {
    if (!open) return;
    if (me) setF({ types: me.preferences.filters.types, days: me.preferences.filters.days, freeOnly: me.preferences.filters.freeOnly, radiusKm: me.preferences.radiusKm });
    else setF({ types: guest.filters.types, days: guest.filters.days, freeOnly: guest.filters.freeOnly, radiusKm: guest.radiusKm });
  }, [open, me, guest]);
  const [debounced, setDebounced] = useState(f);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(f), 300);
    return () => clearTimeout(h);
  }, [f]);
  const count = useQuery({
    queryKey: [...keys.discovery, 'count', debounced, me ? 'me' : guest.cityId, guest.lat, guest.lng],
    queryFn: () =>
      D.count({
        ...debounced,
        cityId: !me && guest.originMode === 'override' ? guest.cityId : undefined,
        lat: !me && guest.originMode === 'gps' ? guest.lat : undefined,
        lng: !me && guest.originMode === 'gps' ? guest.lng : undefined,
      }),
    enabled: open,
  });
  const toggle = <T extends string>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const apply = () => {
    if (me) {
      save.mutate(
        { filters: { types: f.types, days: f.days, freeOnly: f.freeOnly }, radiusKm: f.radiusKm },
        { onSuccess: onClose, onError: (e) => toast.error(errorMessage(e)) },
      );
      return;
    }
    writeGuest({ filters: { types: f.types, days: f.days, freeOnly: f.freeOnly }, radiusKm: f.radiusKm });
    onGuestChange();
    void qc.invalidateQueries({ queryKey: keys.discovery });
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} label="Filtros">
      <div className={cx(ui.row, ui.between)}>
        <Title>Filtros</Title>
        <button type="button" className={ui.link} onClick={() => setF({ types: [], days: [], freeOnly: false, radiusKm: f.radiusKm })}>
          Limpar
        </button>
      </div>
      <Section accent="violet">Tipo</Section>
      <div className={ui.chips}>
        {types?.map((ty) => (
          <Chip key={ty.slug} small on={f.types.includes(ty.slug)} onClick={() => setF({ ...f, types: toggle(f.types, ty.slug) })}>
            {ty.label}
          </Chip>
        ))}
      </div>
      <Section accent="cyan">Quando</Section>
      <div className={ui.chips}>
        {DAY_FILTERS.map((d) => (
          <Chip key={d} small on={f.days.includes(d)} onClick={() => setF({ ...f, days: toggle(f.days, d) })}>
            {DAY_LABEL[d]}
          </Chip>
        ))}
      </div>
      <Section accent="magenta" right={`${f.radiusKm} km`}>
        Distância
      </Section>
      <RangeSlider label="Raio" value={f.radiusKm} min={RADIUS_MIN_KM} max={RADIUS_MAX_KM} onChange={(v) => setF({ ...f, radiusKm: v })} scale={['1 km', '50', '100 km']} />
      <div className={cx(ui.row, ui.between, ui.mt16)}>
        <span className={ui.b}>Só gratuitos</span>
        <Toggle label="Só gratuitos" checked={f.freeOnly} onChange={(v) => setF({ ...f, freeOnly: v })} />
      </div>
      <Button className={ui.mt24} loading={save.isPending} onClick={apply}>
        {count.data ? `Ver ${count.data.total} rolê${count.data.total === 1 ? '' : 's'}` : 'Aplicar'}
      </Button>
    </Sheet>
  );
}

/** T-14 · Explorar onde? (override → gps → cidade base, resolvido no servidor). */
function Where(): JSX.Element {
  const { data: me } = useMe();
  const nav = useNavigate();
  const toast = useToast();
  const save = useSavePrefs();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const { data: cities } = useCities(q);
  const guest = readGuest();
  const done = { onSuccess: () => nav('/explorar'), onError: (e: unknown) => toast.error(errorMessage(e)) };
  const guestDone = () => {
    void qc.invalidateQueries({ queryKey: keys.discovery });
    nav('/explorar');
  };
  const useGps = () => {
    if (!('geolocation' in navigator)) return toast.error('Seu navegador não oferece localização.');
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (me) {
          save.mutate({ originMode: 'gps', overrideCityId: null, location: { lat: p.coords.latitude, lng: p.coords.longitude } }, done);
          return;
        }
        writeGuest({ originMode: 'gps', lat: p.coords.latitude, lng: p.coords.longitude, cityId: undefined, cityName: undefined });
        guestDone();
      },
      () => toast.error('Não conseguimos sua localização. Verifique a permissão do navegador.'),
      { timeout: 10_000 },
    );
  };
  return (
    <Screen title="Explorar onde?">
      <TopBar title="Explorar onde?" />
      <p className={ui.sub}>Está viajando? Escolha outra cidade sem mudar sua cidade base.</p>
      <button type="button" className={ui.lrow} onClick={useGps}>
        <span className={ui.lrowIco}>
          <Icon name="nav" className={ui.cy} />
        </span>
        <span className={ui.grow}>
          <b>Minha localização atual</b>
          {(me?.preferences.originMode === 'gps' || (!me && guest.originMode === 'gps')) ? (
            <span className={cx(ui.xs, ui.cy)} style={{ display: 'block' }}>
              em uso
            </span>
          ) : null}
        </span>
      </button>
      {me?.preferences.city ? (
        <button type="button" className={ui.lrow} onClick={() => save.mutate({ originMode: 'city', overrideCityId: null }, done)}>
          <span className={ui.lrowIco}>
            <Icon name="home" />
          </span>
          <span className={ui.grow}>
            <b>{me.preferences.city.name}</b> <span className={ui.muted}>· cidade base</span>
          </span>
        </button>
      ) : null}
      {!me ? (
        <button
          type="button"
          className={ui.lrow}
          onClick={() => {
            writeGuest({ originMode: 'city', cityId: undefined, cityName: undefined, lat: undefined, lng: undefined });
            guestDone();
          }}
        >
          <span className={ui.lrowIco}>
            <Icon name="home" />
          </span>
          <span className={ui.grow}>
            <b>Cidade padrão</b> <span className={ui.muted}>· Curitiba</span>
          </span>
        </button>
      ) : null}
      <div className={ui.mt16} />
      <TextInput placeholder="Buscar cidade" aria-label="Buscar cidade" value={q} onChange={(e) => setQ(e.target.value)} />
      {cities
        ?.filter((c) => c.id !== me?.preferences.city?.id)
        .map((c) => (
          <button
            key={c.id}
            type="button"
            className={ui.lrow}
            onClick={() => {
              if (me) {
                save.mutate({ originMode: 'override', overrideCityId: c.id }, done);
                return;
              }
              writeGuest({ originMode: 'override', cityId: c.id, cityName: c.name, cityUf: c.uf, lat: undefined, lng: undefined });
              guestDone();
            }}
          >
            <span className={ui.lrowIco}>
              <Icon name="pin" />
            </span>
            <span className={ui.grow}>
              <b>{c.name}</b> <span className={ui.muted}>{c.uf}</span>
            </span>
            {c.launchStatus === 'soon' ? <Badge>em breve</Badge> : null}
          </button>
        ))}
    </Screen>
  );
}

/** T-15 · Busca sem acento por título ou local; raio por padrão, "Toda a cidade" amplia. */
function Search(): JSX.Element {
  const { data: me } = useMe();
  const guest = me ? null : readGuest();
  const guestKey = me ? 'me' : JSON.stringify(guest);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(q.trim()), 300);
    return () => clearTimeout(h);
  }, [q]);
  const r = useQuery({
    queryKey: [...keys.discovery, 'search', debounced, wide, guestKey],
    queryFn: () => D.search(debounced, wide ? 'city' : 'radius', undefined, guest),
    enabled: debounced.length >= 2,
  });
  return (
    <Screen title="Buscar">
      <TopBar title="Buscar" />
      <TextInput autoFocus type="text" inputMode="search" enterKeyHint="search" placeholder="Nome do rolê ou do local" aria-label="Buscar rolês" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className={cx(ui.row, ui.between)}>
        <span className={cx(ui.small, ui.soft)}>Toda a cidade</span>
        <Toggle label="Buscar em toda a cidade" checked={wide} onChange={setWide} />
      </div>
      {r.isFetching ? <Skeleton height={120} className={ui.mt12} /> : null}
      {r.isSuccess && !r.data.items.length ? <EmptyState icon="search" title="Nada encontrado" hint={wide ? 'Tente outro termo.' : 'Tente buscar em toda a cidade.'} /> : null}
      <div className={ui.mt8}>
        {r.data?.items.map((e) => (
          <EventCardMini key={e.id} e={e} rsvp={e.viewer.rsvp} />
        ))}
      </div>
      {debounced.length < 2 ? (
        <p className={cx(ui.small, ui.faint, ui.mt16, ui.textCenter)}>
          Digite pelo menos 2 letras. <Link className={ui.link} to="/explorar">Voltar ao feed</Link>
        </p>
      ) : null}
    </Screen>
  );
}
