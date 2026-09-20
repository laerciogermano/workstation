/**
 * BDD e2e — EP-02 Eventos de UI
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import { dumpUiXml } from "../../lib/extract.js";
import { launch } from "../../lib/operate.js";
import { provisionEmulator } from "../../lib/provision.js";

const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "ep-02-eventos-de-ui-test";
const pkg = process.env.EVENT_TEST_PKG || "com.android.settings";

describe("Épico: EP-02 Eventos de UI", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;

  before(async () => {
    spawnSync("bash", [stopScript], { encoding: "utf8", stdio: "inherit" });
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent provisionado; Quando handle.on cobre boot/app/stable/dump; Então sinais OK",
    async () => {
      assert.deepEqual(await handle.on("boot", { timeoutMs: 60_000 }), {
        boot: true,
      });

      await launch(handle.serial, pkg, ".Settings");
      const app = await handle.on("app_open", {
        pkg,
        timeoutMs: 60_000,
      });
      assert.equal(app.foreground, true);
      assert.equal(app.package, pkg);

      assert.deepEqual(
        await handle.on("ui_stable", {
          timeoutMs: 60_000,
          stableMs: 800,
          intervalMs: 300,
        }),
        { stable: true },
      );

      const previousXml = "<hierarchy/>";
      const changed = await handle.on("dump_change", {
        previousXml,
        timeoutMs: 30_000,
      });
      assert.equal(changed.changed, true);
      assert.ok(changed.xml.length > 0);
      assert.notEqual(changed.xml, previousXml);
      // sanity: dump real ainda obtível
      assert.ok(dumpUiXml(handle.serial).length > 0);
    },
    { timeout: 300_000 },
  );
});
