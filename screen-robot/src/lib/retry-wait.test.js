import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseRetryAfterMs,
  resolveRetryWaitMs,
} from "./retry-wait.js";

describe("retry-wait", () => {
  it("parseRetryAfterMs lê try again in 728ms", () => {
    assert.equal(
      parseRetryAfterMs("Please try again in 728ms. Visit https://…"),
      728,
    );
    assert.equal(parseRetryAfterMs("try again in 1.5s"), 1500);
    assert.equal(parseRetryAfterMs("ok"), null);
  });

  it("429 usa piso 2s se base=0; senão max(API, piso×attempt)", () => {
    assert.equal(
      resolveRetryWaitMs({
        baseMs: 0,
        attempt: 1,
        status: 429,
        message: "Rate limit. Please try again in 728ms.",
      }),
      2000,
    );
    assert.equal(
      resolveRetryWaitMs({
        baseMs: 2000,
        attempt: 1,
        status: 429,
        message: "try again in 728ms",
      }),
      2000,
    );
    assert.equal(
      resolveRetryWaitMs({
        baseMs: 2000,
        attempt: 1,
        status: 429,
        message: "try again in 5s",
      }),
      5000,
    );
  });

  it("503 high demand não espera", () => {
    assert.equal(
      resolveRetryWaitMs({
        baseMs: 2000,
        attempt: 1,
        status: 503,
        message: "high demand",
      }),
      0,
    );
  });
});
