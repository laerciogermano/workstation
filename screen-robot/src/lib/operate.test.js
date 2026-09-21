/**
 * Unitário — operate.js (adb stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildKeyCenters,
  launch,
  tap,
  type,
  scroll,
  screenshot,
  matchImage,
  openScrcpy,
} from "./operate.js";

describe("buildKeyCenters", () => {
  it("mapeia dígitos OCR para centers", () => {
    const map = buildKeyCenters([
      { text: "1", bounds: { x: 0, y: 0, w: 20, h: 20 } },
      { text: "2", bounds: { x: 40, y: 0, w: 20, h: 20 } },
      { text: "Phone", bounds: { x: 0, y: 100, w: 80, h: 20 } },
    ]);
    assert.deepEqual(map.get("1"), { x: 10, y: 10 });
    assert.deepEqual(map.get("2"), { x: 50, y: 10 });
    assert.equal(map.has("P"), false);
  });
});

describe("operate", () => {
  it("type toca cada tecla via OCR (sem input text)", async () => {
    const taps = [];
    await type(
      {
        serial: "s",
        text: "129",
        region: { x: 0, y: 700, width: 720, height: 500 },
        delayMs: 0,
      },
      {
        adb: (_s, args) => {
          if (args.includes("tap")) taps.push([args[4], args[5]]);
          return {};
        },
        connectIfTcp: () => {},
        sleep: async () => {},
        captureFrame: async () => "/tmp/kb.png",
        ocrWords: async (_p, deps) => {
          assert.ok(deps.rectangle || deps.region);
          return [
            { text: "1", bounds: { x: 10, y: 10, w: 20, h: 20 } },
            { text: "2", bounds: { x: 50, y: 10, w: 20, h: 20 } },
            { text: "9", bounds: { x: 90, y: 10, w: 20, h: 20 } },
          ];
        },
      },
    );
    assert.deepEqual(taps, [
      ["20", "20"],
      ["60", "20"],
      ["100", "20"],
    ]);
  });

  it("type falha se tecla ausente no OCR", async () => {
    await assert.rejects(
      () =>
        type(
          { serial: "s", text: "5", delayMs: 0 },
          {
            adb: () => {},
            connectIfTcp: () => {},
            sleep: async () => {},
            captureFrame: async () => "/tmp/kb.png",
            ocrWords: async () => [
              { text: "1", bounds: { x: 0, y: 0, w: 10, h: 10 } },
            ],
          },
        ),
      (err) => err && err.code === "OPERATE_TYPE_FAILED",
    );
  });

  it("tap envia cmd input tap", () => {
    const calls = [];
    tap(
      { serial: "s", x: 10, y: 20 },
      {
        adb: (_s, args) => calls.push(args),
        sleep: async () => {},
        connectIfTcp: () => {},
      },
    );
    assert.deepEqual(calls[0], ["shell", "cmd", "input", "tap", "10", "20"]);
  });

  it("tap faz retry em Broken pipe", () => {
    let n = 0;
    const calls = [];
    tap(
      { serial: "s", x: 1, y: 2 },
      {
        adb: (_s, args) => {
          calls.push(args);
          n += 1;
          if (n <= 2) {
            throw new Error("cmd: Failure calling service input: Broken pipe (32)");
          }
          return {};
        },
        connectIfTcp: () => {},
      },
    );
    assert.ok(calls.length >= 3);
  });

  it("scroll down faz swipe", () => {
    const calls = [];
    scroll(
      { serial: "s", direction: "down", distance: 100, x: 5, y: 10 },
      { adb: (_s, args) => calls.push(args) },
    );
    assert.equal(calls[0][2], "swipe");
    assert.equal(calls[0][6], "110");
  });

  it("screenshot grava path", () => {
    assert.equal(
      screenshot(
        { serial: "s", path: "out.png" },
        {
          adb: () => {},
          mkdirSync: () => {},
          resolve: (p) => `/abs/${p}`,
        },
      ),
      "/abs/out.png",
    );
  });

  it("matchImage exige template", async () => {
    await assert.rejects(
      () =>
        matchImage(
          { serial: "s", templatePath: "/nope.png" },
          { existsSync: () => false },
        ),
      (err) => err && err.code === "OPERATE_MATCH_NOT_FOUND",
    );
  });

  it("launch resolve activity e faz am start -n", async () => {
    const calls = [];
    await launch(
      { serial: "s", package: "com.x" },
      {
        adb: (_s, args) => {
          calls.push(args);
          if (args.includes("resolve-activity")) {
            return { stdout: "com.x/.Main\n" };
          }
          return {};
        },
        sleep: async () => {},
      },
    );
    assert.ok(calls.some((a) => a.includes("resolve-activity")));
    assert.ok(
      calls.some(
        (a) => a.includes("am") && a.includes("start") && a.includes("com.x/.Main"),
      ),
    );
  });

  it("launch marca OPERATE_LAUNCH_FAILED se adb falha", async () => {
    await assert.rejects(
      () =>
        launch(
          { serial: "s", package: "com.x" },
          {
            adb: () => {
              throw new Error("boom");
            },
            adbOk: () => false,
            sleep: async () => {},
          },
        ),
      (err) => err && err.code === "OPERATE_LAUNCH_FAILED",
    );
  });

  it("openScrcpy spawna scrcpy no serial", () => {
    let spawned;
    const out = openScrcpy(
      { serial: "127.0.0.1:5555", title: "test" },
      {
        whichScrcpy: () => "/usr/bin/scrcpy",
        connectIfTcp: () => {},
        spawnScrcpy: (bin, args, opts) => {
          spawned = { bin, args, opts };
          return { pid: 4242, unref: () => {} };
        },
      },
    );
    assert.equal(out.pid, 4242);
    assert.equal(out.serial, "127.0.0.1:5555");
    assert.equal(spawned.bin, "/usr/bin/scrcpy");
    assert.ok(spawned.args.includes("127.0.0.1:5555"));
    assert.ok(spawned.args.includes("--keyboard=sdk"));
    assert.equal(spawned.opts.detached, true);
  });

  it("openScrcpy falha sem scrcpy no PATH", () => {
    assert.throws(
      () => openScrcpy({ serial: "s" }, { whichScrcpy: () => null }),
      (err) => err && err.code === "OPERATE_SCRCPY_FAILED",
    );
  });
});
