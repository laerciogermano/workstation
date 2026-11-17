/**
 * Backups de CDP via pastas legíveis:
 *   ~/chrome-cdp-backups/<cdpId>/
 *     selected.json
 *     <backupId>/
 *       meta.json
 *       profile/          ← cópia de ~/chrome-profiles/<cdpId>/
 *
 * No start: apaga o perfil atual e restaura o backup selecionado (snapshot limpo).
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROFILES_DIR = join(homedir(), 'chrome-profiles');
const BACKUPS_DIR = join(homedir(), 'chrome-cdp-backups');
const META_FILE = '.human-cdp.json';
const SELECTED_FILE = 'selected.json';

function profilePath(id) {
  return join(PROFILES_DIR, id);
}

function cdpBackupRoot(id) {
  return join(BACKUPS_DIR, id);
}

function backupPath(id, backupId) {
  return join(cdpBackupRoot(id), backupId);
}

function selectedPath(id) {
  return join(cdpBackupRoot(id), SELECTED_FILE);
}

function stampId(d = new Date()) {
  return d.toISOString().replace(/\.\d{3}Z$/, 'Z').replace(/:/g, '-');
}

function readJson(p, fallback = null) {
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(p, obj) {
  mkdirSync(join(p, '..'), { recursive: true });
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

export function backupsDir() {
  return BACKUPS_DIR;
}

export function listBackups(cdpId) {
  const root = cdpBackupRoot(cdpId);
  if (!existsSync(root)) return [];
  const selected = getSelectedBackup(cdpId);
  const rows = [];
  for (const name of readdirSync(root)) {
    if (name === SELECTED_FILE) continue;
    const dir = join(root, name);
    try {
      if (!statSync(dir).isDirectory()) continue;
    } catch {
      continue;
    }
    const meta = readJson(join(dir, 'meta.json'), {
      id: name,
      cdpId,
      createdAt: null,
      note: '',
      path: dir,
    });
    rows.push({
      id: meta.id || name,
      cdpId,
      createdAt: meta.createdAt || null,
      note: meta.note || '',
      path: dir,
      profilePath: join(dir, 'profile'),
      selected: selected?.id === (meta.id || name),
    });
  }
  return rows.sort((a, b) => String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)));
}

export function getSelectedBackup(cdpId) {
  const sel = readJson(selectedPath(cdpId), null);
  if (!sel?.backupId) return null;
  const dir = backupPath(cdpId, sel.backupId);
  if (!existsSync(dir)) return null;
  const meta = readJson(join(dir, 'meta.json'), {});
  return {
    id: sel.backupId,
    cdpId,
    createdAt: meta.createdAt || null,
    note: meta.note || '',
    path: dir,
    profilePath: join(dir, 'profile'),
    selected: true,
  };
}

/**
 * Copia ~/chrome-profiles/<id>/ → ~/chrome-cdp-backups/<id>/<stamp>/profile/
 */
export function createBackup(cdpId, { note = '' } = {}) {
  const src = profilePath(cdpId);
  if (!existsSync(src)) throw new Error(`perfil ausente: ${src}`);
  const id = stampId();
  const dir = backupPath(cdpId, id);
  const destProfile = join(dir, 'profile');
  mkdirSync(destProfile, { recursive: true });
  cpSync(src, destProfile, { recursive: true, dereference: true });
  const meta = {
    id,
    cdpId,
    createdAt: new Date().toISOString(),
    note: String(note || '').trim(),
    path: dir,
    profilePath: destProfile,
    sourcePath: src,
  };
  writeJson(join(dir, 'meta.json'), meta);
  // se não há selecionado, este vira o selecionado
  if (!getSelectedBackup(cdpId)) {
    selectBackup(cdpId, id);
  }
  return { ...meta, selected: getSelectedBackup(cdpId)?.id === id };
}

export function selectBackup(cdpId, backupId) {
  const dir = backupPath(cdpId, backupId);
  if (!existsSync(dir)) throw new Error(`backup não encontrado: ${backupId}`);
  writeJson(selectedPath(cdpId), {
    backupId,
    path: dir,
    selectedAt: new Date().toISOString(),
  });
  return getSelectedBackup(cdpId);
}

export function removeBackup(cdpId, backupId) {
  const dir = backupPath(cdpId, backupId);
  if (!existsSync(dir)) return false;
  rmSync(dir, { recursive: true, force: true });
  const sel = readJson(selectedPath(cdpId), null);
  if (sel?.backupId === backupId) {
    rmSync(selectedPath(cdpId), { force: true });
    const rest = listBackups(cdpId);
    if (rest[0]) selectBackup(cdpId, rest[0].id);
  }
  return true;
}

/**
 * Apaga o perfil atual e copia o snapshot do backup.
 * Preserva `.human-cdp.json` atual (porta/fingerprint da gestão) se existir.
 */
export function restoreBackup(cdpId, backupId) {
  const bid = backupId || getSelectedBackup(cdpId)?.id;
  if (!bid) throw new Error(`nenhum backup selecionado para ${cdpId}`);
  const srcProfile = join(backupPath(cdpId, bid), 'profile');
  if (!existsSync(srcProfile)) throw new Error(`profile do backup ausente: ${srcProfile}`);

  const dest = profilePath(cdpId);
  const metaFile = join(dest, META_FILE);
  let liveMeta = null;
  if (existsSync(metaFile)) {
    try {
      liveMeta = JSON.parse(readFileSync(metaFile, 'utf8'));
    } catch {
      liveMeta = null;
    }
  }

  if (existsSync(dest)) {
    rmSync(dest, { recursive: true, force: true });
  }
  mkdirSync(dest, { recursive: true });
  cpSync(srcProfile, dest, { recursive: true, dereference: true });

  if (liveMeta) {
    writeFileSync(metaFile, JSON.stringify(liveMeta, null, 2) + '\n');
  }

  return {
    cdpId,
    backupId: bid,
    restoredTo: dest,
    from: srcProfile,
    preservedMeta: !!liveMeta,
  };
}

/**
 * Garante restore do selecionado antes do start.
 * Sem backups → ok (primeiro uso). Com backups e sem seleção → erro.
 */
export function restoreSelectedBeforeStart(cdpId) {
  const selected = getSelectedBackup(cdpId);
  const all = listBackups(cdpId);
  if (selected) {
    return restoreBackup(cdpId, selected.id);
  }
  if (all.length) {
    throw new Error(
      `há ${all.length} backup(s) em ${cdpBackupRoot(cdpId)}; selecione um antes de executar`,
    );
  }
  return { cdpId, skipped: true, reason: 'sem backups' };
}
