import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useId, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { doneCount, EmptyState, ErrorNote, PageHeader, ProgressBar, StatusBadge } from '../components/ui.tsx';
import { api } from '../lib/api.ts';
import { fmtDate, fmtNumber } from '../lib/format.ts';

export function CampaignsPage() {
  const navigate = useNavigate();
  const nameId = useId();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const campaigns = useQuery({
    queryKey: ['campaigns'],
    queryFn: api.campaigns,
    // enquanto alguma estiver enviando, atualiza a lista
    refetchInterval: (q) => (q.state.data?.some((c) => c.status === 'sending') ? 3000 : false),
  });

  const create = useMutation({
    mutationFn: () => api.createCampaign(name),
    onSuccess: (c) => navigate(`/campanhas/${c.id}`),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <>
      <PageHeader
        title="Campanhas"
        actions={
          !creating && (
            <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>
              <Plus size={18} strokeWidth={2} aria-hidden /> Nova campanha
            </button>
          )
        }
      />

      {creating && (
        <form className="inline-form panel" onSubmit={submit}>
          <div className="field grow">
            <label htmlFor={nameId}>Nome da campanha</label>
            <input id={nameId} autoFocus required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Black Friday 2026" />
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

      <ErrorNote error={campaigns.error} />
      {campaigns.data?.length === 0 && (
        <EmptyState title="Nenhuma campanha ainda">
          <p className="muted">Crie a primeira e escolha a lista que vai receber.</p>
        </EmptyState>
      )}

      {!!campaigns.data?.length && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Campanha</th>
                <th scope="col">Lista</th>
                <th scope="col">Situação</th>
                <th scope="col" className="col-progress">Envio</th>
                <th scope="col">Criada em</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.data.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/campanhas/${c.id}`} className="row-link">
                      {c.name}
                    </Link>
                    {c.subject && <div className="muted small">{c.subject}</div>}
                  </td>
                  <td>{c.list?.name ?? <span className="muted">—</span>}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="col-progress">
                    {c.status === 'draft' ? (
                      <span className="muted">—</span>
                    ) : (
                      <div className="progress-cell">
                        <ProgressBar progress={c.progress} label={`Envio de ${c.name}`} />
                        <span className="num small">
                          {fmtNumber(doneCount(c.progress))}/{fmtNumber(c.progress.total)}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="num">{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
