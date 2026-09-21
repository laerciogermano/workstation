#!/usr/bin/env node
/**
 * Exemplo mínimo: provisionar o emulador e abrir o scrcpy.
 *
 *   npm run sample
 *   node scripts/sample.js
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { provisionEmulator } from "../lib/provision.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cfg = JSON.parse(readFileSync(resolve(root, "device.config.json"), "utf8"));

const handle = await provisionEmulator(cfg);
console.log(`Emulador: ${handle.serial}`);

const view = handle.openScrcpy({ title: `sample ${handle.serial}` });
console.log(`scrcpy pid=${view.pid}`);
