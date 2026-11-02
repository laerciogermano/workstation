#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { replaceAllCdps, storePath } from '../src/registry.mjs';

const csvPath =
  process.env.CDP_CSV ||
  resolve(import.meta.dirname, '../../../android-studio/contas-facebook-chrome.csv');

const text = readFileSync(csvPath, 'utf8').trim();
const lines = text.split(/\r?\n/);
const header = lines.shift().split(',');
const idx = Object.fromEntries(header.map((h, i) => [h.trim(), i]));

const cdps = lines
  .filter((l) => l.trim())
  .map((line) => {
    const cols = line.split(',');
    const port = Number(cols[idx.cdp_port]);
    return {
      id: randomUUID(),
      name: (cols[idx.nome] || '').trim() || `port-${port}`,
      userDataDir: (cols[idx.chrome_user_data_dir] || '').trim(),
      port,
      startScript: (cols[idx.start_script] || '').trim(),
      platform: (cols[idx.plataforma] || '').trim(),
      defaultUrl: '',
      obs: (cols[idx.obs] || '').trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'contas-facebook-chrome.csv',
    };
  })
  .filter((c) => Number.isFinite(c.port));

replaceAllCdps(cdps);
console.log(`seed: ${cdps.length} → ${storePath()}`);
for (const c of cdps) console.log(`  ${c.port}\t${c.name}`);
