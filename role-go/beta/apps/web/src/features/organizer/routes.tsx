import {
  type EventDetail,
  type EventPatchInput,
  type Guest,
  MAX_GALLERY,
  MAX_PRICE_ITEMS,
  type Me,
  OrganizerInput,
  type OrganizerEventCard,
  type OrganizerKind,
  type Page,
  type PriceItem,
  type PublishCheck,
  type PublishField,
  type VenuePreview,
} from '@rolego/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type JSX, type ReactNode, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router';
import { api, ApiError, errorMessage, qs } from '../../lib/http';
import { endsNextDay, fromLocalInput, toLocalInput, whenLabel } from '../../lib/format';
import { t } from '../../lib/i18n/pt-BR';
import { keys, setMe, useEventTypes, useMe } from '../../lib/queries';
import { EventCover } from '../../ui/EventCover';
import { EventCardFeed, eventPath } from '../../ui/EventCard';
import { Icon, type IconName } from '../../ui/Icon';
import { ImageCropDialog } from '../../ui/ImageCrop';
import { Footer, Screen, Sheet, TabBar, TopBar } from '../../ui/layout';
import { Avatar, Badge, Button, Chip, cx, EmptyState, ErrorState, IconButton, Loading, NeonCard, ProgressSteps, Section, Segmented, Skeleton, TextArea, TextInput, Title, Toggle, ui } from '../../ui/primitives';
import { useToast } from '../../ui/toast';
import s from './organizer.module.css';

export default function OrganizerRoutes(): JSX.Element {
  const { data: me } = useMe();
  if (!me) return <Loading />;
  return (
    <Routes>
      <Route path="ativar" element={me.organizer ? <Navigate to="/organizar" replace /> : <Activate />} />
      <Route index element={me.organizer ? <MyEvents /> : <Navigate to="/organizar/ativar" replace />} />
      <Route path="novo" element={<Wizard />} />
      <Route path="eventos/:id" element={<Manage />} />
      <Route path="eventos/:id/editar/:step" element={<Wizard />} />
      <Route path="eventos/:id/convidados" element={<Guests />} />
      <Route path="eventos/:id/galeria" element={<Gallery />} />
      <Route path="*" element={<Navigate to="/organizar" replace />} />
    </Routes>
  );
}

const KIND_ICON: Record<OrganizerKind, IconName> = { person: 'user', bar: 'glass', venue: 'home', producer: 'music' };

/** T-40 · Ativar modo organizador. */
function Activate(): JSX.Element {
  const qc = useQueryClient();
  const nav = useNavigate();
  const [f, setF] = useState<{ displayName: string; kind: OrganizerKind; bio: string; instagram: string }>({ displayName: '', kind: 'person', bio: '', instagram: '' });
  const m = useMutation({
    mutationFn: () => api('/organizer', { method: 'POST', body: OrganizerInput.parse({ displayName: f.displayName, kind: f.kind, ...(f.bio ? { bio: f.bio } : {}), ...(f.instagram ? { instagram: f.instagram } : {}) }) }),
    onSuccess: async () => {
      setMe(qc, await api<Me>('/me'));
      nav('/organizar/novo');
    },
  });
  return (
    <>
      <Screen foot title="Modo organizador">
        <TopBar />
        <Title accent="cyan">Publique seus rolês</Title>
        <p className={ui.sub}>Anfitriões, bares, casas e produtores. Sem custo no beta.</p>
        <TextInput label="Nome público" placeholder="Ex.: Bar da Esquina" value={f.displayName} maxLength={60} onChange={(e) => setF({ ...f, displayName: e.target.value })} />
        <p className={ui.label}>Você é</p>
        <div className={ui.grid2}>
          {(Object.keys(t.orgKinds) as OrganizerKind[]).map((k) => (
            <button key={k} type="button" className={cx(ui.tile, f.kind === k && ui.tileOn)} aria-pressed={f.kind === k} onClick={() => setF({ ...f, kind: k })}>
              <Icon name={KIND_ICON[k]} size="l" />
              {t.orgKinds[k]}
            </button>
          ))}
        </div>
        {f.kind === 'person' ? <p className={cx(ui.xs, ui.faint, ui.mt8)}>Pessoa física começa com eventos privados por padrão (endereço só para aprovados).</p> : null}
        <div className={ui.mt16} />
        <TextArea label="Bio (opcional)" maxLength={300} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} />
        <TextInput label="Instagram (opcional)" placeholder="@seuperfil" value={f.instagram} onChange={(e) => setF({ ...f, instagram: e.target.value })} error={m.error ? errorMessage(m.error) : undefined} />
      </Screen>
      <Footer>
        <Button disabled={f.displayName.trim().length < 2} loading={m.isPending} onClick={() => m.mutate()}>
          Ativar e criar meu primeiro rolê
        </Button>
      </Footer>
    </>
  );
}

