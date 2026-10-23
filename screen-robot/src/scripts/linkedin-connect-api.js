#!/usr/bin/env node
/**
 * API HTTP: POST /connect { "url": "https://www.linkedin.com/in/…" }
 *
 * Uso (cwd: screen-robot/src):
 *   npm run linkedin-connect-api
 *   LINKEDIN_CONNECT_PORT=3099 npm run linkedin-connect-api
 *
 * curl -s -X POST http://127.0.0.1:3099/connect \
 *   -H 'content-type: application/json' \
 *   -d '{"url":"https://www.linkedin.com/in/…"}'
 */
import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { connectByLinkedInUrl, normalizeLinkedInProfileUrl } from "../lib/linkedin-connect.js";
import { provisionEmulator } from "../lib/provision.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const PORT = Number(process.env.LINKEDIN_CONNECT_PORT || 3099);
const HOST = process.env.LINKEDIN_CONNECT_HOST || "127.0.0.1";
const CONFIG = resolve(process.env.DEVICE_CONFIG || resolve(ROOT, "device.config.json"));

/** @type {Promise<unknown>|null} */
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

async function runConnect(url) {
  const cfg = loadConfig();
  const linkedinPkg = cfg.apps?.linkedin?.package || "com.linkedin.android";
  const { serial } = await provisionEmulator(cfg);
  return connectByLinkedInUrl({
    serial,
    linkedinPackage: linkedinPkg,
    url,
    outDir: null,
  });
}

function enqueue(fn) {
  const job = queue.then(fn, fn);
  queue = job.catch(() => {});
  return job;
}

const server = createServer(async (req, res) => {
  const path = (req.url || "/").split("?")[0];

  if (req.method === "GET" && (path === "/" || path === "/health")) {
    return send(res, 200, { ok: true, busy, service: "linkedin-connect" });
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
      return send(res, 400, {
        ok: false,
        error: "passe url linkedin.com/in/…",
      });
    }
    if (busy) {
      return send(res, 409, { ok: false, error: "já há uma conexão em andamento" });
    }

    try {
      const result = await enqueue(async () => {
        busy = true;
        try {
          return await runConnect(url);
        } finally {
          busy = false;
        }
      });
      return send(res, result.ok ? 200 : 502, result);
    } catch (e) {
      busy = false;
      return send(res, 500, { ok: false, error: String(e?.message || e) });
    }
  }

  send(res, 404, { ok: false, error: "not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`linkedin-connect-api http://${HOST}:${PORT}`);
  console.log(`POST /connect {"url":"https://www.linkedin.com/in/…"}`);
});
