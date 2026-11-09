/** Catálogo de motores de QR (NFC-e). Preferência em localStorage. */

export type QrEngineId = 'native' | 'qr-scanner' | 'zxing' | 'jsqr';

export interface QrEngineMeta {
  id: QrEngineId;
  name: string;
  blurb: string;
}

export const QR_ENGINES: readonly QrEngineMeta[] = [
  {
    id: 'jsqr',
    name: 'jsQR',
    blurb: 'Padrão. Port JS puro do ZXing (cozmo). Decodifica frame a frame no canvas.',
  },
  {
    id: 'qr-scanner',
    name: 'qr-scanner (Nimiq)',
    blurb: 'BarcodeDetector quando dá; senão worker jsQR.',
  },
  {
    id: 'native',
    name: 'BarcodeDetector',
    blurb: 'API nativa do browser (Chrome/Android). Pode faltar no iOS/Safari.',
  },
  {
    id: 'zxing',
    name: 'ZXing',
    blurb: '@zxing/browser — motor anterior do app.',
  },
] as const;

/** Default canônico — nunca outro. */
export const DEFAULT_QR_ENGINE: QrEngineId = 'jsqr';
const STORAGE_KEY = 'nt_qr_engine';
const OBSOLETE_VALUES = new Set(['html5-qrcode']);

export function isQrEngineId(v: string): v is QrEngineId {
  return QR_ENGINES.some((e) => e.id === v);
}

export function getQrEngineMeta(id: QrEngineId): QrEngineMeta {
  return QR_ENGINES.find((e) => e.id === id) ?? QR_ENGINES[0]!;
}

export function isQrEngineAvailable(id: QrEngineId): boolean {
  if (typeof window === 'undefined') return id !== 'native';
  if (id === 'native') return 'BarcodeDetector' in window;
  return true;
}

export function loadQrEngine(): QrEngineId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && OBSOLETE_VALUES.has(raw)) {
      localStorage.setItem(STORAGE_KEY, DEFAULT_QR_ENGINE);
      return DEFAULT_QR_ENGINE;
    }
    if (raw && isQrEngineId(raw) && isQrEngineAvailable(raw)) return raw;
    if (raw && !isQrEngineId(raw)) localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode */
  }
  return DEFAULT_QR_ENGINE;
}

export function saveQrEngine(id: QrEngineId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
