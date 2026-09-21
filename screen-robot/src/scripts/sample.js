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
import { openScrcpy } from "../lib/operate.js";

const { serial } = await provisionEmulator({
  provision: {
    name: "agent-b",
    kind: "redroid",
  },
});

console.log(`Emulador: ${serial} (name=agent-b)`);

const view = openScrcpy({ serial, title: `sample ${serial}` });
console.log(`scrcpy pid=${view.pid}`);
