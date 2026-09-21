/**
 * BDD e2e — EP-02 Eventos de UI
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import { dumpUiXml } from "../../lib/extract.js";
import { on } from "../../lib/events.js";
import { launch } from "../../lib/operate.js";
import { provisionEmulator } from "../../lib/provision.js";

const serialEnv = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const pkg = process.env.EVENT_TEST_PKG || "com.android.settings";

describe("Épico: EP-02 Eventos de UI", () => {
  /** @type {string} */
  let serial;

  before(async () => {
    spawnSync("bash", [stopScript], { encoding: "utf8", stdio: "inherit" });
    const handle = await provisionEmulator({
      provision: {
        serial: serialEnv,
        kind: "redroid",
        connectTimeoutMs: timeoutMs,
      },
    });
    serial = handle.serial;
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando on(cfg) cobre boot/app/stable/frame; Então sinais OK",
    async () => {
      assert.deepEqual(
        await on({ serial, event: "boot", timeoutMs: 60_000 }),
        { boot: true },
      );

      await launch(serial, pkg, ".Settings");
      const app = await on({
        serial,
        event: "app_open",
        pkg,
        timeoutMs: 60_000,
      });
      assert.equal(app.foreground, true);
      assert.equal(app.package, pkg);

      assert.deepEqual(
        await on({
          serial,
          event: "ui_stable",
          timeoutMs: 60_000,
          stableMs: 800,
          intervalMs: 300,
        }),
        { stable: true },
      );

      const previousXml = "<hierarchy/>";
      const changed = await on({
        serial,
        event: "frame_change",
        previousFrame: previousXml,
        timeoutMs: 30_000,
      });
      assert.equal(changed.changed, true);
      assert.ok(changed.xml.length > 0);
      assert.notEqual(changed.xml, previousXml);
      assert.ok(dumpUiXml(serial).length > 0);
    },
    { timeout: 300_000 },
  );
});
