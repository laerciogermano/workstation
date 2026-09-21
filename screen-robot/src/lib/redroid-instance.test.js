/**
 * Unitário — redroid-instance.js
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  containerNameForRedroid,
  findSerialForRedroid,
  portForRedroidName,
  serialForRedroidName,
  slugifyRedroidName,
} from "./redroid-instance.js";

describe("redroid-instance", () => {
  it("slug e porta estáveis por name; names distintos → portas distintas (típico)", () => {
    assert.equal(slugifyRedroidName("Agent_A"), "agent-a");
    assert.equal(containerNameForRedroid("Agent_A"), "redroid-agent-a");
    assert.equal(portForRedroidName("a"), portForRedroidName("a"));
    assert.notEqual(serialForRedroidName("a"), serialForRedroidName("b"));
  });

  it("findSerialForRedroid lê porta do container", () => {
    const serial = findSerialForRedroid("agent-a", {
      dockerInspectPort: (c) => {
        assert.equal(c, "redroid-agent-a");
        return "5610";
      },
    });
    assert.equal(serial, "127.0.0.1:5610");
  });
});
