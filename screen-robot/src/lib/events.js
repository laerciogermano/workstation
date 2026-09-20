/**
 * Eventos de UI — internos do AgentHandle (`handle.on`).
 * Caller: provisionEmulator → handle.on(event, opts?, onEvent?).
 * Não exportar `on` solto.
 */
import { waitAppOpen } from "./event-app-open.js";
import { waitBoot } from "./event-boot.js";
import { waitDumpChange } from "./event-dump-change.js";
import { waitUiStable } from "./event-ui-stable.js";

/**
 * Liga `on` ao serial do handle (usado só por provisionEmulator).
 * @param {string} serial
 * @param {{ waitBoot?: Function, waitAppOpen?: Function, waitUiStable?: Function, waitDumpChange?: Function }} [deps]
 */
export function createOn(serial, deps = {}) {
  const boot = deps.waitBoot ?? waitBoot;
  const appOpen = deps.waitAppOpen ?? waitAppOpen;
  const uiStable = deps.waitUiStable ?? waitUiStable;
  const dumpChange = deps.waitDumpChange ?? waitDumpChange;

  return async function on(event, opts = {}, onEvent) {
    const full = { ...opts, serial, onEvent };
    switch (event) {
      case "boot":
        return boot(serial, full);
      case "app_open":
        return appOpen(serial, full);
      case "ui_stable":
        return uiStable(serial, full);
      case "dump_change":
        return dumpChange(serial, full);
      default: {
        const err = new Error(`EVENT_UNKNOWN: evento "${event}"`);
        err.code = "EVENT_UNKNOWN";
        throw err;
      }
    }
  };
}
