#!/usr/bin/env node
/**
 * Lista conversas unread (Chrome CDP).
 *
 *   CDP_ID=… npm run linkedin-unread-messages-cdp -- --max 20 [--sync]
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { parseCdpArgs } from "../lib/cdp/cli-args.js";
import { listUnreadMessages } from "../lib/cdp/linkedin-unread-messages.js";

installConnectmaxApiAuth();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseCdpArgs(process.argv.slice(2));
  const maxResults = args.maxResults || args.n || 20;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = args.noShot
    ? null
    : resolve(ROOT, "..", "screenshots", "linkedin-unread-messages-cdp", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });
  const result = await listUnreadMessages({
    cdpId: args.cdpId,
    cdpUrl: args.cdpUrl,
    maxResults,
    sync: args.sync,
    outDir,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(1);
});
