#!/usr/bin/env node
/**
 * API HTTP LinkedIn (CDP) — espelho de linkedin-connect-api.js (AVD).
 *
 *   POST /connect          { "url": "https://www.linkedin.com/in/…" }
 *   POST /connections      { "n": 20 }
 *   POST /message          { "url": "…", "text": "Oi!" }
 *   POST /unread-messages  { "maxResults": 20 }
 *   POST /profile-messages { "url": "…", "maxResults": 10 }
 *   POST /extract-leads    { "query": "comprador", "n": 5 }
 *
 * Sessão: CDP_ID=marina-costa | CDP_URL=http://127.0.0.1:9224
 *
 * Uso (cwd: screen-robot/src):
 *   CDP_ID=marina-costa npm run linkedin-connect-api-cdp
 */
import { createServer } from "node:http";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { connectByLinkedInUrl } from "../lib/cdp/linkedin-connect.js";
import { extractRecentConnections } from "../lib/cdp/linkedin-extract-connections.js";
import { extractLeads } from "../lib/cdp/linkedin-extract-leads.js";
import { sendLinkedInMessage } from "../lib/cdp/linkedin-message.js";
import { listProfileMessages } from "../lib/cdp/linkedin-profile-messages.js";
import { listUnreadMessages } from "../lib/cdp/linkedin-unread-messages.js";
import {
  normalizeLinkedInProfileUrl,
  resolveAgentId,
} from "../lib/linkedin-connect.js";

installConnectmaxApiAuth();

const PORT = Number(process.env.LINKEDIN_CDP_PORT || process.env.LINKEDIN_CONNECT_PORT || 3098);
const HOST = process.env.LINKEDIN_CONNECT_HOST || "127.0.0.1";

/** @type {Promise<unknown>} */
let queue = Promise.resolve();
let busy = false;

function cdpOpts() {
  const cdpId = String(process.env.CDP_ID || "").trim() || undefined;
  const cdpUrl = String(process.env.CDP_URL || "").trim() || undefined;
  if (!cdpId && !cdpUrl) {
    throw new Error("defina CDP_ID (registry) ou CDP_URL (http://127.0.0.1:PORT)");
  }
  return { cdpId, cdpUrl };
}

function readJson(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8") || "{}";
        resolveBody(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data),
    ...corsHeaders(),
  });
  res.end(data);
}

function sendWithDb(res, result, { kind = "client_linkedin_message" } = {}) {
  if (!result?.ok) return send(res, 502, result);
  const notify = result.db || result.notify;
  const dbErrStep = (result.steps || []).find((s) =>
    String(s).startsWith("db:error:"),
  );
  if ((notify && notify.notified === false) || dbErrStep) {
    const detail =
      notify?.error ||
      notify?.reason ||
      (dbErrStep ? String(dbErrStep).replace(/^db:error:/, "") : null) ||
      `falha ao persistir em ${kind}`;
    return send(res, 200, {
      ...result,
      warning: detail,
      error: undefined,
    });
  }
  if (
    result.steps?.some((s) =>
      String(s).startsWith("api:client-connections-linkedin:fail:"),
    )
  ) {
    return send(res, 200, {
      ...result,
      warning: "falha ao persistir em client_connection_linkedin",
    });
  }
  if (result.steps?.some((s) => String(s).startsWith("api:mark-accepted:fail:"))) {
    return send(res, 200, {
      ...result,
      warning: "falha ao marcar aceitos em client_connection_linkedin",
    });
  }
  return send(res, 200, result);
}

function enqueue(fn) {
  const job = queue.then(fn, fn);
  queue = job.catch(() => {});
  return job;
}

async function runExclusive(work) {
  if (busy) {
    const err = new Error("já há uma operação LinkedIn CDP em andamento");
    err.code = "BUSY";
    throw err;
  }
  return enqueue(async () => {
    busy = true;
    try {
      return await work();
    } finally {
      busy = false;
    }
  });
}

