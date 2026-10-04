/**
 * Unitário — docker-avd-instance.js
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  containerNameForDockerAvd,
  findSerialForDockerAvd,
  portForDockerAvdName,
  serialForDockerAvdName,
  slugifyDockerAvdName,
} from "./docker-avd-instance.js";

describe("docker-avd-instance", () => {
  it("slug e porta estáveis; faixa 5655–5754", () => {
    assert.equal(slugifyDockerAvdName("Agent_A"), "agent-a");
    assert.equal(containerNameForDockerAvd("Agent_A"), "docker-avd-agent-a");
    assert.equal(portForDockerAvdName("a"), portForDockerAvdName("a"));
    const p = portForDockerAvdName("agent-a");
    assert.ok(p >= 5655 && p <= 5754);
    assert.notEqual(serialForDockerAvdName("a"), serialForDockerAvdName("b"));
  });

  it("findSerialForDockerAvd lê porta do container", () => {
    const serial = findSerialForDockerAvd("agent-a", {
      dockerInspectPort: (c) => {
        assert.equal(c, "docker-avd-agent-a");
        return "5710";
      },
    });
    assert.equal(serial, "127.0.0.1:5710");
  });
});
