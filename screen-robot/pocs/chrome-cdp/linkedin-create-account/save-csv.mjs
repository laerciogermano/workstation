/**
 * Grava conta LinkedIn nos CSVs do lab (fingerprint completo + CDP + IP).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';

const __dir = dirname(fileURLToPath(import.meta.url));
const LI_CSV = resolve(__dir, '../../android-studio/contas-linkedin-clozzy.csv');
const CHROME_CSV = resolve(
  __dir,
  '../../android-studio/contas-facebook-chrome.csv',
);

/** Header canônico — todos os campos configurados no fingerprint (sem viewport/hash). */
export const LI_HEADER = [
  'data_criacao',
  'nome',
  'email',
  'senha_li',
  'restrita',
  'li_criado',
  'origem',
  'ip',
  'objetivo',
  'observacoes',
  'cidade',
  'company',
  'cdp',
  'cdp_port',
  'fp_ua',
  'fp_platform',
  'fp_lang',
  'fp_accept_language',
  'fp_timezone',
  'fp_locale',
  'fp_hw',
  'fp_mem',
  'fp_geo_lat',
  'fp_geo_lon',
  'fp_geo_accuracy',
  'fp_max_touch',
  'fp_touch',
  'fp_webrtc',
  'fp_ch_platform',
  'fp_platform_version',
  'fp_arch',
  'fp_model',
  'fp_mobile',
  'fp_bitness',
  'fp_brands',
  'fp_full_version_list',
  'fp_chrome',
  'fp_screen',
  // perfil LinkedIn (pós-signup)
  'li_url',
  'li_headline',
  'li_cargo',
  'li_about',
  'li_foto',
  'li_banner',
  'li_exp1_titulo',
  'li_exp1_empresa',
  'li_exp1_inicio',
  'li_exp1_fim',
  'li_exp1_atual',
  'li_exp1_desc',
  'li_exp2_titulo',
  'li_exp2_empresa',
  'li_exp2_inicio',
  'li_exp2_fim',
  'li_exp2_atual',
  'li_exp2_desc',
  'li_exp3_titulo',
  'li_exp3_empresa',
  'li_exp3_inicio',
  'li_exp3_fim',
  'li_exp3_atual',
  'li_exp3_desc',
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return { header: [], rows: [] };
  const header = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = splitCsvLine(line);
    const o = {};
    for (let i = 0; i < header.length; i++) o[header[i]] = cols[i] ?? '';
    return o;
  });
  return { header, rows };
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function esc(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(path, header, rows) {
  const body = [
    header.join(','),
    ...rows.map((r) => header.map((h) => esc(r[h] ?? '')).join(',')),
  ].join('\n');
  writeFileSync(path, body.endsWith('\n') ? body : body + '\n');
}

function fetchIp() {
  const r = spawnSync('curl', ['-sS', '--max-time', '8', 'https://api.ipify.org'], {
    encoding: 'utf8',
  });
  if (r.status !== 0) return '';
  return (r.stdout || '').trim();
}

function brandsCompact(list) {
  if (!Array.isArray(list) || !list.length) return '';
  return list.map((b) => `${b.brand}:${b.version}`).join('|');
}

function chromeVersion(fp) {
  const full = fp?.userAgentMetadata?.fullVersionList?.find(
    (b) => /chrome/i.test(b.brand),
  );
  return full?.version || '';
}

/** Mapeia fingerprint → cols fp_* da planilha. */
export function fingerprintToCsvCols(fp = {}) {
  const geo = fp.geolocation || {};
  const meta = fp.userAgentMetadata || {};
  return {
    fp_ua: fp.userAgent || '',
    fp_platform: fp.platform || '',
    fp_lang: fp.lang || '',
    fp_accept_language: fp.acceptLanguage || '',
    fp_timezone: fp.timezone || '',
    fp_locale: fp.locale || '',
    fp_hw: fp.hardwareConcurrency != null ? String(fp.hardwareConcurrency) : '',
    fp_mem: fp.deviceMemory != null ? String(fp.deviceMemory) : '',
    fp_geo_lat: geo.latitude != null ? String(geo.latitude) : '',
    fp_geo_lon: geo.longitude != null ? String(geo.longitude) : '',
    fp_geo_accuracy: geo.accuracy != null ? String(geo.accuracy) : '',
    fp_max_touch: fp.maxTouchPoints != null ? String(fp.maxTouchPoints) : '',
    fp_touch: fp.touch != null ? String(!!fp.touch) : '',
    fp_webrtc: fp.webrtcIpHandling || '',
    fp_ch_platform: meta.platform || '',
    fp_platform_version: meta.platformVersion || '',
    fp_arch: meta.architecture || '',
    fp_model: meta.model || '',
    fp_mobile: meta.mobile != null ? String(!!meta.mobile) : '',
    fp_bitness: meta.bitness || '',
    fp_brands: brandsCompact(meta.brands),
    fp_full_version_list: brandsCompact(meta.fullVersionList),
    fp_chrome: chromeVersion(fp),
    fp_screen: '', // viewport proibido
  };
}

function readMetaFingerprint(cdpId) {
  if (!cdpId) return null;
  const p = resolve(homedir(), 'chrome-profiles', cdpId, '.human-cdp.json');
  if (!existsSync(p)) return null;
  try {
    const meta = JSON.parse(readFileSync(p, 'utf8'));
    return meta.fingerprint || null;
  } catch {
    return null;
  }
}

/**
 * Garante header canônico no CSV LI (migra cols novas vazias nas linhas antigas).
 */
export function ensureLinkedinCsvHeader() {
  if (!existsSync(LI_CSV)) throw new Error(`CSV ausente: ${LI_CSV}`);
  const { rows } = parseCsv(readFileSync(LI_CSV, 'utf8'));
  const next = rows.map((r) => {
    const o = {};
    for (const h of LI_HEADER) o[h] = r[h] ?? '';
    return o;
  });
  writeCsv(LI_CSV, LI_HEADER, next);
  return { rows: next.length, header: LI_HEADER };
}

/**
 * Infere se a conta LI chegou a ser criada (sim/nao) a partir de observacoes.
 */
export function inferLiCriado(observacoes = '', explicit) {
  if (explicit === 'sim' || explicit === 'nao') return explicit;
  const o = String(observacoes || '').toLowerCase();
  if (
    /criada_chrome_cdp|email_confirmado|onboarding completo|onboarding → \/feed|status criada/.test(
      o,
    )
  ) {
    return 'sim';
  }
  if (
    /mailbox_cdp_prontos|signup_em_andamento|signup incompleto|nao_criada/.test(o)
  ) {
    return 'nao';
  }
  // restrita / AVD antigo: conta existiu (mesmo que depois restrita)
  if (/restrita|avd |criada via chrome/.test(o)) return 'sim';
  return 'nao';
}

/**
 * Preenche fp_* a partir do .human-cdp.json quando a linha tem cdp e fp incompleto.
 * Também preenche li_criado vazio via inferência.
 */
export function backfillFingerprintFromMeta() {
  ensureLinkedinCsvHeader();
  const { rows } = parseCsv(readFileSync(LI_CSV, 'utf8'));
  let updated = 0;
  const next = rows.map((r) => {
    const o = { ...r };
    for (const h of LI_HEADER) if (o[h] == null) o[h] = '';
    let changed = false;
    if (!o.li_criado) {
      o.li_criado = inferLiCriado(o.observacoes);
      changed = true;
    }
    if (o.cdp && !(o.fp_accept_language && o.fp_webrtc && o.fp_brands)) {
      const fp = readMetaFingerprint(o.cdp);
      if (fp) {
        Object.assign(o, fingerprintToCsvCols(fp));
        changed = true;
      }
    }
    if (changed) updated += 1;
    return o;
  });
  writeCsv(LI_CSV, LI_HEADER, next);
  return { updated, rows: next.length };
}

/**
 * Salva/atualiza linha nos CSVs a partir do resultado de createEmail + createLinkedInCdp.
 *
 * @param {{
 *   email: object,
 *   cdp: object,
 *   ip?: string,
 *   senhaLi?: string,
 *   cidade?: string,
 *   company?: string,
 *   liCriado?: 'sim'|'nao',
 *   dryRun?: boolean,
 *   writeChromeCsv?: boolean,
 * }} opts
 */
export function saveAccountCsv(opts = {}) {
  const emailRes = opts.email || {};
  const cdpRes = opts.cdp || {};
  let fp = cdpRes.fingerprint || {};
  if (!fp.userAgent && cdpRes.id) {
    fp = readMetaFingerprint(cdpRes.id) || fp;
  }
  const dryRun = !!opts.dryRun;
  const writeChrome = opts.writeChromeCsv !== false;

  const email = String(emailRes.email || '').trim();
  const name = String(emailRes.name || cdpRes.name || '').trim();
  if (!email || !name) throw new Error('saveAccountCsv: email e name obrigatórios');

  const ip = opts.ip != null ? String(opts.ip).trim() : fetchIp();
  const cdpId = cdpRes.id || '';
  const cdpPort = cdpRes.port != null ? String(cdpRes.port) : '';
  const cidade = String(opts.cidade || opts.location || '').trim();
  const company = String(opts.company || opts.empresa || '').trim();
  const fpCols = fingerprintToCsvCols(fp);
  const observacoes = [
    `conta LI via CDP (perfil ${cdpId} :${cdpPort})`,
    fp.timezone ? `fingerprint ${fp.platform}/${fp.timezone}` : '',
    'senha mailbox em credenciais.md',
    opts.liCriado === 'sim' ? 'status criada_chrome_cdp' : 'status mailbox_cdp_prontos',
    'fingerprint sem viewport',
  ]
    .filter(Boolean)
    .join('; ');

  const row = {
    data_criacao: today(),
    nome: name,
    email,
    senha_li: opts.senhaLi || 'in@12345678',
    restrita: 'nao',
    li_criado: opts.liCriado === 'sim' ? 'sim' : 'nao',
    origem: 'CDP',
    ip,
    objetivo: 'Criar a conta LinkedIn via Chrome + CDP com fingerprint novo',
    observacoes,
    cidade,
    company,
    cdp: cdpId,
    cdp_port: cdpPort,
    ...fpCols,
  };

  const chromeRow = {
    data: today(),
    nome: name,
    plataforma: 'linkedin',
    chrome_user_data_dir: `~/chrome-profiles/${cdpId}`,
    cdp_port: cdpPort,
    start_script: `human-cdp createCdp ${cdpId}`,
    obs: `perfil Chrome isolado; fingerprint ${fp.platform || ''} ${fp.timezone || ''}; LI signup`.trim(),
  };

  if (dryRun) {
    return { dryRun: true, linkedin: row, chrome: chromeRow, paths: { LI_CSV, CHROME_CSV } };
  }

  if (!existsSync(LI_CSV)) throw new Error(`CSV ausente: ${LI_CSV}`);
  ensureLinkedinCsvHeader();
  const { rows } = parseCsv(readFileSync(LI_CSV, 'utf8'));
  const next = rows.filter((r) => r.email !== email);
  next.push(row);
  writeCsv(LI_CSV, LI_HEADER, next);

  let chromeSaved = false;
  if (writeChrome && cdpId && existsSync(CHROME_CSV)) {
    const ch = parseCsv(readFileSync(CHROME_CSV, 'utf8'));
    const chNext = ch.rows.filter(
      (r) => !(r.chrome_user_data_dir || '').includes(cdpId),
    );
    chNext.push(chromeRow);
    writeCsv(CHROME_CSV, ch.header, chNext);
    chromeSaved = true;
  }

  return {
    saved: true,
    email,
    cdp: cdpId,
    ip,
    linkedinCsv: LI_CSV,
    chromeCsv: chromeSaved ? CHROME_CSV : null,
  };
}

/**
 * Atualiza só li_criado (+ status em observacoes) na linha existente.
 * @param {{ email: string, liCriado?: 'sim'|'nao', dryRun?: boolean }} opts
 */
export function markLiCriado(opts = {}) {
  const email = String(opts.email || '').trim();
  if (!email) throw new Error('markLiCriado: email obrigatório');
  const liCriado = opts.liCriado === 'nao' ? 'nao' : 'sim';
  if (opts.dryRun) {
    return { dryRun: true, email, li_criado: liCriado };
  }
  if (!existsSync(LI_CSV)) throw new Error(`CSV ausente: ${LI_CSV}`);
  ensureLinkedinCsvHeader();
  const { rows } = parseCsv(readFileSync(LI_CSV, 'utf8'));
  let found = false;
  const next = rows.map((r) => {
    if (r.email !== email) return r;
    found = true;
    const o = { ...r };
    o.li_criado = liCriado;
    const obs = String(o.observacoes || '');
    if (liCriado === 'sim') {
      o.observacoes = obs
        .replace(/status\s+\w+/gi, 'status criada_chrome_cdp')
        .replace(/mailbox_cdp_prontos/gi, 'criada_chrome_cdp');
      if (!/criada_chrome_cdp|li_criado/i.test(o.observacoes)) {
        o.observacoes = (obs ? `${obs}; ` : '') + 'status criada_chrome_cdp';
      }
    }
    return o;
  });
  if (!found) throw new Error(`markLiCriado: e-mail não está no CSV: ${email}`);
  writeCsv(LI_CSV, LI_HEADER, next);
  return { saved: true, email, li_criado: liCriado, linkedinCsv: LI_CSV };
}

function periodStart(exp = {}) {
  const m = String(exp.startMonth || '').trim();
  const y = String(exp.startYear || '').trim();
  if (!y) return '';
  return m ? `${m}/${y}` : y;
}

function periodEnd(exp = {}) {
  if (exp.current) return 'presente';
  const m = String(exp.endMonth || '').trim();
  const y = String(exp.endYear || '').trim();
  if (!y) return '';
  return m ? `${m}/${y}` : y;
}

/**
 * Atualiza colunas de perfil LinkedIn (url, headline, about, foto, banner, até 3 exps).
 *
 * @param {{
 *   email: string,
 *   liUrl?: string,
 *   headline?: string,
 *   cargo?: string,
 *   about?: string,
 *   foto?: string,
 *   banner?: string,
 *   experiences?: Array<Record<string, any>>,
 *   observacoesExtra?: string,
 *   dryRun?: boolean,
 * }} opts
 */
export function updateLinkedinProfileCsv(opts = {}) {
  const email = String(opts.email || '').trim();
  if (!email) throw new Error('updateLinkedinProfileCsv: email obrigatório');

  const patch = {
    li_url: opts.liUrl != null ? String(opts.liUrl).trim() : undefined,
    li_headline: opts.headline != null ? String(opts.headline).trim() : undefined,
    li_cargo: opts.cargo != null ? String(opts.cargo).trim() : undefined,
    li_about: opts.about != null ? String(opts.about).trim() : undefined,
    li_foto: opts.foto != null ? String(opts.foto).trim() : undefined,
    li_banner: opts.banner != null ? String(opts.banner).trim() : undefined,
  };

  const exps = Array.isArray(opts.experiences) ? opts.experiences.slice(0, 3) : null;
  if (exps) {
    for (let i = 0; i < 3; i++) {
      const n = i + 1;
      const e = exps[i] || {};
      patch[`li_exp${n}_titulo`] = String(e.title || '').trim();
      patch[`li_exp${n}_empresa`] = String(e.company || '').trim();
      patch[`li_exp${n}_inicio`] = periodStart(e);
      patch[`li_exp${n}_fim`] = periodEnd(e);
      patch[`li_exp${n}_atual`] = e.current ? 'sim' : e.title ? 'nao' : '';
      patch[`li_exp${n}_desc`] = String(e.description || '').trim();
    }
  }

  if (opts.dryRun) {
    return { dryRun: true, email, patch };
  }

  if (!existsSync(LI_CSV)) throw new Error(`CSV ausente: ${LI_CSV}`);
  ensureLinkedinCsvHeader();
  const { rows } = parseCsv(readFileSync(LI_CSV, 'utf8'));
  let found = false;
  const next = rows.map((r) => {
    if (r.email !== email) return r;
    found = true;
    const o = { ...r };
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) o[k] = v;
    }
    if (opts.observacoesExtra) {
      const extra = String(opts.observacoesExtra).trim();
      if (extra && !String(o.observacoes || '').includes(extra)) {
        o.observacoes = (o.observacoes ? `${o.observacoes}; ` : '') + extra;
      }
    }
    return o;
  });
  if (!found) throw new Error(`updateLinkedinProfileCsv: e-mail não está no CSV: ${email}`);
  writeCsv(LI_CSV, LI_HEADER, next);
  return { saved: true, email, linkedinCsv: LI_CSV, keys: Object.keys(patch) };
}
