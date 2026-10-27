/**
 * Conectar em perfil LinkedIn via URL (deep link VIEW).
 *
 * Fluxo (prints: screenshots/jornada-conectar-por-url/):
 * 1. am start VIEW linkedin.com/in/…
 * 2. Se OCR = "This page doesn't exist" → erro (perfil inexistente)
 * 3. Connect no header → tap; senão só Follow → ⋮ → Connect no sheet
 * 4. Skip no dialog "Add a note"
 * 5. Sucesso **somente** se OCR mostrar Pending após Skip
 * 6. Em sucesso → POST na API (convite feito)
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";

import { adb, sleep } from "./adb.js";
import { extractBySense } from "./extract.js";
import { key, screenshot, tapElement } from "./operate.js";

const OCR = process.env.SCREEN_ROBOT_OCR || "rapidocr";
const WAIT_AFTER_VIEW_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_VIEW_MS || 8_000);
const WAIT_AFTER_TAP_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_TAP_MS || 3_000);
const WAIT_PENDING_MS = Number(process.env.LINKEDIN_CONNECT_WAIT_PENDING_MS || 2_000);
const PENDING_TRIES = Number(process.env.LINKEDIN_CONNECT_PENDING_TRIES || 5);
const MAX_ROUNDS = 10;

/**
 * Base da API de conexões (`client_connection_linkedin`).
 * Default `http://127.0.0.1:3000` — connect/listagem sempre tentam persistir.
 */
