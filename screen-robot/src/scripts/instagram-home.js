#!/usr/bin/env node
/**
 * Atalho: tela inicial Instagram.
 * Por padrão não faz wipe (`--no-reset`) — continua a sessão no AVD já ligado.
 * Wipe completo: node scripts/instagram-home.js --reset
 */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const wantsReset = argv.includes("--reset");
const forward = argv.filter((a) => a !== "--reset");
if (!wantsReset && !forward.includes("--no-reset")) {
  forward.unshift("--no-reset");
}

const r = spawnSync(
  process.execPath,
  [resolve(root, "scripts/app-home.js"), "--app", "instagram", ...forward],
  { stdio: "inherit", cwd: root },
);
process.exit(r.status ?? 1);
