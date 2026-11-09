import type { BarcodeOrigin, LinkResultDTO, SuggestionDTO } from '@notinhas/contracts';
import { isValidGtin, normalizeGtin } from '@notinhas/domain';
import { useEffect, useRef, useState } from 'react';
import { useLinkBarcode, usePhotoCandidates, useSuggestions } from '../../lib/queries';
import { api } from '../../lib/api';
import { ErrorBanner, Photo, photoSrc } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/Toast';
import { useCameraScanner, Viewfinder } from './scanner';

export interface LinkTarget {
  storeId: number;
  storeCode: string;
  description: string;
  displayName: string;
  /** Já tem EAN — fluxo “Alterar” sobrescreve o vínculo. */
  replace?: boolean;
  currentGtin?: string | null;
}

/**
 * T-23 · US-01.10 · RN-12 — câmera já aberta; três caminhos com origem gravada:
 * sugestão pela descrição (toque vincula), leitura do código (scan) ou digitação com DV.
 * Depois do vínculo: T-24 escolher foto (SI5 + Open Food Facts).
 */
/** `onLinked` devolve 'next' quando o pai já vai abrir o próximo item (fila de pendentes). */
export function LinkEanSheet({ target, onClose, onLinked }: { target: LinkTarget | null; onClose: () => void; onLinked?: (r: LinkResultDTO) => 'next' | void }) {
  const link = useLinkBarcode();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [typed, setTyped] = useState('');
  const [hit, setHit] = useState(false);
  const [photoFor, setPhotoFor] = useState<string | null>(null);
  const [seedPhotos, setSeedPhotos] = useState<{ url: string; source: string }[]>([]);
  const pending = useRef<LinkResultDTO | null>(null);
  const toast = useToast();
  const replacing = !!target?.replace;

  useEffect(() => {
    if (!target) return;
    setSearch(target.displayName || target.description);
    setDebounced(target.displayName || target.description);
    setTyped('');
    setHit(false);
    setPhotoFor(null);
    setSeedPhotos([]);
    pending.current = null;
  }, [target?.storeId, target?.storeCode, target?.description, target?.displayName, target?.replace]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const sugg = useSuggestions(target?.storeId ?? 0, target?.storeCode ?? '', debounced, !!target);

  function finish(r: LinkResultDTO) {
    pending.current = null;
    setPhotoFor(null);
    setSeedPhotos([]);
    if (onLinked?.(r) === 'next') return;
    onClose();
  }

  async function submit(gtin: string, origin: BarcodeOrigin, from?: SuggestionDTO) {
    if (!target || link.isPending) return;
    const r = await link.mutateAsync({
      storeId: target.storeId,
      storeCode: target.storeCode,
      gtin,
      origin,
      replace: replacing || undefined,
    });
    setTyped('');
    setHit(false);
    if (r.status === 'flagged') {
      toast({ text: 'Esse item já tinha outro código. Mandamos para revisão — obrigado!' });
      finish(r);
      return;
    }
    if (r.status === 'replaced') toast({ text: 'Código de barras atualizado' });
    else toast({ text: r.pointsAwarded ? `Vinculado · +${r.pointsAwarded} pontos` : 'Código vinculado' });

    const seeds: { url: string; source: string }[] = [];
    if (from?.photoUrl) seeds.push({ url: unwrapProxy(from.photoUrl), source: from.source === 'si5' ? 'SI5' : 'sugestão' });
    pending.current = r;
    setSeedPhotos(seeds);
    setPhotoFor(r.product.gtin);
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

  if (photoFor) {
    return (
      <PhotoPickerSheet
        gtin={photoFor}
        seed={seedPhotos}
        onClose={() => {
          const r = pending.current;
          if (r) finish(r);
          else {
            setPhotoFor(null);
            onClose();
          }
        }}
      />
    );
  }

  return (
    <Sheet open={!!target} onClose={onClose} title={replacing ? 'Alterar código de barras' : 'Vincular código de barras'}>
      <p className="meta">
        {target?.displayName} · <span className="mono">{target?.description}</span> · cód. {target?.storeCode}
        {replacing && target?.currentGtin ? (
          <>
            {' · atual '}
            <span className="mono">{target.currentGtin}</span>
          </>
        ) : null}
      </p>
      <div className="cam short mt12" style={{ borderRadius: 18 }}>
        <video ref={videoRef} muted playsInline />
        <Viewfinder mode="ean" hit={hit} />
        <p>{state === 'live' ? 'Aponte para o código de barras da embalagem' : state === 'starting' ? 'Abrindo a câmera…' : 'Câmera indisponível — digite o código ou use uma sugestão abaixo.'}</p>
      </div>

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

      <label className="lbl" htmlFor="ean-suggest-q">
        Sugestões pela descrição
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
      <p className="hint">{sugg.isFetching ? 'Buscando…' : sugg.data?.length ? `${sugg.data.length} resultado${sugg.data.length === 1 ? '' : 's'} — toque para vincular` : 'Nenhuma sugestão — refine o texto ou escaneie.'}</p>
      {sugg.data?.map((s) => (
        <button key={s.gtin} className="sug" onClick={() => submit(s.gtin, 'suggestion', s)} disabled={link.isPending}>
          <Photo url={s.photoUrl} size="xs" eager />
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
      ))}
      <ErrorBanner error={sugg.error} />
    </Sheet>
  );
}

function unwrapProxy(url: string): string {
  if (url.startsWith('/api/v1/imagens/proxy?')) {
    try {
      return new URL(url, location.origin).searchParams.get('u') || url;
    } catch {
      return url;
    }
  }
  return url;
}

/** T-24 · US-01.11 — a foto escolhida vira a foto da ficha para todas as lojas. */
export function PhotoPickerSheet({
  gtin,
  seed = [],
  onClose,
}: {
  gtin: string;
  seed?: { url: string; source: string }[];
  onClose: () => void;
}) {
  const q = usePhotoCandidates(gtin);
  const [sel, setSel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const candidates = (() => {
    const map = new Map<string, { url: string; source: string }>();
    for (const s of seed) {
      const u = unwrapProxy(s.url);
      if (u) map.set(u, { url: u, source: s.source });
    }
    for (const c of q.data?.candidates ?? []) {
      const u = unwrapProxy(c.url);
      if (u && !map.has(u)) map.set(u, { url: u, source: c.source });
    }
    return [...map.values()];
  })();

  useEffect(() => {
    if (!sel && candidates[0]) setSel(candidates[0].url);
  }, [candidates, sel]);

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
      <p className="meta">Toque na foto que melhor representa o produto. Ela vale para todas as lojas.</p>
      {q.isPending && candidates.length === 0 && <p className="hint mt12">Buscando fotos…</p>}
      {!q.isPending && candidates.length === 0 && (
        <p className="meta mt12">Nenhuma foto encontrada para esse código. Tudo bem — o produto já está vinculado.</p>
      )}
      <div className="photogrid mt12">
        {candidates.map((c) => {
          const src = photoSrc(c.url);
          return (
            <button key={c.url} className={`cand ${sel === c.url ? 'on' : ''}`} onClick={() => setSel(c.url)} aria-pressed={sel === c.url} type="button">
              {src ? <img src={src} alt="" loading="eager" decoding="async" referrerPolicy="no-referrer" /> : <span className="ph-empty" />}
              <span>{c.source}</span>
            </button>
          );
        })}
      </div>
      <ErrorBanner error={q.error} />
      <div className="duo mt16">
        <button className="btn s" type="button" onClick={onClose}>
          Pular
        </button>
        <button className="btn p" type="button" onClick={save} disabled={!sel || saving || candidates.length === 0}>
          Usar esta foto
        </button>
      </div>
    </Sheet>
  );
}
