/**
 * Snapshots de CDP via pastas legíveis:
 *   ~/chrome-cdp-snapshots/<cdpId>/
 *     selected.json
 *     <snapshotId>/
 *       meta.json
 *       profile/          ← cópia de ~/chrome-profiles/<cdpId>/
 *
 * Todo start: apaga o perfil atual e restaura o snapshot selecionado.
 * Compat: também lê ~/chrome-cdp-backups/ (nome antigo).
 */
import { spawn, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const PROFILES_DIR = join(homedir(), 'chrome-profiles');
const SNAPSHOTS_DIR = join(homedir(), 'chrome-cdp-snapshots');
const LEGACY_BACKUPS_DIR = join(homedir(), 'chrome-cdp-backups');
const META_FILE = '.human-cdp.json';
const SELECTED_FILE = 'selected.json';

function profilePath(id) {
  return join(PROFILES_DIR, id);
}

/** Prefere snapshots/; também lê backups/ legado. */
export function snapshotsDir() {
  return SNAPSHOTS_DIR;
}

function cdpRoots(id) {
  return [join(SNAPSHOTS_DIR, id), join(LEGACY_BACKUPS_DIR, id)];
}

function findSnapshotDir(id, snapshotId) {
  for (const root of cdpRoots(id)) {
    const dir = join(root, snapshotId);
    if (existsSync(dir)) return dir;
  }
  return join(SNAPSHOTS_DIR, id, snapshotId);
}

function selectedPath(id) {
  for (const root of cdpRoots(id)) {
    const p = join(root, SELECTED_FILE);
    if (existsSync(p)) return p;
  }
  return join(SNAPSHOTS_DIR, id, SELECTED_FILE);
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

export function listSnapshots(cdpId) {
  const selected = getSelectedSnapshot(cdpId);
  /** @type {Map<string, object>} */
  const map = new Map();
  for (const root of cdpRoots(cdpId)) {
    if (!existsSync(root)) continue;
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
      const id = meta.id || name;
      if (map.has(id)) continue;
      map.set(id, {
        id,
        cdpId,
        createdAt: meta.createdAt || null,
        note: meta.note || '',
        path: dir,
        profilePath: join(dir, 'profile'),
        selected: selected?.id === id,
      });
    }
  }
  return [...map.values()].sort((a, b) =>
    String(b.createdAt || b.id).localeCompare(String(a.createdAt || a.id)),
  );
}

export function getSelectedSnapshot(cdpId) {
  const sel = readJson(selectedPath(cdpId), null);
  const sid = sel?.snapshotId || sel?.backupId;
  if (!sid) return null;
  const dir = findSnapshotDir(cdpId, sid);
  if (!existsSync(dir)) return null;
  const meta = readJson(join(dir, 'meta.json'), {});
  return {
    id: sid,
    cdpId,
    createdAt: meta.createdAt || null,
    note: meta.note || '',
    path: dir,
    profilePath: join(dir, 'profile'),
    selected: true,
  };
}

/**
 * Copia perfil → snapshot. Sempre seleciona o novo se ainda não houver seleção,
 * ou se `select: true`.
 */
export function createSnapshot(cdpId, { note = '', select = null } = {}) {
  const src = profilePath(cdpId);
  if (!existsSync(src)) throw new Error(`perfil ausente: ${src}`);
  const id = stampId();
  const root = join(SNAPSHOTS_DIR, cdpId);
  mkdirSync(root, { recursive: true });
  const dir = join(root, id);
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
  const shouldSelect = select === true || (select !== false && !getSelectedSnapshot(cdpId));
  if (shouldSelect) selectSnapshot(cdpId, id);
  return { ...meta, selected: getSelectedSnapshot(cdpId)?.id === id };
}

export function selectSnapshot(cdpId, snapshotId) {
  const dir = findSnapshotDir(cdpId, snapshotId);
  if (!existsSync(dir)) throw new Error(`snapshot não encontrado: ${snapshotId}`);
  // grava sempre em snapshots/
  const root = join(SNAPSHOTS_DIR, cdpId);
  mkdirSync(root, { recursive: true });
  writeJson(join(root, SELECTED_FILE), {
    snapshotId,
    path: dir,
    selectedAt: new Date().toISOString(),
  });
  return getSelectedSnapshot(cdpId);
}

export function removeSnapshot(cdpId, snapshotId) {
  const dir = findSnapshotDir(cdpId, snapshotId);
  if (!existsSync(dir)) return false;
  rmSync(dir, { recursive: true, force: true });
  const sel = readJson(selectedPath(cdpId), null);
  const sid = sel?.snapshotId || sel?.backupId;
  if (sid === snapshotId) {
    for (const root of cdpRoots(cdpId)) {
      const p = join(root, SELECTED_FILE);
      if (existsSync(p)) rmSync(p, { force: true });
    }
    const rest = listSnapshots(cdpId);
    if (rest[0]) selectSnapshot(cdpId, rest[0].id);
  }
  return true;
}

/**
 * Apaga o perfil atual e copia o snapshot.
 * Preserva `.human-cdp.json` atual (porta/fingerprint/selectedMediaId).
 */
export function restoreSnapshot(cdpId, snapshotId) {
  const sid = snapshotId || getSelectedSnapshot(cdpId)?.id;
  if (!sid) throw new Error(`nenhum snapshot selecionado para ${cdpId}`);
  const srcProfile = join(findSnapshotDir(cdpId, sid), 'profile');
  if (!existsSync(srcProfile)) throw new Error(`profile do snapshot ausente: ${srcProfile}`);

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
    snapshotId: sid,
    restoredTo: dest,
    from: srcProfile,
    preservedMeta: !!liveMeta,
  };
}

