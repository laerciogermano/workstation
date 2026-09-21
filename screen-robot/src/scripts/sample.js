#!/usr/bin/env node
/**
 * Exemplo mínimo: provisionar o runtime e abrir o scrcpy.
 *
 * redroid: Colima + Docker; serial padrão 127.0.0.1:5555
 * avd:     name = AVD (ex. ConnectMax_Cam)
 *
 *   npm run sample
 *   node scripts/sample.js
 */
import { provisionEmulator } from "../lib/provision.js";

const handle = await provisionEmulator({
  provision: {
    kind: "redroid",
    // serial opcional — default 127.0.0.1:5555
  },
});

console.log(`Emulador: ${handle.serial}`);

const view = handle.openScrcpy({ title: `sample ${handle.serial}` });
console.log(`scrcpy pid=${view.pid}`);
