/** Visualizações SVG portadas do protótipo: anel do dia, gráfico de linha, figura do movimento, silhueta e mapa. */
import { type Animation, dfmt, n1 } from '@fitness/domain';
import type { ReactNode } from 'react';

export function Ring({
  val,
  max,
  label,
  sub,
  over,
  size = 168,
  stroke = 14,
}: { val: number; max: number; label: ReactNode; sub: string; over?: boolean; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, max ? val / max : 0);
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(p * 100)}% da meta`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ft-line-2)" strokeWidth={stroke} />
        <circle
          className={`rg${over ? ' over' : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - p)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="rv">
        <b className="tnum">{label}</b>
        <span>{sub}</span>
      </div>
    </div>
  );
}

export interface Pt {
  x: number;
  y: number;
  d?: string;
}

/** Série registrada (linha cheia) + projeção tracejada com faixa de incerteza que abre com o tempo. */
export function LineChart({
  pts = [],
  proj = [],
  h = 170,
  unit = 'kg',
  today = null,
  hi = null,
}: { pts?: Pt[]; proj?: Pt[]; h?: number; unit?: string; today?: number | null; hi?: number | null }) {
  const w = 358;
  const [pt, pr, pb, pl] = [10, 26, 22, 30];
  const all = [...pts, ...proj];
  if (!all.length) return null;
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  let y0 = Math.min(...ys);
  let y1 = Math.max(...ys);
  const span = Math.max(1, y1 - y0);
  y0 -= span * 0.15;
  y1 += span * 0.15;
  const X = (x: number) => pl + ((x - x0) / Math.max(1, x1 - x0)) * (w - pl - pr);
  const Y = (y: number) => pt + (1 - (y - y0) / (y1 - y0)) * (h - pt - pb);
  const path = (arr: Pt[]) => arr.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(' ');
  const ticks = [0.2, 0.5, 0.8].map((k) => y0 + (y1 - y0) * k);
  const p0 = proj[0];
  const spread = (p: Pt) => (p0 ? ((p.x - p0.x) * 0.012 * span) / 4 : 0);
  const band = p0
    ? `${proj.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)} ${Y(p.y + spread(p)).toFixed(1)}`).join(' ')} ${[
        ...proj,
      ]
        .reverse()
        .map((p) => `L${X(p.x).toFixed(1)} ${Y(p.y - spread(p)).toFixed(1)}`)
        .join(' ')} Z`
    : '';
  const pend = proj[proj.length - 1];
  const first = pts[0];
  return (
    <svg className="lc" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Gráfico de ${unit}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pl} x2={w - pr} y1={Y(t)} y2={Y(t)} className="grid" />
          <text x={pl - 6} y={Y(t) + 3.5} className="yl">
            {n1(t)}
          </text>
        </g>
      ))}
      {today !== null && (
        <>
          <line x1={X(today)} x2={X(today)} y1={pt - 4} y2={h - pb} className="today" />
          <text x={X(today)} y={h - 6} className="xl" textAnchor="middle">
            hoje
          </text>
        </>
      )}
      {band && <path className="band" d={band} />}
      {proj.length > 0 && <path d={path(proj)} className="proj" />}
      {pts.length > 0 && <path d={path(pts)} className="line" />}
      {pts.map((p, i) => (
        <circle
          key={`${p.x}-${i}`}
          cx={X(p.x)}
          cy={Y(p.y)}
          r={i === hi ? 5 : 3.2}
          className={`dot${i === hi ? ' hi' : ''}`}
        />
      ))}
      {pend && (
        <>
          <circle cx={X(pend.x)} cy={Y(pend.y)} r="3.6" className="pend" />
          <text x={X(pend.x) - 4} y={Y(pend.y) - 9} className="pl" textAnchor="end">
            {n1(pend.y)} {unit}
          </text>
        </>
      )}
      {first?.d && (
        <text x={X(first.x)} y={h - 6} className="xl">
          {dfmt(first.d)}
        </text>
      )}
    </svg>
  );
}

/* ---------- figura do movimento (RF-26) ---------- */
type Pose = Record<'head' | 'sh' | 'el' | 'ha' | 'hip' | 'kn' | 'ft', [number, number]>;
const POSES: Record<Animation, [Pose, Pose]> = {
  squat: [
    { head: [100, 30], sh: [100, 46], el: [90, 54], ha: [94, 44], hip: [100, 88], kn: [100, 120], ft: [100, 152] },
    { head: [110, 66], sh: [104, 80], el: [94, 88], ha: [100, 78], hip: [82, 116], kn: [122, 124], ft: [104, 152] },
  ],
  bench: [
    { head: [44, 100], sh: [62, 104], el: [62, 84], ha: [62, 62], hip: [116, 104], kn: [140, 104], ft: [140, 150] },
    { head: [44, 100], sh: [62, 104], el: [76, 112], ha: [62, 92], hip: [116, 104], kn: [140, 104], ft: [140, 150] },
  ],
  row: [
    { head: [62, 66], sh: [78, 74], el: [80, 100], ha: [80, 124], hip: [120, 92], kn: [110, 122], ft: [114, 152] },
    { head: [62, 66], sh: [78, 74], el: [104, 80], ha: [90, 102], hip: [120, 92], kn: [110, 122], ft: [114, 152] },
  ],
  press: [
    { head: [100, 30], sh: [100, 46], el: [86, 60], ha: [92, 42], hip: [100, 88], kn: [100, 120], ft: [100, 152] },
    { head: [100, 30], sh: [100, 46], el: [96, 26], ha: [104, 8], hip: [100, 88], kn: [100, 120], ft: [100, 152] },
  ],
  plank: [
    { head: [42, 118], sh: [56, 126], el: [58, 148], ha: [78, 148], hip: [106, 132], kn: [134, 140], ft: [164, 148] },
    { head: [42, 116], sh: [56, 125], el: [58, 148], ha: [78, 148], hip: [106, 128], kn: [134, 139], ft: [164, 148] },
  ],
  pushup: [
    { head: [38, 108], sh: [52, 116], el: [52, 132], ha: [52, 150], hip: [104, 128], kn: [134, 138], ft: [164, 148] },
    { head: [38, 130], sh: [52, 136], el: [70, 130], ha: [52, 150], hip: [104, 140], kn: [134, 144], ft: [164, 148] },
  ],
  pullup: [
    { head: [106, 44], sh: [100, 58], el: [100, 40], ha: [100, 20], hip: [100, 100], kn: [98, 128], ft: [100, 152] },
    { head: [106, 12], sh: [100, 32], el: [86, 40], ha: [100, 20], hip: [100, 76], kn: [98, 104], ft: [100, 128] },
  ],
};
const SEQ = { leg: ['ft', 'kn', 'hip'], torso: ['hip', 'sh'], arm: ['sh', 'el', 'ha'] } as const;

export function Figure({
  kind,
  size = '',
  animate = true,
  bar = true,
  dur = 2.4,
}: { kind: Animation; size?: string; animate?: boolean; bar?: boolean; dur?: number }) {
  const [A, B] = POSES[kind];
  const pl = (p: Pose, k: readonly (keyof Pose)[]) => k.map((j) => p[j].join(',')).join(' ');
  const Anim = ({ attr, a, b }: { attr: string; a: string | number; b: string | number }) =>
    animate ? (
      <animate
        attributeName={attr}
        values={`${a};${b};${a}`}
        dur={`${dur}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keyTimes="0;.5;1"
        keySplines=".45 0 .55 1;.45 0 .55 1"
      />
    ) : null;
  return (
    <svg className={`fig ${size}`} viewBox="0 0 200 160" aria-hidden="true">
      <line className="fg-floor" x1="10" x2="190" y1="153" y2="153" />
      {kind === 'bench' && (
        <>
          <line className="fg-gear" x1="30" x2="132" y1="112" y2="112" />
          <line className="fg-gear" x1="124" x2="124" y1="112" y2="152" />
          <line className="fg-gear" x1="38" x2="38" y1="112" y2="152" />
        </>
      )}
      {kind === 'pullup' && <line className="fg-gear" x1="60" x2="150" y1="20" y2="20" />}
      {['bench', 'row', 'squat', 'press'].includes(kind) && bar && (
        <circle className="fg-bar" cx={A.ha[0]} cy={A.ha[1]} r={kind === 'press' ? 5 : 8}>
          <Anim attr="cx" a={A.ha[0]} b={B.ha[0]} />
          <Anim attr="cy" a={A.ha[1]} b={B.ha[1]} />
        </circle>
      )}
      {!animate && (
        <>
          {Object.values(SEQ).map((k) => (
            <polyline key={k.join()} className="fg-ghost" points={pl(B, k)} />
          ))}
          <circle className="fg-ghost" cx={B.head[0]} cy={B.head[1]} r="10" />
        </>
      )}
      {Object.entries(SEQ).map(([n, k]) => (
        <polyline key={n} className={`fg-${n}`} points={pl(A, k)}>
          <Anim attr="points" a={pl(A, k)} b={pl(B, k)} />
        </polyline>
      ))}
      <circle className="fg-head" cx={A.head[0]} cy={A.head[1]} r="10">
        <Anim attr="cx" a={A.head[0]} b={B.head[0]} />
        <Anim attr="cy" a={A.head[1]} b={B.head[1]} />
      </circle>
    </svg>
  );
}

