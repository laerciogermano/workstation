import { type EventDetail, REPORT_REASONS } from '@rolego/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, type JSX, type ReactNode, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { ApiError, errorMessage } from '../../lib/http';
import { directionLinks } from '../../lib/directions';
import { dayLabel, distanceLabel, endsIn, endsNextDay, hhmm, money, relativeStart, whenLabel } from '../../lib/format';
import { t } from '../../lib/i18n/pt-BR';
import { keys, useMe, useToggleInterest } from '../../lib/queries';
import { EventCover } from '../../ui/EventCover';
import { EventCardMini, HeartButton } from '../../ui/EventCard';
import { Icon, type IconName } from '../../ui/Icon';
import { Footer, Screen, Sheet, TopBar } from '../../ui/layout';
import { Avatar, AvatarStack, Badge, Button, cx, EmptyState, ErrorState, IconButton, ListRow, Loading, NeonCard, Section, Segmented, Stars, TextArea, TextInput, Title, ui } from '../../ui/primitives';
import { useToast } from '../../ui/toast';
import * as A from './api';
import s from './event.module.css';

export default function EventRoutes({ view }: { view?: 'code' }): JSX.Element {
  if (view === 'code') return <CodePage />;
  return (
    <Routes>
      <Route path="e/:slug" element={<EventPage />} />
      <Route path="e/:slug/quem-vai" element={<PeoplePage />} />
      <Route path="e/:slug/vou" element={<GoingPage />} />
      <Route path="e/:slug/avaliar" element={<ReviewPage />} />
      <Route path="o/:slug" element={<OrganizerPage />} />
      <Route path="*" element={<Navigate to="/explorar" replace />} />
    </Routes>
  );
}

function useEvent() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const code = params.get('c');
  const q = useQuery({ queryKey: [...keys.event(slug), code], queryFn: () => A.bySlug(slug, code), retry: false });
  return { slug, code, ...q };
}

