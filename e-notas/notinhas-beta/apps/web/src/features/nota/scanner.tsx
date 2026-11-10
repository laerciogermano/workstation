import { useEffect, useRef, useState } from 'react';
import { isValidGtin, normalizeGtin } from '@notinhas/domain';
import { DEFAULT_EAN_ENGINE, type EanEngineId } from './ean-engines';
import { decodeEanWithEngine, startEanCamera } from './ean-runners';
import { DEFAULT_QR_ENGINE, type QrEngineId } from './qr-engines';
import { decodeQrWithEngine, startQrCamera } from './qr-runners';

export type ScanMode = 'qr' | 'ean';

/** Resultado: barras e/ou VOCR (OCR dos dígitos impressos). */
export interface ScanHit {
  code: string;
  /** Dígitos lidos por OCR; null se OCR falhou ou modo QR. */
  vocr: string | null;
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

/** Decodifica QR/EAN de uma foto com o motor escolhido. */
export async function decodeImageFile(
  file: File,
  mode: ScanMode,
  engine?: QrEngineId | EanEngineId,
): Promise<ScanHit | null> {
  if (mode === 'qr') {
    const id = (engine as QrEngineId | undefined) ?? DEFAULT_QR_ENGINE;
    const code = await decodeQrWithEngine(id, file);
    return code ? { code, vocr: null } : null;
  }

  const id = (engine as EanEngineId | undefined) ?? DEFAULT_EAN_ENGINE;
  try {
    const code = await decodeEanWithEngine(id, file);
    const vocr = await readVocrFromBitmap(file);
    if (code) return { code, vocr: validEan(vocr) ?? vocr };
    const only = validEan(vocr);
    return only ? { code: only, vocr: only } : null;
  } catch {
    const vocr = await readVocrFromBitmap(file);
    const only = validEan(vocr);
    return only ? { code: only, vocr: only } : null;
  }
}

export type CameraState = 'starting' | 'live' | 'denied' | 'unsupported';

/**
 * Câmera contínua (RN-07: HTTPS).
 * QR / EAN → motor selecionável; EAN ainda roda OCR periódico (VOCR).
 */
export function useCameraScanner(
  mode: ScanMode,
  onResult: (hit: ScanHit) => void,
  enabled = true,
  engine: QrEngineId | EanEngineId = mode === 'qr' ? DEFAULT_QR_ENGINE : DEFAULT_EAN_ENGINE,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
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
        const video = videoRef.current;
        if (!video) return;

        if (mode === 'qr') {
          stopCamera = await startQrCamera(engine as QrEngineId, {
            video,
            signal,
            onCode: (code) => {
              if (!stopped && !busy.current) emit({ code, vocr: null });
            },
          });
        } else {
          stopCamera = await startEanCamera(engine as EanEngineId, {
            video,
            signal,
            onCode: (code) => {
              if (stopped || busy.current) return;
              void (async () => {
                let vocr: string | null = null;
                if (videoRef.current) vocr = await readVocrFromVideo(videoRef.current, ocrWorker);
                emit({ code, vocr: validEan(vocr) ?? vocr });
              })();
            },
          });

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
  }, [mode, enabled, engine]);

  return { videoRef, state };
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