/** Guia de silhueta para fotos comparáveis. */
export function Silhouette({ pose = 'frente', cls = '' }: { pose?: string; cls?: string }) {
  const cx = 100;
  const body =
    pose === 'lado'
      ? 'M96 48 C 84 52, 86 70, 90 84 C 102 104, 102 124, 94 150 L 96 196 L 106 196 L 108 150 C 112 128, 116 104, 112 84 C 116 66, 114 52, 104 48 Z'
      : `M${cx - 18} 48 C ${cx - 40} 52, ${cx - 44} 60, ${cx - 46} 86 L ${cx - 50} 128 L ${cx - 42} 128 L ${cx - 36} 92 C ${cx - 34} 108, ${cx - 40} 124, ${cx - 32} 142 L ${cx - 26} 196 L ${cx - 6} 196 L ${cx} 150 L ${cx + 6} 196 L ${cx + 26} 196 L ${cx + 32} 142 C ${cx + 40} 124, ${cx + 34} 108, ${cx + 36} 92 L ${cx + 42} 128 L ${cx + 50} 128 L ${cx + 46} 86 C ${cx + 44} 60, ${cx + 40} 52, ${cx + 18} 48 Z`;
  return (
    <svg className={`sil ${cls}`} viewBox="0 0 200 210" aria-hidden="true">
      <circle cx="100" cy="28" r="15" />
      <path d={body} />
    </svg>
  );
}

