import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRunArgs, runAction } from "./run-action.js";

describe("parseRunArgs", () => {
  it("extract --engine all", () => {
    const p = parseRunArgs(["extract", "--engine", "all"]);
    assert.equal(p.action, "extract");
    assert.equal(p.engine, "all");
    assert.equal(p.icons, false);
  });

  it("extract --icons true / --no-icons", () => {
    assert.equal(parseRunArgs(["extract", "--icons"]).icons, true);
    assert.equal(parseRunArgs(["extract", "--icons", "true"]).icons, true);
    assert.equal(parseRunArgs(["extract", "--icons", "false"]).icons, false);
    assert.equal(parseRunArgs(["extract", "--no-icons"]).icons, false);
  });

  it("tap x y", () => {
    const p = parseRunArgs(["tap", "360", "640"]);
    assert.equal(p.action, "tap");
    assert.equal(p.x, 360);
    assert.equal(p.y, 640);
  });

  it("type junta o texto", () => {
    const p = parseRunArgs(["type", "Campinas", "SP"]);
    assert.equal(p.text, "Campinas SP");
  });
});

describe("runAction", () => {
  const serial = "emulator-5554";

  it("extract chama a lib e devolve result", async () => {
    const els = [{ type: "text", text: "People", x: 10, y: 20 }];
    const out = await runAction(
      { action: "extract", serial, engine: "all" },
      { extract: async (cfg) => {
        assert.equal(cfg.serial, serial);
        assert.equal(cfg.engine, "all");
        assert.equal(cfg.icons, false);
        return els;
      } },
    );
    assert.equal(out.ok, true);
    assert.equal(out.icons, false);
    assert.deepEqual(out.result, els);
  });

  it("extract --icons true passa cfg.icons", async () => {
    const out = await runAction(
      { action: "extract", serial, engine: "rapidocr", icons: true },
      {
        extract: async (cfg) => {
          assert.equal(cfg.icons, true);
          return [];
        },
      },
    );
    assert.equal(out.icons, true);
  });

  it("tap chama a lib", async () => {
    const taps = [];
    const out = await runAction(
      { action: "tap", serial, x: 100, y: 200 },
      { tap: (cfg) => taps.push(cfg) },
    );
    assert.deepEqual(taps, [{ serial, x: 100, y: 200 }]);
    assert.deepEqual(out.result, { x: 100, y: 200 });
  });

  it("launch resolve alias do config", async () => {
    const launched = [];
    const out = await runAction(
      {
        action: "launch",
        serial,
        package: "linkedin",
        config: { apps: { linkedin: { package: "com.linkedin.android" } } },
      },
      { launch: async (cfg) => launched.push(cfg) },
    );
    assert.equal(launched[0].package, "com.linkedin.android");
    assert.equal(out.result.package, "com.linkedin.android");
  });
});
