/**
 * Compara OCR backends na mesma fixture People/comprador (Connect visível na UI).
 * Grava relatório em test/output/ocr-backends-compare.json.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  extractFromImage,
  findConnectHits,
  listOcrEngines,
} from "./extract-engines.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = resolve(ROOT, "test/fixtures/linkedin-people-comprador-connect.png");
const OUT_DIR = resolve(ROOT, "test/output");
const OUT_JSON = resolve(OUT_DIR, "ocr-backends-compare.json");

describe("extract OCR backends — fixture People comprador", () => {
  it("identifica quais engines devolvem Connect", async () => {
    const engines = listOcrEngines();
    assert.ok(engines.includes("rapidocr"));
    assert.ok(engines.includes("macos-vision"));
    assert.ok(engines.includes("tesseract"));
    assert.ok(engines.includes("paddleocr"));
    assert.ok(engines.includes("easyocr"));
    assert.ok(engines.includes("all"));

    /** @type {Record<string, any>} */
    const report = { fixture: FIXTURE, engines: {} };

    for (const engine of engines) {
      const started = Date.now();
      let els = [];
      let error = null;
      try {
        els = await extractFromImage(FIXTURE, { engine });
      } catch (e) {
        error = String(e.message || e);
      }
      const connects = findConnectHits(els);
      const exact = els.filter((e) => /^connect$/i.test(String(e.text || "").trim()));
      report.engines[engine] = {
        ok: !error,
        error,
        ms: Date.now() - started,
        hits: els.length,
        connectHits: connects.map((e) => ({ text: e.text, x: e.x, y: e.y })),
        connectExact: exact.map((e) => ({ text: e.text, x: e.x, y: e.y })),
        sample: els.slice(0, 12),
        all: els,
      };

      console.log(`\n=== engine=${engine} ===`);
      if (error) console.log("ERROR", error);
      else {
        console.log(`hits=${els.length} connectHits=${connects.length} exact=${exact.length}`);
        for (const c of connects) console.log(`Connect-ish ${JSON.stringify(c.text)} @${c.x},${c.y}`);
      }
    }

    const winnersExact = Object.entries(report.engines)
      .filter(([, r]) => (r.connectExact || []).length > 0)
      .map(([name]) => name);
    const winnersAny = Object.entries(report.engines)
      .filter(([, r]) => (r.connectHits || []).length > 0)
      .map(([name]) => name);

    report.winnersExactConnect = winnersExact;
    report.winnersAnyConnect = winnersAny;

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + "\n", "utf8");
    console.log(`\nsaved=${OUT_JSON}`);
    console.log(`winnersExactConnect=${JSON.stringify(winnersExact)}`);
    console.log(`winnersAnyConnect=${JSON.stringify(winnersAny)}`);

    assert.ok(
      winnersAny.includes("rapidocr") || winnersAny.includes("macos-vision"),
      "esperado RapidOCR ou macOS Vision ver Connect nesta fixture",
    );
    assert.equal(
      (report.engines.tesseract?.connectExact || []).length,
      0,
      "baseline: tesseract.js não lê o pill Connect nesta fixture",
    );
    assert.ok(
      (report.engines.rapidocr?.connectExact || []).length >= 1,
      "RapidOCR deve devolver text===Connect",
    );
  });
});
