/**
 * Unitário — apk-install-package.js (adb stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { installPackage } from "./apk-install-package.js";

describe("installPackage", () => {
  it("instala .apk via adbInstall", () => {
    let called;
    installPackage("s", "/tmp/a.apk", {
      adbInstall: (serial, path) => {
        called = [serial, path];
      },
    });
    assert.deepEqual(called, ["s", "/tmp/a.apk"]);
  });

  it("instala .xapk via splits", () => {
    let splits;
    installPackage("s", "/tmp/a.xapk", {
      unzipToTemp: () => ({
        tmp: "/tmp/x",
        splits: ["/tmp/x/base.apk", "/tmp/x/split.apk"],
      }),
      adbInstallMultiple: (_s, s) => {
        splits = s;
      },
    });
    assert.deepEqual(splits, ["/tmp/x/base.apk", "/tmp/x/split.apk"]);
  });

  it("lança APK_INSTALL_FAILED se adb falha", () => {
    assert.throws(
      () =>
        installPackage("s", "/tmp/a.apk", {
          adbInstall: () => {
            const err = new Error("fail");
            throw err;
          },
        }),
      (err) => err && err.code === "APK_INSTALL_FAILED",
    );
  });
});