/** Descrição como texto: quebras de linha + links https autolinkados (sem dangerouslySetInnerHTML). */
function RichText({ text }: { text: string }): JSX.Element {
  const parts = text.split(/(https:\/\/[^\s<>"']+)/g);
  return (
    <p className={s.desc}>
      {parts.map((p, i) =>
        /^https:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer nofollow">
            {p}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </p>
  );
}

/** T-20 · Página do evento (+ T-20b ao vivo, T-23 privado, cancelado, lotado). */
function EventPage(): JSX.Element {
  const { slug, code, data: e, isLoading, error, refetch } = useEvent();
  const { data: me } = useMe();
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const toast = useToast();
  const toggle = useToggleInterest();
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const reviewsQ = useQuery({ queryKey: ['event', slug, 'reviews'], queryFn: () => A.reviews(e?.id ?? ''), enabled: !!e && (e.rating?.count ?? 0) > 0 });
  const editionsQ = useQuery({ queryKey: ['event', slug, 'editions'], queryFn: () => A.editions(e?.id ?? ''), enabled: !!e?.seriesId });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: keys.event(slug) });
    void qc.invalidateQueries({ queryKey: keys.discovery });
    void qc.invalidateQueries({ queryKey: keys.myRsvps });
  };
  const rsvpM = useMutation({
    mutationFn: () => A.rsvp(e?.id ?? '', code),
    onSuccess: (r) => {
      refresh();
      if (r.status === 'confirmed' || r.status === 'approved') nav(`/app/e/${slug}/vou`);
      else toast.show('Pedido enviado! Você recebe um e-mail quando o anfitrião aprovar.');
    },
    onError: (err) => {
      toast.error(errorMessage(err));
      if (err instanceof ApiError && err.code === 'EVENT_FULL') refresh();
    },
  });
  const cancelM = useMutation({
    mutationFn: () => A.cancelRsvp(e?.id ?? ''),
    onSuccess: () => {
      setConfirmCancel(false);
      toast.show('Presença cancelada.');
      refresh();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const hereM = useMutation({ mutationFn: () => A.here(e?.id ?? ''), onSuccess: () => { toast.show('Curte o rolê! 🎉'); refresh(); }, onError: (err) => toast.error(errorMessage(err)) });

  if (isLoading) return <Loading />;
  if (error || !e)
    return (
      <Screen>
        <TopBar />
        {error instanceof ApiError && error.code === 'NOT_FOUND' ? (
          <EmptyState icon="lock" title="Rolê não encontrado" hint="O link pode estar errado, ou é um evento privado que precisa de código." action={<Link className={ui.link} to="/codigo">Tenho um código</Link>} />
        ) : (
          <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
        )}
      </Screen>
    );

  const isPrivate = e.visibility === 'private';
  const going = e.viewer.rsvp === 'confirmed' || e.viewer.rsvp === 'approved';
  const pending = e.viewer.rsvp === 'pending';
  const requireLogin = () => nav(`/entrar?next=${encodeURIComponent(loc.pathname + loc.search)}`);
  const canGo = !!e.venue.location && !e.venue.addressLocked;

  let cta: ReactNode;
  if (e.status === 'cancelled') cta = <Button disabled className={ui.disabledLook}>{t.cancelled}</Button>;
  else if (e.phase === 'ended') cta = e.viewer.canReview ? <Button onClick={() => nav(`/app/e/${slug}/avaliar`)}>Avaliar o rolê</Button> : <Button disabled className={ui.disabledLook}>Encerrado</Button>;
  else if (!me) cta = <Button variant={isPrivate ? 'private' : 'primary'} onClick={requireLogin}>{isPrivate ? t.requestJoin : t.confirm}</Button>;
  else if (e.viewer.isOrganizer) cta = <Button variant="secondary" onClick={() => nav(`/organizar/eventos/${e.id}`)}>Gerenciar evento</Button>;
  else if (going && e.phase === 'live') cta = e.viewer.hereAt ? <Button variant="secondary" disabled>Você está aqui ✓</Button> : <Button loading={hereM.isPending} onClick={() => hereM.mutate()}>{t.here}</Button>;
  else if (going) cta = <Button variant="secondary" onClick={() => setConfirmCancel(true)}>{t.goingCancel}</Button>;
  else if (pending) cta = <Button variant="secondary" onClick={() => setConfirmCancel(true)}>{t.requestSent} · cancelar</Button>;
  else if (e.isFull) cta = <Button disabled className={ui.disabledLook}>{t.full}</Button>;
  else cta = <Button variant={isPrivate ? 'private' : 'primary'} loading={rsvpM.isPending} onClick={() => rsvpM.mutate()}>{isPrivate ? t.requestJoin : t.confirm}</Button>;

  return (
    <>
      <Screen flush title={e.title}>
        {e.status === 'cancelled' ? <div className={s.strip}>Cancelado{e.cancelReason ? ` — ${e.cancelReason}` : ''}</div> : null}
        {e.phase === 'live' && e.status === 'published' ? (
          <div className={s.liveStrip}>
            <span className={ui.liveDot} /> Ao vivo agora · {endsIn(e.endsAt)}
          </div>
        ) : null}
        <div className={s.hero}>
          <EventCover coverUrl={e.coverUrl} thumbUrl={e.coverThumbUrl} height="100%" className={s.cover} eager />
          <div className={s.fade} />
          <div className={s.nav}>
            <IconButton glass icon="back" label={t.back} onClick={() => (window.history.length > 1 ? nav(-1) : nav('/explorar'))} />
            <span className={ui.grow} />
            {e.status === 'published' ? <IconButton glass icon="share" label={t.share} onClick={() => setShareOpen(true)} /> : null}
            {me && !e.viewer.isOrganizer ? <IconButton glass icon="more" label={t.report} onClick={() => setReportOpen(true)} /> : null}
          </div>
        </div>
        <div className={s.pad}>
          <div className={cx(ui.row, ui.mb8, ui.wrap)}>
            {isPrivate ? (
              <Badge tone="yellow">
                <Icon name="lock" size="s" /> Evento privado
              </Badge>
            ) : null}
            <Badge tone="cyan">{e.type.label}</Badge>
            {e.ageRating !== 'free' ? <Badge>{t.ageRatings[e.ageRating]}</Badge> : null}
            {e.isFree ? <Badge tone="green">{t.free}</Badge> : null}
            {e.phase === 'upcoming' && e.status === 'published' ? <Badge tone="magenta">{relativeStart(e.startsAt)}</Badge> : null}
            {e.phase === 'live' && e.status === 'published' ? <Badge tone="green" live>{t.live}</Badge> : null}
          </div>
          <h1 className={s.title}>{e.title}</h1>

          <Link to={`/app/o/${e.organizerInfo.slug}`} className={cx(ui.row, ui.mt12)}>
            <Avatar name={e.organizerInfo.name} url={e.organizerInfo.avatarUrl} size="md" />
            <span className={ui.grow}>
              <span className={cx(ui.b, ui.small)} style={{ display: 'block' }}>
                {e.organizerInfo.name}
              </span>
              <span className={cx(ui.xs, ui.muted)}>
                {t.orgKinds[e.organizerInfo.kind]}
                {e.organizerInfo.rating ? (
                  <>
                    {' · '}
                    <span className={ui.yl}>★ {e.organizerInfo.rating.avg.toLocaleString('pt-BR')}</span> ({e.organizerInfo.rating.count})
                  </>
                ) : null}
              </span>
            </span>
            <Icon name="chev" className={ui.muted} />
          </Link>
          <div className={ui.hr} />

          <div className={s.irow}>
            <span className={s.ic} style={isPrivate ? { color: 'var(--rg-yellow)' } : undefined}>
              <Icon name="cal" />
            </span>
            <div>
              <p className={ui.b}>{whenLabel(e.startsAt, e.endsAt)}</p>
              <p className={cx(ui.xs, ui.soft)}>
                {endsNextDay(e.startsAt, e.endsAt) ? 'Termina no dia seguinte · ' : ''}
                {e.status === 'published' ? (
                  <a className={cx(ui.cy, ui.b)} href={`/api/v1/events/${e.id}/calendar.ics`}>
                    Adicionar ao calendário
                  </a>
                ) : null}
              </p>
            </div>
          </div>
          <div className={s.irow}>
            <span className={s.ic} style={isPrivate ? { color: 'var(--rg-yellow)' } : undefined}>
              <Icon name="pin" />
            </span>
            <div className={ui.grow}>
              <p className={ui.b}>
                {e.venue.addressLocked ? e.venue.neighborhood || e.venue.city : e.venue.name}
                {e.distanceKm !== null ? ` · ${distanceLabel(e.distanceKm, e.venue.addressLocked ? 'private' : 'public')}` : ''}
              </p>
              <p className={cx(ui.xs, ui.soft)}>
                {e.venue.addressLocked
                  ? 'Bairro aproximado'
                  : `${[e.venue.street, e.venue.number].filter(Boolean).join(', ')}${e.venue.complement ? ` — ${e.venue.complement}` : ''} — ${e.venue.neighborhood}, ${e.venue.city}`}
              </p>
            </div>
            {canGo ? (
              <button type="button" className={cx(ui.btn, ui.secondary, ui.sm)} onClick={() => setDirectionsOpen(true)}>
                <Icon name="nav" size="s" /> Ir
              </button>
            ) : null}
          </div>
          {e.venue.addressLocked ? (
            <div className={s.lockbox}>
              <Icon name="lock" size="l" className={ui.yl} />
              <div>
                <p className={cx(ui.b, ui.small)}>{t.addressLocked}</p>
                <p className={cx(ui.xs, ui.soft)}>{t.addressLockedHint}</p>
              </div>
            </div>
          ) : null}

          {e.priceItems.length ? (
            <>
              <Section accent="yellow">Valores</Section>
              <div className={s.price}>
                {e.priceItems.map((p, i) => (
                  <span key={i}>
                    {p.label}
                    <b>{p.priceCents === null ? (p.note ?? 'incluso') : p.priceCents === 0 ? t.free : money(p.priceCents)}</b>
                    {p.priceCents !== null && p.note ? <small className={ui.faint}>{p.note}</small> : null}
                  </span>
                ))}
              </div>
              <p className={cx(ui.xs, ui.faint, ui.mt8)}>Valores informativos. A venda não acontece no RoleGo.</p>
            </>
          ) : null}
          {e.externalTicketUrl ? (
            <a className={cx(ui.row, ui.small, ui.cy, ui.b, ui.mt8)} href={e.externalTicketUrl} target="_blank" rel="noopener noreferrer nofollow">
              <Icon name="link" size="s" /> Comprar no site do organizador
            </a>
          ) : null}

          <Section accent="magenta" right={e.counts.going + e.counts.interested > 0 ? <Link to={`/app/e/${slug}/quem-vai`}>ver todos</Link> : undefined}>
            Quem vai
          </Section>
          {e.people.going.length ? (
            <Link to={`/app/e/${slug}/quem-vai`} className={ui.row}>
              <AvatarStack people={e.people.going} extra={e.counts.going - e.people.going.length} />
            </Link>
          ) : null}
          <p className={cx(ui.small, ui.soft, ui.mt8)}>
            <b className={isPrivate ? ui.yl : ui.mg}>
              {e.counts.going} {t.going}
            </b>{' '}
            · {e.counts.interested} {t.interested}
            {e.capacity ? ` · ${e.capacity} vagas` : ''}
          </p>

          {e.description ? (
            <>
              <Section accent="violet">Sobre</Section>
              <RichText text={e.description} />
            </>
          ) : null}

          {e.gallery.length ? (
            <>
              <Section accent="cyan">Fotos</Section>
              <div className={s.thumbs}>
                {e.gallery.map((g) => (
                  <a key={g.id} href={g.url} target="_blank" rel="noopener noreferrer">
                    <img src={g.thumbUrl} alt="" loading="lazy" width={400} height={400} />
                  </a>
                ))}
              </div>
            </>
          ) : null}

          {editionsQ.data && (editionsQ.data.editions.length || editionsQ.data.photos.length) ? (
            <>
              <Section accent="yellow" right={editionsQ.data.editions[0] ? `#${editionsQ.data.editions.length + 1}` : undefined}>
                Edições anteriores
              </Section>
              <div className={s.thumbs}>
                {editionsQ.data.photos.slice(0, 6).map((g) => (
                  <img key={g.id} src={g.thumbUrl} alt="" loading="lazy" width={400} height={400} />
                ))}
              </div>
              {editionsQ.data.editions.map((ed) => (
                <EventCardMini key={ed.id} e={ed} />
              ))}
            </>
          ) : null}

          {e.rating ? (
            <>
              <Section accent="yellow" right={`★ ${e.rating.avg.toLocaleString('pt-BR')} · ${e.rating.count}`}>
                Avaliações
              </Section>
              {reviewsQ.data?.items.slice(0, 5).map((r) => (
                <div key={r.id} className={s.review}>
                  <div className={ui.row}>
                    <Avatar name={r.author.name} url={r.author.photoUrl} />
                    <span className={cx(ui.grow, ui.b, ui.small)}>{r.author.name}</span>
                    <Stars value={r.rating} />
                  </div>
                  {r.comment ? <p className={cx(ui.small, ui.soft, ui.mt8)}>{r.comment}</p> : null}
                </div>
              ))}
            </>
          ) : null}
          <div style={{ height: 24 }} />
        </div>
      </Screen>
      <Footer>
        {me && e.status === 'published' && e.phase !== 'ended' ? (
          <HeartButton
            on={e.viewer.interested}
            size={50}
            title={e.title}
            onToggle={() => {
              if (!me) {
                requireLogin();
                return;
              }
              toggle.mutate({ id: e.id, on: !e.viewer.interested }, { onSettled: refresh });
            }}
          />
        ) : null}
        {cta}
      </Footer>
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} e={e} />
      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} targetId={e.id} />
      <DirectionsSheet
        open={directionsOpen}
        onClose={() => setDirectionsOpen(false)}
        lat={e.venue.location?.lat ?? 0}
        lng={e.venue.location?.lng ?? 0}
        label={e.venue.name}
        address={[e.venue.street, e.venue.number].filter(Boolean).join(', ')}
      />
      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} accent="magenta" label="Cancelar presença">
        <Title accent="magenta">{pending ? 'Cancelar pedido?' : 'Cancelar presença?'}</Title>
        <p className={ui.sub}>{isPrivate && !pending ? 'Se cancelar, vai precisar pedir de novo e esperar aprovação.' : 'Você pode confirmar de novo enquanto houver vaga.'}</p>
        <div className={ui.stack}>
          <Button variant="danger" loading={cancelM.isPending} onClick={() => cancelM.mutate()}>
            Sim, cancelar
          </Button>
          <Button variant="ghost" onClick={() => setConfirmCancel(false)}>
            Manter
          </Button>
        </div>
      </Sheet>
    </>
  );
}

const DIR_ICONS: Record<string, IconName> = { uber: 'nav', '99': 'nav', google: 'pin', apple: 'apple', waze: 'compass' };

/** T-28 · Como chegar: Uber, 99, Google Maps, Apple Mapas, Waze (+ copiar endereço). */
function DirectionsSheet({
  open,
  onClose,
  lat,
  lng,
  label,
  address,
}: {
  open: boolean;
  onClose: () => void;
  lat: number;
  lng: number;
  label: string;
  address: string;
}): JSX.Element {
  const toast = useToast();
  const apps = directionLinks({ lat, lng, label, address });
  const copyAddr = async () => {
    const text = [label, address].filter(Boolean).join(' · ') || `${lat}, ${lng}`;
    await navigator.clipboard.writeText(text);
    toast.show('Endereço copiado');
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} accent="cyan" label="Como chegar">
      <Title accent="cyan">Como chegar</Title>
      <p className={cx(ui.xs, ui.soft, ui.mb8)}>{[label, address].filter(Boolean).join(' · ')}</p>
      <div>
        {apps.map((a) => (
          <ListRow
            key={a.id}
            icon={DIR_ICONS[a.id] ?? 'nav'}
            onClick={() => {
              window.open(a.href, '_blank', 'noopener,noreferrer');
              onClose();
            }}
          >
            {a.name}
          </ListRow>
        ))}
        <ListRow icon="copy" onClick={() => void copyAddr()}>
          Copiar endereço
        </ListRow>
      </div>
    </Sheet>
  );
}

/** T-24 · Compartilhar: Web Share API + WhatsApp + copiar link (com ?s= para contar cliques). */
function ShareSheet({ open, onClose, e }: { open: boolean; onClose: () => void; e: EventDetail }): JSX.Element {
  const toast = useToast();
  const url = (src: string) => `${e.shareUrl}?s=${src}`;
  const text = `${e.title} · ${dayLabel(e.startsAt)} ${hhmm(e.startsAt)} · ${e.visibility === 'private' ? e.venue.neighborhood : e.venue.name}`;
  const native = async () => {
    try {
      await navigator.share({ title: e.title, text, url: url('other') });
      onClose();
    } catch {
      /* cancelado pelo usuário */
    }
  };
  const copy = async () => {
    await navigator.clipboard.writeText(url('copy'));
    toast.show(t.linkCopied);
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} accent="cyan" label={t.share}>
      <Title accent="cyan">Chama a galera</Title>
      <div className={s.og}>
        {e.coverUrl ? <img src={e.coverUrl} alt="" /> : null}
        <div style={{ padding: '8px 12px' }}>
          <p className={cx(ui.b, ui.small)}>{e.title}</p>
          <p className={cx(ui.xs, ui.muted)}>{text.split(' · ').slice(1).join(' · ')}</p>
          <p className={cx(ui.xs, ui.faint)}>rolego.com.br</p>
        </div>
      </div>
      <div className={s.shareGrid}>
        <a className={s.shareIco} href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url('wa')}`)}`} target="_blank" rel="noopener noreferrer" style={{ '--pc': 'var(--rg-green)' } as React.CSSProperties}>
          <i>
            <Icon name="wa" size="l" />
          </i>
          WhatsApp
        </a>
        <button type="button" className={s.shareIco} onClick={() => void copy()} style={{ '--pc': 'var(--rg-cyan)' } as React.CSSProperties}>
          <i>
            <Icon name="copy" size="l" />
          </i>
          {t.copyLink}
        </button>
        {'share' in navigator ? (
          <button type="button" className={s.shareIco} onClick={() => void native()} style={{ '--pc': 'var(--rg-violet)' } as React.CSSProperties}>
            <i>
              <Icon name="share" size="l" />
            </i>
            Mais
          </button>
        ) : null}
      </div>
      {e.visibility === 'private' && e.organizerView?.accessCode ? (
        <NeonCard accent="yellow">
          <p className={cx(ui.xs, ui.muted, ui.textCenter)}>Código do evento privado</p>
          <p className={s.code}>{e.organizerView.accessCode}</p>
        </NeonCard>
      ) : null}
    </Sheet>
  );
}

