import { useEffect, useState } from 'react';
import { useCreateList, useLists, useSetListItem } from '../../lib/queries';
import { ErrorBanner, Stepper } from '../../ui/bits';
import { useGo } from '../../ui/nav';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';

/** “Adicionar à lista” com quantidade e escolha entre várias listas (REQ-051). */
export function AddToListSheet({ product, onClose }: { product: { gtin: string; title: string } | null; onClose: () => void }) {
  const lists = useLists();
  const [listId, setListId] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [newName, setNewName] = useState('');
  const setItem = useSetListItem();
  const create = useCreateList();
  const toast = useToast();
  const go = useGo();

  useEffect(() => {
    if (product) {
      setQty(1);
      setListId(lists.data?.[0]?.id ?? null);
    }
  }, [product, lists.data]);

  async function confirm() {
    if (!product) return;
    let id = listId;
    let name = lists.data?.find((l) => l.id === id)?.name ?? '';
    if (!id) {
      const l = await create.mutateAsync(newName.trim() || 'Minha lista');
      id = l.id;
      name = l.name;
    }
    await setItem.mutateAsync({ listId: id, gtin: product.gtin, quantity: qty });
    onClose();
    const target = id;
    toast({ text: `Adicionado a “${name}”`, action: { label: 'Ver lista', run: () => go(`/listas/${target}`) } });
  }

  return (
    <Sheet open={!!product} onClose={onClose} title="Adicionar à lista">
      <p className="meta mb12">{product?.title}</p>
      <div className="flex mb12">
        <span className="grow b">Quantidade</span>
        <Stepper value={qty} onChange={setQty} min={1} />
      </div>
      {(lists.data ?? []).map((l) => (
        <button key={l.id} className={`radio ${listId === l.id ? 'on' : ''}`} onClick={() => setListId(l.id)} role="radio" aria-checked={listId === l.id}>
          <span />
          {l.name}
          <em className="meta">{l.itemCount} itens</em>
        </button>
      ))}
      <button className={`radio ${listId === null ? 'on' : ''}`} onClick={() => setListId(null)} role="radio" aria-checked={listId === null}>
        <span />
        Nova lista
      </button>
      {listId === null && (
        <label className="field mt8">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: Compra do mês" aria-label="Nome da nova lista" maxLength={60} />
        </label>
      )}
      <ErrorBanner error={setItem.error ?? create.error} />
      <button className="btn p mt16" onClick={confirm} disabled={setItem.isPending || create.isPending}>
        Adicionar
      </button>
    </Sheet>
  );
}
