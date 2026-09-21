/**
 * BDD e2e — EP-06 Sessão
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";
import { saveSession, restoreSession, removeSession } from "../../lib/session.js";

const serial = process.env.ANDROID_SERIAL || "127.0.0.1:5555";
const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);

describe("Épico: EP-06 Sessão", () => {
  /** @type {string} */
  let kind;
  const sessPath = path.join(os.tmpdir(), `sr-sess-${Date.now()}.json`);

  before(async () => {
    const h = await provisionEmulator({
      provision: { serial, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
    kind = h.kind;
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando save/restore/remove; Então estado persiste e some",
    async () => {
      const saved = await saveSession({
        serial,
        kind,
        path: sessPath,
        state: { step: "e2e" },
      });
      assert.ok(fs.existsSync(saved));
      const state = await restoreSession({ path: sessPath });
      assert.equal(state.serial, serial);
      assert.equal(state.kind, "redroid");
      assert.equal(state.step, "e2e");
      assert.equal(await removeSession({ path: sessPath }), true);
      assert.equal(fs.existsSync(sessPath), false);
    },
    { timeout: 60_000 },
  );
});
