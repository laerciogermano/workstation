import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ConfirmDialog, doneCount, EmptyState, ErrorNote, PageHeader, ProgressBar, StatusBadge } from '../components/ui.tsx';
import { api, type Campaign, type Recipient, type RecipientFilter } from '../lib/api.ts';
import { fmtDate, fmtNumber, plural } from '../lib/format.ts';

export function CampaignPage() {
  const { id = '' } = useParams();
  const campaign = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => api.campaign(id),
    // CU-05: acompanha o progresso enquanto envia; CU-06: aberturas continuam chegando depois
    refetchInterval: (q) => (q.state.data?.status === 'sending' ? 2000 : q.state.data?.status === 'sent' ? 15_000 : false),
  });

  const back = (
    <Link to="/campanhas" className="back">
      <ArrowLeft size={16} aria-hidden /> Campanhas
    </Link>
  );

  if (campaign.error) return <><PageHeader title="Campanha" back={back} /><ErrorNote error={campaign.error} /></>;
  if (!campaign.data) return <PageHeader title="Carregando…" back={back} />;

  const c = campaign.data;
  return c.status === 'draft' ? <DraftEditor campaign={c} back={back} /> : <SendingView campaign={c} back={back} />;
}

function DraftEditor({ campaign, back }: { campaign: Campaign; back: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const ids = { name: useId(), subject: useId(), list: useId(), body: useId() };

  const [form, setForm] = useState({
    name: campaign.name,
    subject: campaign.subject,
    bodyHtml: campaign.bodyHtml,
    listId: campaign.list?.id ?? '',
  });
  const [confirmSend, setConfirmSend] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const lists = useQuery({ queryKey: ['lists'], queryFn: api.lists });
  const selectedList = lists.data?.find((l) => l.id === form.listId);
  const recipients = selectedList ? selectedList.contactCount - selectedList.suppressedCount : 0;

  const dirty =
    form.name !== campaign.name ||
    form.subject !== campaign.subject ||
    form.bodyHtml !== campaign.bodyHtml ||
    form.listId !== (campaign.list?.id ?? '');

  const save = useMutation({
    mutationFn: () => api.updateCampaign(campaign.id, { ...form, listId: form.listId || null }),
    onSuccess: (c) => {
      queryClient.setQueryData(['campaign', c.id], c);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const send = useMutation({
    mutationFn: async () => {
      if (dirty) await api.updateCampaign(campaign.id, { ...form, listId: form.listId || null });
      return api.sendCampaign(campaign.id);
    },
    onSuccess: (c) => {
      setConfirmSend(false);
      queryClient.setQueryData(['campaign', c.id], c);
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });

  const remove = useMutation({
    mutationFn: () => api.deleteCampaign(campaign.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/campanhas', { replace: true });
    },
  });

  const canSend = form.subject.trim() && form.bodyHtml.trim() && form.listId && recipients > 0;

  return (
    <>
      <PageHeader
        title={campaign.name}
        back={back}
        actions={
          <>
            <StatusBadge status="draft" />
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setConfirmDelete(true)} aria-label="Excluir rascunho" title="Excluir rascunho">
              <Trash2 size={18} strokeWidth={1.75} />
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
              {save.isPending ? 'Salvando…' : dirty ? 'Salvar' : 'Salvo'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setConfirmSend(true)} disabled={!canSend}>
              <Send size={16} strokeWidth={2} aria-hidden /> Enviar
            </button>
          </>
        }
      />
      <ErrorNote error={save.error} />

      <div className="editor">
        <div className="editor-form">
          <div className="field">
            <label htmlFor={ids.name}>Nome interno</label>
            <input id={ids.name} required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor={ids.list}>Lista de destino</label>
            <select id={ids.list} value={form.listId} onChange={(e) => setForm({ ...form, listId: e.target.value })}>
              <option value="">Escolha uma lista</option>
              {lists.data?.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} ({fmtNumber(l.contactCount)})
                </option>
              ))}
            </select>
            {selectedList && (
              <p className="hint">
                {plural(recipients, 'destinatário', 'destinatários')}
                {selectedList.suppressedCount > 0 && ` · ${plural(selectedList.suppressedCount, 'descadastrado fica', 'descadastrados ficam')} de fora`}
              </p>
            )}
            {lists.data?.length === 0 && (
              <p className="hint">
                Nenhuma lista cadastrada. <Link to="/listas">Criar lista</Link>
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor={ids.subject}>Assunto</label>
            <input id={ids.subject} maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div className="field grow">
            <label htmlFor={ids.body}>Conteúdo (HTML)</label>
            <textarea
              id={ids.body}
              className="code"
              spellCheck={false}
              value={form.bodyHtml}
              onChange={(e) => setForm({ ...form, bodyHtml: e.target.value })}
              placeholder="<h1>Olá!</h1>&#10;<p>Conteúdo da campanha…</p>"
            />
            <p className="hint">O rodapé com o link de descadastro é incluído automaticamente.</p>
          </div>
        </div>
        <EmailPreview subject={form.subject} html={form.bodyHtml} />
      </div>

      <ConfirmDialog
        open={confirmSend}
        title="Enviar campanha?"
        confirmLabel={`Enviar para ${fmtNumber(recipients)}`}
        busy={send.isPending}
        onConfirm={() => send.mutate()}
        onClose={() => setConfirmSend(false)}
      >
        <p>
          “{form.subject}” vai para {plural(recipients, 'contato', 'contatos')} da lista <strong>{selectedList?.name}</strong>. Depois de
          enviada, a campanha não pode ser alterada.
        </p>
        <ErrorNote error={send.error} />
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir rascunho?"
        confirmLabel="Excluir"
        danger
        busy={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      >
        <p>“{campaign.name}” será apagada.</p>
        <ErrorNote error={remove.error} />
      </ConfirmDialog>
    </>
  );
}

function SendingView({ campaign: c, back }: { campaign: Campaign; back: React.ReactNode }) {
  const p = c.progress;
  const done = doneCount(p);
  const pct = p.total ? Math.floor((done / p.total) * 100) : 0;

  return (
    <>
      <PageHeader title={c.name} back={back} actions={<StatusBadge status={c.status} />} />

      <section className="panel progress-panel" aria-labelledby="progress-title">
        <div className="progress-head">
          <h2 id="progress-title">{c.status === 'sending' ? 'Enviando' : 'Envio concluído'}</h2>
          <span className="progress-pct num" aria-live="polite">
            {pct}%
          </span>
        </div>
        <ProgressBar progress={p} label="Progresso do envio" />
        <dl className="stats">
          <div>
            <dt>Enviados</dt>
            <dd className="num">{fmtNumber(p.sent)}</dd>
          </div>
          <div>
            <dt>Na fila</dt>
            <dd className="num">{fmtNumber(p.pending + p.sending)}</dd>
          </div>
          <div>
            <dt>Falharam</dt>
            <dd className={`num ${p.failed ? 'text-error' : ''}`}>{fmtNumber(p.failed)}</dd>
          </div>
          <div>
            <dt>Descadastrados</dt>
            <dd className="num">{fmtNumber(p.skipped)}</dd>
          </div>
          <div>
            <dt>Abriram</dt>
            <dd className="num">{fmtNumber(p.opened)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd className="num">{fmtNumber(p.total)}</dd>
          </div>
        </dl>
        <p className="muted small">
          Lista {c.list?.name} · iniciado {fmtDate(c.startedAt)}
          {c.finishedAt && ` · concluído ${fmtDate(c.finishedAt)}`}
        </p>
      </section>

      <RecipientsTable campaignId={c.id} sending={c.status === 'sending'} />

      <EmailPreview subject={c.subject} html={c.bodyHtml} />
    </>
  );
}

const RECIPIENT_STATUS: Record<Recipient['status'], string> = {
  pending: 'Na fila',
  sending: 'Enviando',
  sent: 'Enviado',
  failed: 'Falhou',
  skipped: 'Descadastrado',
};

/** CU-06: quem abriu. */
function RecipientsTable({ campaignId, sending }: { campaignId: string; sending: boolean }) {
  const filterId = useId();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<RecipientFilter>('all');

  const recipients = useQuery({
    queryKey: ['recipients', campaignId, page, filter],
    queryFn: () => api.recipients(campaignId, page, filter),
    placeholderData: keepPreviousData,
    refetchInterval: sending ? 2000 : 15_000,
  });

  const data = recipients.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section className="recipients" aria-labelledby="recipients-title">
      <div className="contacts-head">
        <h2 id="recipients-title">Destinatários</h2>
        <div>
          <label htmlFor={filterId} className="sr-only">
            Filtrar destinatários
          </label>
          <select
            id={filterId}
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as RecipientFilter);
              setPage(1);
            }}
          >
            <option value="all">Todos</option>
            <option value="opened">Abriram</option>
            <option value="not_opened">Não abriram</option>
          </select>
        </div>
      </div>
      <ErrorNote error={recipients.error} />

      {data?.total === 0 ? (
        <EmptyState title="Ninguém neste filtro" />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">E-mail</th>
                <th scope="col">Nome</th>
                <th scope="col">Envio</th>
                <th scope="col">Abriu em</th>
                <th scope="col">Última abertura</th>
                <th scope="col">Vezes</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((r) => (
                <tr key={r.id}>
                  <td>{r.email}</td>
                  <td>{r.name ?? <span className="muted">—</span>}</td>
                  <td>{RECIPIENT_STATUS[r.status]}</td>
                  <td>{r.openedAt ? fmtDate(r.openedAt) : <span className="muted">sem registro</span>}</td>
                  <td>{fmtDate(r.lastOpenedAt)}</td>
                  <td>{fmtNumber(r.openCount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="pager" aria-label="Paginação dos destinatários">
          <button type="button" className="btn btn-secondary" onClick={() => setPage(page - 1)} disabled={page <= 1}>
            Anterior
          </button>
          <span className="num small">
            {page} de {pages}
          </span>
          <button type="button" className="btn btn-secondary" onClick={() => setPage(page + 1)} disabled={page >= pages}>
            Próxima
          </button>
        </nav>
      )}

      <p className="muted small">
        A abertura é aproximada: quem bloqueia imagens não aparece, e alguns provedores (como o Apple Mail) carregam a imagem
        sem a pessoa abrir. E-mail encaminhado conta para o destinatário original.
      </p>
    </section>
  );
}

/** Pré-visualização isolada: sandbox sem scripts, então HTML colado não executa nada no app. */
function EmailPreview({ subject, html }: { subject: string; html: string }) {
  const [debounced, setDebounced] = useState(html);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(html), 300);
    return () => clearTimeout(t);
  }, [html]);

  return (
    <section className="preview" aria-label="Pré-visualização do e-mail">
      <div className="preview-head">
        <span className="muted small">Assunto</span>
        <strong>{subject || <span className="muted">sem assunto</span>}</strong>
      </div>
      <iframe title="Pré-visualização do e-mail" sandbox="" srcDoc={debounced} className="preview-frame" />
    </section>
  );
}