export function invitesApiBase() {
  return (
    process.env.INVITES_API_URL ||
    process.env.PROFILES_API_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

/**
 * Base para `client_linkedin_message`.
 * Default `http://127.0.0.1:3000` — envio/leitura sempre tentam persistir.
 */
export function messagesApiBase() {
  return (
    process.env.MESSAGES_API_URL ||
    process.env.INVITES_API_URL ||
    process.env.PROFILES_API_URL ||
    "http://127.0.0.1:3000"
  ).replace(/\/$/, "");
}

/**
 * Agente que dispara o convite (`AGENT_ID` ou `provision.name` do device config).
 * @param {{ provision?: { name?: string } }|null} [cfg]
 */
export function resolveAgentId(cfg = null) {
  const fromEnv = String(process.env.AGENT_ID || "").trim();
  if (fromEnv) return fromEnv;
  const fromCfg = String(cfg?.provision?.name || "").trim();
  return fromCfg || "default";
}

/** Status int em `client_connection_linkedin` (vendas/api). */
export const CONNECTION_STATUS = Object.freeze({
  NOT_SENT: 0,
  PENDING: 1,
  CONNECTED: 2,
});

/**
 * Lê status da conexão agente↔perfil na vendas/api.
 * @returns {Promise<{ status: number|null, row: object|null }>}
 */
export async function fetchConnectionStatus(opts = {}) {
  const base = String(opts.baseUrl || invitesApiBase() || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("INVITES_API_URL/PROFILES_API_URL ausente");
  }
  const profileUrl =
    normalizeLinkedInProfileUrl(opts.profileUrl || opts.url || "") ||
    String(opts.profileUrl || opts.url || "").trim();
  if (!profileUrl) throw new Error("profileUrl obrigatório");
  const agentId =
    String(opts.agentId || resolveAgentId() || "default").trim() || "default";
  const q = new URLSearchParams({
    profileUrl,
    agentId,
    limit: "1",
  });
  const url = `${base}/client-connections-linkedin?${q}`;
  let res;
  try {
    res = await fetch(url);
  } catch (e) {
    throw new Error(
      `vendas/api inacessível (${url}) — ${String(e?.message || e).slice(0, 80)}`,
    );
  }
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(
      `GET conexão → ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 160)}` : ""}`,
    );
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  const row = Array.isArray(data?.data) ? data.data[0] : null;
  return {
    status: row?.status == null ? null : Number(row.status),
    row: row ?? null,
  };
}

/**
 * Envio de mensagem só com conexão aceita (`status === 2`).
 * @throws {{ code: "CONNECTION_NOT_ACCEPTED" }}
 */
export async function assertConnectionAcceptedForSend(opts = {}) {
  const { status } = await fetchConnectionStatus(opts);
  if (status !== CONNECTION_STATUS.CONNECTED) {
    const err = new Error(
      status == null
        ? "conexão não encontrada; só é possível enviar mensagem após aceite (status conectado)"
        : `conexão ainda não aceita (status=${status}); só envia com status conectado (2)`,
    );
    err.code = "CONNECTION_NOT_ACCEPTED";
    throw err;
  }
}


/** Canonicaliza URL do perfil (tira utm_* / query). */
export function normalizeLinkedInProfileUrl(raw) {
  const s = String(raw || "");
  // Slug pode ter acentos (dump UI: /in/vitória-…); [A-Za-z0-9] cortava cedo.
  const m = s.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^\s/?#]+)/i,
  );
  if (!m) return null;
  let slug = m[1].replace(/[.,;:!?)\]}>'"]+$/g, "");
  try {
    slug = decodeURIComponent(slug);
  } catch {
    /* keep raw */
  }
  if (!slug) return null;
  return `https://www.linkedin.com/in/${slug}`;
}

export function openProfileByUrl(serial, linkedinPkg, rawUrl) {
  const url = normalizeLinkedInProfileUrl(rawUrl);
  if (!url) {
    throw new Error(`URL inválida (precisa linkedin.com/in/…): ${rawUrl}`);
  }
  adb(serial, [
    "shell",
    "am",
    "start",
    "-a",
    "android.intent.action.VIEW",
    "-d",
    url,
    "-p",
    linkedinPkg,
  ]);
  return url;
}

/** Hit de botão Connect — exclui "connections" / "mutual". */
export function findExactConnect(els) {
  const list = Array.isArray(els) ? els : [];
  for (const el of list) {
    const t = String(el?.text || el?.contentDesc || el?.contentDescription || "")
      .trim();
    if (!t) continue;
    // Dump/UI: content-desc "Invite Artur Elias to connect" (sem text=Connect).
    const inviteToConnect = /\binvite\b.+\bto connect\b/i.test(t);
    const exactConnect = /^[\+＋]?\s*connect$/i.test(t);
    if (!inviteToConnect && !exactConnect) continue;
    // Evita "500+ connections" / "mutual connections".
    if (/\bconnections?\b/i.test(t) && !inviteToConnect) continue;
    if (el.x == null || el.y == null) continue;
    return { text: t, x: el.x, y: el.y };
  }
  return null;
}

export function hasFollow(els) {
  return (els || []).some((el) =>
    /^[\+＋]?\s*follow$/i.test(String(el?.text || "").trim()),
  );
}

export function hasPending(els) {
  return (els || []).some((el) =>
    /^pending$/i.test(String(el?.text || "").trim()),
  );
}

/**
 * LinkedIn 404: "This page doesn't exist" / "Please check your URL…".
 * Junta textos OCR (podem vir partidos) e normaliza apóstrofo.
 */
export function hasPageDoesNotExist(els) {
  const blob = (els || [])
    .map((el) => String(el?.text || "").trim())
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[\u2019\u2018`´]/g, "'");
  return (
    /this\s+page\s+doesn'?t\s+exist/.test(blob) ||
    /please\s+check\s+your\s+url/.test(blob)
  );
}

export function findSkip(els) {
  for (const el of els || []) {
    const t = String(el?.text || "").trim();
    if (/^(skip|ignorar)$/i.test(t) && el.x != null && el.y != null) {
      return { text: t, x: el.x, y: el.y };
    }
  }
  return null;
}

/**
 * Ícone ⋮ à direita de Message (ou do Follow) na faixa de CTAs do perfil.
 */
export function findMoreOverflow(els) {
  const list = Array.isArray(els) ? els : [];
  const message = list.find(
    (el) =>
      /\bmessage\b/i.test(String(el?.text || "")) &&
      !/send profile/i.test(String(el?.text || "")),
  );
  const follow = list.find((el) =>
    /^[\+＋]?\s*follow$/i.test(String(el?.text || "").trim()),
  );
  const anchor = message || follow;
  if (!anchor || anchor.y == null) return null;

  const icons = list.filter(
    (el) =>
      el?.type === "icon" &&
      el.x != null &&
      el.y != null &&
      Math.abs(el.y - anchor.y) <= 40 &&
      el.x > (anchor.x || 0) + 40,
  );
  if (icons.length) {
    icons.sort((a, b) => a.x - b.x);
    return { x: icons[0].x, y: icons[0].y, via: "icon" };
  }
  return {
    x: Math.min(520, (anchor.x || 350) + 140),
    y: anchor.y,
    via: "geom",
  };
}

async function shot(serial, outDir, name) {
  if (!outDir) return;
  screenshot({ serial, path: join(outDir, name) });
}

/**
 * Mapeia `inviteStatus` do cartão (parseProfileHeader) → status da conexão.
 * `connect` / ausente → null (só sobe perfil; não cria/atualiza conexão).
 * @param {string|null|undefined} inviteStatus
 * @returns {0|1|2|null}
 */
export function connectionStatusFromInviteStatus(inviteStatus) {
  const s = String(inviteStatus || "")
    .toLowerCase()
    .trim();
  if (s === "pending") return CONNECTION_STATUS.PENDING;
  if (s === "connected") return CONNECTION_STATUS.CONNECTED;
  return null;
}

/**
 * Após extrair perfil: se Pending/Connected no cartão → upsert conexão;
 * se Connect (não conectado) → não toca conexão.
 * POST {base}/client-connections-linkedin
 */
export async function syncConnectionFromInviteStatus({
  profileUrl,
  inviteStatus,
  peerName = null,
  steps = ["extract-profile"],
  agentId = resolveAgentId(),
  baseUrl = invitesApiBase(),
} = {}) {
  const status = connectionStatusFromInviteStatus(inviteStatus);
  if (status == null) {
    return {
      notified: false,
      reason: "inviteStatus sem conexão (connect/ausente)",
      inviteStatus: inviteStatus ?? null,
    };
  }
  return notifyInviteSent({
    profileUrl,
    peerName,
    steps,
    agentId,
    status,
    baseUrl,
  });
}

/**
 * Upsert em `client_connection_linkedin`.
 * POST {base}/client-connections-linkedin
 * body: { profileUrl, agentId, status, invitedAt?, connectedAt?, peerName?, steps }
 */
export async function notifyInviteSent({
  profileUrl,
  steps = [],
  agentId = resolveAgentId(),
  status = CONNECTION_STATUS.PENDING,
  peerName = null,
  baseUrl = invitesApiBase(),
} = {}) {
  const base = String(baseUrl || "").replace(/\/$/, "");
  if (!base) {
    return { notified: false, reason: "INVITES_API_URL/PROFILES_API_URL ausente" };
  }
  const url = `${base}/client-connections-linkedin`;
  const body = {
    profileUrl,
    agentId: String(agentId || "default").trim() || "default",
    status,
    steps,
  };
  if (peerName) body.peerName = String(peerName).trim();
  if (status === CONNECTION_STATUS.PENDING) {
    body.invitedAt = new Date().toISOString();
  }
  if (status === CONNECTION_STATUS.CONNECTED) {
    body.connectedAt = new Date().toISOString();
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(
      `POST ${url} → ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 240)}` : ""}`,
    );
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { notified: true, url, data, status };
}

