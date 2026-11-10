/** Catálogo de motores de EAN/barras. Preferência em localStorage. */

export type EanEngineId = 'zxing' | 'native' | 'quagga2';

export interface EanEngineMeta {
  id: EanEngineId;
  name: string;
  blurb: string;
}

export const EAN_ENGINES: readonly EanEngineMeta[] = [
  {
    id: 'zxing',
    name: 'ZXing',
    blurb: '@zxing/browser — motor atual do app (padrão).',
  },
  {
    id: 'native',
    name: 'BarcodeDetector',
    blurb: 'API nativa (EAN/UPC). Pode faltar no iOS/Safari.',
  },
  {
    id: 'quagga2',
    name: 'Quagga2',
    blurb: '@ericblade/quagga2 — leitor clássico de barras 1D.',
  },
] as const;

export const DEFAULT_EAN_ENGINE: EanEngineId = 'zxing';
const STORAGE_KEY = 'nt_ean_engine';
/** Chaves antigas / inválidas a limpar (ex.: opções removidas). */
const OBSOLETE_KEYS = ['nt_ean_engine_html5', 'nt_barcode_engine'] as const;

export function isEanEngineId(v: string): v is EanEngineId {
  return EAN_ENGINES.some((e) => e.id === v);
}

export function getEanEngineMeta(id: EanEngineId): EanEngineMeta {
  return EAN_ENGINES.find((e) => e.id === id) ?? EAN_ENGINES[0]!;
}

export function isEanEngineAvailable(id: EanEngineId): boolean {
  if (typeof window === 'undefined') return id !== 'native';
  if (id === 'native') return 'BarcodeDetector' in window;
  return true;
}

function clearObsolete(): void {
  try {
    for (const k of OBSOLETE_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && !isEanEngineId(raw)) localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function loadEanEngine(): EanEngineId {
  clearObsolete();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isEanEngineId(raw) && isEanEngineAvailable(raw)) return raw;
    if (raw && !isEanEngineId(raw)) localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
  return DEFAULT_EAN_ENGINE;
}

export function saveEanEngine(id: EanEngineId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
