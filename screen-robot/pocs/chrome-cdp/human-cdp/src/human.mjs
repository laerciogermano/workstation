/**
 * Timing e trajetória “humana” para Input CDP.
 * Movimento contínuo: parte de onde parou, sem saltos.
 */

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function rand(min, max) {
  return min + Math.random() * (max - min);
}

export function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

/** Ease-in-out quadratic (igual ao bot-lab / test-cdp-clicks). */
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

/** Distância máxima entre pontos consecutivos (px) — evita teleporte no bot-lab. */
export const MAX_STEP_PX = 36;

/**
 * Pontos de uma curva do `from` ao `to`.
 * - 1º e último pontos exatamente em from/to (sem jitter nas pontas)
 * - passos adaptativos: nenhum segmento > MAX_STEP_PX
 */
export function trajectoryPoints(from, to, { steps, jitter = 0.9, maxStepPx = MAX_STEP_PX } = {}) {
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const minSteps = Math.max(2, Math.ceil(dist / Math.max(8, maxStepPx)));
  const n = Math.max(minSteps, steps ?? Math.min(80, Math.max(12, Math.round(dist / 10))));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const e = easeInOutQuad(t);
    const x = from.x + (to.x - from.x) * e;
    const y = from.y + (to.y - from.y) * e;
    if (i === 0) {
      pts.push({ x: from.x, y: from.y });
    } else if (i === n) {
      pts.push({ x: to.x, y: to.y });
    } else {
      pts.push({
        x: x + rand(-jitter, jitter),
        y: y + rand(-jitter, jitter),
      });
    }
  }
  // garante que nenhum salto residual passe do limite
  return densify(pts, maxStepPx);
}

/** Insere midpoints se algum segmento passar de maxStepPx. */
export function densify(points, maxStepPx = MAX_STEP_PX) {
  if (!points?.length) return [];
  const out = [{ x: points[0].x, y: points[0].y }];
  for (let i = 1; i < points.length; i++) {
    const a = out[out.length - 1];
    const b = points[i];
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    if (d > maxStepPx) {
      const parts = Math.ceil(d / maxStepPx);
      for (let k = 1; k < parts; k++) {
        const t = k / parts;
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    out.push({ x: b.x, y: b.y });
  }
  return out;
}

/**
 * Despacha mouseMoved ponto a ponto.
 * Intervalo ≥ ~16ms para o sampler do bot-lab (throttle 16ms) não ver saltos com dt&lt;8.
 * @returns {{ x: number, y: number }} última posição despachada
 */
export async function moveAlong(send, points, { stepMs = [16, 28] } = {}) {
  let last = null;
  for (const p of points) {
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: p.x,
      y: p.y,
    });
    last = p;
    await sleep(randInt(stepMs[0], stepMs[1]));
  }
  return last || { x: 0, y: 0 };
}

export async function pressRelease(send, x, y, { button = 'left' } = {}) {
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    x,
    y,
    button,
    buttons: 1,
    clickCount: 1,
  });
  await sleep(randInt(35, 90));
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    x,
    y,
    button,
    buttons: 0,
    clickCount: 1,
  });
}

/** Delay entre cliques humanos (~180–400ms). */
export function clickGapMs() {
  return randInt(180, 400);
}

/** Delay entre teclas (~45–140ms). */
export function keyGapMs() {
  return randInt(45, 140);
}
