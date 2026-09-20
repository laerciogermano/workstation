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
  it("tap envia input tap", () => {
    const calls = [];
    const op = createOperate("s", {
      adb: (_s, args) => calls.push(args),
      sleep: async () => {},
    });
    op.tap(10, 20);
    assert.deepEqual(calls[0], ["shell", "input", "tap", "10", "20"]);
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

  it("launch marca OPERATE_LAUNCH_FAILED se adb falha", async () => {
    const op = createOperate("s", {
      adb: () => {
        throw new Error("boom");
      },
      sleep: async () => {},
    });
    await assert.rejects(
      () => op.launch("com.x"),
      (err) => err && err.code === "OPERATE_LAUNCH_FAILED",
    );
  });
});
