/**
 * BDD e2e — US-17 Salvar sessão
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";
import { saveSession } from "../../lib/session.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Cenário: US-17 Salvar sessão", () => {
  /** @type {string} */
  let kind;
  const sessPath = path.join(os.tmpdir(), `sr-us17-${Date.now()}.json`);

  before(async () => {
    const h = await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
    kind = h.kind;
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando saveSession; Então arquivo com serial/kind",
    async () => {
      const saved = await saveSession({
        serial,
        kind,
        path: sessPath,
        state: { step: "us17" },
      });
      assert.ok(fs.existsSync(saved));
      const raw = JSON.parse(fs.readFileSync(saved, "utf8"));
      assert.equal(raw.serial, serial);
      assert.equal(raw.kind, "redroid");
      assert.equal(raw.step, "us17");
      fs.unlinkSync(saved);
    },
    { timeout: 60_000 },
  );
});
