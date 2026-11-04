import { type JSX, type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, IconButton, RangeSlider, cx } from './primitives';
import s from './ImageCrop.module.css';

export type CropKind = 'avatar' | 'cover' | 'gallery';

const PRESETS: Record<CropKind, { aspect: number; outW: number; outH: number; label: string; fileName: string }> = {
  avatar: { aspect: 1, outW: 1024, outH: 1024, label: 'Foto de perfil', fileName: 'avatar.jpg' },
  cover: { aspect: 4 / 5, outW: 1080, outH: 1350, label: 'Capa do evento', fileName: 'cover.jpg' },
  gallery: { aspect: 1, outW: 1600, outH: 1600, label: 'Foto da galeria', fileName: 'gallery.jpg' },
};

type Pt = { x: number; y: number };

function rotatedSize(w: number, h: number, rot: number): { rw: number; rh: number } {
  return rot % 180 === 0 ? { rw: w, rh: h } : { rw: h, rh: w };
}

function clampOffset(ox: number, oy: number, dispW: number, dispH: number, frameW: number, frameH: number): Pt {
  const maxX = Math.max(0, (dispW - frameW) / 2);
  const maxY = Math.max(0, (dispH - frameH) / 2);
  return { x: Math.min(maxX, Math.max(-maxX, ox)), y: Math.min(maxY, Math.max(-maxY, oy)) };
}

/** Exporta o retângulo da moldura a partir da imagem (já rotacionada na lógica). */
export async function renderCrop(opts: {
  img: HTMLImageElement;
  rotation: number;
  zoom: number;
  offset: Pt;
  frameW: number;
  frameH: number;
  outW: number;
  outH: number;
  fileName: string;
}): Promise<File> {
  const { img, rotation, zoom, offset, frameW, frameH, outW, outH, fileName } = opts;
  const { rw, rh } = rotatedSize(img.naturalWidth, img.naturalHeight, rotation);
  const temp = document.createElement('canvas');
  temp.width = rw;
  temp.height = rh;
  const tctx = temp.getContext('2d');
  if (!tctx) throw new Error('canvas');
  tctx.translate(rw / 2, rh / 2);
  tctx.rotate((rotation * Math.PI) / 180);
  tctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  const base = Math.max(frameW / rw, frameH / rh);
  const scale = base * zoom;
  const dispW = rw * scale;
  const dispH = rh * scale;
  const imgLeft = frameW / 2 + offset.x - dispW / 2;
  const imgTop = frameH / 2 + offset.y - dispH / 2;
  const sx = Math.max(0, Math.min(rw - 1, -imgLeft / scale));
  const sy = Math.max(0, Math.min(rh - 1, -imgTop / scale));
  const sw = Math.min(rw - sx, frameW / scale);
  const sh = Math.min(rh - sy, frameH / scale);

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const octx = out.getContext('2d');
  if (!octx) throw new Error('canvas');
  octx.drawImage(temp, sx, sy, sw, sh, 0, 0, outW, outH);
  const blob = await new Promise<Blob>((resolve, reject) => {
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('blob'))), 'image/jpeg', 0.92);
  });
  return new File([blob], fileName, { type: 'image/jpeg' });
}

/** Editor fullscreen: moldura fixa, arrastar, zoom e girar 90° (RF-E01-12 / RF-E02-02). */
export function ImageCropDialog({
  file,
  kind,
  onCancel,
  onConfirm,
}: {
  file: File;
  kind: CropKind;
  onCancel: () => void;
  onConfirm: (cropped: File) => void;
}): JSX.Element {
  const preset = PRESETS[kind];
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [frame, setFrame] = useState({ w: 280, h: 280 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState<Pt>({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      URL.revokeObjectURL(url);
      document.body.style.overflow = prev;
    };
  }, [file]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const pad = 24;
      const maxW = Math.max(160, el.clientWidth - pad * 2);
      const maxH = Math.max(160, el.clientHeight - pad * 2);
      let w = maxW;
      let h = w / preset.aspect;
      if (h > maxH) {
        h = maxH;
        w = h * preset.aspect;
      }
      setFrame({ w: Math.round(w), h: Math.round(h) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [preset.aspect]);

  const { rw, rh } = useMemo(() => rotatedSize(natural.w || 1, natural.h || 1, rotation), [natural, rotation]);
  const base = frame.w && rw ? Math.max(frame.w / rw, frame.h / rh) : 1;
  const scale = base * zoom;
  const dispW = rw * scale;
  const dispH = rh * scale;

  useEffect(() => {
    setOffset((o) => clampOffset(o.x, o.y, dispW, dispH, frame.w, frame.h));
  }, [dispW, dispH, frame.w, frame.h, zoom, rotation]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const nx = drag.current.ox + (e.clientX - drag.current.x);
    const ny = drag.current.oy + (e.clientY - drag.current.y);
    setOffset(clampOffset(nx, ny, dispW, dispH, frame.w, frame.h));
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const confirm = useCallback(async () => {
    const img = imgRef.current;
    if (!img?.naturalWidth) return;
    setBusy(true);
    try {
      const cropped = await renderCrop({
        img,
        rotation,
        zoom,
        offset: clampOffset(offset.x, offset.y, dispW, dispH, frame.w, frame.h),
        frameW: frame.w,
        frameH: frame.h,
        outW: preset.outW,
        outH: preset.outH,
        fileName: preset.fileName,
      });
      onConfirm(cropped);
    } finally {
      setBusy(false);
    }
  }, [rotation, zoom, offset, dispW, dispH, frame, preset, onConfirm]);

  const imgW = natural.w * scale;
  const imgH = natural.h * scale;

  return (
    <div className={s.root} role="dialog" aria-modal="true" aria-label={`Recortar ${preset.label}`}>
      <header className={s.top}>
        <IconButton icon="x" label="Cancelar" onClick={onCancel} />
        <span className={s.title}>Ajustar foto</span>
        <span className={s.grow} />
      </header>
      <div ref={stageRef} className={s.stage}>
        <div
          className={s.frame}
          style={{ width: frame.w, height: frame.h }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => e.preventDefault()}
        >
          {src ? (
            <div
              className={s.imgWrap}
              style={{
                width: dispW,
                height: dispH,
                transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
              }}
            >
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                style={{
                  width: imgW || undefined,
                  height: imgH || undefined,
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                }}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setNatural({ w: el.naturalWidth, h: el.naturalHeight });
                  setZoom(1);
                  setRotation(0);
                  setOffset({ x: 0, y: 0 });
                }}
              />
            </div>
          ) : null}
          <div className={cx(s.mask, kind === 'avatar' && s.maskRound)} aria-hidden />
        </div>
        <p className={s.hint}>Arraste para enquadrar · zoom e giro abaixo</p>
      </div>
      <div className={s.controls}>
        <RangeSlider label="Zoom" value={Math.round(zoom * 100)} min={100} max={300} onChange={(v) => setZoom(v / 100)} scale={['1×', '2×', '3×']} />
        <div className={s.row}>
          <Button variant="secondary" small icon="undo" onClick={() => setRotation((r) => (r + 90) % 360)}>
            Girar 90°
          </Button>
          <Button
            variant="ghost"
            small
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
              setRotation(0);
            }}
          >
            Resetar
          </Button>
        </div>
        <Button loading={busy} onClick={() => void confirm()}>
          Usar foto
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