/** T-46 · Organizar · Meus eventos. */
function MyEvents(): JSX.Element {
  const nav = useNavigate();
  const { data: me } = useMe();
  const [tab, setTab] = useState<'upcoming' | 'drafts' | 'past'>('upcoming');
  const q = useQuery({ queryKey: [...keys.organizer, 'events', tab], queryFn: () => api<Page<OrganizerEventCard>>(`/organizer/events${qs({ tab })}`) });
  return (
    <>
      <Screen tabs title={t.tabs.organize}>
        <header className={ui.top}>
          <span className={cx(ui.grow)}>
            <span className={cx(ui.xb, ui.it, ui.up, ui.lg)} style={{ display: 'block' }}>
              Organizar
            </span>
            <span className={cx(ui.xs, ui.muted)}>{me?.organizer?.displayName}</span>
          </span>
          <Button small icon="plus" onClick={() => nav('/organizar/novo')}>
            Novo rolê
          </Button>
        </header>
        <Segmented
          label="Eventos"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: 'Próximos' },
            { value: 'drafts', label: 'Rascunhos' },
            { value: 'past', label: 'Passados' },
          ]}
        />
        {q.isLoading ? <Skeleton height={200} className={ui.mt16} /> : null}
        {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} /> : null}
        {q.isSuccess && !q.data.items.length ? (
          <EmptyState icon="grid" title={tab === 'drafts' ? 'Nenhum rascunho' : tab === 'past' ? 'Nenhum rolê passado' : 'Nenhum rolê publicado'} action={<Button small variant="secondary" onClick={() => nav('/organizar/novo')}>Criar rolê</Button>} />
        ) : null}
        <div className={ui.mt12}>
          {q.data?.items.map((e) => (
            <ManageCard key={e.id} e={e} />
          ))}
        </div>
      </Screen>
      <TabBar />
    </>
  );
}

function ManageCard({ e }: { e: OrganizerEventCard }): JSX.Element {
  const nav = useNavigate();
  return (
    <button type="button" className={s.mcard} onClick={() => nav(`/organizar/eventos/${e.id}`)}>
      <div className={s.top2}>
        <EventCover coverUrl={e.coverThumbUrl} height={74} className={s.thumb} />
        <div className={ui.grow}>
          <p className={cx(ui.b, ui.ell)}>{e.title}</p>
          <p className={cx(ui.xs, ui.soft)}>{e.scheduled ? whenLabel(e.startsAt, e.endsAt) : 'Sem data'}</p>
          <div className={cx(ui.row, ui.mt4, ui.wrap)}>
            {e.status === 'draft' ? <Badge tone="neutral">Rascunho</Badge> : null}
            {e.status === 'cancelled' ? <Badge tone="magenta">Cancelado</Badge> : null}
            {e.status === 'published' && e.phase === 'live' ? <Badge tone="green" live>Ao vivo</Badge> : null}
            {e.visibility === 'private' ? <Badge tone="yellow">Privado</Badge> : null}
            {e.metrics.pending ? <Badge tone="yellow">{e.metrics.pending} pedidos</Badge> : null}
          </div>
        </div>
        <Icon name="chev" className={ui.muted} />
      </div>
      {e.status !== 'draft' ? (
        <div className={s.metrics}>
          <div>
            <b>{e.metrics.interested}</b>interesse
          </div>
          <div>
            <b>{e.metrics.going}</b>vão
          </div>
          <div>
            <b>{e.metrics.pending}</b>pedidos
          </div>
          <div>
            <b>{e.metrics.views}</b>visitas
          </div>
        </div>
      ) : null}
    </button>
  );
}

function useOwnedEvent(id: string | undefined) {
  return useQuery({ queryKey: ['organizer', 'event', id], queryFn: () => api<EventDetail>(`/events/${id}`), enabled: !!id });
}

