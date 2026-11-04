import { type AdminReport, type AdminStats, type EventDetail, type OrganizerDto, type OrganizerKind } from '@rolego/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type JSX, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router';
import { api, errorMessage, qs } from '../../lib/http';
import { t } from '../../lib/i18n/pt-BR';
import { Icon } from '../../ui/Icon';
import { Badge, Button, cx, EmptyState, Select, TextInput, Title, ui, Wordmark } from '../../ui/primitives';
import { useToast } from '../../ui/toast';
import s from './admin.module.css';

/** T-61 · Backoffice (papel admin atribuído só via CLI). Tudo grava audit_log no servidor. */
export default function AdminRoutes(): JSX.Element {
  return (
    <div className={s.desk}>
      <div className={cx(ui.row, ui.between)} style={{ padding: '14px 16px 0' }}>
        <Wordmark size={24} />
        <Link className={cx(ui.link, ui.small)} to="/explorar">
          Voltar ao app
        </Link>
      </div>
      <nav className={s.side} aria-label="Admin">
        <NavLink to="/admin" end className={({ isActive }) => cx(isActive && s.on)}>
          <Icon name="flag" size="s" /> Denúncias
        </NavLink>
        <NavLink to="/admin/organizadores" className={({ isActive }) => cx(isActive && s.on)}>
          <Icon name="grid" size="s" /> Parceiros
        </NavLink>
        <NavLink to="/admin/metricas" className={({ isActive }) => cx(isActive && s.on)}>
          <Icon name="bolt" size="s" /> Métricas
        </NavLink>
      </nav>
      <main className={s.main}>
        <Routes>
          <Route index element={<Reports />} />
          <Route path="organizadores" element={<Partners />} />
          <Route path="metricas" element={<Stats />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}

const ACTION_LABEL = { remove: 'Remover evento', hide_review: 'Ocultar comentário', block_user: 'Bloquear usuário', dismiss: 'Descartar' } as const;

function Reports(): JSX.Element {
  const [status, setStatus] = useState<'open' | 'resolved' | 'dismissed'>('open');
  const qc = useQueryClient();
  const toast = useToast();
  const q = useQuery({ queryKey: ['admin', 'reports', status], queryFn: () => api<AdminReport[]>(`/admin/reports${qs({ status })}`) });
  const resolve = useMutation({
    mutationFn: ({ id, action }: { id: string; action: keyof typeof ACTION_LABEL }) => api(`/admin/reports/${id}/resolve`, { method: 'POST', body: { action, note: '' } }),
    onSuccess: () => {
      toast.show('Feito.');
      void qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <Title>Denúncias</Title>
      <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
        <option value="open">Abertas</option>
        <option value="resolved">Resolvidas</option>
        <option value="dismissed">Descartadas</option>
      </Select>
      {q.data && !q.data.length ? <EmptyState icon="check" title="Fila vazia" /> : null}
      {q.data?.map((r) => (
        <div key={r.id} className={s.report}>
          <div className={cx(ui.row, ui.wrap)}>
            <Badge tone="magenta">{r.targetType}</Badge>
            <Badge tone="neutral">{t.reportReasons[r.reason as keyof typeof t.reportReasons] ?? r.reason}</Badge>
            {r.reportsOnTarget > 1 ? <Badge tone="yellow">{r.reportsOnTarget} denúncias</Badge> : null}
            <span className={cx(ui.xs, ui.faint)}>{new Date(r.createdAt).toLocaleString('pt-BR')}</span>
          </div>
          <p className={cx(ui.b, ui.mt8)}>
            {r.targetSlug ? (
              <Link className={ui.link} to={`/app/e/${r.targetSlug}`}>
                {r.targetLabel}
              </Link>
            ) : (
              r.targetLabel
            )}
          </p>
          {r.note ? <p className={cx(ui.small, ui.soft)}>“{r.note}”</p> : null}
          <p className={cx(ui.xs, ui.muted)}>por {r.reporterName}</p>
          {status === 'open' ? (
            <div className={s.actions}>
              {r.targetType === 'event' ? <Button small variant="danger" onClick={() => resolve.mutate({ id: r.id, action: 'remove' })}>{ACTION_LABEL.remove}</Button> : null}
              {r.targetType === 'review' ? <Button small variant="danger" onClick={() => resolve.mutate({ id: r.id, action: 'hide_review' })}>{ACTION_LABEL.hide_review}</Button> : null}
              <Button small variant="secondaryMagenta" onClick={() => resolve.mutate({ id: r.id, action: 'block_user' })}>
                {ACTION_LABEL.block_user}
              </Button>
              <Button small variant="ghost" onClick={() => resolve.mutate({ id: r.id, action: 'dismiss' })}>
                {ACTION_LABEL.dismiss}
              </Button>
            </div>
          ) : null}
        </div>
      ))}
    </>
  );
}

/** RF-ADM-04 · Organizador sem usuário + rascunho em nome dele (curadoria de lançamento). */
function Partners(): JSX.Element {
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const q = useQuery({ queryKey: ['admin', 'organizers'], queryFn: () => api<OrganizerDto[]>('/admin/organizers') });
  const [f, setF] = useState<{ displayName: string; kind: OrganizerKind; contactEmail: string }>({ displayName: '', kind: 'venue', contactEmail: '' });
  const create = useMutation({
    mutationFn: () => api<OrganizerDto>('/admin/organizers', { method: 'POST', body: f }),
    onSuccess: () => {
      setF({ displayName: '', kind: 'venue', contactEmail: '' });
      toast.show('Parceiro criado.');
      void qc.invalidateQueries({ queryKey: ['admin', 'organizers'] });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
  const newEvent = useMutation({
    mutationFn: (orgId: string) => api<EventDetail>(`/admin/organizers/${orgId}/events`, { method: 'POST', body: { title: 'Novo rolê', typeSlug: 'festas' } }),
    onSuccess: (d) => nav(`/organizar/eventos/${d.id}/editar/1`),
    onError: (e) => toast.error(errorMessage(e)),
  });
  return (
    <>
      <Title>Parceiros</Title>
      <div className={ui.card} style={{ padding: 14 }}>
        <p className={cx(ui.b, ui.mb8)}>Cadastrar parceiro</p>
        <TextInput label="Nome público" value={f.displayName} onChange={(e) => setF({ ...f, displayName: e.target.value })} />
        <Select label="Tipo" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as OrganizerKind })}>
          {(Object.keys(t.orgKinds) as OrganizerKind[]).map((k) => (
            <option key={k} value={k}>
              {t.orgKinds[k]}
            </option>
          ))}
        </Select>
        <TextInput label="E-mail de contato" type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} />
        <Button small disabled={f.displayName.length < 2 || !f.contactEmail} loading={create.isPending} onClick={() => create.mutate()}>
          Criar parceiro
        </Button>
      </div>
      <div className={ui.mt16}>
        {q.data?.map((o) => (
          <div key={o.id} className={ui.lrow}>
            <span className={ui.grow}>
              <span className={ui.b} style={{ display: 'block' }}>
                {o.displayName}
              </span>
              <span className={cx(ui.xs, ui.muted)}>
                {t.orgKinds[o.kind]} · /o/{o.slug}
              </span>
            </span>
            <Button small variant="secondary" icon="plus" onClick={() => newEvent.mutate(o.id)}>
              Evento
            </Button>
          </div>
        ))}
      </div>
    </>
  );
}

function Stats(): JSX.Element {
  const q = useQuery({ queryKey: ['admin', 'stats'], queryFn: () => api<AdminStats>('/admin/stats') });
  const d = q.data;
  const items: [string, number | undefined][] = [
    ['Usuários ativos', d?.users],
    ['Onboarding concluído', d?.onboarded],
    ['Organizadores', d?.organizers],
    ['Eventos publicados', d?.eventsPublished],
    ['Eventos futuros', d?.eventsUpcoming],
    ['Presenças confirmadas', d?.rsvpsGoing],
    ['Avaliações', d?.reviews],
    ['Denúncias abertas', d?.openReports],
  ];
  return (
    <>
      <Title>Métricas do beta</Title>
      <div className={s.kpis}>
        {items.map(([label, v]) => (
          <div key={label} className={s.kpi}>
            <b>{v ?? '—'}</b>
            <span className={cx(ui.xs, ui.muted)}>{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
