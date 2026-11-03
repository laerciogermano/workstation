#!/usr/bin/env node
/**
 * Lista mensagens de um perfil (Chrome CDP).
 *
 *   CDP_ID=… npm run linkedin-profile-messages-cdp -- --url '…' --max 10
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { parseCdpArgs } from "../lib/cdp/cli-args.js";
import { listProfileMessages } from "../lib/cdp/linkedin-profile-messages.js";
import { normalizeLinkedInProfileUrl } from "../lib/linkedin-connect.js";

installConnectmaxApiAuth();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseCdpArgs(process.argv.slice(2), { requireUrl: true });
  const url = normalizeLinkedInProfileUrl(args.url);
  if (!url) throw new Error(`URL inválida: ${args.url}`);
  const maxResults = args.maxResults || args.n || 10;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = args.noShot
    ? null
    : resolve(ROOT, "..", "screenshots", "linkedin-profile-messages-cdp", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });
  const result = await listProfileMessages({
    cdpId: args.cdpId,
    cdpUrl: args.cdpUrl,
    url,
    maxResults,
    outDir,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(1);
});
