import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { ts } from '../../log.mjs';

/** screen-robot/src a partir de vendas/worker. */
export function resolveScreenRobotSrc() {
  const cwd = resolve(
    process.cwd(),
    process.env.EXTRACT_CWD ||
      process.env.CONNECT_CWD ||
      '../../../../screen-robot/src',
  );
  if (!existsSync(cwd)) {
    throw new Error(`EXTRACT_CWD/CONNECT_CWD inexistente: ${cwd}`);
  }
  return cwd;
}

export function resolveCdpTarget(ctx = {}) {
  const cdpId =
    String(ctx.cdpId || process.env.CDP_ID || '').trim() || null;
  const cdpUrl =
    String(ctx.cdpUrl || process.env.CDP_URL || '').trim() || null;
  if (!cdpId && !cdpUrl) {
    throw new Error('CDP_ID ou CDP_URL obrigatório (worker CDP)');
  }
  return { cdpId, cdpUrl };
}

export function resolveApiUrl(ctx = {}) {
  const apiUrl = (
    process.env.PROFILES_API_URL ||
    ctx.apiUrl ||
    process.env.API_URL ||
    ''
  ).replace(/\/$/, '');
  if (!apiUrl) throw new Error('PROFILES_API_URL ou API_URL obrigatório');
  return apiUrl;
}

export function spawnNpm(cwd, args, env) {
  const timeoutMs = Number(
    env.WORKER_SCRIPT_TIMEOUT_MS ||
      process.env.WORKER_SCRIPT_TIMEOUT_MS ||
      0,
  );
  const label = `npm ${args.join(' ')}`;
  console.log(
    `${ts()} [spawn] iniciando robô: ${label}${
      Number.isFinite(timeoutMs) && timeoutMs >= 30_000
        ? ` (timeout ${Math.round(timeoutMs / 1000)}s)`
        : ''
    }`,
  );
  return new Promise((resolvePromise, reject) => {
    const child = spawn('npm', args, {
      cwd,
      env,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    let timer = null;
    const clear = () => {
      if (timer) clearTimeout(timer);
      timer = null;
    };
    if (Number.isFinite(timeoutMs) && timeoutMs >= 30_000) {
      timer = setTimeout(() => {
        console.warn(
          `${ts()} [spawn] timeout — matando ${label} após ${Math.round(timeoutMs / 1000)}s`,
        );
        try {
          child.kill('SIGTERM');
        } catch {
          /* ignore */
        }
        setTimeout(() => {
          try {
            child.kill('SIGKILL');
          } catch {
            /* ignore */
          }
        }, 5_000);
        reject(
          new Error(
            `script timeout ${Math.round(timeoutMs / 1000)}s: ${label}`,
          ),
        );
      }, timeoutMs);
    }
    child.on('error', (err) => {
      clear();
      console.error(`${ts()} [spawn] falha ao subir processo: ${err.message}`);
      reject(err);
    });
    child.on('close', (code) => {
      clear();
      const c = code ?? 1;
      if (c === 0) {
        console.log(`${ts()} [spawn] robô terminou OK: ${label}`);
      } else {
        console.warn(`${ts()} [spawn] robô saiu com código ${c}: ${label}`);
      }
      resolvePromise(c);
    });
  });
}

/** Env comum para scripts `linkedin-*-cdp`. */
export function cdpScriptEnv(ctx, apiUrl, extra = {}) {
  const { cdpId, cdpUrl } = resolveCdpTarget(ctx);
  const agentId = String(ctx.agentId || process.env.AGENT_ID || '').trim();
  return {
    ...process.env,
    PROFILES_API_URL: apiUrl,
    MESSAGES_API_URL: process.env.MESSAGES_API_URL || apiUrl,
    INVITES_API_URL: process.env.INVITES_API_URL || apiUrl,
    ...(cdpId ? { CDP_ID: cdpId } : {}),
    ...(cdpUrl ? { CDP_URL: cdpUrl } : {}),
    ...(ctx.apiKey ? { AGENT_API_KEY: ctx.apiKey } : {}),
    ...(agentId ? { AGENT_ID: agentId } : {}),
    ...extra,
  };
}