/** Mapa estilizado (sem provedor de tiles no v1, ADR-0007). */
export function FMap({
  pins,
  you = false,
  short = false,
}: {
  pins: { x: number; y: number; txt: string; mine?: boolean; big?: boolean; label: string; onClick?: () => void }[];
  you?: boolean;
  short?: boolean;
}) {
  return (
    <div className={`fmap${short ? ' short' : ''}`}>
      <svg className="streets" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path d="M-5 38 C 20 34, 40 46, 62 40 S 95 30, 110 34" className="av" />
        <path d="M30 -5 C 34 30, 26 60, 34 110" className="av" />
        <path d="M-5 72 C 30 66, 55 80, 110 70" className="st" />
        <path d="M62 -5 C 60 30, 70 70, 66 110" className="st" />
        <path d="M-5 18 L 110 24" className="st" />
        <path d="M12 -5 L 18 110" className="st" />
        <path d="M84 -5 L 80 110" className="st" />
        <path d="M-5 92 C 25 86, 60 96, 110 88" className="river" />
        <rect x="40" y="52" width="12" height="9" rx="2" className="park" />
        <rect x="72" y="8" width="10" height="8" rx="2" className="park" />
      </svg>
      {you && <span className="you" style={{ left: '50%', top: '50%' }} />}
      {pins.map((p) => (
        <button
          type="button"
          key={p.label}
          className={`pin${p.mine ? ' mine' : ''}${p.big ? ' big' : ''}`}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          aria-label={p.label}
          onClick={p.onClick}
        >
          <span>{p.txt}</span>
        </button>
      ))}
    </div>
  );
}
