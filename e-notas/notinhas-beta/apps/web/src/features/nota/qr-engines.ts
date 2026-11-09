/** Catálogo de motores de QR (NFC-e). Preferência em localStorage. */

export type QrEngineId = 'native' | 'qr-scanner' | 'zxing' | 'jsqr';

export interface QrEngineMeta {
  id: QrEngineId;
  name: string;
  blurb: string;
}

export const QR_ENGINES: readonly QrEngineMeta[] = [
  {
    id: 'native',
    name: 'BarcodeDetector',
    blurb: 'API nativa do browser (Chrome/Android). Leve; pode faltar no iOS/Safari.',
  },
  {
    id: 'qr-scanner',
    name: 'qr-scanner (Nimiq)',
    blurb: 'Usa BarcodeDetector quando dá; senão worker jsQR. Bom no cupom.',
  },
  {
    id: 'zxing',
    name: 'ZXing',
    blurb: '@zxing/browser — o motor anterior do app.',
  },
  {
    id: 'jsqr',
    name: 'jsQR',
    blurb: 'Port JS puro do ZXing (cozmo). Decodifica frame a frame no canvas.',
  },
] as const;

export const DEFAULT_QR_ENGINE: QrEngineId = 'qr-scanner';
const STORAGE_KEY = 'nt_qr_engine';

export function isQrEngineId(v: string): v is QrEngineId {
  return QR_ENGINES.some((e) => e.id === v);
}

export function getQrEngineMeta(id: QrEngineId): QrEngineMeta {
  return QR_ENGINES.find((e) => e.id === id) ?? QR_ENGINES[1]!;
}

/** BarcodeDetector só existe em alguns browsers. */
export function isQrEngineAvailable(id: QrEngineId): boolean {
  if (typeof window === 'undefined') return id !== 'native';
  if (id === 'native') return 'BarcodeDetector' in window;
  return true;
}

export function loadQrEngine(): QrEngineId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && isQrEngineId(raw) && isQrEngineAvailable(raw)) return raw;
  } catch {
    /* private mode */
  }
  return isQrEngineAvailable(DEFAULT_QR_ENGINE) ? DEFAULT_QR_ENGINE : 'zxing';
}

export function saveQrEngine(id: QrEngineId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
}
