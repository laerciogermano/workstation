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
      adb: () => ({ stdout: "arm64-v8a,armeabi-v7a\n" }),
      unzipToTemp: () => ({
        tmp: "/tmp/x",
        splits: [
          "/tmp/x/base.apk",
          "/tmp/x/config.arm64_v8a.apk",
          "/tmp/x/config.armeabi_v7a.apk",
          "/tmp/x/config.en.apk",
        ],
      }),
      adbInstallMultiple: (_s, s) => {
        splits = s;
      },
    });
    assert.ok(splits.includes("/tmp/x/base.apk"));
    assert.ok(splits.includes("/tmp/x/config.arm64_v8a.apk"));
    assert.ok(splits.includes("/tmp/x/config.armeabi_v7a.apk"));
    assert.ok(splits.includes("/tmp/x/config.en.apk"));
  });

  it("filtra ABI incompatível no XAPK", () => {
    assert.throws(
      () =>
        installPackage("s", "/tmp/a.xapk", {
          adb: () => ({ stdout: "arm64-v8a\n" }),
          unzipToTemp: () => ({
            tmp: "/tmp/x",
            splits: [
              "/tmp/x/base.apk",
              "/tmp/x/config.armeabi_v7a.apk",
              "/tmp/x/config.en.apk",
            ],
          }),
          adbInstallMultiple: () => {
            throw new Error("não deveria instalar");
          },
        }),
      (err) => err && err.code === "APK_INSTALL_FAILED" && /ABI/.test(err.message),
    );
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
