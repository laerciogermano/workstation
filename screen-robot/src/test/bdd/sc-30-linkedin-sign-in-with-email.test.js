/**
 * BDD — SC-30 LinkedIn Sign in with Email (US-23)
 * Fixture: test/fixtures/linkedin-tela-inicial.png
 */
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { findByText } from "../../lib/extract.js";

const FIXTURE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/linkedin-tela-inicial.png",
);

describe("Cenário: SC-30 LinkedIn Sign in with Email", () => {
  it(
    'Dado print LinkedIn; Quando findByText("Sign in with Email"); Então Sign+in+with+Email',
    async () => {
      const hit = await findByText("fixture", "Sign in with Email", {
        minScore: 0.75,
        captureFrame: async () => FIXTURE,
      });
      assert.ok(hit, "esperado match na fixture LinkedIn");
      assert.deepEqual(
        hit.elements.map((e) => e.text),
        ["Sign", "in", "with", "Email"],
      );
      assert.match(hit.text, /^sign in with email$/);
      assert.ok(hit.score >= 0.75);
      assert.equal(hit.center.length, 2);
    },
    { timeout: 120_000 },
  );
});
