/**
 * BDD e2e — US-17 Salvar sessão
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it, before } from "node:test";
import { provisionEmulator } from "../../lib/provision.js";

const timeoutMs = Number(process.env.PROVISION_TIMEOUT_MS || 180_000);
const agentName = process.env.SR_AGENT_NAME || "us-17-salvar-sessao-test";

describe("Cenário: US-17 Salvar sessão", () => {
  /** @type {Awaited<ReturnType<typeof provisionEmulator>>} */
  let handle;
  const sessPath = path.join(os.tmpdir(), `sr-us17-${Date.now()}.json`);

  before(async () => {
    handle = await provisionEmulator({
      provision: { name: agentName, kind: "redroid", connectTimeoutMs: timeoutMs },
    });
  }, { timeout: 300_000 });

  it(
    "Dado agent; Quando saveSession; Então arquivo com serial/kind",
    async () => {
      const saved = await handle.saveSession(sessPath, { step: "us17" });
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
