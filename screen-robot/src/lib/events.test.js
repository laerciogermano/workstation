/**
 * Unitário — events.js createOn (despacho com waits stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createOn } from "./events.js";

describe("createOn", () => {
  it("despacha boot / app_open / ui_stable / dump_change", async () => {
    const calls = [];
    const on = createOn("127.0.0.1:5555", {
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
      waitDumpChange: async () => {
        calls.push(["dump"]);
        return { xml: "<x/>", changed: true };
      },
    });
    const cb = () => {};
    assert.deepEqual(await on("boot", {}, cb), { boot: true });
    assert.deepEqual(await on("app_open", { pkg: "com.x" }), {
      foreground: true,
      package: "com.x",
    });
    assert.deepEqual(await on("ui_stable", {}), { stable: true });
    assert.deepEqual(await on("dump_change", { previousXml: "" }), {
      xml: "<x/>",
      changed: true,
    });
    assert.equal(calls[0][0], "boot");
    assert.equal(calls[0][2], cb);
    assert.equal(calls[1][2], "com.x");
  });

  it("lança EVENT_UNKNOWN para evento inválido", async () => {
    const on = createOn("s");
    await assert.rejects(
      () => on("nope"),
      (err) => err && err.code === "EVENT_UNKNOWN",
    );
  });
});
