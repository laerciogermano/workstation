/**
 * extract OCR na fixture People/comprador (print com pills + Connect).
 * Imprime no console o retorno completo para inspeção.
 */
import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { extract } from "./extract.js";

const FIXTURE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../test/fixtures/linkedin-people-comprador-connect.png",
);

describe("extract — fixture People comprador", () => {
  it("OCR da fixture e print no console", async () => {
    const els = await extract(
      { serial: "fixture" },
      { captureFrame: async () => FIXTURE },
    );

    assert.ok(Array.isArray(els), "extract deve devolver array");
    assert.ok(els.length > 0, "OCR não pode ser vazio");
    assert.ok(els.every((e) => e.type === "text"));
    assert.ok(els.every((e) => typeof e.text === "string"));
    assert.ok(els.every((e) => typeof e.x === "number" && typeof e.y === "number"));

    console.log("\n=== OCR extract (fixture people-comprador-connect) ===");
    console.log(`hits=${els.length}`);
    for (const e of els) {
      console.log(`${JSON.stringify(e.text)} @${e.x},${e.y}`);
    }
    console.log("=== JSON ===");
    console.log(JSON.stringify(els.map(({ text, x, y }) => ({ text, x, y })), null, 2));
    console.log("=== fim OCR ===\n");

    assert.ok(
      els.some((e) => /comprador/i.test(String(e.text || ""))),
      "esperado token comprador na fixture",
    );
  });
});
