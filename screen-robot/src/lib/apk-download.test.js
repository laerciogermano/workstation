/**
 * Unitário — apk-download.js (fs/apkeep stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ensureApkArtifact, findArtifact } from "./apk-download.js";

describe("findArtifact", () => {
  it("usa artifact hint se existir", () => {
    const path = findArtifact("/apks", "com.x", "apks/com.x.apk", {
      root: "/root",
      existsSync: (p) => p === "/root/apks/com.x.apk",
      readdirSync: () => [],
    });
    assert.equal(path, "/root/apks/com.x.apk");
  });

  it("procura por nome do package no dir", () => {
    const path = findArtifact("/apks", "com.x", undefined, {
      root: "/root",
      existsSync: (p) => p === "/apks",
      readdirSync: () => ["com.x.xapk"],
    });
    assert.equal(path, "/apks/com.x.xapk");
  });
});

describe("ensureApkArtifact", () => {
  it("retorna artefato local sem download", () => {
    const path = ensureApkArtifact(
      { package: "com.x", artifact: "apks/x.apk" },
      {
        root: "/root",
        apksDir: "/apks",
        findArtifact: () => "/apks/x.apk",
      },
    );
    assert.equal(path, "/apks/x.apk");
  });

  it("baixa quando ausente e encontra depois", () => {
    let downloaded = false;
    const path = ensureApkArtifact(
      { package: "com.x", source: "apk-pure" },
      {
        root: "/root",
        apksDir: "/apks",
        findArtifact: () => (downloaded ? "/apks/com.x.apk" : null),
        ensureApkeep: () => {},
        download: () => {
          downloaded = true;
        },
      },
    );
    assert.equal(path, "/apks/com.x.apk");
    assert.equal(downloaded, true);
  });

  it("lança APK_DOWNLOAD_FAILED se não achar artefato", () => {
    assert.throws(
      () =>
        ensureApkArtifact(
          { package: "com.x" },
          {
            findArtifact: () => null,
            ensureApkeep: () => {},
            download: () => {},
          },
        ),
      (err) => err && err.code === "APK_DOWNLOAD_FAILED",
    );
  });
});
