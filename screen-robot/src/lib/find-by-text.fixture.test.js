/**
 * findByText com fixture LinkedIn (print inicial) → "Sign in with Email".
 */
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { findByText } from "./extract.js";

const FIXTURE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../test/fixtures/linkedin-tela-inicial.png",
);

describe("findByText — fixture LinkedIn", () => {
  it('query "Sign in with Email" devolve Sign, in, with, Email', async () => {
    const hit = await findByText("fixture", "Sign in with Email", {
      minScore: 0.75,
      captureFrame: async () => FIXTURE,
    });
    assert.ok(hit, "esperado match na fixture");
    assert.equal(hit.elements.length, 4);
    assert.deepEqual(
      hit.elements.map((e) => e.text),
      ["Sign", "in", "with", "Email"],
    );
    assert.match(hit.text, /^sign in with email$/);
    assert.ok(hit.score >= 0.75);
    assert.ok(Array.isArray(hit.center) && hit.center.length === 2);
  });
});
