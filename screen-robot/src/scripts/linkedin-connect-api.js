#!/usr/bin/env node
/**
 * API HTTP LinkedIn (AVD):
 *   POST /connect     { "url": "https://www.linkedin.com/in/…" }
 *   POST /connections { "n": 20 }  → JSON das N conexões mais recentes
 *   GET  /connections?n=20
 *   POST /message     { "url": "…", "text": "Oi!" }
 *   POST /unread-messages { "maxResults": 20 }
 *   GET  /unread-messages?maxResults=20
 *   POST /profile-messages { "url": "…", "maxResults": 10 }
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-connect-api
 */
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  connectByLinkedInUrl,
  normalizeLinkedInProfileUrl,
  resolveAgentId,
} from "../lib/linkedin-connect.js";
import { extractRecentConnections } from "../lib/linkedin-extract-connections.js";
import { sendLinkedInMessage } from "../lib/linkedin-message.js";
import { listProfileMessages } from "../lib/linkedin-profile-messages.js";
import { listUnreadMessages } from "../lib/linkedin-unread-messages.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = Number(process.env.LINKEDIN_CONNECT_PORT || 3099);
const HOST = process.env.LINKEDIN_CONNECT_HOST || "127.0.0.1";
const CONFIG = resolve(process.env.DEVICE_CONFIG || resolve(ROOT, "device.config.json"));

/** @type {Promise<unknown>} */
let queue = Promise.resolve();
let busy = false;

function loadConfig() {
  if (!existsSync(CONFIG)) throw new Error(`Config não encontrada: ${CONFIG}`);
  return JSON.parse(readFileSync(CONFIG, "utf8"));
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

function corsHeaders(req) {
  const origin = String(req?.headers?.origin || "*");
  return {
    "access-control-allow-origin": origin || "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-allow-credentials": "true",
    vary: "Origin",
  };
}

function send(res, status, body, req = null) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data),
    ...corsHeaders(req),
  });
  res.end(data);
}

async function withDevice(fn) {
  const cfg = loadConfig();
  const linkedinPkg = cfg.apps?.linkedin?.package || "com.linkedin.android";
  const { serial } = await provisionEmulator(cfg);
  // mensagens/conexões → vendas/api (default local)
  if (!process.env.PROFILES_API_URL && !process.env.MESSAGES_API_URL) {
    process.env.PROFILES_API_URL = "http://127.0.0.1:3000";
  }
  if (!process.env.AGENT_ID) {
    process.env.AGENT_ID = resolveAgentId(cfg);
  }
  return fn({ serial, linkedinPkg, apps: cfg.apps, cfg });
}

/** LinkedIn ok mas base não gravou → 502. */
function sendWithDb(res, result, { kind = "client_linkedin_message" } = {}) {
  if (!result?.ok) return send(res, 502, result);
  const notify = result.db || result.notify;
  if (notify && notify.notified === false) {
    return send(res, 502, {
      ...result,
      error:
        notify.error ||
        notify.reason ||
        `falha ao persistir em ${kind}`,
    });
  }
  if (result.steps?.some((s) => String(s).startsWith("db:error:"))) {
    return send(res, 502, {
      ...result,
      error: `falha ao persistir em ${kind}`,
    });
  }
  if (
    result.steps?.some((s) =>
      String(s).startsWith("api:client-connections-linkedin:fail:"),
    )
  ) {
    return send(res, 502, {
      ...result,
      error: "falha ao persistir em client_connection_linkedin",
    });
  }
  if (result.steps?.some((s) => String(s).startsWith("api:mark-accepted:fail:"))) {
    return send(res, 502, {
      ...result,
      error: "falha ao marcar aceitos em client_connection_linkedin",
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
    const err = new Error("já há uma operação LinkedIn em andamento");
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
  const u = new URL(req.url || "/", `http://${HOST}`);
  const path = u.pathname;

  if (req.method === "GET" && (path === "/" || path === "/health")) {
    return send(res, 200, {
      ok: true,
      busy,
      service: "linkedin-robot",
      endpoints: [
        "POST /connect",
        "POST /connections",
        "GET /connections?n=",
        "POST /message",
        "POST /unread-messages",
        "GET /unread-messages?maxResults=",
        "POST /profile-messages",
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
      const agentId = resolveAgentId(loadConfig());
      const result = await runExclusive(() =>
        withDevice(({ serial, linkedinPkg }) =>
          connectByLinkedInUrl({
            serial,
            linkedinPackage: linkedinPkg,
            url,
            outDir: null,
            agentId,
          }),
        ),
      );
      return sendWithDb(res, result, { kind: "client_connection_linkedin" });
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  if (
    (req.method === "POST" || req.method === "GET") &&
    path === "/connections"
  ) {
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
      const agentId = resolveAgentId(loadConfig());
      const result = await runExclusive(() =>
        withDevice(({ serial, linkedinPkg }) =>
          extractRecentConnections({
            serial,
            linkedinPackage: linkedinPkg,
            n,
            outDir: null,
            agentId,
          }),
        ),
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
        withDevice(({ serial, linkedinPkg, apps }) =>
          sendLinkedInMessage({
            serial,
            linkedinPackage: linkedinPkg,
            url,
            text,
            outDir: null,
            apps,
          }),
        ),
      );
      return sendWithDb(res, result);
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
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
        u.searchParams.get("max-results") ??
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
        withDevice(({ serial, linkedinPkg }) =>
          listUnreadMessages({
            serial,
            linkedinPackage: linkedinPkg,
            maxResults,
            outDir: null,
          }),
        ),
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
        withDevice(({ serial, linkedinPkg, apps }) =>
          listProfileMessages({
            serial,
            linkedinPackage: linkedinPkg,
            url,
            maxResults,
            outDir: null,
            apps,
          }),
        ),
      );
      return sendWithDb(res, result);
    } catch (e) {
      if (e?.code === "BUSY") return send(res, 409, { ok: false, error: e.message });
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  send(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`linkedin-robot-api http://${HOST}:${PORT}`);
  console.log(`POST /connect {"url":"…"}`);
  console.log(`POST /connections {"n":20}`);
  console.log(`POST /message {"url":"…","text":"…"}`);
  console.log(`POST /unread-messages {"maxResults":20}`);
  console.log(`POST /profile-messages {"url":"…","maxResults":10}`);
});
