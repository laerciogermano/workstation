import { useEffect, useRef, useState } from 'react';
import type { BrowserMultiFormatReader as Reader } from '@zxing/browser';

export type ScanMode = 'qr' | 'ean';

/** Resultado da leitura: barras (zxing) + VOCR (OCR dos dígitos impressos no mesmo frame). */
export interface ScanHit {
  code: string;
  /** Dígitos lidos por OCR sob/ao lado do código; null se OCR falhou ou modo QR. */
  vocr: string | null;
}

/** zxing carregado só quando a câmera abre (fora do bundle inicial). */
async function createReader(mode: ScanMode): Promise<Reader> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
  const formats =
    mode === 'qr'
      ? [BarcodeFormat.QR_CODE]
      : [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF];
  return new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]));
}

/** Extrai a melhor sequência numérica (8–14) do texto OCR. */
function pickDigitRun(text: string): string | null {
  const runs = text.replace(/\s+/g, '').match(/\d{8,14}/g);
  if (!runs?.length) return null;
  return runs.sort((a, b) => b.length - a.length)[0] ?? null;
}

/** OCR dos dígitos no frame atual do vídeo (faixa inferior — onde costuma estar o HRI/VOCR). */
async function readVocrFromVideo(video: HTMLVideoElement): Promise<string | null> {
  if (video.readyState < 2 || video.videoWidth < 8) return null;
  const w = video.videoWidth;
  const h = video.videoHeight;
  const canvas = document.createElement('canvas');
  // Faixa central-inferior: número impresso sob as barras.
  const cropY = Math.floor(h * 0.45);
  const cropH = Math.floor(h * 0.5);
  canvas.width = w;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, cropY, w, cropH, 0, 0, w, cropH);
  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(canvas, 'eng', {
      logger: () => undefined,
    });
    // Só dígitos — reduz ruído do OCR.
    const raw = (result.data.text || '').replace(/[^\d\s]/g, ' ');
    return pickDigitRun(raw);
  } catch {
    return null;
  }
}

/** Decodifica QR/EAN de uma foto (T-21, T-24): reflexo, papel amassado ou câmera fraca. */
export async function decodeImageFile(file: File, mode: ScanMode): Promise<ScanHit | null> {
  const reader = await createReader(mode);
  const url = URL.createObjectURL(file);
  try {
    const r = await reader.decodeFromImageUrl(url);
    const code = r.getText();
    if (mode !== 'ean') return { code, vocr: null };
    // OCR na mesma imagem (foto estática).
    try {
      const Tesseract = await import('tesseract.js');
      const img = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const cropY = Math.floor(img.height * 0.45);
      const cropH = Math.floor(img.height * 0.5);
      canvas.width = img.width;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return { code, vocr: null };
      ctx.drawImage(img, 0, cropY, img.width, cropH, 0, 0, img.width, cropH);
      img.close();
      const result = await Tesseract.recognize(canvas, 'eng', { logger: () => undefined });
      const vocr = pickDigitRun((result.data.text || '').replace(/[^\d\s]/g, ' '));
      return { code, vocr };
    } catch {
      return { code, vocr: null };
    }
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type CameraState = 'starting' | 'live' | 'denied' | 'unsupported';

/**
 * Câmera contínua (RN-07: exige HTTPS). Sem permissão ou sem HTTPS, estado vira `denied`/`unsupported`
 * e a tela oferece foto e colar link (T-70) — o fluxo nunca trava.
 * No modo EAN, após o zxing, tenta OCR (VOCR) no mesmo frame.
 */
export function useCameraScanner(mode: ScanMode, onResult: (hit: ScanHit) => void, enabled = true) {
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
    let controls: { stop: () => void } | null = null;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setState('unsupported');
      return;
    }
    setState('starting');
    (async () => {
      try {
        const reader = await createReader(mode);
        if (stopped || !videoRef.current) return;
        controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, videoRef.current, (result) => {
          if (!result || stopped || busy.current) return;
          busy.current = true;
          void (async () => {
            try {
              const code = result.getText();
              navigator.vibrate?.(40);
              let vocr: string | null = null;
              if (mode === 'ean' && videoRef.current) {
                vocr = await readVocrFromVideo(videoRef.current);
              }
              if (!stopped) cb.current({ code, vocr });
            } finally {
              // Evita rajada de leituras enquanto o pai processa.
              setTimeout(() => {
                busy.current = false;
              }, 1200);
            }
          })();
        });
        if (stopped) controls.stop();
        else setState('live');
      } catch (e) {
        if (!stopped) setState(e instanceof DOMException && e.name === 'NotAllowedError' ? 'denied' : 'unsupported');
      }
    })();
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [mode, enabled]);

  return { videoRef, state };
}

export function Viewfinder({ mode, hit }: { mode: ScanMode; hit: boolean }) {
  return (
    <div className={`vf ${mode === 'ean' ? 'bar' : ''} ${hit ? 'hit' : ''}`} aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
      {/* laser up/down removido — corners do vf intactos */}
    </div>
  );
}
