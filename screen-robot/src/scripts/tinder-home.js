#!/usr/bin/env node
/** Atalho: tela inicial Tinder. */
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const r = spawnSync(
  process.execPath,
  [resolve(root, "scripts/app-home.js"), "--app", "tinder", ...process.argv.slice(2)],
  { stdio: "inherit", cwd: root },
);
process.exit(r.status ?? 1);
