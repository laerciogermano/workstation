import { useEffect, useRef, useState } from 'react';
import type { BrowserMultiFormatReader as Reader } from '@zxing/browser';
import { isValidGtin, normalizeGtin } from '@notinhas/domain';
import { getQrEngineMeta, type QrEngineId } from './qr-engines';
import { decodeQrWithEngine, startQrCamera } from './qr-runners';

export type ScanMode = 'qr' | 'ean';

/** Resultado: barras e/ou VOCR (OCR dos dígitos impressos). */
export interface ScanHit {
  code: string;
  /** Dígitos lidos por OCR; null se OCR falhou ou modo QR. */
  vocr: string | null;
}

/** zxing só para EAN. Lazy fora do bundle inicial. */
async function createEanReader(): Promise<Reader> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF];
  return new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]));
}

/** Extrai a melhor sequência numérica (8–14) do texto OCR. */
function pickDigitRun(text: string): string | null {
  const runs = text.replace(/\s+/g, '').match(/\d{8,14}/g);
  if (!runs?.length) return null;
  return runs.sort((a, b) => b.length - a.length)[0] ?? null;
}

function validEan(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const g = normalizeGtin(raw);
  return isValidGtin(g) ? g : null;
}

type OcrWorker = { recognize: (img: HTMLCanvasElement) => Promise<{ data: { text: string } }>; terminate: () => Promise<void> };

async function createOcrWorker(): Promise<OcrWorker> {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng', 1, { logger: () => undefined });
  await worker.setParameters({
    tessedit_char_whitelist: '0123456789',
  });
  return worker as unknown as OcrWorker;
}

/** OCR na faixa inferior do frame (HRI / número sob as barras). */
async function readVocrFromVideo(video: HTMLVideoElement, worker?: OcrWorker | null): Promise<string | null> {
  if (video.readyState < 2 || video.videoWidth < 8) return null;
  const w = video.videoWidth;
  const h = video.videoHeight;
  const canvas = document.createElement('canvas');
  const cropY = Math.floor(h * 0.4);
  const cropH = Math.floor(h * 0.55);
  canvas.width = w;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, cropY, w, cropH, 0, 0, w, cropH);
  try {
    if (worker) {
      const result = await worker.recognize(canvas);
      return pickDigitRun((result.data.text || '').replace(/[^\d\s]/g, ' '));
    }
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(canvas, 'eng', { logger: () => undefined });
    return pickDigitRun((result.data.text || '').replace(/[^\d\s]/g, ' '));
  } catch {
    return null;
  }
}

async function readVocrFromBitmap(file: File): Promise<string | null> {
  try {
    const Tesseract = await import('tesseract.js');
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const cropY = Math.floor(img.height * 0.4);
    const cropH = Math.floor(img.height * 0.55);
    canvas.width = img.width;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      img.close();
      return null;
    }
    ctx.drawImage(img, 0, cropY, img.width, cropH, 0, 0, img.width, cropH);
    img.close();
    const result = await Tesseract.recognize(canvas, 'eng', { logger: () => undefined });
    return pickDigitRun((result.data.text || '').replace(/[^\d\s]/g, ' '));
  } catch {
    return null;
  }
}

/** Decodifica QR/EAN de uma foto. QR usa o motor escolhido. */
export async function decodeImageFile(file: File, mode: ScanMode, qrEngine?: QrEngineId): Promise<ScanHit | null> {
  if (mode === 'qr') {
    const id = qrEngine ?? 'qr-scanner';
    const code = await decodeQrWithEngine(id, file);
    return code ? { code, vocr: null } : null;
  }

  const reader = await createEanReader();
  const url = URL.createObjectURL(file);
  try {
    try {
      const r = await reader.decodeFromImageUrl(url);
      const code = r.getText();
      const vocr = await readVocrFromBitmap(file);
      return { code, vocr: validEan(vocr) ?? vocr };
    } catch {
      const vocr = await readVocrFromBitmap(file);
      const code = validEan(vocr);
      return code ? { code, vocr: code } : null;
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type CameraState = 'starting' | 'live' | 'denied' | 'unsupported';

/**
 * Câmera contínua (RN-07: HTTPS).
 * QR → motor selecionável; EAN → zxing + OCR periódico.
 */
export function useCameraScanner(
  mode: ScanMode,
  onResult: (hit: ScanHit) => void,
  enabled = true,
  qrEngine: QrEngineId = 'qr-scanner',
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CameraState>('starting');
  const cb = useRef(onResult);
  const busy = useRef(false);
  useEffect(() => {
    cb.current = onResult;
  }, [onResult]);

  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    const signal = { stopped: false };
    let stopCamera: (() => void) | null = null;
    let ocrTimer: ReturnType<typeof setInterval> | null = null;
    let ocrWorker: OcrWorker | null = null;
    let ocrRunning = false;

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }
    setState('starting');

    const emit = (hit: ScanHit) => {
      if (stopped || busy.current) return;
      busy.current = true;
      navigator.vibrate?.(40);
      cb.current(hit);
      setTimeout(() => {
        busy.current = false;
      }, 1200);
    };

    (async () => {
      try {
        if (mode === 'qr') {
          const video = videoRef.current;
          const host = hostRef.current;
          if (!video || !host) return;
          const needsHost = getQrEngineMeta(qrEngine).needs === 'host';
          video.classList.toggle('off', needsHost);
          host.classList.toggle('off', !needsHost);
          stopCamera = await startQrCamera(qrEngine, {
            video,
            host,
            signal,
            onCode: (code) => {
              if (!stopped && !busy.current) emit({ code, vocr: null });
            },
          });
        } else {
          if (!videoRef.current) return;
          videoRef.current.classList.remove('off');
          hostRef.current?.classList.add('off');
          const reader = await createEanReader();
          if (stopped || !videoRef.current) return;
          const controls = await reader.decodeFromConstraints(
            { video: { facingMode: 'environment' } },
            videoRef.current,
            (result) => {
              if (!result || stopped || busy.current) return;
              void (async () => {
                const code = result.getText();
                let vocr: string | null = null;
                if (videoRef.current) {
                  vocr = await readVocrFromVideo(videoRef.current, ocrWorker);
                }
                emit({ code, vocr: validEan(vocr) ?? vocr });
              })();
            },
          );
          stopCamera = () => controls.stop();

          try {
            ocrWorker = await createOcrWorker();
          } catch {
            ocrWorker = null;
          }
          ocrTimer = setInterval(() => {
            if (stopped || busy.current || ocrRunning || !videoRef.current) return;
            ocrRunning = true;
            void (async () => {
              try {
                const raw = await readVocrFromVideo(videoRef.current!, ocrWorker);
                const code = validEan(raw);
                if (code) emit({ code, vocr: code });
              } finally {
                ocrRunning = false;
              }
            })();
          }, 1600);
        }

        if (stopped) stopCamera?.();
        else setState('live');
      } catch (e) {
        if (!stopped) setState(e instanceof DOMException && e.name === 'NotAllowedError' ? 'denied' : 'unsupported');
      }
    })();

    return () => {
      stopped = true;
      signal.stopped = true;
      stopCamera?.();
      if (ocrTimer) clearInterval(ocrTimer);
      void ocrWorker?.terminate().catch(() => undefined);
    };
  }, [mode, enabled, qrEngine]);

  return { videoRef, hostRef, state };
}

export function Viewfinder({ mode, hit }: { mode: ScanMode; hit: boolean }) {
  return (
    <div className={`vf ${mode === 'ean' ? 'bar' : ''} ${hit ? 'hit' : ''}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}
