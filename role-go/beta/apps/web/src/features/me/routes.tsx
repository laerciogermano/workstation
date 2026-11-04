import { type EventCard, type Me, type Page, RADIUS_MAX_KM, RADIUS_MIN_KM, type RsvpStatus } from '@rolego/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type JSX, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { api, errorMessage } from '../../lib/http';
import { t } from '../../lib/i18n/pt-BR';
import { keys, setMe, useEventTypes, useMe } from '../../lib/queries';
import { EventCardMini, eventPath } from '../../ui/EventCard';
import { Icon } from '../../ui/Icon';
import { ImageCropDialog } from '../../ui/ImageCrop';
import { Screen, Sheet, TabBar, TopBar } from '../../ui/layout';
import { Avatar, Button, Chip, cx, EmptyState, ErrorState, ListRow, NeonCard, RangeSlider, Section, Segmented, Skeleton, TextInput, Title, Toggle, ui } from '../../ui/primitives';
import { useToast } from '../../ui/toast';

export default function MeRoutes({ view }: { view: 'mine' | 'profile' }): JSX.Element {
  if (view === 'mine') return <MyRoles />;
  return (
    <Routes>
      <Route index element={<Profile />} />
      <Route path="editar" element={<EditProfile />} />
      <Route path="preferencias" element={<Preferences />} />
      <Route path="*" element={<Navigate to="/perfil" replace />} />
    </Routes>
  );
}

type MyRsvp = EventCard & { rsvpStatus: RsvpStatus };

/** T-30 · Meus rolês: próximos (confirmados, pedidos, cancelados) e "Rolês que fui". */
function MyRoles(): JSX.Element {
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const nav = useNavigate();
  const q = useQuery({ queryKey: [...keys.myRsvps, scope], queryFn: () => api<Page<MyRsvp>>(`/me/rsvps?scope=${scope}`) });
  const pending = useQuery({ queryKey: keys.pendingReviews, queryFn: () => api<EventCard[]>('/me/reviews/pending') });
  const toReview = new Set(pending.data?.map((e) => e.id));
  return (
    <>
      <Screen tabs title={t.tabs.mine}>
        <Title>Meus rolês</Title>
        <Segmented
          label="Período"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'upcoming', label: 'Próximos' },
            { value: 'past', label: 'Rolês que fui' },
          ]}
        />
        {q.isLoading ? <Skeleton height={240} className={ui.mt16} /> : null}
        {q.isError ? <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} /> : null}
        {q.isSuccess && !q.data.items.length ? (
          <EmptyState
            icon="calok"
            title={scope === 'upcoming' ? 'Nenhum rolê marcado' : 'Você ainda não foi a nenhum rolê'}
            hint={scope === 'upcoming' ? 'Confirme presença em um evento e ele aparece aqui.' : 'Depois que um rolê acaba, ele vem para cá.'}
            action={<Button variant="secondary" small onClick={() => nav('/explorar')}>Explorar rolês</Button>}
          />
        ) : null}
        <div className={ui.mt8}>
          {q.data?.items.map((e) => (
            <EventCardMini
              key={e.id}
              e={e}
              rsvp={e.rsvpStatus}
              to={toReview.has(e.id) ? `${eventPath(e)}/avaliar` : undefined}
              right={toReview.has(e.id) ? <span className={cx(ui.small, ui.yl, ui.b)}>Avaliar</span> : undefined}
            />
          ))}
        </div>
      </Screen>
      <TabBar />
    </>
  );
}

