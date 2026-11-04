// size-limit simples: soma o gzip do JS de entrada (index-*.js) do build web.
import { readdirSync, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
const dir = new URL('../apps/web/dist/assets/', import.meta.url);
const entry = readdirSync(dir).filter((f) => /^index-.*\.js$/.test(f));
const total = entry.reduce((a, f) => a + gzipSync(readFileSync(new URL(f, dir))).length, 0);
const kb = (total / 1024).toFixed(1);
console.log(`JS inicial: ${kb} KB gzip (limite 250 KB)`);
if (total > 250 * 1024) process.exit(1);
