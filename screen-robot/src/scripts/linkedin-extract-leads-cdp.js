#!/usr/bin/env node
/**
 * Extrai leads People search (Chrome CDP) — lib worker.
 *
 *   CDP_ID=… npm run linkedin-extract-leads-cdp -- -n 10 --query 'comprador'
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { parseCdpArgs } from "../lib/cdp/cli-args.js";
import { extractLeads } from "../lib/cdp/linkedin-extract-leads.js";
import { resolveAgentId } from "../lib/linkedin-connect.js";

installConnectmaxApiAuth();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseCdpArgs(process.argv.slice(2));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = args.noShot
    ? null
    : resolve(ROOT, "..", "screenshots", "linkedin-extract-leads-cdp", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });
  const result = await extractLeads({
    cdpId: args.cdpId,
    cdpUrl: args.cdpUrl,
    query: args.query || "comprador",
    n: args.n || args.maxResults || 10,
    outDir,
    agentId: resolveAgentId(),
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(1);
});