/** T-27 · Denunciar (uma vez por item; 20/dia). */
function ReportSheet({ open, onClose, targetId, targetType = 'event' }: { open: boolean; onClose: () => void; targetId: string; targetType?: 'event' | 'review' }): JSX.Element {
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number] | null>(null);
  const [note, setNote] = useState('');
  const toast = useToast();
  const m = useMutation({
    mutationFn: () => A.report({ targetType, targetId, reason: reason ?? 'other', ...(note ? { note } : {}) }),
    onSuccess: () => {
      toast.show(t.reportSent);
      onClose();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <Sheet open={open} onClose={onClose} accent="magenta" label={t.report}>
      <Title accent="magenta">Denunciar</Title>
      <p className={ui.sub}>A equipe do RoleGo analisa em até 24 h.</p>
      <div role="radiogroup" aria-label="Motivo">
        {REPORT_REASONS.map((r) => (
          <button key={r} type="button" role="radio" aria-checked={reason === r} className={cx(s.radio, reason === r && s.radioOn)} onClick={() => setReason(r)}>
            {t.reportReasons[r]}
          </button>
        ))}
      </div>
      <TextArea label="Detalhes (opcional)" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      <Button variant="danger" disabled={!reason} loading={m.isPending} onClick={() => m.mutate()}>
        Enviar denúncia
      </Button>
    </Sheet>
  );
}

/** T-21 · Quem vai: só quem deixou a presença visível; o resto entra na contagem. */
function PeoplePage(): JSX.Element {
  const { data: e } = useEvent();
  const [params, setParams] = useSearchParams();
  const kind = params.get('tab') === 'interested' ? 'interested' : 'going';
  const setKind = (v: 'going' | 'interested') => {
    const next = new URLSearchParams(params);
    next.set('tab', v);
    setParams(next, { replace: true });
  };
  const q = useQuery({ queryKey: ['event', e?.slug, 'people', kind], queryFn: () => A.people(e?.id ?? '', kind), enabled: !!e });
  return (
    <Screen title="Quem vai">
      <TopBar title={e?.title ?? 'Quem vai'} />
      <Segmented
        label="Lista"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'going', label: `Vão (${e?.counts.going ?? 0})` },
          { value: 'interested', label: `Interesse (${e?.counts.interested ?? 0})` },
        ]}
      />
      <div className={ui.mt12}>
        {q.data?.items.map((p) => (
          <div key={p.id} className={ui.lrow}>
            <Avatar name={p.name} url={p.photoUrl} size="md" />
            <span className={cx(ui.grow, ui.b)}>{p.name}</span>
          </div>
        ))}
        {q.data && q.data.hiddenCount > 0 ? <p className={cx(ui.small, ui.muted, ui.mt12)}>+{q.data.hiddenCount} com presença privada</p> : null}
        {q.data && !q.data.total ? <EmptyState icon="users" title="Ninguém por aqui ainda" hint="Seja a primeira pessoa!" /> : null}
        {q.isError ? <ErrorState message={errorMessage(q.error)} /> : null}
      </div>
    </Screen>
  );
}

