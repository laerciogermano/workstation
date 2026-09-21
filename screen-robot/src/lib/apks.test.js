/**
 * Unitário — apks.js installApk (orquestração stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installApk } from "./apks.js";

describe("installApk", () => {
  it("skip quando versionName == alvo", async () => {
    const r = await installApk(
      { serial: "s", package: "com.x", version: "1.2.3" },
      {
        readAppSpec: (app) => app,
        getInstalledVersion: () => "1.2.3",
        ensureApkArtifact: () => {
          throw new Error("não deve baixar");
        },
        installPackage: () => {
          throw new Error("não deve instalar");
        },
      },
    );
    assert.deepEqual(r, {
      package: "com.x",
      version: "1.2.3",
      skipped: true,
    });
  });

  it("baixa, instala e devolve resultado", async () => {
    let verCalls = 0;
    const steps = [];
    const r = await installApk(
      { serial: "s", package: "com.x", version: "9.0" },
      {
        readAppSpec: (app) => app,
        getInstalledVersion: () => {
          verCalls += 1;
          return verCalls === 1 ? null : "9.0";
        },
        ensureApkArtifact: (spec) => {
          steps.push("dl");
          return `/apks/${spec.package}.apk`;
        },
        installPackage: (serial, path) => {
          steps.push(["ins", serial, path]);
        },
        sleep: async () => {},
      },
    );
    assert.equal(r.skipped, false);
    assert.equal(r.package, "com.x");
    assert.equal(r.version, "9.0");
    assert.equal(r.artifactPath, "/apks/com.x.apk");
    assert.equal(steps[0], "dl");
    assert.deepEqual(steps[1], ["ins", "s", "/apks/com.x.apk"]);
  });

  it("aceita app aninhado", async () => {
    const r = await installApk(
      { serial: "s", app: { package: "com.x", version: "1.0" } },
      {
        readAppSpec: (app) => app,
        getInstalledVersion: () => "1.0",
        ensureApkArtifact: () => {
          throw new Error("não deve baixar");
        },
      },
    );
    assert.equal(r.skipped, true);
  });

  it("lança APK_INSTALL_FAILED se versão diverge sem source (artifact local)", async () => {
    await assert.rejects(
      () =>
        installApk(
          { serial: "s", package: "com.x", version: "2.0", artifact: "/a.apk" },
          {
            readAppSpec: (app) => app,
            getInstalledVersion: () => "1.0",
            ensureApkArtifact: () => "/a.apk",
            installPackage: () => {},
            sleep: async () => {},
          },
        ),
      (err) => err && err.code === "APK_INSTALL_FAILED",
    );
  });

  it("avisa e segue se versão diverge com source remoto", async () => {
    const warnings = [];
    const prev = console.warn;
    console.warn = (...a) => warnings.push(a.join(" "));
    try {
      const r = await installApk(
        { serial: "s", package: "com.x", version: "340.0", source: "apk-pure" },
        {
          readAppSpec: (app) => app,
          getInstalledVersion: () => "447.0",
          ensureApkArtifact: () => "/a.apk",
          installPackage: () => {},
          sleep: async () => {},
        },
      );
      assert.equal(r.version, "447.0");
      assert.ok(warnings.some((w) => w.includes("447.0")));
    } finally {
      console.warn = prev;
    }
  });
});
