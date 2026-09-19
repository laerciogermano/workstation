/**
 * Receber eventos — espera condições de UI/device (poll).
 */
import { adbOk, sleep } from "./adb.js";
import { dumpUiXml } from "./extract.js";

/**
 * Espera dump de UI disponível e (opcionalmente) um texto aparecer.
 * Emite callback onEvent({ type, ... }) a cada tentativa.
 */
export async function waitForUiReady(serial, opts = {}) {
  const timeoutMs = Number(opts.timeoutMs ?? 60_000);
  const intervalMs = Number(opts.intervalMs ?? 1_500);
  const contains = opts.contains ? String(opts.contains).toLowerCase() : null;
  const onEvent = typeof opts.onEvent === "function" ? opts.onEvent : () => {};
  const started = Date.now();
  let attempt = 0;

  while (Date.now() - started < timeoutMs) {
    attempt += 1;
    try {
      const xml = dumpUiXml(serial);
      const ok = xml.length > 100 && (!contains || xml.toLowerCase().includes(contains));
      onEvent({
        type: "ui_poll",
        attempt,
        ok,
        size: xml.length,
        at: new Date().toISOString(),
      });
      if (ok) {
        onEvent({ type: "ui_ready", attempt, at: new Date().toISOString() });
        return { ready: true, attempt, xml };
      }
    } catch (e) {
      onEvent({
        type: "ui_poll_error",
        attempt,
        message: e.message,
        at: new Date().toISOString(),
      });
    }
    await sleep(intervalMs);
  }
  throw new Error(`eventos: timeout ${timeoutMs}ms aguardando UI${contains ? ` com "${contains}"` : ""}`);
}

export function isPackageForeground(serial, pkg) {
  return adbOk(serial, [
    "shell",
    "pidof",
    pkg,
  ]);
}
