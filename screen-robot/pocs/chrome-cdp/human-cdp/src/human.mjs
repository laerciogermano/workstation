/**
 * Timing e trajetória “humana” para Input CDP.
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

/**
 * Pontos de uma curva do `from` ao `to` com jitter.
 */
export function trajectoryPoints(from, to, { steps = 25, jitter = 1.2 } = {}) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const e = easeInOutQuad(t);
    pts.push({
      x: from.x + (to.x - from.x) * e + rand(-jitter, jitter),
      y: from.y + (to.y - from.y) * e + rand(-jitter, jitter),
    });
  }
  return pts;
}

export async function moveAlong(send, points, { stepMs = [12, 30] } = {}) {
  for (const p of points) {
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: p.x,
      y: p.y,
    });
    await sleep(randInt(stepMs[0], stepMs[1]));
  }
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
