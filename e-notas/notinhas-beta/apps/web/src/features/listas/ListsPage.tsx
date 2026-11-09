import { useState } from 'react';
import { Link } from 'react-router';
import { brl, when } from '../../lib/format';
import { useCreateList, useLists } from '../../lib/queries';
import { Empty, ErrorBanner, Skel } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useGo } from '../../ui/nav';
import { Sheet } from '../../ui/Sheet';

/** T-40 · REQ-051 — várias listas, sem login obrigatório (posse pelo fingerprint). */
export default function ListsPage() {
  const q = useLists();
  const create = useCreateList();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const go = useGo();

  return (
    <>
      <div className="h1row" style={{ marginTop: 12 }}>
        <h1 className="h1">Listas</h1>
        <button className="btn p sm" onClick={() => setNaming(true)}>
          <Icon name="plus" />
          Nova lista
        </button>
      </div>
      <p className="lede">Monte a lista e veja quanto ela custa em cada loja — ou dividindo entre lojas.</p>
      <ErrorBanner error={q.error} />
      {q.isPending && [0, 1].map((i) => <Skel key={i} h={88} r={18} />)}
      {q.data?.length === 0 && (
        <Empty icon="list" title="Nenhuma lista ainda.">
          Toque no + de qualquer produto para começar, ou crie uma lista agora.
        </Empty>
      )}
      {q.data?.map((l) => (
        <Link key={l.id} to={`/listas/${l.id}`} viewTransition className="lcard">
          <div className="flex">
            <span className="grow">
              <span className="b" style={{ fontSize: 16 }}>
                {l.name}
              </span>
              <span className="meta" style={{ display: 'block' }}>
                {l.itemCount} produto{l.itemCount === 1 ? '' : 's'} · atualizada {when(l.updatedAt)}
              </span>
            </span>
            {l.bestTotalCents !== null && (
              <span className="price menor tnum" style={{ fontSize: 18 }}>
                {brl(l.bestTotalCents)}
              </span>
            )}
            <Icon name="next" />
          </div>
        </Link>
      ))}
      <Sheet open={naming} onClose={() => setNaming(false)} title="Nova lista">
        <label className="field">
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Compra do mês" aria-label="Nome da lista" maxLength={60} />
        </label>
        <ErrorBanner error={create.error} />
        <button
          className="btn p mt8"
          disabled={!name.trim() || create.isPending}
          onClick={async () => {
            const l = await create.mutateAsync(name.trim());
            setNaming(false);
            setName('');
            go(`/listas/${l.id}`);
          }}
        >
          Criar
        </button>
      </Sheet>
    </>
  );
}
