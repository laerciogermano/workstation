/**
 * Unitário — agent-registry.js (fs stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAgentRegistry, sanitizeAgentName } from "./agent-registry.js";

describe("sanitizeAgentName", () => {
  it("aceita nome válido", () => {
    assert.equal(sanitizeAgentName("agent-a"), "agent-a");
  });

  it("lança PROVISION_INVALID_NAME", () => {
    assert.throws(
      () => sanitizeAgentName("bad name"),
      (err) => err && err.code === "PROVISION_INVALID_NAME",
    );
  });
});

describe("createAgentRegistry", () => {
  it("set / get / has / remove", () => {
    let raw = "";
    const reg = createAgentRegistry({
      path: "/tmp/agents.json",
      existsSync: () => raw.length > 0,
      readFileSync: () => raw,
      writeFileSync: (_p, data) => {
        raw = data;
      },
      mkdirSync: () => {},
    });
    assert.equal(reg.has("a"), false);
    reg.set("a", { serial: "127.0.0.1:5555", port: 5555 });
    assert.equal(reg.has("a"), true);
    assert.equal(reg.get("a").port, 5555);
    assert.equal(reg.remove("a"), true);
    assert.equal(reg.has("a"), false);
  });
});
