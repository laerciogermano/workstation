import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const yaml = await readFile(join(root, 'openapi.yaml'), 'utf8');

/** YAML mínimo (sem âncoras) → JSON via JSON após normalização fraca: usa parse com js-yaml se houver; senão copia estruturado. */
let json;
try {
  const { default: YAML } = await import('yaml');
  json = YAML.parse(yaml);
} catch {
  console.error('Instale `yaml` ou rode com node_modules; fallback: manter openapi.json manual.');
  process.exit(1);
}

await writeFile(join(root, 'openapi.json'), JSON.stringify(json, null, 2) + '\n');
console.log('openapi.json atualizado');
