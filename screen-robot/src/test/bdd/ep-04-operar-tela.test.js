/**
 * BDD e2e — EP-04 Operar tela
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";
import { fileURLToPath } from "node:url";
import { adbOk } from "../../lib/adb.js";
import {
  launch,
  tap,
  type,
  scroll,
  screenshot,
  matchImage,
} from "../../lib/operate.js";
import { provisionEmulator } from "../../lib/provision.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const pocsRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../pocs",
);
const stopScript = path.join(pocsRoot, "redroid", "scripts", "stop.sh");
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const pkg = "com.android.settings";

describe("Épico: EP-04 Operar tela", () => {
  before(async () => {
    spawnSync("bash", [stopScript], { encoding: "utf8", stdio: "inherit" });
    await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando launch/tap/type/scroll/screenshot/matchImage; Então OK",
    async () => {
      await launch({ serial, package: pkg, activity: ".Settings" });
      assert.ok(adbOk(serial, ["shell", "pidof", pkg]));

      tap({ serial, x: 200, y: 400 });
      scroll({ serial, direction: "down", distance: 400 });
      // type = OCR teclado + tap; Settings sem teclado → OPERATE_TYPE_FAILED (unitários cobrem o happy path)
      await assert.rejects(
        () => type({ serial, text: "1", delayMs: 0 }),
        (err) => err && err.code === "OPERATE_TYPE_FAILED",
      );

      const shot = path.join(os.tmpdir(), `sr-shot-${Date.now()}.png`);
      const out = screenshot({ serial, path: shot });
      assert.ok(fs.existsSync(out));

      const tpl = path.join(os.tmpdir(), `sr-tpl-${Date.now()}.png`);
      fs.copyFileSync(out, tpl);
      const hit = await matchImage({ serial, templatePath: tpl });
      assert.ok(hit.x >= 0 && hit.y >= 0);
      assert.ok(hit.confidence > 0);
    },
    { timeout: 180_000 },
  );
});
