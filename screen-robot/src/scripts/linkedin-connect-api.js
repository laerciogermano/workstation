#!/usr/bin/env node
/**
 * API HTTP LinkedIn (AVD):
 *   POST /connect     { "url": "https://www.linkedin.com/in/…" }
 *   POST /connections { "n": 20 }  → JSON das N conexões mais recentes
 *   GET  /connections?n=20
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-connect-api
 */
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { connectByLinkedInUrl, normalizeLinkedInProfileUrl } from "../lib/linkedin-connect.js";
import { extractRecentConnections } from "../lib/linkedin-extract-connections.js";
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

function send(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(data),
  });
  res.end(data);
}

async function withDevice(fn) {
  const cfg = loadConfig();
  const linkedinPkg = cfg.apps?.linkedin?.package || "com.linkedin.android";
  const { serial } = await provisionEmulator(cfg);
  return fn({ serial, linkedinPkg });
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
      endpoints: ["POST /connect", "POST /connections", "GET /connections?n="],
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
      const result = await runExclusive(() =>
        withDevice(({ serial, linkedinPkg }) =>
          connectByLinkedInUrl({
            serial,
            linkedinPackage: linkedinPkg,
            url,
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
      const result = await runExclusive(() =>
        withDevice(({ serial, linkedinPkg }) =>
          extractRecentConnections({
            serial,
            linkedinPackage: linkedinPkg,
            n,
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

  send(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`linkedin-robot-api http://${HOST}:${PORT}`);
  console.log(`POST /connect {"url":"…"}`);
  console.log(`POST /connections {"n":20}`);
});
