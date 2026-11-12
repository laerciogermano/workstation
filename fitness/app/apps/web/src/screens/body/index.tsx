/** E05 · Avaliação física (F-40..F-43). RF-29..32 · RN-07, RN-13, RN-18. */
import {
  MEASURES,
  type MeasureId,
  type Measurement,
  PHOTO_POSES,
  type PhotoPose,
  daysBetween,
  dfmt,
  goodDirection,
  n0,
  n1,
  sgn,
} from '@fitness/domain';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { errorText } from '../../lib/api';
import { type Photo, listPhotos, savePhoto } from '../../lib/photos';
import { useBody, useSaveMeasurement } from '../../lib/queries';
import { useSession } from '../../lib/session';
import { Icon } from '../../ui/icon';
import { ErrorState, Loading, Note, NumStep, Seg, TabBar, TopBar, useToast } from '../../ui/kit';
import { LineChart, Silhouette } from '../../ui/viz';

/** Fotos locais com URLs de objeto liberadas ao desmontar. */
function usePhotos() {
  const [photos, setPhotos] = useState<(Photo & { url: string })[] | null>(null);
  const load = useCallback(async () => {
    const ps = await listPhotos();
    setPhotos((old) => {
      for (const p of old ?? []) URL.revokeObjectURL(p.url);
      return ps.map((p) => ({ ...p, url: URL.createObjectURL(p.blob) }));
    });
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(
    () => () => {
      for (const p of photos ?? []) URL.revokeObjectURL(p.url);
    },
    [photos],
  );
  return { photos, reload: load };
}

const DEFAULTS: Omit<Measurement, 'date' | 'weightKg'> = {
  waistCm: 80,
  hipCm: 100,
  chestCm: 95,
  armCm: 30,
  thighCm: 57,
};

/** F-40 · Nova avaliação com fita (RF-29, RF-30 · RN-13, RN-07) */
export function BodyMeasure() {
  const { today, me } = useSession();
  const q = useBody();
  const save = useSaveMeasurement(today);
  const nav = useNavigate();
  const toast = useToast();
  const [m, setM] = useState<Omit<Measurement, 'date'> | null>(null);
  const last = q.data?.measurements.filter((x) => x.date < today).at(-1) ?? null;
  const todayM = q.data?.measurements.find((x) => x.date === today) ?? null;
  useEffect(() => {
    if (!q.data || m) return;
    const base = todayM ?? last;
    setM(
      base
        ? {
            weightKg: base.weightKg,
            waistCm: base.waistCm,
            hipCm: base.hipCm,
            chestCm: base.chestCm,
            armCm: base.armCm,
            thighCm: base.thighCm,
          }
        : { ...DEFAULTS, weightKg: me.profile?.weightKg ?? 70 },
    );
  }, [q.data, m, todayM, last, me.profile]);
  if (q.isPending || !m) return q.error ? <ErrorState error={q.error} /> : <Loading />;
  const gaining = me.energy?.strategy === 'superavit';
  return (
    <div className="body ft">
      <TopBar
        title="Nova avaliação"
        sub={
          last
            ? `Hoje · última em ${dfmt(last.date)} (há ${daysBetween(last.date, today)} dias)`
            : 'Hoje · primeira avaliação'
        }
        fallback="/corpo"
      />
      <div className="mgrid">
        {MEASURES.map((def) => {
          const v = m[def.id];
          const prev = last?.[def.id];
          const dv = prev === undefined ? 0 : Math.round((v - prev) * 10) / 10;
          const dir = goodDirection(def, gaining);
          const good = dir ? Math.sign(dv) === dir : null;
          return (
            <div className="mfld" key={def.id}>
              <label>
                {def.name}
                {def.where && <span>{def.where}</span>}
              </label>
              <NumStep
                label={def.name}
                value={v}
                unit={def.unit}
                step={def.step}
                decimals={1}
                min={def.range[0]}
                max={def.range[1]}
                onChange={(nv) => setM({ ...m, [def.id]: nv })}
              />
              <p className={`tnum dv ${dv && good !== null ? (good ? 'ok' : 'bad') : ''}`}>
                {prev === undefined
                  ? 'primeiro registro'
                  : `${dv ? `${sgn(dv)} ${def.unit}` : 'igual'} · antes ${n1(prev)}`}
              </p>
            </div>
          );
        })}
      </div>
      <Note icon="clock">Meça sempre no mesmo horário, de manhã e antes de comer.</Note>
      {save.error && <p className="err-box">{errorText(save.error)}</p>}
      <div className="footcta two">
        <button
          type="button"
          className="btn p"
          disabled={save.isPending}
          onClick={() =>
            save.mutate(m, {
              onSuccess: (r) => {
                toast(
                  r.targetBefore !== r.targetAfter
                    ? `Avaliação salva · meta recalculada ${n0(r.targetBefore)} → ${n0(r.targetAfter)} kcal`
                    : 'Avaliação salva',
                );
                void nav('/corpo', { replace: true, viewTransition: true });
              },
            })
          }
        >
          Salvar avaliação
        </button>
        <Link className="btn g" to="/corpo/foto" viewTransition>
          <Icon name="camera" />
          Adicionar fotos
        </Link>
      </div>
    </div>
  );
}

/** F-41 · Foto de progresso (RF-31 · RN-13, RN-18): câmera com guia de silhueta; a foto fica só no aparelho. */
export function BodyPhoto() {
  const { today } = useSession();
  const nav = useNavigate();
  const toast = useToast();
  const [pose, setPose] = useState<PhotoPose>('frente');
  const [hit, setHit] = useState(false);
  const [camErr, setCamErr] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancel = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamErr(true);
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1080 } }, audio: false })
      .then((s) => {
        if (cancel) {
          for (const t of s.getTracks()) t.stop();
          return;
        }
        stream.current = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setCamErr(true));
    return () => {
      cancel = true;
      for (const t of stream.current?.getTracks() ?? []) t.stop();
    };
  }, []);

  const store = async (blob: Blob) => {
    await savePhoto({ date: today, pose, blob });
    toast('Foto salva na timeline · só neste aparelho');
    void nav('/corpo', { replace: true, viewTransition: true });
  };
  const shoot = () => {
    const v = video.current;
    if (camErr || !v || !v.videoWidth) {
      file.current?.click();
      return;
    }
    setHit(true);
    const c = document.createElement('canvas');
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext('2d')?.drawImage(v, 0, 0);
    c.toBlob((b) => b && void store(b), 'image/jpeg', 0.85);
  };
  return (
    <div className="body dark cam">
      <TopBar title="Foto de progresso" sub="Hoje · fica só neste aparelho" fallback="/corpo" />
      <div className={`vf${hit ? ' hit' : ''}`}>
        {!camErr && <video ref={video} autoPlay playsInline muted aria-label="Câmera" />}
        <Silhouette pose={pose} cls="guide" />
        <span className="vfh">
          {camErr
            ? 'Câmera indisponível · toque para escolher da galeria'
            : 'Encaixe o corpo na silhueta · mesma luz e distância'}
        </span>
      </div>
      <div className="poses">
        <Seg
          options={
            [
              ['frente', 'Frente'],
              ['lado', 'Lado'],
              ['costas', 'Costas'],
            ] as const
          }
          value={pose}
          onChange={setPose}
        />
      </div>
      <div className="shut">
        <button
          type="button"
          className="ib glass"
          onClick={() => file.current?.click()}
          aria-label="Escolher da galeria"
        >
          <Icon name="image" />
        </button>
        <button type="button" className="shutter" onClick={shoot} aria-label="Tirar foto">
          <i />
        </button>
        <span className="ib ghost" />
      </div>
      <input
        ref={file}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        aria-label="Escolher foto"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void store(f);
        }}
      />
    </div>
  );
}

