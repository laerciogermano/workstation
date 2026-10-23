import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveSense, takeSenseArg } from "./sense.js";

describe("sense", () => {
  it("resolveSense default dump", () => {
    const prev = process.env.SCREEN_ROBOT_SENSE;
    delete process.env.SCREEN_ROBOT_SENSE;
    try {
      assert.equal(resolveSense({}), "dump");
      assert.equal(resolveSense({ sense: "ocr" }), "ocr");
      assert.equal(resolveSense({ sense: "dump" }), "dump");
    } finally {
      if (prev == null) delete process.env.SCREEN_ROBOT_SENSE;
      else process.env.SCREEN_ROBOT_SENSE = prev;
    }
  });

  it("takeSenseArg", () => {
    const prev = process.env.SCREEN_ROBOT_SENSE;
    try {
      const { sense, argv } = takeSenseArg(["-n", "3", "--sense", "ocr", "--x"]);
      assert.equal(sense, "ocr");
      assert.deepEqual(argv, ["-n", "3", "--x"]);
      assert.equal(process.env.SCREEN_ROBOT_SENSE, "ocr");
    } finally {
      if (prev == null) delete process.env.SCREEN_ROBOT_SENSE;
      else process.env.SCREEN_ROBOT_SENSE = prev;
    }
  });
});
