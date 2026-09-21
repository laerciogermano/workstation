/**
 * Unitário — events.js on(cfg).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { on } from "./events.js";

describe("on(cfg)", () => {
  it("despacha boot / app_open / ui_stable / frame_change", async () => {
    const calls = [];
    const deps = {
      waitBoot: async (serial, opts) => {
        calls.push(["boot", serial, opts.onEvent]);
        return { boot: true };
      },
      waitAppOpen: async (serial, opts) => {
        calls.push(["app", serial, opts.pkg]);
        return { foreground: true, package: opts.pkg };
      },
      waitUiStable: async () => {
        calls.push(["stable"]);
        return { stable: true };
      },
      waitDumpChange: async (serial, opts) => {
        calls.push(["frame", opts.previousXml]);
        return { xml: "<x/>", changed: true };
      },
    };
    const cb = () => {};
    assert.deepEqual(
      await on({ serial: "127.0.0.1:5555", event: "boot", onEvent: cb }, deps),
      { boot: true },
    );
    assert.deepEqual(
      await on({ serial: "127.0.0.1:5555", event: "app_open", pkg: "com.x" }, deps),
      { foreground: true, package: "com.x" },
    );
    assert.deepEqual(
      await on({ serial: "s", event: "ui_stable" }, deps),
      { stable: true },
    );
    assert.deepEqual(
      await on(
        { serial: "s", event: "frame_change", previousFrame: "<old/>" },
        deps,
      ),
      { xml: "<x/>", changed: true },
    );
    assert.equal(calls[0][0], "boot");
    assert.equal(calls[0][2], cb);
    assert.equal(calls[1][2], "com.x");
    assert.equal(calls[3][1], "<old/>");
  });

  it("lança EVENT_NO_SERIAL sem serial", async () => {
    await assert.rejects(
      () => on({ event: "boot" }),
      (err) => err && err.code === "EVENT_NO_SERIAL",
    );
  });

  it("lança EVENT_UNKNOWN para evento inválido", async () => {
    await assert.rejects(
      () => on({ serial: "s", event: "nope" }),
      (err) => err && err.code === "EVENT_UNKNOWN",
    );
  });
});