/** F-42 · Corpo · timeline (RF-30, RF-31, RF-32 · RN-13) */
export function BodyTimeline() {
  const q = useBody();
  const { photos } = usePhotos();
  const [metric, setMetric] = useState<MeasureId>('weightKg');
  if (q.isPending) return <Loading />;
  if (!q.data) return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const h = q.data.measurements;
  const def = MEASURES.find((x) => x.id === metric) ?? MEASURES[0];
  if (!def) return null;
  const first = h[0];
  const last = h[h.length - 1];
  const byDate = new Map<string, Photo[]>();
  for (const p of photos ?? []) byDate.set(p.date, [...(byDate.get(p.date) ?? []), p]);
  type Row = { d: string; kind: 'm'; m: Measurement } | { d: string; kind: 'p'; ps: (Photo & { url: string })[] };
  const rows: Row[] = [
    ...h.map((m) => ({ d: m.date, kind: 'm' as const, m })),
    ...[...byDate.entries()].map(([d, ps]) => ({ d, kind: 'p' as const, ps: ps as (Photo & { url: string })[] })),
  ].sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : a.kind === 'p' ? -1 : 1));
  return (
    <>
      <div className="body tb">
        <TopBar
          title="Corpo"
          back={false}
          sub={`${h.length} avaliaç${h.length === 1 ? 'ão' : 'ões'} · ${photos?.length ?? 0} fotos`}
          right={
            <Link className="ib" to="/corpo/medir" aria-label="Nova medida" viewTransition>
              <Icon name="plus" />
            </Link>
          }
        />
        {first && last ? (
          <>
            <div className="chips scroll">
              {MEASURES.map((x) => (
                <button
                  type="button"
                  key={x.id}
                  className={`fchip${x.id === metric ? ' on' : ''}`}
                  aria-pressed={x.id === metric}
                  onClick={() => setMetric(x.id)}
                >
                  {x.name}
                </button>
              ))}
            </div>
            <section className="card flush-b">
              <div className="ch-h">
                <h2 className="h-sm">{def.name}</h2>
                <b className={`tnum dv ${def.dir && Math.sign(last[metric] - first[metric]) === def.dir ? 'ok' : ''}`}>
                  {sgn(last[metric] - first[metric])} {def.unit}
                </b>
              </div>
              <LineChart
                pts={h.map((x) => ({ x: daysBetween(first.date, x.date), y: x[metric], d: x.date }))}
                unit={def.unit}
                h={160}
                hi={h.length - 1}
              />
              <p className="hint tnum">
                {n1(first[metric])} {def.unit} em {dfmt(first.date)} → {n1(last[metric])} {def.unit} em{' '}
                {dfmt(last.date)}
              </p>
            </section>
          </>
        ) : (
          <section className="empty sm">
            <Icon name="ruler" />
            <p>Nenhuma avaliação ainda. Meça com a fita para começar a timeline.</p>
          </section>
        )}
        <div className="sec-h">
          <h2>Timeline</h2>
          {(photos?.length ?? 0) >= 2 && (
            <Link to="/corpo/comparar" viewTransition>
              Comparar fotos
            </Link>
          )}
        </div>
        <ol className="tl">
          {rows.map((r) =>
            r.kind === 'p' ? (
              <li className="tp" key={`p-${r.d}`}>
                <span className="tld">{dfmt(r.d)}</span>
                <div className="thumbs">
                  {r.ps.slice(0, 3).map((p) => (
                    <div className="thumb" key={p.id}>
                      <img src={p.url} alt={`Foto de ${p.pose} em ${dfmt(p.date)}`} />
                    </div>
                  ))}
                </div>
                <span className="tlt">Fotos · {r.ps.map((p) => p.pose).join(', ')}</span>
              </li>
            ) : (
              <li key={`m-${r.d}`}>
                <span className="tld">{dfmt(r.d)}</span>
                <div className="tlm">
                  <b className="tnum">{n1(r.m.weightKg)} kg</b>
                  <span className="tnum">
                    cintura {n1(r.m.waistCm)} · quadril {n1(r.m.hipCm)} · braço {n1(r.m.armCm)}
                  </span>
                </div>
              </li>
            ),
          )}
        </ol>
        <div className="row2">
          <Link className="btn s" to="/corpo/foto" viewTransition>
            <Icon name="camera" />
            Foto
          </Link>
          <Link className="btn p" to="/corpo/medir" viewTransition>
            <Icon name="ruler" />
            Medir
          </Link>
        </div>
      </div>
      <TabBar on="/corpo" />
    </>
  );
}

