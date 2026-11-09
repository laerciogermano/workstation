import type { BarcodeOrigin, LinkResultDTO } from '@notinhas/contracts';
import { isValidGtin, normalizeGtin } from '@notinhas/domain';
import { useEffect, useState } from 'react';
import { useLinkBarcode, usePhotoCandidates, useSuggestions } from '../../lib/queries';
import { api } from '../../lib/api';
import { ErrorBanner, Photo } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { useCameraScanner, Viewfinder } from './scanner';

export interface LinkTarget {
  storeId: number;
  storeCode: string;
  description: string;
  displayName: string;
}

/**
 * T-23 · US-01.10 · RN-12 — câmera já aberta; três caminhos com origem gravada:
 * sugestão pela descrição (toque vincula), leitura do código (scan) ou digitação com DV.
 */
/** `onLinked` devolve 'next' quando o pai já vai abrir o próximo item (fila de pendentes). */
export function LinkEanSheet({ target, onClose, onLinked }: { target: LinkTarget | null; onClose: () => void; onLinked?: (r: LinkResultDTO) => 'next' | void }) {
  const link = useLinkBarcode();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [typed, setTyped] = useState('');
  const [hit, setHit] = useState(false);
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!target) return;
    setSearch(target.displayName || target.description);
    setDebounced(target.displayName || target.description);
    setTyped('');
    setHit(false);
  }, [target?.storeId, target?.storeCode, target?.description, target?.displayName]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const sugg = useSuggestions(target?.storeId ?? 0, target?.storeCode ?? '', debounced, !!target);

  async function submit(gtin: string, origin: BarcodeOrigin) {
    if (!target || link.isPending) return;
    const r = await link.mutateAsync({ storeId: target.storeId, storeCode: target.storeCode, gtin, origin });
    setTyped('');
    setHit(false);
    if (r.status === 'flagged') toast({ text: 'Esse item já tinha outro código. Mandamos para revisão — obrigado!' });
    else toast({ text: r.pointsAwarded ? `Vinculado · +${r.pointsAwarded} pontos` : 'Código vinculado' });
    if (onLinked?.(r) === 'next') return;
    if (!r.product.photoUrl && r.status === 'linked') setPhotoFor(r.product.gtin);
    else onClose();
  }

  const { videoRef, state } = useCameraScanner(
    'ean',
    (text) => {
      const g = normalizeGtin(text);
      if (isValidGtin(g)) {
        setHit(true);
        void submit(g, 'barcode_scan');
      }
    },
    !!target && !photoFor,
  );
  const clean = normalizeGtin(typed);
  const typedOk = clean.length >= 8 && isValidGtin(clean);
  const typedBad = clean.length >= 8 && !typedOk;

  if (photoFor) return <PhotoPickerSheet gtin={photoFor} onClose={() => { setPhotoFor(null); onClose(); }} />;

  return (
    <Sheet open={!!target} onClose={onClose} title="Vincular código de barras">
      <p className="meta">
        {target?.displayName} · <span className="mono">{target?.description}</span> · cód. {target?.storeCode}
      </p>
      <div className="cam short mt12" style={{ borderRadius: 18 }}>
        <video ref={videoRef} muted playsInline />
        <Viewfinder mode="ean" hit={hit} />
        <p>{state === 'live' ? 'Aponte para o código de barras da embalagem' : state === 'starting' ? 'Abrindo a câmera…' : 'Câmera indisponível — use uma sugestão ou digite.'}</p>
      </div>

      <label className="lbl" htmlFor="ean-suggest-q">
        Buscar sugestões pelo texto
      </label>
      <div className="field">
        <span>
          <Icon name="search" />
        </span>
        <input
          id="ean-suggest-q"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ex.: Pringles Original 100g"
          autoComplete="off"
          enterKeyHint="search"
        />
      </div>

      <p className="lbl">Sugestões {sugg.isFetching ? '· buscando…' : sugg.data?.length ? `· ${sugg.data.length}` : ''}</p>
      {sugg.isPending && !sugg.data ? (
        <p className="hint">Buscando pelo texto da nota…</p>
      ) : (sugg.data?.length ?? 0) > 0 ? (
        sugg.data?.map((s) => (
          <button key={s.gtin} className="sug" onClick={() => submit(s.gtin, 'suggestion')} disabled={link.isPending}>
            <Photo url={s.photoUrl} size="xs" />
            <span className="grow">
              <span className="b">{s.title}</span>
              <span className="meta mono" style={{ display: 'block' }}>
                {s.gtin} · {Math.round(s.score * 100)}% · {s.source === 'si5' ? 'SI5' : s.source}
              </span>
              <span className="score">
                <i style={{ width: `${Math.round(s.score * 100)}%` }} />
              </span>
            </span>
            <Icon name="check" />
          </button>
        ))
      ) : (
        <p className="hint">Nenhuma sugestão ainda — refine o texto acima ou escaneie o código da embalagem.</p>
      )}
      <ErrorBanner error={sugg.error} />

      <label className="lbl" htmlFor="ean-typed">
        Ou digite os números
      </label>
      <div className={`field ${typedOk ? 'ok' : typedBad ? 'bad' : ''}`}>
        <span>
          <Icon name="keyboard" />
        </span>
        <input id="ean-typed" inputMode="numeric" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="7891000…" maxLength={18} />
      </div>
      <p className="hint">{typedOk ? 'Dígito verificador confere.' : typedBad ? 'Dígito verificador não confere.' : 'EAN-8, EAN-13 ou GTIN-14.'}</p>
      <ErrorBanner error={link.error} />
      <button className="btn p" disabled={!typedOk || link.isPending} onClick={() => submit(clean, 'manual')}>
        Vincular
      </button>
    </Sheet>
  );
}

/** T-24 · US-01.11 — a foto escolhida vira a foto da ficha para todas as lojas. */
export function PhotoPickerSheet({ gtin, onClose }: { gtin: string; onClose: () => void }) {
  const q = usePhotoCandidates(gtin);
  const [sel, setSel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  async function save() {
    if (!sel) return onClose();
    setSaving(true);
    try {
      await api(`/produtos/${gtin}/fotos`, { method: 'POST', body: { url: sel } });
      toast({ text: 'Foto salva na ficha do produto' });
    } finally {
      setSaving(false);
      onClose();
    }
  }
  return (
    <Sheet open onClose={onClose} title="Escolher foto do produto">
      {q.data && q.data.candidates.length === 0 && <p className="meta">Nenhuma foto encontrada para esse código. Tudo bem — o produto já está vinculado.</p>}
      <div className="photogrid">
        {q.data?.candidates.map((c) => (
          <button key={c.url} className={`cand ${sel === c.url ? 'on' : ''}`} onClick={() => setSel(c.url)} aria-pressed={sel === c.url}>
            <img src={c.url} alt="" loading="lazy" />
            <span>{c.source}</span>
          </button>
        ))}
      </div>
      <div className="duo mt16">
        <button className="btn s" onClick={onClose}>
          Pular
        </button>
        <button className="btn p" onClick={save} disabled={!sel || saving}>
          Usar esta foto
        </button>
      </div>
    </Sheet>
  );
}
