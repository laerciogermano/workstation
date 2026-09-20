/**
 * Unitário — operate.js createOperate (adb stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createOperate, escapeInputText } from "./operate.js";

describe("escapeInputText", () => {
  it("escapa espaços", () => {
    assert.equal(escapeInputText("a b"), "a%sb");
  });
});

describe("createOperate", () => {
  it("tap envia cmd input tap", () => {
    const calls = [];
    const op = createOperate("s", {
      adb: (_s, args) => calls.push(args),
      sleep: async () => {},
      connectIfTcp: () => {},
    });
    op.tap(10, 20);
    assert.deepEqual(calls[0], ["shell", "cmd", "input", "tap", "10", "20"]);
  });

  it("tap faz retry em Broken pipe", () => {
    let n = 0;
    const calls = [];
    const op = createOperate("s", {
      adb: (_s, args) => {
        calls.push(args);
        n += 1;
        if (n <= 2) {
          throw new Error("cmd: Failure calling service input: Broken pipe (32)");
        }
        return {};
      },
      connectIfTcp: () => {},
    });
    op.tap(1, 2);
    assert.ok(calls.length >= 3);
  });

  it("scroll down faz swipe", () => {
    const calls = [];
    const op = createOperate("s", {
      adb: (_s, args) => calls.push(args),
    });
    op.scroll({ direction: "down", distance: 100, x: 5, y: 10 });
    assert.equal(calls[0][2], "swipe");
    assert.equal(calls[0][6], "110");
  });

  it("screenshot grava path", () => {
    const op = createOperate("s", {
      adb: () => {},
      mkdirSync: () => {},
      resolve: (p) => `/abs/${p}`,
    });
    assert.equal(op.screenshot("out.png"), "/abs/out.png");
  });

  it("matchImage exige template", async () => {
    const op = createOperate("s", { existsSync: () => false });
    await assert.rejects(
      () => op.matchImage("/nope.png"),
      (err) => err && err.code === "OPERATE_MATCH_NOT_FOUND",
    );
  });

  it("launch resolve activity e faz am start -n", async () => {
    const calls = [];
    const op = createOperate("s", {
      adb: (_s, args) => {
        calls.push(args);
        if (args.includes("resolve-activity")) {
          return { stdout: "com.x/.Main\n" };
        }
        return {};
      },
      sleep: async () => {},
    });
    await op.launch("com.x");
    assert.ok(calls.some((a) => a.includes("resolve-activity")));
    assert.ok(
      calls.some(
        (a) => a.includes("am") && a.includes("start") && a.includes("com.x/.Main"),
      ),
    );
  });

  it("launch marca OPERATE_LAUNCH_FAILED se adb falha", async () => {
    const op = createOperate("s", {
      adb: () => {
        throw new Error("boom");
      },
      adbOk: () => false,
      sleep: async () => {},
    });
    await assert.rejects(
      () => op.launch("com.x"),
      (err) => err && err.code === "OPERATE_LAUNCH_FAILED",
    );
  });

  it("openScrcpy spawna scrcpy no serial", () => {
    let spawned;
    const op = createOperate("127.0.0.1:5555", {
      whichScrcpy: () => "/usr/bin/scrcpy",
      connectIfTcp: () => {},
      spawnScrcpy: (bin, args, opts) => {
        spawned = { bin, args, opts };
        return { pid: 4242, unref: () => {} };
      },
    });
    const out = op.openScrcpy({ title: "test" });
    assert.equal(out.pid, 4242);
    assert.equal(out.serial, "127.0.0.1:5555");
    assert.equal(spawned.bin, "/usr/bin/scrcpy");
    assert.ok(spawned.args.includes("127.0.0.1:5555"));
    assert.ok(spawned.args.includes("--keyboard=sdk"));
    assert.equal(spawned.opts.detached, true);
  });

  it("openScrcpy falha sem scrcpy no PATH", () => {
    const op = createOperate("s", { whichScrcpy: () => null });
    assert.throws(
      () => op.openScrcpy(),
      (err) => err && err.code === "OPERATE_SCRCPY_FAILED",
    );
  });
});
