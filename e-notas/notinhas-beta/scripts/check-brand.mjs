// BETA-012: a marca pública é notinhas.shop — "e-notas" nunca aparece na UI.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const roots = ['apps/web/src', 'apps/web/index.html', 'apps/web/public', 'apps/api/src/shared/mail'];
const bad = [];
function walk(p) {
  let st;
  try { st = statSync(p); } catch { return; }
  if (st.isDirectory()) return readdirSync(p).forEach((f) => walk(join(p, f)));
  if (!/\.(tsx?|html|css|json|webmanifest|txt)$/.test(p)) return;
  readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
    if (/e-notas/i.test(line)) bad.push(`${p}:${i + 1}: ${line.trim()}`);
  });
}
roots.forEach(walk);
if (bad.length) {
  console.error('Marca: "e-notas" não pode aparecer na interface (use notinhas.shop):\n' + bad.join('\n'));
  process.exit(1);
}
console.log('brand ok');
