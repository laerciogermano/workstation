import { useParams, Link } from 'react-router';
import { api } from '../../lib/api';
import { useList, useSetListItem } from '../../lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { ErrorBanner, Empty, Photo, Skel, StateView, Stepper } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { useGo } from '../../ui/nav';
import { QuotePanel } from '../../ui/QuotePanel';
import { TopBar } from '../../ui/TopBar';

/** T-42 uma loja · T-41 dividir entre lojas · T-54 gate de crédito — RN-13 (nunca inventa preço). */
export default function ListPage() {
  const { id = '' } = useParams();
  const q = useList(id);
  const setItem = useSetListItem();
  const qc = useQueryClient();
  const go = useGo();
  const d = q.data;

  if (q.isPending) return <><TopBar title="" /><Skel h={64} r={14} /><Skel h={200} r={18} /></>;
  if (!d) return <><TopBar title="Lista" /><ErrorBanner error={q.error} /><StateView icon="list" title="Lista não encontrada" /></>;

  const title = (g: string) => d.items.find((i) => i.gtin === g)?.title ?? g;
  const photo = (g: string) => d.items.find((i) => i.gtin === g)?.photoUrl ?? null;

  return (
    <>
      <TopBar
        title={d.name}
        sub={`${d.items.length} produto${d.items.length === 1 ? '' : 's'}`}
        right={
          <button
            className="ib ghost"
            aria-label="Apagar lista"
            onClick={async () => {
              if (!confirm(`Apagar a lista “${d.name}”?`)) return;
              await api(`/listas/${id}`, { method: 'DELETE' });
              await qc.invalidateQueries({ queryKey: ['personal'] });
              go('/listas', { replace: true });
            }}
          >
            <Icon name="trash" />
          </button>
        }
      />
      <div className="cols2">
        <div>
          {d.items.length === 0 && (
            <Empty icon="list" title="Lista vazia.">
              Adicione produtos pelo + nos cards. <Link to="/busca">Buscar produtos</Link>
            </Empty>
          )}
          {d.items.length > 0 && (
            <div className="card list">
              {d.items.map((i) => (
                <div className="li" key={i.gtin}>
                  <Photo url={i.photoUrl} size="xs" />
                  <Link to={`/produto/${i.gtin}`} className="grow b" style={{ color: 'inherit', fontSize: 13.5 }}>
                    {i.title}
                  </Link>
                  <Stepper value={i.quantity} onChange={(v) => setItem.mutate({ listId: id, gtin: i.gtin, quantity: v })} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <QuotePanel quote={d.quote} credits={d.credits} hasItems={d.items.length > 0} title={title} photo={photo} />
        </div>
      </div>
    </>
  );
}
