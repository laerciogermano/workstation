#!/usr/bin/env node
/**
 * Envia mensagem LinkedIn via URL (Chrome CDP).
 *
 *   CDP_ID=… npm run linkedin-message-cdp -- --url '…' --text 'Oi'
 */
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { installConnectmaxApiAuth } from "../lib/connectmax-api-auth.js";
import { parseCdpArgs } from "../lib/cdp/cli-args.js";
import { sendLinkedInMessage } from "../lib/cdp/linkedin-message.js";
import { normalizeLinkedInProfileUrl } from "../lib/linkedin-connect.js";

installConnectmaxApiAuth();

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseCdpArgs(process.argv.slice(2), { requireUrl: true });
  const url = normalizeLinkedInProfileUrl(args.url);
  const text = String(args.text || "").trim();
  if (!url) throw new Error(`URL inválida: ${args.url}`);
  if (!text) throw new Error("passe --text");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = args.noShot
    ? null
    : resolve(ROOT, "..", "screenshots", "linkedin-message-cdp", stamp);
  if (outDir) mkdirSync(outDir, { recursive: true });
  const result = await sendLinkedInMessage({
    cdpId: args.cdpId,
    cdpUrl: args.cdpUrl,
    url,
    text,
    dryRun: args.dryRun,
    outDir,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main().catch((e) => {
  console.error(String(e?.message || e));
  process.exit(e?.code === "CONNECTION_NOT_ACCEPTED" ? 3 : 1);
});
