import { useEffect, useRef, useState } from 'react';
import type { BrowserMultiFormatReader as Reader } from '@zxing/browser';

export type ScanMode = 'qr' | 'ean';

/** zxing carregado só quando a câmera abre (fora do bundle inicial). */
async function createReader(mode: ScanMode): Promise<Reader> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
  const formats =
    mode === 'qr'
      ? [BarcodeFormat.QR_CODE]
      : [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF];
  return new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]));
}

/** Decodifica QR/EAN de uma foto (T-21, T-24): reflexo, papel amassado ou câmera fraca. */
export async function decodeImageFile(file: File, mode: ScanMode): Promise<string | null> {
  const reader = await createReader(mode);
  const url = URL.createObjectURL(file);
  try {
    const r = await reader.decodeFromImageUrl(url);
    return r.getText();
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
 */
export function useCameraScanner(mode: ScanMode, onResult: (text: string) => void, enabled = true) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<CameraState>('starting');
  const cb = useRef(onResult);
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
          if (result && !stopped) {
            navigator.vibrate?.(40);
            cb.current(result.getText());
          }
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
      <span className="laser" />
    </div>
  );
}
