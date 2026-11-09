import type { QrEngineId } from './qr-engines';

export type QrStop = () => void;

type StartOpts = {
  video: HTMLVideoElement;
  host: HTMLElement;
  onCode: (text: string) => void;
  signal: { stopped: boolean };
};

async function playEnvironment(video: HTMLVideoElement): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  });
  video.srcObject = stream;
  video.setAttribute('playsinline', 'true');
  video.muted = true;
  await video.play();
  return stream;
}

function stopStream(video: HTMLVideoElement) {
  const stream = video.srcObject;
  if (stream instanceof MediaStream) {
    for (const t of stream.getTracks()) t.stop();
  }
  video.srcObject = null;
}

function qrRegion(video: HTMLVideoElement) {
  const smallest = Math.min(video.videoWidth, video.videoHeight);
  const size = Math.floor(smallest * 0.85);
  return {
    x: Math.floor((video.videoWidth - size) / 2),
    y: Math.floor((video.videoHeight - size) / 2),
    width: size,
    height: size,
    downScaledWidth: 480,
    downScaledHeight: 480,
  };
}

async function startNative({ video, onCode, signal }: StartOpts): Promise<QrStop> {
  const BD = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } })
    .BarcodeDetector;
  if (!BD) throw new Error('BarcodeDetector indisponível');
  const detector = new BD({ formats: ['qr_code'] });
  await playEnvironment(video);
  let raf = 0;
  let busy = false;
  const tick = () => {
    if (signal.stopped) return;
    raf = requestAnimationFrame(tick);
    if (busy || video.readyState < 2) return;
    busy = true;
    void detector
      .detect(video)
      .then((codes) => {
        const text = codes[0]?.rawValue?.trim();
        if (text) onCode(text);
      })
      .catch(() => undefined)
      .finally(() => {
        busy = false;
      });
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    stopStream(video);
  };
}

async function startQrScanner({ video, onCode, signal }: StartOpts): Promise<QrStop> {
  const [{ default: QrScanner }, workerUrl] = await Promise.all([
    import('qr-scanner'),
    import('qr-scanner/qr-scanner-worker.min.js?url'),
  ]);
  QrScanner.WORKER_PATH = workerUrl.default;
  if (signal.stopped) return () => undefined;
  const scanner = new QrScanner(
    video,
    (result) => {
      const code = typeof result === 'string' ? result : result.data;
      if (code?.trim()) onCode(code.trim());
    },
    {
      preferredCamera: 'environment',
      maxScansPerSecond: 12,
      returnDetailedScanResult: true,
      calculateScanRegion: qrRegion,
    },
  );
  await scanner.start();
  return () => {
    scanner.stop();
    scanner.destroy();
  };
}

async function startZxing({ video, onCode, signal }: StartOpts): Promise<QrStop> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  if (signal.stopped) return () => undefined;
  const reader = new BrowserMultiFormatReader(
    new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]]]),
  );
  const controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (result) => {
    const text = result?.getText()?.trim();
    if (text) onCode(text);
  });
  return () => controls.stop();
}

async function startHtml5({ host, onCode, signal }: StartOpts): Promise<QrStop> {
  const { Html5Qrcode } = await import('html5-qrcode');
  if (signal.stopped) return () => undefined;
  host.replaceChildren();
  host.id = host.id || 'nt-html5-qr';
  const scanner = new Html5Qrcode(host.id, { verbose: false });
  await scanner.start(
    { facingMode: 'environment' },
    { fps: 12, qrbox: (w, h) => {
      const s = Math.floor(Math.min(w, h) * 0.75);
      return { width: s, height: s };
    }, aspectRatio: 1 },
    (text) => {
      if (text?.trim()) onCode(text.trim());
    },
    () => undefined,
  );
  return () => {
    void scanner.stop().catch(() => undefined).then(() => {
      try {
        scanner.clear();
      } catch {
        /* já limpo */
      }
      host.replaceChildren();
    });
  };
}

