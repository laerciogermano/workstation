/**
 * Provisionar um agente — conecta/aguarda device ADB online.
 */
import { adb, connectIfTcp, sleep } from "./adb.js";

export async function provisionAgent(cfg) {
  const serial = cfg.provision?.serial || cfg.device || process.env.ANDROID_SERIAL;
  if (!serial) throw new Error("provision: falta serial/device na config");

  const timeoutMs = Number(cfg.provision?.connectTimeoutMs ?? 120_000);
  const started = Date.now();

  connectIfTcp(serial);
  while (Date.now() - started < timeoutMs) {
    try {
      adb(serial, ["wait-for-device"], { timeout: 5_000 });
      const boot = adb(serial, ["shell", "getprop", "sys.boot_completed"]).stdout.trim();
      if (boot === "1") {
        return {
          serial,
          kind: cfg.provision?.kind || "adb",
          provisionedAt: new Date().toISOString(),
        };
      }
    } catch {
      /* retry */
    }
    connectIfTcp(serial);
    await sleep(2_000);
  }
  throw new Error(`provision: timeout ${timeoutMs}ms aguardando ${serial}`);
}