/**
 * Após listar N conexões recentes: promove pendentes → conectado (status 2).
 * POST {base}/client-connections-linkedin/mark-accepted
 * body: { agentId, connections: [{ name, title?, connectedOn? }] }
 */
export async function notifyRecentConnectionsAccepted({
  connections = [],
  agentId = resolveAgentId(),
  baseUrl = invitesApiBase(),
} = {}) {
  const base = String(baseUrl || "").replace(/\/$/, "");
  if (!base) {
    return { notified: false, reason: "INVITES_API_URL/PROFILES_API_URL ausente" };
  }
  const list = (Array.isArray(connections) ? connections : [])
    .map((c) => ({
      name: String(c?.name || "").trim(),
      title: c?.title ?? null,
      connectedOn: c?.connectedOn ?? null,
    }))
    .filter((c) => c.name);
  if (!list.length) {
    return { notified: false, reason: "lista de conexões vazia" };
  }
  const url = `${base}/client-connections-linkedin/mark-accepted`;
  const body = {
    agentId: String(agentId || "default").trim() || "default",
    connections: list,
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(
      `POST ${url} → ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 240)}` : ""}`,
    );
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { notified: true, url, data };
}

/**
 * Persiste mensagens em `client_linkedin_message` (vendas/api).
 * POST {base}/client-linkedin-messages
 *
 * @param {{
 *   profileUrl: string,
 *   agentId?: string,
 *   peerName?: string|null,
 *   messages?: Array<{ direction: "sent"|"received", message: string, sender?: string|null, time?: string|null }>,
 *   direction?: "sent"|"received",
 *   message?: string,
 *   sender?: string|null,
 *   time?: string|null,
 *   baseUrl?: string,
 * }} opts
 */
export async function notifyLinkedInMessages(opts = {}) {
  const base = String(opts.baseUrl || messagesApiBase() || "").replace(/\/$/, "");
  if (!base) {
    return { notified: false, reason: "MESSAGES_API_URL/PROFILES_API_URL ausente" };
  }
  const url = `${base}/client-linkedin-messages`;
  const body = {
    profileUrl: opts.profileUrl,
    agentId: String(opts.agentId || resolveAgentId() || "default").trim() || "default",
    peerName: opts.peerName || null,
  };
  if (opts.messages?.length) {
    body.messages = opts.messages;
  } else {
    body.direction = opts.direction || "sent";
    body.message = opts.message;
    body.sender = opts.sender ?? null;
    body.time = opts.time ?? null;
    if (opts.occurredAt) body.occurredAt = opts.occurredAt;
  }
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new Error(
      `vendas/api inacessível (${url}) — confirme start:dev em :3000 (${String(e?.message || e).slice(0, 80)})`,
    );
  }
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(
      `POST ${url} → ${res.status} ${res.statusText}${text ? `: ${text.slice(0, 240)}` : ""}`,
    );
  }
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  return { notified: true, url, data };
}

/** Após Skip: poll até Pending ou esgota tentativas. */
async function waitForPending(serial, { outDir, steps }) {
  for (let i = 0; i < PENDING_TRIES; i++) {
    const els = await extractBySense({
      serial,
      engine: OCR,
      icons: true,
    });
    if (hasPending(els || [])) {
      steps.push(`pending:try${i + 1}`);
      await shot(serial, outDir, "99-pending.png");
      return true;
    }
    steps.push(`pending-miss:try${i + 1}`);
    await sleep(WAIT_PENDING_MS);
  }
  return false;
}

/**
 * @param {{
 *   serial: string,
 *   linkedinPackage: string,
 *   url: string,
 *   outDir?: string|null,
 *   dryRun?: boolean,
 *   notifyApi?: boolean,
 *   agentId?: string,
 * }} opts
 */
export async function connectByLinkedInUrl(opts) {
  const serial = opts.serial;
  const pkg = opts.linkedinPackage || "com.linkedin.android";
  const dryRun = Boolean(opts.dryRun);
  const notifyApi = opts.notifyApi !== false;
  const agentId = opts.agentId || resolveAgentId();
  const steps = [];
  const url = openProfileByUrl(serial, pkg, opts.url);
  steps.push(`view:${url}`);
  await sleep(WAIT_AFTER_VIEW_MS);

  if (opts.outDir) mkdirSync(opts.outDir, { recursive: true });
  await shot(serial, opts.outDir, "01-perfil.png");

  let skipped = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const els = await extractBySense({
      serial,
      engine: OCR,
      icons: true,
    });
    const texts = els || [];

    if (hasPageDoesNotExist(texts)) {
      steps.push("page_does_not_exist");
      await shot(serial, opts.outDir, "99-page-does-not-exist.png");
      return {
        ok: false,
        status: "not_found",
        url,
        steps,
        error:
          "perfil inexistente (This page doesn't exist / Please check your URL)",
      };
    }

    // Pending antes de Skip = já tinha convite — ainda sincroniza status 1
    if (hasPending(texts) && !skipped) {
      steps.push("already_pending");
      await shot(serial, opts.outDir, "99-already-pending.png");
      key({ serial, code: "KEYCODE_BACK" });

      /** @type {{ notified: boolean, reason?: string, url?: string, data?: unknown, error?: string }} */
      let notify = { notified: false, reason: "notify desligado" };
      if (notifyApi && !dryRun) {
        try {
          notify = await notifyInviteSent({
            profileUrl: url,
            steps,
            agentId,
            status: CONNECTION_STATUS.PENDING,
          });
          steps.push(
            notify.notified
              ? "api:client-connections-linkedin:ok"
              : `api:client-connections-linkedin:skip:${notify.reason}`,
          );
        } catch (e) {
          notify = {
            notified: false,
            error: String(e?.message || e),
          };
          steps.push(`api:client-connections-linkedin:fail:${notify.error}`);
        }
      }

      return {
        ok: true,
        status: "already",
        url,
        steps,
        notify,
      };
    }

    const skip = findSkip(texts);
    if (skip) {
      steps.push(`skip@${skip.x},${skip.y}`);
      await shot(serial, opts.outDir, "03-add-note-skip.png");
      if (!dryRun) {
        tapElement({ serial, x: skip.x, y: skip.y });
        await sleep(WAIT_AFTER_TAP_MS);
      }
      skipped = true;

      const pending = dryRun
        ? true
        : await waitForPending(serial, { outDir: opts.outDir, steps });
      if (!pending) {
        await shot(serial, opts.outDir, "99-sem-pending.png");
        return {
          ok: false,
          status: "failed",
          url,
          steps,
          error: "Skip ok mas Pending não apareceu — convite não confirmado",
        };
      }

      key({ serial, code: "KEYCODE_BACK" });

      /** @type {{ notified: boolean, reason?: string, url?: string, data?: unknown, error?: string }} */
      let notify = { notified: false, reason: "notify desligado" };
      if (notifyApi && !dryRun) {
        try {
          notify = await notifyInviteSent({
            profileUrl: url,
            steps,
            agentId,
            status: CONNECTION_STATUS.PENDING,
          });
          steps.push(
            notify.notified
              ? "api:client-connections-linkedin:ok"
              : `api:client-connections-linkedin:skip:${notify.reason}`,
          );
        } catch (e) {
          notify = {
            notified: false,
            error: String(e?.message || e),
          };
          steps.push(`api:client-connections-linkedin:fail:${notify.error}`);
          // Convite na UI ok; falha de API não anula o Pending
        }
      }

      return {
        ok: true,
        status: "pending",
        url,
        steps,
        notify,
      };
    }

    const connect = findExactConnect(texts);
    if (connect) {
      steps.push(`connect@${connect.x},${connect.y}`);
      await shot(serial, opts.outDir, "02-connect.png");
      if (!dryRun) {
        tapElement({ serial, x: connect.x, y: connect.y });
        await sleep(WAIT_AFTER_TAP_MS);
      }
      continue;
    }

    // Só Follow → ⋮ → Connect no sheet
    if (hasFollow(texts)) {
      const more = findMoreOverflow(texts);
      if (!more) {
        return {
          ok: false,
          status: "failed",
          url,
          steps,
          error: "Follow visível mas ⋮ não encontrado",
        };
      }
      steps.push(`more@${more.x},${more.y}:${more.via}`);
      await shot(serial, opts.outDir, "02-follow-more.png");
      if (!dryRun) {
        tapElement({ serial, x: more.x, y: more.y });
        await sleep(WAIT_AFTER_TAP_MS);
      }
      continue;
    }

    steps.push(`wait:round${round}`);
    await sleep(1_500);
  }

  return {
    ok: false,
    status: "failed",
    url,
    steps,
    error: skipped
      ? "Skip ok mas Pending não apareceu — convite não confirmado"
      : "não concluiu Connect+Skip+Pending",
  };
}