/** Gestão de um evento: métricas e ações (editar, convidados, galeria, compartilhar, nova edição, cancelar). */
function Manage(): JSX.Element {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const q = useOwnedEvent(id);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['organizer'] });
    void qc.invalidateQueries({ queryKey: keys.discovery });
  };
  const cancel = useMutation({
    mutationFn: () => api<EventDetail>(`/events/${id}/cancel`, { method: 'POST', body: { reason } }),
    onSuccess: () => {
      setCancelOpen(false);
      toast.show('Evento cancelado. Os confirmados vão receber um e-mail.');
      invalidate();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const edition = useMutation({
    mutationFn: () => api<EventDetail>(`/events/${id}/editions`, { method: 'POST' }),
    onSuccess: (d) => {
      invalidate();
      nav(`/organizar/eventos/${d.id}/editar/2`);
    },
  });
  const remove = useMutation({
    mutationFn: () => api(`/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate();
      nav('/organizar');
    },
  });
  if (q.isLoading) return <Loading />;
  const e = q.data;
  if (!e) return <ErrorState message={errorMessage(q.error)} />;
  const isDraft = e.status === 'draft';
  const ended = e.phase === 'ended' && !isDraft;
  return (
    <Screen title={e.title}>
      <TopBar title="Gerenciar" onBack={() => nav('/organizar')} />
      <EventCardFeed e={e} />
      {e.organizerView ? (
        <div className={s.metricsBox}>
          <div>
            <b>{e.counts.interested}</b>interesse
          </div>
          <div>
            <b>{e.counts.going}</b>vão{e.capacity ? ` / ${e.capacity}` : ''}
          </div>
          <div>
            <b>{e.organizerView.pendingCount}</b>pedidos
          </div>
          <div>
            <b>{e.organizerView.views}</b>visitas
          </div>
        </div>
      ) : null}
      {e.visibility === 'private' && e.organizerView?.accessCode ? (
        <NeonCard accent="yellow" className={ui.mt12}>
          <p className={cx(ui.xs, ui.muted)}>Código de acesso · aprovação {e.organizerView.approvalMode === 'manual' ? 'manual' : 'automática'}</p>
          <p className={s.code}>{e.organizerView.accessCode}</p>
        </NeonCard>
      ) : null}
      <div className={cx(ui.stack, ui.mt16)}>
        {!ended && e.status !== 'cancelled' ? (
          <Button variant={isDraft ? 'primary' : 'secondary'} icon="edit" onClick={() => nav(`/organizar/eventos/${e.id}/editar/${isDraft ? 1 : 6}`)}>
            {isDraft ? 'Continuar rascunho' : 'Editar'}
          </Button>
        ) : null}
        {!isDraft ? (
          <Button variant="secondary" icon="users" onClick={() => nav(`/organizar/eventos/${e.id}/convidados`)}>
            Lista de convidados{e.organizerView?.pendingCount ? ` (${e.organizerView.pendingCount} pedidos)` : ''}
          </Button>
        ) : null}
        {!isDraft ? (
          <Button variant="secondary" icon="eye" onClick={() => nav(eventPath(e))}>
            Ver página pública
          </Button>
        ) : null}
        <Button variant="secondary" icon="image" onClick={() => nav(`/organizar/eventos/${e.id}/galeria`)}>
          Galeria ({e.gallery.length})
        </Button>
        {ended ? (
          <Button variant="secondary" icon="plus" loading={edition.isPending} onClick={() => edition.mutate()}>
            Nova edição
          </Button>
        ) : null}
        {e.status === 'published' && !ended ? (
          <Button variant="danger" icon="x" onClick={() => setCancelOpen(true)}>
            Cancelar evento
          </Button>
        ) : null}
        {isDraft ? (
          <Button variant="danger" icon="trash" loading={remove.isPending} onClick={() => remove.mutate()}>
            Excluir rascunho
          </Button>
        ) : null}
      </div>
      <Sheet open={cancelOpen} onClose={() => setCancelOpen(false)} accent="magenta" label="Cancelar evento">
        <Title accent="magenta">Cancelar evento</Title>
        <p className={ui.sub}>
          {e.counts.going} pessoa{e.counts.going === 1 ? '' : 's'} confirmada{e.counts.going === 1 ? '' : 's'} vão receber um e-mail. O link continua mostrando "Cancelado". Não dá para desfazer.
        </p>
        <TextArea label="Motivo (aparece para os convidados)" value={reason} maxLength={300} onChange={(ev) => setReason(ev.target.value)} />
        <Button variant="danger" disabled={reason.trim().length < 5} loading={cancel.isPending} onClick={() => cancel.mutate()}>
          Cancelar evento
        </Button>
      </Sheet>
    </Screen>
  );
}

// ---------- Wizard T-41 → T-45 ----------

const STEPS = ['Básico', 'Quando', 'Onde', 'Acesso', 'Valores', 'Revisão'] as const;
const FIELD_STEP: Record<PublishField, number> = { title: 1, type: 1, cover: 1, startsAt: 2, endsAt: 2, duration: 2, startInFuture: 2, venue: 3, location: 3 };

function Wizard(): JSX.Element {
  const { id, step: stepParam } = useParams();
  const step = id ? Math.min(6, Math.max(1, Number(stepParam) || 1)) : 1;
  const q = useOwnedEvent(id);
  const nav = useNavigate();
  if (id && q.isLoading) return <Loading />;
  const e = q.data ?? null;
  const go = (n: number, eventId = id) => nav(`/organizar/eventos/${eventId}/editar/${n}`, { replace: true });
  const back = () => (step > 1 ? go(step - 1) : nav(id ? `/organizar/eventos/${id}` : '/organizar'));
  const common = { e, next: (eventId?: string) => go(step + 1, eventId ?? id), back };
  return (
    <Screen foot title={`Novo rolê · ${STEPS[step - 1]}`}>
      <TopBar title={`${step} · ${STEPS[step - 1]}`} onBack={back} right={e && e.status !== 'draft' ? <Badge tone="green">Publicado</Badge> : undefined} />
      <ProgressSteps total={6} current={step} />
      {step === 1 ? <StepBasic {...common} /> : null}
      {e && step === 2 ? <StepWhen {...common} e={e} /> : null}
      {e && step === 3 ? <StepWhere {...common} e={e} /> : null}
      {e && step === 4 ? <StepAccess {...common} e={e} /> : null}
      {e && step === 5 ? <StepPrices {...common} e={e} /> : null}
      {e && step === 6 ? <StepReview e={e} goTo={(n) => go(n)} /> : null}
    </Screen>
  );
}

type StepProps<E = EventDetail> = { e: E; next: (eventId?: string) => void; back: () => void };

function useSaveEvent(id: string | undefined) {
  const qc = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: (body: EventPatchInput) => api<EventDetail & { notifiesGoing: number }>(`/events/${id}`, { method: 'PATCH', body }),
    onSuccess: (d) => {
      qc.setQueryData(['organizer', 'event', d.id], d);
      void qc.invalidateQueries({ queryKey: ['organizer', 'events'] });
      if (d.notifiesGoing > 0) toast.show(`${d.notifiesGoing} confirmados vão receber um e-mail com a mudança.`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

function WizardFooter({ children }: { children: ReactNode }): JSX.Element {
  return <Footer>{children}</Footer>;
}

/** T-41 · Básico: título, tipo, descrição, faixa etária, capa 4:5 com editor de recorte. */
function StepBasic({ e, next }: StepProps<EventDetail | null>): JSX.Element {
  const { data: types } = useEventTypes();
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState({ title: e?.title ?? '', typeSlug: e?.type.slug ?? '', description: e?.description ?? '', ageRating: e?.ageRating ?? 'free' });
  const [cover, setCover] = useState<File | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(e?.coverUrl ?? null);
  const save = useMutation({
    mutationFn: async () => {
      const body = { title: f.title.trim(), typeSlug: f.typeSlug, description: f.description, ageRating: f.ageRating };
      let d = e ? await api<EventDetail>(`/events/${e.id}`, { method: 'PATCH', body }) : await api<EventDetail>('/events', { method: 'POST', body });
      if (cover) {
        const fd = new FormData();
        fd.append('file', cover);
        d = await api<EventDetail>(`/events/${d.id}/cover`, { method: 'PUT', form: fd });
      }
      return d;
    },
    onSuccess: (d) => {
      qc.setQueryData(['organizer', 'event', d.id], d);
      void qc.invalidateQueries({ queryKey: ['organizer', 'events'] });
      next(d.id);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const pick = (fl: File | undefined) => {
    if (!fl) return;
    if (fl.size > 8 * 1024 * 1024) return toast.error('A capa pode ter até 8 MB.');
    setCropFile(fl);
  };
  const applyCrop = (cropped: File) => {
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview);
    setCover(cropped);
    setPreview(URL.createObjectURL(cropped));
    setCropFile(null);
  };
  return (
    <>
      <button type="button" className={s.upload} onClick={() => fileRef.current?.click()} aria-label="Escolher capa">
        {preview ? (
          <img src={preview} alt="Prévia da capa" />
        ) : (
          <>
            <Icon name="image" size="l" className={ui.cy} />
            <span>Capa vertical 4:5 · JPG, PNG ou WebP até 8 MB · ajuste o recorte</span>
          </>
        )}
      </button>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(ev) => pick(ev.target.files?.[0])} />
      {cropFile ? <ImageCropDialog file={cropFile} kind="cover" onCancel={() => setCropFile(null)} onConfirm={applyCrop} /> : null}
      <TextInput label="Nome do rolê" maxLength={80} value={f.title} onChange={(ev) => setF({ ...f, title: ev.target.value })} hint={`${f.title.length}/80`} />
      <p className={ui.label}>Tipo</p>
      <div className={cx(ui.chips, ui.mb12)}>
        {types?.map((ty) => (
          <Chip key={ty.slug} small on={f.typeSlug === ty.slug} onClick={() => setF({ ...f, typeSlug: ty.slug })}>
            {ty.label}
          </Chip>
        ))}
      </div>
      <TextArea label="Descrição" maxLength={3000} value={f.description} onChange={(ev) => setF({ ...f, description: ev.target.value })} />
      <p className={ui.label}>Faixa etária</p>
      <Segmented
        label="Faixa etária"
        value={f.ageRating}
        onChange={(v) => setF({ ...f, ageRating: v })}
        options={[
          { value: 'free', label: 'Livre' },
          { value: '16', label: '16+' },
          { value: '18', label: '18+' },
        ]}
      />
      <WizardFooter>
        <Button disabled={f.title.trim().length < 3 || !f.typeSlug} loading={save.isPending} onClick={() => save.mutate()}>
          {t.next}
        </Button>
      </WizardFooter>
    </>
  );
}

/** T-42 · Quando: início no futuro, fim depois do início, até 48 h. */
function StepWhen({ e, next }: StepProps): JSX.Element {
  const [start, setStart] = useState(toLocalInput(e.scheduled ? e.startsAt : null));
  const [end, setEnd] = useState(toLocalInput(e.scheduled ? e.endsAt : null));
  const save = useSaveEvent(e.id);
  const s1 = fromLocalInput(start);
  const e1 = fromLocalInput(end);
  let err: string | undefined;
  if (s1 && new Date(s1).getTime() <= Date.now() && e.status === 'draft') err = 'O início precisa estar no futuro.';
  else if (s1 && e1 && new Date(e1) <= new Date(s1)) err = 'O fim precisa ser depois do início.';
  else if (s1 && e1 && new Date(e1).getTime() - new Date(s1).getTime() > 48 * 3600_000) err = 'A duração máxima é de 48 horas.';
  return (
    <>
      <Title accent="cyan">Quando rola?</Title>
      <TextInput label="Início" type="datetime-local" value={start} onChange={(ev) => setStart(ev.target.value)} />
      <TextInput label="Fim" type="datetime-local" value={end} min={start} onChange={(ev) => setEnd(ev.target.value)} error={err} hint={s1 && e1 && endsNextDay(s1, e1) ? 'Termina no dia seguinte' : 'Horário de Brasília'} />
      <WizardFooter>
        <Button disabled={!s1 || !e1 || !!err} loading={save.isPending} onClick={() => s1 && e1 && save.mutate({ startsAt: s1, endsAt: e1 }, { onSuccess: () => next() })}>
          {t.next}
        </Button>
      </WizardFooter>
    </>
  );
}

/** T-42B · Onde: CEP → ViaCEP, + número → coordenadas; ou localização atual. */
function StepWhere({ e, next }: StepProps): JSX.Element {
  const qc = useQueryClient();
  const toast = useToast();
  const [venueName, setVenueName] = useState(e.venue.name);
  const [cep, setCep] = useState(e.venue.cep ?? '');
  const [number, setNumber] = useState(e.venue.number ?? '');
  const [complement, setComplement] = useState(e.venue.complement ?? '');
  const [preview, setPreview] = useState<VenuePreview | null>(
    e.venue.location ? { street: e.venue.street ?? '', number: e.venue.number ?? '', complement: e.venue.complement ?? null, neighborhood: e.venue.neighborhood, city: e.venue.city, uf: '', cep: e.venue.cep ?? '', location: e.venue.location, formatted: `${e.venue.street ?? ''}, ${e.venue.number ?? ''} — ${e.venue.neighborhood}, ${e.venue.city}` } : null,
  );
  const saveName = useSaveEvent(e.id);
  const geo = useMutation({
    mutationFn: (body: unknown) => api<VenuePreview & { notifiesGoing: number }>(`/events/${e.id}/geocode`, { method: 'POST', body }),
    onSuccess: (p) => {
      setPreview(p);
      void qc.invalidateQueries({ queryKey: ['organizer', 'event', e.id] });
      if (p.notifiesGoing > 0) toast.show(`${p.notifiesGoing} confirmados vão receber um e-mail com o novo local.`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const here = () =>
    navigator.geolocation.getCurrentPosition(
      (p) => geo.mutate({ lat: p.coords.latitude, lng: p.coords.longitude, venueName }),
      () => toast.error('Não conseguimos sua localização.'),
    );
  return (
    <>
      <Title accent="cyan">Onde?</Title>
      <TextInput label="Nome do local" placeholder="Ex.: Club Central, Casa da Ana" maxLength={80} value={venueName} onChange={(ev) => setVenueName(ev.target.value)} />
      <div className={ui.grid2}>
        <TextInput label="CEP" inputMode="numeric" placeholder="00000-000" maxLength={9} value={cep} onChange={(ev) => setCep(ev.target.value)} />
        <TextInput label="Número" value={number} maxLength={10} onChange={(ev) => setNumber(ev.target.value)} />
      </div>
      <TextInput label="Complemento (opcional)" value={complement} maxLength={60} onChange={(ev) => setComplement(ev.target.value)} />
      <Button variant="secondary" small loading={geo.isPending} disabled={!/^\d{5}-?\d{3}$/.test(cep) || !number} onClick={() => geo.mutate({ cep, number, ...(complement ? { complement } : {}) })}>
        Buscar endereço
      </Button>
      <Button variant="ghost" small icon="nav" onClick={here}>
        Usar minha localização atual
      </Button>
      {preview ? (
        <NeonCard accent="green" className={ui.mt12}>
          <p className={cx(ui.xs, ui.muted)}>Endereço encontrado — confira</p>
          <p className={ui.b}>{preview.formatted}</p>
          <p className={cx(ui.xs, ui.faint)}>
            {preview.location.lat.toFixed(5)}, {preview.location.lng.toFixed(5)} ·{' '}
            <a className={ui.link} href={`https://www.google.com/maps?q=${preview.location.lat},${preview.location.lng}`} target="_blank" rel="noopener noreferrer">
              ver no mapa
            </a>
          </p>
        </NeonCard>
      ) : null}
      <WizardFooter>
        <Button disabled={!preview || venueName.trim().length < 2} loading={saveName.isPending} onClick={() => saveName.mutate({ venueName: venueName.trim() }, { onSuccess: () => next() })}>
          {t.next}
        </Button>
      </WizardFooter>
    </>
  );
}

/** T-43 · Acesso: público/privado, aprovação, descoberta sem endereço, capacidade. */
function StepAccess({ e, next }: StepProps): JSX.Element {
  const [f, setF] = useState({
    visibility: e.visibility,
    approvalMode: e.organizerView?.approvalMode ?? 'manual',
    privateDiscoverable: e.privateDiscoverable,
    capacity: e.capacity,
  });
  const save = useSaveEvent(e.id);
  const Radio = ({ on, title, hint, onClick }: { on: boolean; title: string; hint: string; onClick: () => void }) => (
    <button type="button" role="radio" aria-checked={on} className={cx(s.radio, on && s.radioOn)} onClick={onClick}>
      <span className={s.radioO} />
      <span>
        <span className={ui.b} style={{ display: 'block' }}>
          {title}
        </span>
        <span className={cx(ui.xs, ui.soft)}>{hint}</span>
      </span>
    </button>
  );
  return (
    <>
      <Title accent="yellow">Quem pode ir?</Title>
      <div role="radiogroup" aria-label="Visibilidade">
        <Radio on={f.visibility === 'public'} title="Público" hint="Aparece na descoberta, com endereço." onClick={() => setF({ ...f, visibility: 'public' })} />
        <Radio on={f.visibility === 'private'} title="Privado" hint="Só com link ou código. O endereço é revelado para quem você aprovar." onClick={() => setF({ ...f, visibility: 'private' })} />
      </div>
      {f.visibility === 'private' ? (
        <>
          <Section accent="yellow">Aprovação</Section>
          <Segmented
            label="Aprovação"
            value={f.approvalMode}
            onChange={(v) => setF({ ...f, approvalMode: v })}
            options={[
              { value: 'manual', label: 'Manual' },
              { value: 'auto', label: 'Automática' },
            ]}
          />
          <div className={cx(ui.row, ui.between, ui.mt16)}>
            <span className={ui.grow}>
              <span className={ui.b} style={{ display: 'block' }}>
                Aparecer na descoberta
              </span>
              <span className={cx(ui.xs, ui.soft)}>Sem endereço: só bairro e distância aproximada.</span>
            </span>
            <Toggle label="Aparecer na descoberta" checked={f.privateDiscoverable} onChange={(v) => setF({ ...f, privateDiscoverable: v })} />
          </div>
          {e.organizerView?.accessCode ? (
            <NeonCard accent="yellow" className={ui.mt12}>
              <p className={cx(ui.xs, ui.muted)}>Código do evento</p>
              <p className={s.code}>{e.organizerView.accessCode}</p>
            </NeonCard>
          ) : (
            <p className={cx(ui.xs, ui.faint, ui.mt12)}>O código de 6 caracteres é gerado ao salvar.</p>
          )}
        </>
      ) : null}
      <Section accent="cyan">Capacidade</Section>
      <div className={cx(ui.row, ui.between)}>
        <span className={ui.b}>Limitar vagas</span>
        <Toggle label="Limitar vagas" checked={f.capacity !== null} onChange={(v) => setF({ ...f, capacity: v ? Math.max(e.counts.going, 50) : null })} />
      </div>
      {f.capacity !== null ? (
        <div className={cx(s.stepper, ui.mt8)}>
          <button type="button" aria-label="Menos" onClick={() => setF({ ...f, capacity: Math.max(Math.max(1, e.counts.going), (f.capacity ?? 1) - 5) })}>
            −
          </button>
          <input aria-label="Vagas" inputMode="numeric" value={f.capacity} onChange={(ev) => setF({ ...f, capacity: Math.max(1, Number(ev.target.value.replace(/\D/g, '')) || 1) })} />
          <button type="button" aria-label="Mais" onClick={() => setF({ ...f, capacity: (f.capacity ?? 0) + 5 })}>
            +
          </button>
        </div>
      ) : null}
      <p className={cx(ui.xs, ui.faint, ui.mt8)}>Lotou, novos pedidos são recusados com "Lotado" (sem lista de espera no beta).</p>
      <WizardFooter>
        <Button loading={save.isPending} onClick={() => save.mutate(f, { onSuccess: () => next() })}>
          {t.next}
        </Button>
      </WizardFooter>
    </>
  );
}

/** T-44 · Valores informativos (0 a 10) + link externo https opcional. Sem venda no beta (ADR-014). */
function StepPrices({ e, next }: StepProps): JSX.Element {
  const [items, setItems] = useState<{ label: string; price: string; note: string }[]>(
    e.priceItems.map((p) => ({ label: p.label, price: p.priceCents === null ? '' : (p.priceCents / 100).toString().replace('.', ','), note: p.note ?? '' })),
  );
  const [url, setUrl] = useState(e.externalTicketUrl ?? '');
  const save = useSaveEvent(e.id);
  const toItems = (): PriceItem[] =>
    items
      .filter((i) => i.label.trim())
      .map((i) => ({ label: i.label.trim(), priceCents: i.price.trim() === '' ? null : Math.round(Number(i.price.replace(/\./g, '').replace(',', '.')) * 100), ...(i.note.trim() ? { note: i.note.trim() } : {}) }));
  const badUrl = url.trim() !== '' && !/^https:\/\/\S+\.\S+/.test(url.trim());
  return (
    <>
      <Title accent="yellow">Valores</Title>
      <p className={ui.sub}>Informativos: a venda não acontece no RoleGo. Sem itens, o rolê ganha o selo "Grátis".</p>
      {items.map((it, i) => (
        <div key={i} className={s.pitem}>
          <input className={ui.input} aria-label="Rótulo" placeholder="Pista" value={it.label} maxLength={40} onChange={(ev) => setItems(items.map((x, k) => (k === i ? { ...x, label: ev.target.value } : x)))} />
          <input className={ui.input} aria-label="Preço em reais" placeholder="R$ (vazio = sem preço)" inputMode="decimal" value={it.price} onChange={(ev) => setItems(items.map((x, k) => (k === i ? { ...x, price: ev.target.value.replace(/[^\d,]/g, '') } : x)))} />
          <IconButton icon="trash" label="Remover item" onClick={() => setItems(items.filter((_, k) => k !== i))} />
          <input className={cx(ui.input, s.pnote)} aria-label="Observação" placeholder="Observação (ex.: 1º lote)" value={it.note} maxLength={60} onChange={(ev) => setItems(items.map((x, k) => (k === i ? { ...x, note: ev.target.value } : x)))} />
        </div>
      ))}
      {items.length < MAX_PRICE_ITEMS ? (
        <Button variant="ghost" small icon="plus" onClick={() => setItems([...items, { label: '', price: '', note: '' }])}>
          Adicionar valor
        </Button>
      ) : null}
      <div className={ui.mt16} />
      <TextInput label="Link de ingresso (opcional)" placeholder="https://" type="url" value={url} onChange={(ev) => setUrl(ev.target.value)} error={badUrl ? 'Use um link https://' : undefined} />
      <WizardFooter>
        <Button disabled={badUrl} loading={save.isPending} onClick={() => save.mutate({ priceItems: toItems(), externalTicketUrl: url.trim() || null }, { onSuccess: () => next() })}>
          {t.next}
        </Button>
      </WizardFooter>
    </>
  );
}

/** T-45 · Revisão: prévia do card + publishCheck; e-mail não verificado bloqueia. */
function StepReview({ e, goTo }: { e: EventDetail; goTo: (n: number) => void }): JSX.Element {
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const { data: me } = useMe();
  const check = useQuery({ queryKey: ['organizer', 'event', e.id, 'check', e.startsAt, e.endsAt, e.coverUrl, e.venue.name], queryFn: () => api<PublishCheck>(`/events/${e.id}/publish-check`) });
  const publish = useMutation({
    mutationFn: () => api<EventDetail>(`/events/${e.id}/publish`, { method: 'POST' }),
    onSuccess: (d) => {
      void qc.invalidateQueries({ queryKey: ['organizer'] });
      void qc.invalidateQueries({ queryKey: keys.discovery });
      toast.show('Rolê publicado! Compartilhe o link.');
      nav(`${eventPath(d)}`, { replace: true });
    },
  });
  const resend = useMutation({ mutationFn: () => api('/auth/email/verify/send', { method: 'POST' }), onSuccess: () => toast.show('Link enviado para o seu e-mail.') });
  const missing = check.data?.missing ?? [];
  const firstMissing = missing[0];
  const isDraft = e.status === 'draft';
  const needsVerify = isDraft && me && !me.emailVerified && me.role !== 'admin';
  const lines: { ok: boolean; label: string; step: number }[] = [
    { ok: !missing.some((m) => FIELD_STEP[m] === 1), label: 'Capa, nome e tipo', step: 1 },
    { ok: !missing.some((m) => FIELD_STEP[m] === 2), label: e.scheduled ? whenLabel(e.startsAt, e.endsAt) : 'Data e horário', step: 2 },
    { ok: !missing.some((m) => FIELD_STEP[m] === 3), label: e.venue.name ? `${e.venue.name} · ${e.venue.neighborhood}` : 'Endereço confirmado', step: 3 },
    { ok: true, label: `${e.visibility === 'public' ? 'Público' : 'Privado'} · ${e.capacity ? `${e.capacity} vagas` : 'sem limite'}`, step: 4 },
    { ok: true, label: e.priceItems.length ? `${e.priceItems.length} valor(es)${e.externalTicketUrl ? ' + link externo' : ''}` : 'Grátis', step: 5 },
  ];
  return (
    <>
      <p className={cx(ui.xs, ui.muted, ui.b, ui.up, ui.mb8)}>Assim aparece no feed</p>
      <EventCardFeed e={e} />
      <div className={ui.card} style={{ padding: '10px 12px' }}>
        {lines.map((l) => (
          <button key={l.step} type="button" className={s.okline} onClick={() => goTo(l.step)}>
            <Icon name={l.ok ? 'check' : 'x'} size="s" className={l.ok ? ui.gr : ui.mg} />
            <span className={ui.grow}>{l.label}</span>
            <Icon name="edit" size="s" className={ui.faint} />
          </button>
        ))}
      </div>
      {needsVerify ? (
        <NeonCard accent="yellow" className={ui.mt12}>
          <p className={cx(ui.b, ui.small)}>Confirme seu e-mail para publicar</p>
          <p className={cx(ui.xs, ui.soft)}>Mandamos um link para {me.email}.</p>
          <Button variant="ghost" small loading={resend.isPending} onClick={() => resend.mutate()}>
            Reenviar link
          </Button>
        </NeonCard>
      ) : null}
      {publish.error ? <p className={cx(ui.hint, ui.hintErr)}>{publish.error instanceof ApiError && publish.error.code === 'EVENT_NOT_PUBLISHABLE' ? `Falta: ${(publish.error.problem.missing ?? []).map((m) => t.missing[m as PublishField]).join(', ')}` : errorMessage(publish.error)}</p> : null}
      <Footer column>
        {isDraft ? (
          firstMissing ? (
            <Button variant="secondary" onClick={() => goTo(FIELD_STEP[firstMissing])}>
              Falta: {missing.map((m) => t.missing[m]).join(', ')}
            </Button>
          ) : (
            <Button disabled={!!needsVerify || !check.data} loading={publish.isPending} onClick={() => publish.mutate()}>
              Publicar rolê
            </Button>
          )
        ) : (
          <Button onClick={() => nav(`/organizar/eventos/${e.id}`)}>Concluir edição</Button>
        )}
        <Button variant="ghost" onClick={() => nav('/organizar')}>
          {isDraft ? 'Salvar rascunho' : 'Voltar'}
        </Button>
      </Footer>
    </>
  );
}

/** T-48 · Lista de convidados (pedidos e confirmados). */
function Guests(): JSX.Element {
  const { id } = useParams();
  const toast = useToast();
  const qc = useQueryClient();
  const ev = useOwnedEvent(id);
  const [status, setStatus] = useState<'pending' | 'going'>('pending');
  const q = useQuery({ queryKey: ['organizer', 'guests', id, status], queryFn: () => api<Page<Guest>>(`/events/${id}/guests${qs({ status })}`) });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ['organizer'] });
  };
  const decide = useMutation({
    mutationFn: ({ userId, approve }: { userId: string; approve: boolean }) => api<Guest>(`/events/${id}/guests/${userId}/${approve ? 'approve' : 'decline'}`, { method: 'POST' }),
    onSuccess: (g) => {
      toast.show(g.status === 'approved' ? `${g.name} está na lista.` : `Pedido de ${g.name} recusado.`);
      refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const all = useMutation({
    mutationFn: () => api<{ approved: number; leftPending: number }>(`/events/${id}/guests/approve-all`, { method: 'POST' }),
    onSuccess: (r) => {
      toast.show(r.leftPending ? `${r.approved} aprovados. ${r.leftPending} ficaram pendentes: lotou.` : `${r.approved} aprovados.`);
      refresh();
    },
  });
  const e = ev.data;
  return (
    <Screen title="Lista de convidados">
      <TopBar title="Lista de convidados" />
      {e ? (
        <>
          <p className={cx(ui.b)}>{e.title}</p>
          <p className={cx(ui.small, ui.soft)}>
            {e.counts.going} vão{e.capacity ? ` de ${e.capacity} vagas` : ''}
          </p>
          {e.capacity ? (
            <div className={s.capbar}>
              <i style={{ width: `${Math.min(100, (e.counts.going / e.capacity) * 100)}%` }} />
            </div>
          ) : null}
        </>
      ) : null}
      <div className={ui.mt12} />
      <Segmented
        label="Status"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'pending', label: `Pedidos (${e?.organizerView?.pendingCount ?? 0})` },
          { value: 'going', label: `Vão (${e?.counts.going ?? 0})` },
        ]}
      />
      {status === 'pending' && q.data?.items.length ? (
        <Button variant="secondary" small className={ui.mt12} loading={all.isPending} onClick={() => all.mutate()}>
          Aprovar todos
        </Button>
      ) : null}
      {q.isSuccess && !q.data.items.length ? <EmptyState icon="users" title={status === 'pending' ? 'Nenhum pedido pendente' : 'Ninguém confirmado ainda'} /> : null}
      <div className={ui.mt8}>
        {q.data?.items.map((g) => (
          <div key={g.userId} className={ui.lrow}>
            <Avatar name={g.name} url={g.photoUrl} size="md" />
            <span className={ui.grow}>
              <span className={ui.b} style={{ display: 'block' }}>
                {g.name}
              </span>
              <span className={cx(ui.xs, ui.muted)}>
                {g.city ?? '—'} · {g.attendedCount} rolê{g.attendedCount === 1 ? '' : 's'} no RoleGo
              </span>
            </span>
            {status === 'pending' ? (
              <>
                <button type="button" className={cx(s.reqbtn, s.no)} aria-label={`Recusar ${g.name}`} onClick={() => decide.mutate({ userId: g.userId, approve: false })}>
                  <Icon name="x" size="s" />
                </button>
                <button type="button" className={cx(s.reqbtn, s.ok)} aria-label={`Aprovar ${g.name}`} onClick={() => decide.mutate({ userId: g.userId, approve: true })}>
                  <Icon name="check" size="s" />
                </button>
              </>
            ) : (
              <Button variant="ghost" small onClick={() => decide.mutate({ userId: g.userId, approve: false })}>
                Remover
              </Button>
            )}
          </div>
        ))}
      </div>
    </Screen>
  );
}

