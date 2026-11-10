import type { EanEngineId } from './ean-engines';

export type EanStop = () => void;

type StartOpts = {
  video: HTMLVideoElement;
  onCode: (text: string) => void;
  signal: { stopped: boolean };
};

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'itf'] as const;

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

async function startZxing({ video, onCode, signal }: StartOpts): Promise<EanStop> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  if (signal.stopped) return () => undefined;
  const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF];
  const reader = new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]));
  const controls = await reader.decodeFromConstraints({ video: { facingMode: 'environment' } }, video, (result) => {
    const text = result?.getText()?.trim();
    if (text) onCode(text);
  });
  return () => controls.stop();
}

async function startNative({ video, onCode, signal }: StartOpts): Promise<EanStop> {
  const BD = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } })
    .BarcodeDetector;
  if (!BD) throw new Error('BarcodeDetector indisponível');
  const detector = new BD({ formats: [...NATIVE_FORMATS] });
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

async function startQuagga2({ video, onCode, signal }: StartOpts): Promise<EanStop> {
  const Quagga = (await import('@ericblade/quagga2')).default;
  if (signal.stopped) return () => undefined;
  const parent = video.parentElement;
  if (!parent) throw new Error('Container da câmera ausente');

  await new Promise<void>((resolve, reject) => {
    Quagga.init(
      {
        inputStream: {
          type: 'LiveStream',
          target: parent,
          constraints: { facingMode: 'environment', aspectRatio: { min: 1, max: 2 } },
          area: { top: '20%', right: '5%', left: '5%', bottom: '20%' },
        },
        locator: { patchSize: 'medium', halfSample: true },
        numOfWorkers: 0,
        frequency: 8,
        decoder: {
          readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'i2of5_reader'],
        },
        locate: true,
      },
      (err) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve();
      },
    );
  });

  if (signal.stopped) {
    Quagga.stop();
    return () => undefined;
  }

  const onDetected = (data: { codeResult?: { code?: string | null } }) => {
    const text = data.codeResult?.code?.trim();
    if (text) onCode(text);
  };
  Quagga.onDetected(onDetected);
  Quagga.start();

  // Esconde o video que o Quagga injeta se o nosso <video> ficar duplicado.
  video.style.opacity = '0';
  video.style.pointerEvents = 'none';

  return () => {
    Quagga.offDetected(onDetected);
    Quagga.stop();
    video.style.opacity = '';
    video.style.pointerEvents = '';
    // Quagga costuma deixar um <video> no parent — limpa extras
    for (const el of Array.from(parent.querySelectorAll('video, canvas.drawingBuffer'))) {
      if (el !== video) el.remove();
    }
    stopStream(video);
  };
}

export async function startEanCamera(id: EanEngineId, opts: StartOpts): Promise<EanStop> {
  switch (id) {
    case 'zxing':
      return startZxing(opts);
    case 'native':
      return startNative(opts);
    case 'quagga2':
      return startQuagga2(opts);
    default: {
      const _exhaustive: never = id;
      throw new Error(`Motor EAN desconhecido: ${_exhaustive}`);
    }
  }
}

async function decodeZxingImage(file: File): Promise<string | null> {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ]);
  const formats = [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.ITF];
  const reader = new BrowserMultiFormatReader(new Map([[DecodeHintType.POSSIBLE_FORMATS, formats]]));
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

async function decodeNativeImage(file: File): Promise<string | null> {
  const BD = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<Array<{ rawValue: string }>> } })
    .BarcodeDetector;
  if (!BD) return null;
  const bitmap = await createImageBitmap(file);
  try {
    const codes = await new BD({ formats: [...NATIVE_FORMATS] }).detect(bitmap);
    return codes[0]?.rawValue?.trim() || null;
  } finally {
    bitmap.close();
  }
}

async function decodeQuaggaImage(file: File): Promise<string | null> {
  const Quagga = (await import('@ericblade/quagga2')).default;
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve) => {
      Quagga.decodeSingle(
        {
          src: url,
          numOfWorkers: 0,
          inputStream: { size: 800 },
          decoder: { readers: ['ean_reader', 'ean_8_reader', 'upc_reader', 'upc_e_reader', 'i2of5_reader'] },
          locate: true,
        },
        (result) => {
          resolve(result?.codeResult?.code?.trim() || null);
        },
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function decodeEanWithEngine(id: EanEngineId, file: File): Promise<string | null> {
  switch (id) {
    case 'zxing':
      return decodeZxingImage(file);
    case 'native':
      return decodeNativeImage(file);
    case 'quagga2':
      return decodeQuaggaImage(file);
    default: {
      const _exhaustive: never = id;
      throw new Error(`Motor EAN desconhecido: ${_exhaustive}`);
    }
  }
}