/** T-22 · Você vai! */
function GoingPage(): JSX.Element {
  const { slug, data: e } = useEvent();
  const nav = useNavigate();
  const [share, setShare] = useState(false);
  if (!e) return <Loading />;
  return (
    <Screen foot title="Você vai!">
      <div className={s.celebrate}>
        <div className={s.confetti} aria-hidden />
        <div className={s.bigcheck}>
          <Icon name="check" />
        </div>
        <Title accent="cyan">Você vai!</Title>
        <p className={ui.sub}>
          Presença confirmada em <b>{e.title}</b>.<br />
          {whenLabel(e.startsAt, e.endsAt)} · {e.venue.name}
        </p>
        <p className={cx(ui.small, ui.muted)}>Mandamos os detalhes no seu e-mail.</p>
      </div>
      <div className={cx(ui.stack, ui.mt24)}>
        <a className={cx(ui.btn, ui.secondary)} href={`/api/v1/events/${e.id}/calendar.ics`}>
          <Icon name="cal" size="s" /> Adicionar ao calendário
        </a>
        <Button variant="secondaryMagenta" icon="share" onClick={() => setShare(true)}>
          Chamar a galera
        </Button>
      </div>
      <Footer>
        <Button onClick={() => nav(`/app/e/${slug}`, { replace: true })}>Ver o rolê</Button>
      </Footer>
      <ShareSheet open={share} onClose={() => setShare(false)} e={e} />
    </Screen>
  );
}

