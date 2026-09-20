/**
 * Unitário — apk-get-installed-version.js
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getInstalledVersion } from "./apk-get-installed-version.js";

describe("getInstalledVersion", () => {
  it("parseia versionName do dumpsys", () => {
    const v = getInstalledVersion("s", "com.x", {
      dumpsysPackage: () => "Package [com.x]\n    versionName=4.1.1093\n",
    });
    assert.equal(v, "4.1.1093");
  });

  it("retorna null se ausente", () => {
    assert.equal(
      getInstalledVersion("s", "com.x", {
        dumpsysPackage: () => "nada",
      }),
      null,
    );
  });
});
