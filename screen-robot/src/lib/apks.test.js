/**
 * Unitário — apks.js createInstallApk (orquestração stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createInstallApk } from "./apks.js";

describe("createInstallApk", () => {
  it("skip quando versionName == alvo", async () => {
    const installApk = createInstallApk("s", {
      readAppSpec: (app) => app,
      getInstalledVersion: () => "1.2.3",
      ensureApkArtifact: () => {
        throw new Error("não deve baixar");
      },
      installPackage: () => {
        throw new Error("não deve instalar");
      },
    });
    const r = await installApk({
      package: "com.x",
      version: "1.2.3",
    });
    assert.deepEqual(r, {
      package: "com.x",
      version: "1.2.3",
      skipped: true,
    });
  });

  it("baixa, instala e devolve resultado", async () => {
    let verCalls = 0;
    const steps = [];
    const installApk = createInstallApk("s", {
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
    });
    const r = await installApk({ package: "com.x", version: "9.0" });
    assert.equal(r.skipped, false);
    assert.equal(r.package, "com.x");
    assert.equal(r.version, "9.0");
    assert.equal(r.artifactPath, "/apks/com.x.apk");
    assert.equal(steps[0], "dl");
    assert.deepEqual(steps[1], ["ins", "s", "/apks/com.x.apk"]);
  });

  it("lança APK_INSTALL_FAILED se versão pós-install diverge", async () => {
    const installApk = createInstallApk("s", {
      readAppSpec: (app) => app,
      getInstalledVersion: () => "1.0",
      ensureApkArtifact: () => "/a.apk",
      installPackage: () => {},
      sleep: async () => {},
    });
    await assert.rejects(
      () => installApk({ package: "com.x", version: "2.0" }),
      (err) => err && err.code === "APK_INSTALL_FAILED",
    );
  });
});
