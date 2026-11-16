import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { EmptyState, ErrorNote, PageHeader } from '../components/ui.tsx';
import { api } from '../lib/api.ts';
import { fmtDate, fmtNumber } from '../lib/format.ts';

export function ListsPage() {
  const navigate = useNavigate();
  const nameId = useId();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const lists = useQuery({ queryKey: ['lists'], queryFn: api.lists });

  const create = useMutation({
    mutationFn: () => api.createList(name),
    onSuccess: (l) => navigate(`/listas/${l.id}`),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageHeader
        title="Listas"
        actions={
          !creating && (
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={18} strokeWidth={2} aria-hidden /> Nova lista
            </button>
          )
        }
      />

      {creating && (
        <form className="inline-form panel" onSubmit={submit}>
          <div className="field grow">
            <label htmlFor={nameId}>Nome da lista</label>
            <input id={nameId} autoFocus required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Clientes ativos" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            Criar
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => setCreating(false)}>
            Cancelar
          </button>
          <ErrorNote error={create.error} />
        </form>
      )}

      <ErrorNote error={lists.error} />
      {lists.data?.length === 0 && (
        <EmptyState title="Nenhuma lista ainda">
          <p className="muted">Crie uma lista e cole os e-mails da sua base.</p>
        </EmptyState>
      )}

      {!!lists.data?.length && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Lista</th>
                <th scope="col" className="num">Contatos</th>
                <th scope="col" className="num">Descadastrados</th>
                <th scope="col">Criada em</th>
              </tr>
            </thead>
            <tbody>
              {lists.data.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link to={`/listas/${l.id}`} className="row-link">
                      {l.name}
                    </Link>
                  </td>
                  <td className="num">{fmtNumber(l.contactCount)}</td>
                  <td className="num">{l.suppressedCount ? fmtNumber(l.suppressedCount) : <span className="muted">0</span>}</td>
                  <td className="num">{fmtDate(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
