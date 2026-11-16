import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Pencil, Search, Trash2, X } from 'lucide-react';
import { useDeferredValue, useId, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ConfirmDialog, EmptyState, ErrorNote, PageHeader } from '../components/ui.tsx';
import { api, type ImportResult } from '../lib/api.ts';
import { fmtDate, fmtNumber, plural } from '../lib/format.ts';

export function ListPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const renameId = useId();

  const list = useQuery({ queryKey: ['list', id], queryFn: () => api.list(id) });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['list', id] });
    queryClient.invalidateQueries({ queryKey: ['contacts', id] });
    queryClient.invalidateQueries({ queryKey: ['lists'] });
  };

  const rename = useMutation({
    mutationFn: (name: string) => api.renameList(id, name),
    onSuccess: () => {
      setRenaming(null);
      refresh();
    },
  });

  const remove = useMutation({
    mutationFn: () => api.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] });
      navigate('/listas', { replace: true });
    },
  });

  const back = (
    <Link to="/listas" className="back">
      <ArrowLeft size={16} aria-hidden /> Listas
    </Link>
  );

  if (list.error) return <><PageHeader title="Lista" back={back} /><ErrorNote error={list.error} /></>;
  if (!list.data) return <PageHeader title="Carregando…" back={back} />;
  const l = list.data;

  function submitRename(e: FormEvent) {
    e.preventDefault();
    if (renaming !== null) rename.mutate(renaming);
  }

  return (
    <>
      <PageHeader
        back={back}
        title={
          renaming === null ? (
            l.name
          ) : (
            <form className="rename" onSubmit={submitRename}>
              <label htmlFor={renameId} className="sr-only">
                Nome da lista
              </label>
              <input id={renameId} autoFocus required maxLength={120} value={renaming} onChange={(e) => setRenaming(e.target.value)} />
              <button type="submit" className="btn btn-primary" disabled={rename.isPending}>
                Salvar
              </button>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setRenaming(null)} aria-label="Cancelar">
                <X size={18} />
              </button>
            </form>
          )
        }
        actions={
          renaming === null && (
            <>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setRenaming(l.name)} aria-label="Renomear lista" title="Renomear">
                <Pencil size={18} strokeWidth={1.75} />
              </button>
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setConfirmDelete(true)} aria-label="Excluir lista" title="Excluir">
                <Trash2 size={18} strokeWidth={1.75} />
              </button>
            </>
          )
        }
      />
      <ErrorNote error={rename.error} />
      <p className="muted lead">
        {plural(l.contactCount, 'contato', 'contatos')}
        {l.suppressedCount > 0 && ` · ${plural(l.suppressedCount, 'descadastrado', 'descadastrados')}`}
      </p>

      <div className="list-layout">
        <ImportPanel listId={id} onDone={refresh} />
        <ContactsTable listId={id} onChange={refresh} />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir lista?"
        confirmLabel="Excluir lista"
        danger
        busy={remove.isPending}
        onConfirm={() => remove.mutate()}
        onClose={() => setConfirmDelete(false)}
      >
        <p>
          “{l.name}” e seus {plural(l.contactCount, 'contato', 'contatos')} serão apagados.
        </p>
        <ErrorNote error={remove.error} />
      </ConfirmDialog>
    </>
  );
}

function ImportPanel({ listId, onDone }: { listId: string; onDone: () => void }) {
  const textId = useId();
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: () => api.importContacts(listId, text),
    onSuccess: (r) => {
      setResult(r);
      if (r.added || r.alreadyInList) setText(r.invalid.map((i) => i.content).join('\n'));
      onDone();
    },
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    importMutation.mutate();
  }

  return (
    <form className="panel import" onSubmit={submit}>
      <h2>Adicionar e-mails</h2>
      <div className="field">
        <label htmlFor={textId}>Um por linha — pode colar da planilha</label>
        <textarea
          id={textId}
          className="code"
          rows={8}
          spellCheck={false}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'ana@empresa.com.br, Ana Lima\nbruno@empresa.com.br\nCarla <carla@empresa.com.br>'}
        />
      </div>
      <ErrorNote error={importMutation.error} />
      {result && (
        <div className="note note-ok" role="status">
          <strong>{plural(result.added, 'e-mail adicionado', 'e-mails adicionados')}</strong>
          {result.alreadyInList + result.duplicatesInInput > 0 && (
            <span> · {fmtNumber(result.alreadyInList + result.duplicatesInInput)} repetidos ignorados</span>
          )}
          {result.invalidCount > 0 && (
            <span className="text-error">
              {' '}
              · {plural(result.invalidCount, 'linha inválida ficou', 'linhas inválidas ficaram')} no campo
            </span>
          )}
        </div>
      )}
      <button type="submit" className="btn btn-primary" disabled={!text.trim() || importMutation.isPending}>
        {importMutation.isPending ? 'Importando…' : 'Adicionar à lista'}
      </button>
    </form>
  );
}

function ContactsTable({ listId, onChange }: { listId: string; onChange: () => void }) {
  const searchId = useId();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());

  const contacts = useQuery({
    queryKey: ['contacts', listId, page, deferredSearch],
    queryFn: () => api.contacts(listId, page, deferredSearch),
    placeholderData: keepPreviousData,
  });

  const remove = useMutation({
    mutationFn: (contactId: string) => api.deleteContact(listId, contactId),
    onSuccess: onChange,
  });

  const data = contacts.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <section className="contacts" aria-labelledby="contacts-title">
      <div className="contacts-head">
        <h2 id="contacts-title">Contatos</h2>
        <div className="search">
          <Search size={16} aria-hidden />
          <label htmlFor={searchId} className="sr-only">
            Buscar contato
          </label>
          <input
            id={searchId}
            type="search"
            placeholder="Buscar e-mail ou nome"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>
      <ErrorNote error={contacts.error ?? remove.error} />

      {data?.total === 0 ? (
        <EmptyState title={deferredSearch ? 'Nada encontrado' : 'Lista vazia'} />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">E-mail</th>
                <th scope="col">Nome</th>
                <th scope="col">Adicionado</th>
                <th scope="col">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    {c.email}
                    {c.isSuppressed && <span className="badge badge-muted">descadastrado</span>}
                  </td>
                  <td>{c.name ?? <span className="muted">—</span>}</td>
                  <td className="num">{fmtDate(c.createdAt)}</td>
                  <td className="cell-action">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => remove.mutate(c.id)}
                      disabled={remove.isPending}
                      aria-label={`Remover ${c.email}`}
                      title="Remover da lista"
                    >
                      <Trash2 size={16} strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="pager" aria-label="Paginação">
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
    </section>
  );
}