/** T-31 · Perfil. */
function Profile(): JSX.Element {
  const { data: me } = useMe();
  const nav = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const logout = useMutation({
    mutationFn: (everywhere: boolean) => api('/auth/logout', { method: 'POST', body: { everywhere } }),
    onSettled: () => {
      setMe(qc, null);
      qc.clear();
      nav('/', { replace: true });
    },
  });
  const resend = useMutation({ mutationFn: () => api('/auth/email/verify/send', { method: 'POST' }), onSuccess: () => toast.show('Link enviado para o seu e-mail.'), onError: (e) => toast.error(errorMessage(e)) });
  if (!me) return <Skeleton height={300} />;
  const since = new Date(me.createdAt).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  return (
    <>
      <Screen tabs title={t.tabs.profile}>
        <header className={ui.top}>
          <span className={cx(ui.grow, ui.xb, ui.it, ui.up, ui.lg)}>Perfil</span>
          {me.role === 'admin' ? <Button variant="ghost" small onClick={() => nav('/admin')}>Admin</Button> : null}
          <button type="button" className={ui.iconBtn} aria-label="Preferências" onClick={() => nav('/perfil/preferencias')}>
            <Icon name="gear" />
          </button>
        </header>
        <div className={ui.textCenter}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar name={me.name} url={me.photoUrl} size="lg" />
          </div>
          <p className={cx(ui.b, ui.lg, ui.mt8)}>{me.name}</p>
          <p className={cx(ui.small, ui.muted)}>
            {me.preferences.city?.name ?? '—'} · desde {since}
          </p>
        </div>
        <div className={cx(ui.grid3, ui.mt16)}>
          <div className={ui.card} style={{ padding: 12, textAlign: 'center' }}>
            <p className={cx(ui.xb, ui.lg)}>{me.stats.attended}</p>
            <p className={cx(ui.xs, ui.muted)}>rolês</p>
          </div>
          <div className={ui.card} style={{ padding: 12, textAlign: 'center' }}>
            <p className={cx(ui.xb, ui.lg)}>{me.stats.upcoming}</p>
            <p className={cx(ui.xs, ui.muted)}>próximos</p>
          </div>
          <div className={ui.card} style={{ padding: 12, textAlign: 'center' }}>
            <p className={cx(ui.xb, ui.lg, ui.yl)}>{me.stats.reviews}</p>
            <p className={cx(ui.xs, ui.muted)}>avaliações</p>
          </div>
        </div>
        {!me.emailVerified ? (
          <NeonCard accent="yellow" className={ui.mt16}>
            <p className={cx(ui.b, ui.small)}>Confirme seu e-mail</p>
            <p className={cx(ui.xs, ui.soft)}>Precisa para publicar rolês. Enviamos um link para {me.email}.</p>
            <Button variant="ghost" small loading={resend.isPending} onClick={() => resend.mutate()}>
              Reenviar link
            </Button>
          </NeonCard>
        ) : null}
        {!me.organizer ? (
          <NeonCard accent="cyan" className={ui.mt16} onClick={() => nav('/organizar/ativar')}>
            <span className={ui.row}>
              <Icon name="grid" size="l" className={ui.cy} />
              <span className={ui.grow}>
                <span className={ui.b} style={{ display: 'block' }}>
                  Quero publicar rolês
                </span>
                <span className={cx(ui.xs, ui.soft)}>Para anfitriões, bares e produtores</span>
              </span>
              <Icon name="chev" className={ui.cy} />
            </span>
          </NeonCard>
        ) : null}
        <div className={ui.mt12}>
          <ListRow icon="edit" onClick={() => nav('/perfil/editar')}>
            Editar perfil
          </ListRow>
          <ListRow icon="gear" onClick={() => nav('/perfil/preferencias')}>
            Preferências e privacidade
          </ListRow>
          <ListRow icon="key" onClick={() => nav('/codigo')}>
            Tenho um código de evento
          </ListRow>
          <ListRow icon="mail" onClick={() => (window.location.href = 'mailto:beta@rolego.com.br?subject=Feedback%20do%20beta')}>
            Mandar feedback
          </ListRow>
          <ListRow icon="logout" tone="magenta" onClick={() => setLogoutOpen(true)}>
            {t.logout}
          </ListRow>
        </div>
      </Screen>
      <Sheet open={logoutOpen} onClose={() => setLogoutOpen(false)} accent="magenta" label="Sair">
        <Title accent="magenta">Sair</Title>
        <div className={ui.stack}>
          <Button variant="danger" loading={logout.isPending} onClick={() => logout.mutate(false)}>
            Sair deste aparelho
          </Button>
          <Button variant="secondaryMagenta" onClick={() => logout.mutate(true)}>
            Sair de todos os aparelhos
          </Button>
        </div>
      </Sheet>
      <TabBar />
    </>
  );
}

