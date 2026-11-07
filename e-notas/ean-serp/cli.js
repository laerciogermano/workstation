#!/usr/bin/env node
import 'dotenv/config';
import { resolveEanByDescricao } from './src/resolve.js';

const args = process.argv.slice(2);
const descricao = args.filter((a) => !a.startsWith('--')).join(' ').trim();
const enrich = !args.includes('--no-enrich');
const googleCdp = args.includes('--google-cdp');
const limitArg = args.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

if (!descricao) {
  console.error('Uso: npm run resolve -- "PAO DE FORMA VISCONTI TRAD.400G" [--limit=5] [--no-enrich] [--google-cdp]');
  process.exit(1);
}

const result = await resolveEanByDescricao(descricao, { enrich, googleCdp, limit });
console.log(JSON.stringify(result, null, 2));
