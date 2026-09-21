#!/usr/bin/env node
/**
 * Exemplo mínimo: provisionar o runtime e abrir o scrcpy.
 *
 * redroid: name = id da instância (container/porta/volume próprios)
 * avd:     name = AVD (ex. ConnectMax_Cam)
 *
 *   npm run sample
 *   node scripts/sample.js
 */
import { provisionEmulator } from "../lib/provision.js";

const handle = await provisionEmulator({
  provision: {
    name: "agent-sssb",
    kind: "redroid",
  },
});

console.log(`Emulador: ${handle.serial} (name=agent-b)`);

const view = handle.openScrcpy({ title: `sample ${handle.serial}` });
console.log(`scrcpy pid=${view.pid}`);