/**
 * Obrigatório antes de todo start: restaura o snapshot selecionado.
 * Sem snapshot: cria um baseline a partir do perfil atual e seleciona
 * (CDPs antigos / migração). Novos já nascem com snapshot de criação.
 */
export function restoreSelectedBeforeStart(cdpId) {
  let selected = getSelectedSnapshot(cdpId);
  if (!selected) {
    const all = listSnapshots(cdpId);
    if (all.length) {
      throw new Error(
        `há ${all.length} snapshot(s); selecione um antes de executar (${join(SNAPSHOTS_DIR, cdpId)})`,
      );
    }
    if (!existsSync(profilePath(cdpId))) {
      throw new Error(`CDP ${cdpId} sem perfil e sem snapshot`);
    }
    createSnapshot(cdpId, { note: 'auto (primeiro snapshot)', select: true });
    selected = getSelectedSnapshot(cdpId);
  }
  return restoreSnapshot(cdpId, selected.id);
}

/**
 * Empacota snapshot em tar.gz (stdout do `tar`).
 * @returns {{ filename: string, child: import('node:child_process').ChildProcessWithoutNullStreams, stream: import('node:stream').Readable }}
 */
export function packSnapshotStream(cdpId, snapshotId) {
  const dir = findSnapshotDir(cdpId, snapshotId);
  if (!existsSync(dir)) throw new Error(`snapshot não encontrado: ${snapshotId}`);
  if (!existsSync(join(dir, 'profile'))) {
    throw new Error(`profile do snapshot ausente: ${snapshotId}`);
  }
  const safeCdp = String(cdpId).replace(/[^a-zA-Z0-9._-]+/g, '_');
  const safeSid = String(snapshotId).replace(/[^a-zA-Z0-9._-]+/g, '_');
  const filename = `${safeCdp}-${safeSid}.tar.gz`;
  const child = spawn('tar', ['-czf', '-', '-C', dir, '.'], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return { filename, child, stream: child.stdout };
}

function findImportedRoot(extractDir) {
  if (existsSync(join(extractDir, 'profile'))) return extractDir;
  const kids = readdirSync(extractDir).filter((n) => {
    try {
      return statSync(join(extractDir, n)).isDirectory();
    } catch {
      return false;
    }
  });
  for (const name of kids) {
    const p = join(extractDir, name);
    if (existsSync(join(p, 'profile'))) return p;
  }
  throw new Error('arquivo inválido: falta pasta profile/ no .tar.gz');
}

/**
 * Importa .tar.gz (ou .tgz) gerado por pack/Baixar.
 * Cria novo snapshotId (stamp) no CDP destino.
 */
export function importSnapshot(
  cdpId,
  { buffer, filename = 'snapshot.tar.gz', note = '', select = true } = {},
) {
  if (!buffer?.length) throw new Error('arquivo vazio');
  const name = String(filename || 'snapshot.tar.gz').toLowerCase();
  if (!/\.(tar\.gz|tgz)$/.test(name)) {
    throw new Error('use .tar.gz (Baixar na UI); .zip não suportado');
  }

  const tmp = mkdtempSync(join(tmpdir(), 'cdp-snap-import-'));
  try {
    const archive = join(tmp, basename(filename) || 'snapshot.tar.gz');
    writeFileSync(archive, buffer);
    const extractDir = join(tmp, 'extract');
    mkdirSync(extractDir, { recursive: true });
    const r = spawnSync('tar', ['-xzf', archive, '-C', extractDir], {
      encoding: 'utf8',
    });
    if (r.status !== 0) {
      throw new Error(`falha ao extrair: ${(r.stderr || r.stdout || '').slice(0, 300)}`);
    }
    const src = findImportedRoot(extractDir);
    const id = stampId();
    const root = join(SNAPSHOTS_DIR, cdpId);
    mkdirSync(root, { recursive: true });
    const dest = join(root, id);
    mkdirSync(dest, { recursive: true });
    cpSync(src, dest, { recursive: true, dereference: true });

    const prev = readJson(join(dest, 'meta.json'), {});
    const meta = {
      id,
      cdpId,
      createdAt: new Date().toISOString(),
      note: String(note || prev.note || 'importado').trim(),
      path: dest,
      profilePath: join(dest, 'profile'),
      importedFrom: basename(filename),
      importedAt: new Date().toISOString(),
      sourceSnapshotId: prev.id || null,
    };
    writeJson(join(dest, 'meta.json'), meta);
    if (select) selectSnapshot(cdpId, id);
    return { ...meta, selected: getSelectedSnapshot(cdpId)?.id === id };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

// --- aliases (compat backup → snapshot) ---
export const backupsDir = snapshotsDir;
export const listBackups = listSnapshots;
export const getSelectedBackup = getSelectedSnapshot;
export const createBackup = createSnapshot;
export const selectBackup = selectSnapshot;
export const removeBackup = removeSnapshot;
export const restoreBackup = restoreSnapshot;
