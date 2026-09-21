#!/usr/bin/env node
/**
 * Exemplo mínimo: provisionar o emulador e abrir o scrcpy.
 * `name` = AVD (muda a instância). O serial vem do adb.
 *
 *   npm run sample
 *   node scripts/sample.js
 */
import { provisionEmulator } from "../lib/provision.js";

const handle = await provisionEmulator({
  provision: {
    name: "ConnectMax_Cam",
    kind: "avd",
  },
});

console.log(`Emulador: ${handle.serial}`);

const view = handle.openScrcpy({ title: `sample ${handle.serial}` });
console.log(`scrcpy pid=${view.pid}`);