/** T-25 · Como foi? (1–5 + comentário opcional; editável dentro da janela de 7 dias). */
function ReviewPage(): JSX.Element {
  const { slug, data: e } = useEvent();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const m = useMutation({
    mutationFn: () => A.putReview(e?.id ?? '', { rating, ...(comment.trim() ? { comment: comment.trim() } : {}) }),
    onSuccess: () => {
      toast.show('Valeu pela avaliação!');
      void qc.invalidateQueries({ queryKey: keys.pendingReviews });
      void qc.invalidateQueries({ queryKey: keys.event(slug) });
      nav(`/app/e/${slug}`, { replace: true });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  if (!e) return <Loading />;
  return (
    <Screen foot title="Como foi?">
      <TopBar />
      <EventCover coverUrl={e.coverUrl} height={160} />
      <Title accent="yellow">Como foi?</Title>
      <p className={ui.sub}>{e.title}</p>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Stars value={rating} onChange={setRating} big />
      </div>
      <TextArea className={ui.mt16} label="Conta mais (opcional)" maxLength={500} value={comment} onChange={(ev) => setComment(ev.target.value)} hint={`${comment.length}/500 · sem links`} />
      <Footer>
        <Button disabled={!rating} loading={m.isPending} onClick={() => m.mutate()}>
          Enviar avaliação
        </Button>
      </Footer>
    </Screen>
  );
}

/** T-26 · Organizador público. */
function OrganizerPage(): JSX.Element {
  const { slug = '' } = useParams();
  const q = useQuery({ queryKey: ['organizer', 'public', slug], queryFn: () => A.organizer(slug) });
  if (q.isLoading) return <Loading />;
  if (!q.data)
    return (
      <Screen>
        <TopBar />
        <ErrorState message={errorMessage(q.error)} />
      </Screen>
    );
  const o = q.data;
  return (
    <Screen title={o.displayName}>
      <TopBar />
      <div className={s.orgHead}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Avatar name={o.displayName} url={o.avatarUrl} size="lg" />
        </div>
        <p className={cx(ui.xb, ui.lg, ui.mt8)}>{o.displayName}</p>
        <p className={cx(ui.small, ui.muted)}>
          {t.orgKinds[o.kind]}
          {o.rating ? (
            <>
              {' · '}
              <span className={ui.yl}>★ {o.rating.avg.toLocaleString('pt-BR')}</span> ({o.rating.count})
            </>
          ) : null}
        </p>
        {o.bio ? <p className={cx(ui.small, ui.soft, ui.mt8)}>{o.bio}</p> : null}
        {o.instagram ? (
          <a className={cx(ui.link, ui.small)} href={`https://instagram.com/${o.instagram}`} target="_blank" rel="noopener noreferrer">
            @{o.instagram}
          </a>
        ) : null}
      </div>
      <Section accent="cyan" right={String(o.upcoming.length)}>
        Próximos
      </Section>
      {o.upcoming.length ? o.upcoming.map((e) => <EventCardMini key={e.id} e={e} rsvp={e.viewer.rsvp} />) : <p className={cx(ui.small, ui.muted)}>Nenhum rolê marcado.</p>}
      {o.past.length ? (
        <>
          <Section accent="yellow">Passados</Section>
          {o.past.map((e) => (
            <EventCardMini key={e.id} e={e} right={e.rating ? <span className={cx(ui.yl, ui.small, ui.b)}>★ {e.rating.avg.toLocaleString('pt-BR')}</span> : undefined} />
          ))}
        </>
      ) : null}
    </Screen>
  );
}

/** "Tenho um código" (evento privado). Limite de 5 tentativas a cada 10 min. */
function CodePage(): JSX.Element {
  const [code, setCode] = useState('');
  const nav = useNavigate();
  const m = useMutation({ mutationFn: () => A.accessCode(code.trim().toUpperCase()), onSuccess: (r) => nav(`/app/e/${r.slug}?c=${encodeURIComponent(code.trim().toUpperCase())}`) });
  return (
    <Screen foot title="Tenho um código">
      <TopBar />
      <Title accent="yellow">Tenho um código</Title>
      <p className={ui.sub}>Digite o código do evento privado que o anfitrião te mandou.</p>
      <TextInput className={s.code} aria-label="Código" maxLength={8} autoCapitalize="characters" autoComplete="off" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} error={m.error ? errorMessage(m.error) : undefined} />
      <Footer>
        <Button variant="private" disabled={code.trim().length < 4} loading={m.isPending} onClick={() => m.mutate()}>
          Abrir evento
        </Button>
      </Footer>
    </Screen>
  );
}