/** T-32 · Editar perfil: foto (JPG/PNG/WebP ≤ 5 MB → editor 1:1 → WebP 512), nome, e-mail. */
function EditProfile(): JSX.Element {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const toast = useToast();
  const nav = useNavigate();
  const file = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [f, setF] = useState({ name: me?.name ?? '', email: me?.email ?? '' });
  useEffect(() => {
    if (me) setF({ name: me.name, email: me.email });
  }, [me]);
  const save = useMutation({
    mutationFn: () => api<Me>('/me', { method: 'PATCH', body: { name: f.name, email: f.email } }),
    onSuccess: (m) => {
      setMe(qc, m);
      toast.show(m.emailVerified ? 'Perfil salvo.' : 'Perfil salvo. Confirme o novo e-mail.');
      nav('/perfil');
    },
  });
  const photo = useMutation({
    mutationFn: (fl: File) => {
      const fd = new FormData();
      fd.append('file', fl);
      return api<Me>('/me/photo', { method: 'PUT', form: fd });
    },
    onSuccess: (m) => {
      setMe(qc, m);
      setCropFile(null);
      toast.show('Foto atualizada.');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const removePhoto = useMutation({ mutationFn: () => api<Me>('/me/photo', { method: 'DELETE' }), onSuccess: (m) => setMe(qc, m) });
  if (!me) return <Skeleton height={300} />;
  return (
    <Screen title="Editar perfil">
      <TopBar title="Editar perfil" />
      <div className={ui.textCenter}>
        <button type="button" onClick={() => file.current?.click()} aria-label="Trocar foto" style={{ display: 'inline-block', position: 'relative' }}>
          <Avatar name={me.name} url={me.photoUrl} size="lg" />
          <span className={ui.iconBtn} style={{ position: 'absolute', right: -6, bottom: -6, width: 34, height: 34 }}>
            {photo.isPending ? <span className={ui.spinner} /> : <Icon name="camera" size="s" />}
          </span>
        </button>
        <input
          ref={file}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const fl = e.target.files?.[0];
            if (!fl) return;
            if (fl.size > 5 * 1024 * 1024) toast.error('A foto pode ter até 5 MB.');
            else setCropFile(fl);
            e.target.value = '';
          }}
        />
        {me.photoUrl ? (
          <Button variant="ghost" small onClick={() => removePhoto.mutate()}>
            Remover foto
          </Button>
        ) : (
          <p className={cx(ui.xs, ui.faint, ui.mt8)}>JPG, PNG ou WebP até 5 MB · você ajusta o recorte</p>
        )}
      </div>
      <TextInput label="Nome" value={f.name} maxLength={60} onChange={(e) => setF({ ...f, name: e.target.value })} />
      <TextInput label={t.email} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} hint="Trocar o e-mail pede uma nova confirmação." error={save.error ? errorMessage(save.error) : undefined} />
      <Button loading={save.isPending} disabled={!f.name.trim() || !f.email} onClick={() => save.mutate()}>
        {t.save}
      </Button>
      {cropFile ? (
        <ImageCropDialog
          file={cropFile}
          kind="avatar"
          onCancel={() => setCropFile(null)}
          onConfirm={(cropped) => photo.mutate(cropped)}
        />
      ) : null}
    </Screen>
  );
}

