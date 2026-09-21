/**
 * EP-02 — eventos de UI. Único público: `on(cfg)`.
 * Antes: handle.on(event, opts) · Depois: on({ serial, event, … }).
 */
import { waitAppOpen } from "./event-app-open.js";
import { waitBoot } from "./event-boot.js";
import { waitDumpChange } from "./event-dump-change.js";
import { waitUiStable } from "./event-ui-stable.js";

/**
 * @typedef {object} OnConfig
 * @property {string} serial
 * @property {"boot"|"app_open"|"ui_stable"|"frame_change"|"dump_change"} event
 * @property {number} [timeoutMs]
 * @property {number} [intervalMs]
 * @property {number} [stableMs]
 * @property {string} [pkg]
 * @property {string} [activity]
 * @property {string|Buffer} [previousFrame]
 * @property {string} [previousXml]
 * @property {string} [contains]
 * @property {(payload: object) => void} [onEvent]
 */

/**
 * Espera um evento de UI. Tudo na config (sem método no handle).
 * @param {OnConfig} cfg
 * @param {{ waitBoot?: Function, waitAppOpen?: Function, waitUiStable?: Function, waitDumpChange?: Function }} [deps]
 */
export async function on(cfg = {}, deps = {}) {
  const serial = cfg.serial;
  const event = cfg.event;
  if (!serial) {
    const err = new Error("EVENT_NO_SERIAL: informe cfg.serial");
    err.code = "EVENT_NO_SERIAL";
    throw err;
  }
  if (!event) {
    const err = new Error('EVENT_UNKNOWN: falta cfg.event');
    err.code = "EVENT_UNKNOWN";
    throw err;
  }

  const boot = deps.waitBoot ?? waitBoot;
  const appOpen = deps.waitAppOpen ?? waitAppOpen;
  const uiStable = deps.waitUiStable ?? waitUiStable;
  const dumpChange = deps.waitDumpChange ?? waitDumpChange;

  const { serial: _s, event: _e, ...opts } = cfg;
  const full = { ...opts, serial };

  switch (event) {
    case "boot":
      return boot(serial, full);
    case "app_open":
      return appOpen(serial, full);
    case "ui_stable":
      return uiStable(serial, full);
    case "frame_change":
    case "dump_change":
      // frame_change: alvo por hash de imagem; hoje reusa waitDumpChange (gap EP-02 I5)
      return dumpChange(serial, {
        ...full,
        previousXml: full.previousXml ?? full.previousFrame ?? "",
      });
    default: {
      const err = new Error(`EVENT_UNKNOWN: evento "${event}"`);
      err.code = "EVENT_UNKNOWN";
      throw err;
    }
  }
}