function parseN(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || n > 500) return null;
  return Math.floor(n);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders());
    res.end();
    return;
  }

  const u = new URL(req.url || "/", `http://${HOST}`);
  const path = u.pathname;

  if (req.method === "GET" && (path === "/" || path === "/health")) {
    return send(res, 200, {
      ok: true,
      busy,
      service: "linkedin-robot-cdp",
      cdpId: process.env.CDP_ID || null,
      cdpUrl: process.env.CDP_URL || null,
      endpoints: [
        "POST /connect",
        "POST /connections",
        "GET /connections?n=",
        "POST /message",
        "POST /unread-messages",
        "GET /unread-messages?maxResults=",
        "POST /profile-messages",
        "POST /extract-leads",
      ],
    });
  }

  if (req.method === "POST" && path === "/connect") {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { ok: false, error: "JSON inválido" });
    }
    const url = normalizeLinkedInProfileUrl(body?.url || body?.profileUrl);
    if (!url) {
      return send(res, 400, { ok: false, error: "passe url linkedin.com/in/…" });
    }
    try {
      const agentId = resolveAgentId();
      const result = await runExclusive(() =>
        connectByLinkedInUrl({
          ...cdpOpts(),
          url,
          outDir: null,
          agentId,
        }),
      );
      return sendWithDb(res, result, { kind: "client_connection_linkedin" });
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  if ((req.method === "POST" || req.method === "GET") && path === "/connections") {
    let body = {};
    if (req.method === "POST") {
      try {
        body = await readJson(req);
      } catch {
        return send(res, 400, { ok: false, error: "JSON inválido" });
      }
    }
    const n = parseN(body?.n ?? body?.limit ?? u.searchParams.get("n") ?? 20);
    if (n == null) {
      return send(res, 400, { ok: false, error: "passe n entre 1 e 500" });
    }
    try {
      const agentId = resolveAgentId();
      const result = await runExclusive(() =>
        extractRecentConnections({
          ...cdpOpts(),
          n,
          outDir: null,
          agentId,
          profileUrl: body?.url || body?.profileUrl || undefined,
        }),
      );
      return sendWithDb(res, result, { kind: "client_connection_linkedin" });
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  if (req.method === "POST" && path === "/message") {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { ok: false, error: "JSON inválido" });
    }
    const url = normalizeLinkedInProfileUrl(body?.url || body?.profileUrl);
    const text = String(body?.text || body?.message || "").trim();
    if (!url) {
      return send(res, 400, { ok: false, error: "passe url linkedin.com/in/…" });
    }
    if (!text) {
      return send(res, 400, { ok: false, error: "passe text da mensagem" });
    }
    try {
      const result = await runExclusive(() =>
        sendLinkedInMessage({
          ...cdpOpts(),
          url,
          text,
          outDir: null,
        }),
      );
      return sendWithDb(res, result);
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      if (e?.code === "CONNECTION_NOT_ACCEPTED") {
        return send(res, 403, { ok: false, error: e.message, code: e.code });
      }
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  if (
    (req.method === "POST" || req.method === "GET") &&
    path === "/unread-messages"
  ) {
    let body = {};
    if (req.method === "POST") {
      try {
        body = await readJson(req);
      } catch {
        return send(res, 400, { ok: false, error: "JSON inválido" });
      }
    }
    const maxResults = parseN(
      body?.maxResults ??
        body?.max_results ??
        body?.n ??
        u.searchParams.get("maxResults") ??
        u.searchParams.get("n") ??
        20,
    );
    if (maxResults == null) {
      return send(res, 400, {
        ok: false,
        error: "passe maxResults entre 1 e 500",
      });
    }
    try {
      const result = await runExclusive(() =>
        listUnreadMessages({
          ...cdpOpts(),
          maxResults,
          outDir: null,
          sync: Boolean(body?.sync),
        }),
      );
      return send(res, result.ok ? 200 : 502, result);
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  if (req.method === "POST" && path === "/profile-messages") {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { ok: false, error: "JSON inválido" });
    }
    const url = normalizeLinkedInProfileUrl(body?.url || body?.profileUrl);
    const maxResults = parseN(
      body?.maxResults ?? body?.max_results ?? body?.n ?? 20,
    );
    if (!url) {
      return send(res, 400, { ok: false, error: "passe url linkedin.com/in/…" });
    }
    if (maxResults == null) {
      return send(res, 400, {
        ok: false,
        error: "passe maxResults entre 1 e 500",
      });
    }
    try {
      const result = await runExclusive(() =>
        listProfileMessages({
          ...cdpOpts(),
          url,
          maxResults,
          outDir: null,
        }),
      );
      return sendWithDb(res, result);
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  if (req.method === "POST" && path === "/extract-leads") {
    let body;
    try {
      body = await readJson(req);
    } catch {
      return send(res, 400, { ok: false, error: "JSON inválido" });
    }
    const query = String(body?.query || body?.q || "comprador").trim();
    const n = parseN(body?.n ?? body?.maxProfiles ?? body?.limit ?? 5);
    if (n == null) {
      return send(res, 400, { ok: false, error: "passe n entre 1 e 500" });
    }
    try {
      const result = await runExclusive(() =>
        extractLeads({
          ...cdpOpts(),
          query,
          n,
          outDir: null,
          agentId: resolveAgentId(),
        }),
      );
      return send(res, result.ok ? 200 : 502, result);
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  send(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`linkedin-robot-cdp-api http://${HOST}:${PORT}`);
  console.log(`CDP_ID=${process.env.CDP_ID || ""} CDP_URL=${process.env.CDP_URL || ""}`);
  console.log(`POST /connect {"url":"…"}`);
  console.log(`POST /connections {"n":20}`);
  console.log(`POST /message {"url":"…","text":"…"}`);
  console.log(`POST /unread-messages {"maxResults":20}`);
  console.log(`POST /profile-messages {"url":"…","maxResults":10}`);
  console.log(`POST /extract-leads {"query":"…","n":5}`);
});
