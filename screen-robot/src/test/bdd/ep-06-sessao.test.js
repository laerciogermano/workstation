/**
 * BDD e2e — EP-06 Sessão
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "ep-06-sessao-test";

describe("Épico: EP-06 Sessão", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;
  const sessPath = path.join(os.tmpdir(), `sr-sess-${Date.now()}.json`);

  before(async () => {
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando save/restore/remove; Então estado persiste e some",
    async () => {
      const saved = await handle.saveSession(sessPath, { step: "e2e" });
      assert.ok(fs.existsSync(saved));
      const state = await handle.restoreSession(sessPath);
      assert.equal(state.serial, handle.serial);
      assert.equal(state.kind, "redroid");
      assert.equal(state.step, "e2e");
      assert.equal(await handle.removeSession(sessPath), true);
      assert.equal(fs.existsSync(sessPath), false);
    },
    { timeout: 60_000 },
  );
});