async function startJsQr({ video, onCode, signal }: StartOpts): Promise<QrStop> {
  const { default: jsQR } = await import('jsqr');
  await playEnvironment(video);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    stopStream(video);
    throw new Error('Canvas 2D indisponível');
  }
  let raf = 0;
  const tick = () => {
    if (signal.stopped) return;
    raf = requestAnimationFrame(tick);
    if (video.readyState < 2 || video.videoWidth < 8) return;
    const region = qrRegion(video);
    canvas.width = region.downScaledWidth;
    canvas.height = region.downScaledHeight;
    ctx.drawImage(
      video,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
    if (code?.data?.trim()) onCode(code.data.trim());
  };
  raf = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(raf);
    stopStream(video);
  };
}

/** Liga a câmera no motor escolhido. */
export async function startQrCamera(id: QrEngineId, opts: StartOpts): Promise<QrStop> {
  switch (id) {
    case 'native':
      return startNative(opts);
    case 'qr-scanner':
      return startQrScanner(opts);
    case 'zxing':
      return startZxing(opts);
    case 'html5-qrcode':
      return startHtml5(opts);
    case 'jsqr':
      return startJsQr(opts);
    default: {
      const _exhaustive: never = id;
      throw new Error(`Motor desconhecido: ${_exhaustive}`);
    }
  }
}

async function decodeNativeImage(file: File): Promise<string | null> {
  const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } })
    .BarcodeDetector;
  if (!BD) return null;
  const bitmap = await createImageBitmap(file);
  try {
    const codes = await new BD({ formats: ['qr_code'] }).detect(bitmap);
    return codes[0]?.rawValue?.trim() || null;
  } finally {
    bitmap.close();
  }
}

async function decodeQrScannerImage(file: File): Promise<string | null> {
  const [{ default: QrScanner }, workerUrl] = await Promise.all([
    import('qr-scanner'),
    import('qr-scanner/qr-scanner-worker.min.js?url'),
  ]);
  QrScanner.WORKER_PATH = workerUrl.default;
  try {
    const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
    const text = typeof result === 'string' ? result : result.data;
    return text?.trim() || null;
  } catch {
    return null;
  }
}

async function decodeZxingImage(file: File): Promise<string | null> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  const reader = new BrowserMultiFormatReader(
    new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]]]),
  );
  const url = URL.createObjectURL(file);
  try {
    const r = await reader.decodeFromImageUrl(url);
    return r.getText()?.trim() || null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function decodeHtml5Image(file: File): Promise<string | null> {
  const { Html5Qrcode } = await import('html5-qrcode');
  const host = document.createElement('div');
  host.id = `nt-html5-file-${Date.now()}`;
  host.hidden = true;
  document.body.appendChild(host);
  const scanner = new Html5Qrcode(host.id, { verbose: false });
  try {
    const text = await scanner.scanFile(file, false);
    return text?.trim() || null;
  } catch {
    return null;
  } finally {
    try {
      scanner.clear();
    } catch {
      /* ignore */
    }
    host.remove();
  }
}

async function decodeJsQrImage(file: File): Promise<string | null> {
  const { default: jsQR } = await import('jsqr');
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'attemptBoth' });
    return code?.data?.trim() || null;
  } finally {
    bitmap.close();
  }
}

/** Decodifica QR de foto/arquivo com o motor escolhido. */
export async function decodeQrWithEngine(id: QrEngineId, file: File): Promise<string | null> {
  switch (id) {
    case 'native':
      return decodeNativeImage(file);
    case 'qr-scanner':
      return decodeQrScannerImage(file);
    case 'zxing':
      return decodeZxingImage(file);
    case 'html5-qrcode':
      return decodeHtml5Image(file);
    case 'jsqr':
      return decodeJsQrImage(file);
    default: {
      const _exhaustive: never = id;
      throw new Error(`Motor desconhecido: ${_exhaustive}`);
    }
  }
}
