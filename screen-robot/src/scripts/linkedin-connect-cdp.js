#!/usr/bin/env node
/**
 * Conecta em perfil LinkedIn pela URL (Chrome CDP + conta logada).
 *
 *   CDP_ID=marina-costa npm run linkedin-connect-cdp -- --url 'https://www.linkedin.com/in/…'
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { parseCdpArgs } from "../lib/cdp/cli-args.js";
import {
  connectByLinkedInUrl,
  normalizeLinkedInProfileUrl,
} from "../lib/cdp/linkedin-connect.js";
import { resolveAgentId } from "../lib/linkedin-connect.js";

installConnectmaxApiAuth();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseCdpArgs(process.argv.slice(2), { requireUrl: true });
  const url = normalizeLinkedInProfileUrl(args.url);
  if (!url) throw new Error(`URL inválida: ${args.url}`);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = args.noShot
    ? null
    : resolve(ROOT, "..", "screenshots", "linkedin-connect-cdp", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });
  console.log(`cdpId=${args.cdpId || ""} cdpUrl=${args.cdpUrl || ""} url=${url}`);
  const result = await connectByLinkedInUrl({
    cdpId: args.cdpId,
    cdpUrl: args.cdpUrl,
    url,
    dryRun: args.dryRun,
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