/** F-43 · Comparar antes e depois (RF-32 · RN-13): divisória arrastável + medidas mais próximas. */
export function BodyCompare() {
  const q = useBody();
  const { photos } = usePhotos();
  const [pose, setPose] = useState<PhotoPose>('frente');
  const [ai, setAi] = useState(0);
  const [bi, setBi] = useState(-1);
  const [wipe, setWipe] = useState(50);
  const list = useMemo(() => (photos ?? []).filter((p) => p.pose === pose), [photos, pose]);
  if (!photos || q.isPending) return <Loading />;
  const A = list[Math.min(ai, list.length - 1)];
  const B = list[bi < 0 ? list.length - 1 : Math.min(bi, list.length - 1)];
  const h = q.data?.measurements ?? [];
  const near = (d: string) =>
    h.reduce<Measurement | null>(
      (best, x) => (!best || Math.abs(daysBetween(x.date, d)) < Math.abs(daysBetween(best.date, d)) ? x : best),
      null,
    );
  const ma = A ? near(A.date) : null;
  const mb = B ? near(B.date) : null;
  return (
    <div className="body ft">
      <TopBar
        title="Comparar"
        sub={A && B ? `${daysBetween(A.date, B.date)} dias entre as fotos` : 'Antes e depois'}
        fallback="/corpo"
      />
      <Seg
        options={PHOTO_POSES.map((p) => [p, p[0]?.toUpperCase() + p.slice(1)] as const)}
        value={pose}
        onChange={(p) => {
          setPose(p);
          setAi(0);
          setBi(-1);
        }}
      />
      {A && B && A !== B ? (
        <>
          <div className="wipe" style={{ '--w': `${wipe}%` } as React.CSSProperties}>
            <div className="wa">
              <img src={A.url} alt={`Antes, ${dfmt(A.date)}`} />
              <span>{dfmt(A.date)}</span>
            </div>
            <div className="wb">
              <img src={B.url} alt={`Depois, ${dfmt(B.date)}`} />
              <span>{dfmt(B.date)}</span>
            </div>
            <i className="wl" />
            <input
              type="range"
              min={5}
              max={95}
              value={wipe}
              onChange={(e) => setWipe(Number(e.target.value))}
              aria-label="Divisória antes e depois"
            />
          </div>
          <div className="fld">
            <label>Antes</label>
            <div className="chips">
              {list.map((p, i) => (
                <button type="button" key={p.id} className={`fchip${p === A ? ' on' : ''}`} onClick={() => setAi(i)}>
                  {dfmt(p.date)}
                </button>
              ))}
            </div>
          </div>
          <div className="fld">
            <label>Depois</label>
            <div className="chips">
              {list.map((p, i) => (
                <button type="button" key={p.id} className={`fchip${p === B ? ' on' : ''}`} onClick={() => setBi(i)}>
                  {dfmt(p.date)}
                </button>
              ))}
            </div>
          </div>
          {ma && mb && (
            <section className="card">
              <ul className="mstat">
                {MEASURES.map((m) => {
                  const dv = mb[m.id] - ma[m.id];
                  return (
                    <li key={m.id}>
                      <span>{m.name}</span>
                      <b className="tnum">
                        {n1(ma[m.id])} → {n1(mb[m.id])}
                      </b>
                      <b className={`tnum dv ${m.dir && dv && Math.sign(dv) === m.dir ? 'ok' : ''}`}>{sgn(dv)}</b>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </>
      ) : (
        <section className="empty sm">
          <Silhouette pose={pose} />
          <p>Tire pelo menos duas fotos de {pose} em dias diferentes para comparar.</p>
        </section>
      )}
      <p className="fine">Suas fotos ficam guardadas só neste aparelho.</p>
      <div className="footcta">
        <Link className="btn p" to="/corpo/foto" viewTransition>
          <Icon name="camera" />
          Nova foto
        </Link>
      </div>
    </div>
  );
}
