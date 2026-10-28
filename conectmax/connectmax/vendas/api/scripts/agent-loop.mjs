#!/usr/bin/env node
/**
 * @deprecated Use vendas/worker (`npm start` lá).
 * Mantido como ponte para o loop real.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const worker = join(here, '../../worker/src/loop.mjs');
console.warn(
  '[agent-loop] deprecado → vendas/worker (mesmo env AGENT_ID / API_URL / AGENT_API_KEY)',
);
const child = spawn(process.execPath, [worker], {
  stdio: 'inherit',
  env: process.env,
});
child.on('exit', (code) => process.exit(code ?? 1));