/** T-33 · Preferências de descoberta + privacidade + excluir conta. */
function Preferences(): JSX.Element {
  const { data: me } = useMe();
  const { data: types } = useEventTypes();
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const [sel, setSel] = useState<string[]>(me?.preferences.eventTypes ?? []);
  const [km, setKm] = useState(me?.preferences.radiusKm ?? 20);
  const [delOpen, setDelOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  useEffect(() => {
    if (me) {
      setSel(me.preferences.eventTypes);
      setKm(me.preferences.radiusKm);
    }
  }, [me]);
  const onMe = (m: Me) => {
    setMe(qc, m);
    void qc.invalidateQueries({ queryKey: keys.discovery });
  };
  const prefs = useMutation({ mutationFn: (body: unknown) => api<Me>('/me/preferences', { method: 'PATCH', body }), onSuccess: (m) => { onMe(m); toast.show('Preferências salvas.'); }, onError: (e) => toast.error(errorMessage(e)) });
  const privacy = useMutation({ mutationFn: (showPresence: boolean) => api<Me>('/me/privacy', { method: 'PATCH', body: { showPresence } }), onSuccess: onMe });
  const del = useMutation({
    mutationFn: () => api('/me', { method: 'DELETE', body: { confirm } }),
    onSuccess: () => {
      setMe(qc, null);
      qc.clear();
      nav('/', { replace: true });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  if (!me) return <Skeleton height={300} />;
  const toggle = (slug: string) => setSel((xs) => (xs.includes(slug) ? xs.filter((x) => x !== slug) : [...xs, slug]));
  return (
    <Screen title="Preferências e privacidade">
      <TopBar title="Preferências e privacidade" />
      <Section accent="violet">O que você curte</Section>
      <div className={ui.chips}>
        {types?.map((ty) => (
          <Chip key={ty.slug} small on={sel.includes(ty.slug)} onClick={() => toggle(ty.slug)}>
            {ty.label}
          </Chip>
        ))}
      </div>
      <Section accent="cyan" right={`${km} km`}>
        Raio
      </Section>
      <RangeSlider label="Raio de busca" value={km} min={RADIUS_MIN_KM} max={RADIUS_MAX_KM} onChange={setKm} scale={['1 km', '50', '100 km']} />
      <p className={cx(ui.small, ui.soft, ui.mt8)}>
        Cidade base: <b>{me.preferences.city?.name ?? '—'}</b> ·{' '}
        <button type="button" className={ui.link} onClick={() => nav('/onboarding/cidade')}>
          trocar
        </button>
      </p>
      <Button className={ui.mt16} disabled={!sel.length} loading={prefs.isPending} onClick={() => prefs.mutate({ eventTypes: sel, radiusKm: km })}>
        Salvar preferências
      </Button>

      <div id="privacidade" />
      <Section accent="green">Privacidade</Section>
      <div className={cx(ui.row, ui.between)}>
        <div className={ui.grow}>
          <p className={ui.b}>Mostrar minha presença nos eventos</p>
          <p className={cx(ui.xs, ui.soft)}>Desligado, sua foto some de "Quem vai", mas você continua na contagem.</p>
        </div>
        <Toggle label="Mostrar minha presença nos eventos" checked={me.privacy.showPresence} onChange={(v) => privacy.mutate(v)} />
      </div>
      <p className={cx(ui.xs, ui.faint, ui.mt12)}>Sua localização fica guardada só de forma aproximada (~100 m) e nunca aparece para outras pessoas.</p>

      <Section accent="magenta">Conta</Section>
      <Button variant="danger" onClick={() => setDelOpen(true)}>
        Excluir minha conta
      </Button>
      <Sheet open={delOpen} onClose={() => setDelOpen(false)} accent="magenta" label="Excluir conta">
        <Title accent="magenta">Excluir conta</Title>
        <p className={ui.sub}>Seus dados pessoais e fotos são apagados, suas presenças futuras são canceladas e os eventos que você organiza são cancelados. Não dá para desfazer.</p>
        <TextInput label='Digite "EXCLUIR" para confirmar' value={confirm} onChange={(e) => setConfirm(e.target.value)} autoCapitalize="characters" />
        <Button variant="danger" disabled={confirm !== 'EXCLUIR'} loading={del.isPending} onClick={() => del.mutate()}>
          Excluir definitivamente
        </Button>
      </Sheet>
    </Screen>
  );
}
