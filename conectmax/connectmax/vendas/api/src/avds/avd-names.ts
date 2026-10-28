/** Slug + porta ADB — mesmo algoritmo de screen-robot `docker-avd-instance.js`. */

export function slugifyAvdName(name: string): string {
  const s = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'default';
}

/** Porta host estável 5655–5754 a partir do nome. */
export function portForAvdName(name: string): number {
  const s = String(name || 'default');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) >>> 0;
  }
  return 5655 + (h % 100);
}

export function containerNameForAvd(name: string): string {
  return `docker-avd-${slugifyAvdName(name)}`;
}

export function serialForAvd(name: string, adbPort?: number): string {
  const port = adbPort ?? portForAvdName(name);
  return `127.0.0.1:${port}`;
}
