#!/usr/bin/env node
/**
 * Extrai N conexões recentes (Chrome CDP).
 *
 *   CDP_ID=marina-costa npm run linkedin-extract-connections-cdp -- --n 20
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { parseCdpArgs } from "../lib/cdp/cli-args.js";
import { extractRecentConnections } from "../lib/cdp/linkedin-extract-connections.js";
import { resolveAgentId } from "../lib/linkedin-connect.js";

installConnectmaxApiAuth();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseCdpArgs(process.argv.slice(2));
  const n = args.n || args.maxResults || 20;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = args.noShot
    ? null
    : resolve(ROOT, "..", "screenshots", "linkedin-extract-connections-cdp", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });
  const result = await extractRecentConnections({
    cdpId: args.cdpId,
    cdpUrl: args.cdpUrl,
    n,
    profileUrl: args.url || undefined,
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