/** T-47 · Galeria (até 20 fotos do organizador). */
function Gallery(): JSX.Element {
  const { id } = useParams();
  const q = useOwnedEvent(id);
  const qc = useQueryClient();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const refresh = () => void qc.invalidateQueries({ queryKey: ['organizer', 'event', id] });
  const up = useMutation({
    mutationFn: (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      return api(`/events/${id}/gallery`, { method: 'POST', form: fd });
    },
    onSuccess: refresh,
    onError: (e) => toast.error(errorMessage(e)),
  });
  const del = useMutation({ mutationFn: (assetId: string) => api(`/events/${id}/gallery/${assetId}`, { method: 'DELETE' }), onSuccess: refresh });
  const gallery = q.data?.gallery ?? [];
  return (
    <Screen title="Galeria">
      <TopBar title="Galeria do evento" />
      <p className={ui.sub}>
        Até {MAX_GALLERY} fotos. Elas aparecem na página e em "Edições anteriores" das próximas edições. {gallery.length}/{MAX_GALLERY}
      </p>
      <div className={s.gallery}>
        {gallery.map((g) => (
          <div key={g.id} className={s.gitem}>
            <img src={g.thumbUrl} alt="" loading="lazy" width={400} height={400} />
            <IconButton glass icon="trash" label="Remover foto" onClick={() => del.mutate(g.id)} />
          </div>
        ))}
        {gallery.length < MAX_GALLERY ? (
          <button type="button" className={s.gadd} onClick={() => fileRef.current?.click()} aria-label="Adicionar fotos">
            {up.isPending ? <span className={ui.spinner} /> : <Icon name="plus" size="l" className={ui.cy} />}
          </button>
        ) : null}
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(ev) => {
          const files = [...(ev.target.files ?? [])].slice(0, MAX_GALLERY - gallery.length);
          if (files.length) up.mutate(files);
          ev.target.value = '';
        }}
      />
    </Screen>
  );
}
