/**
 * Unitário — apk-read-spec.js
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readAppSpec } from "./apk-read-spec.js";

describe("readAppSpec", () => {
  it("lê package e version da config", () => {
    assert.deepEqual(
      readAppSpec({
        package: "com.x",
        version: "1.0",
        source: "apk-pure",
        artifact: "apks/x.apk",
      }),
      {
        package: "com.x",
        version: "1.0",
        source: "apk-pure",
        artifact: "apks/x.apk",
      },
    );
  });

  it("lança APK_CONFIG_INVALID sem package", () => {
    assert.throws(
      () => readAppSpec({}),
      (err) => err && err.code === "APK_CONFIG_INVALID",
    );
  });
});
