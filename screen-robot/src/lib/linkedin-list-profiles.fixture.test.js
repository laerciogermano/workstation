/**
 * Parse de cards LinkedIn a partir de OCR golden das prints da lista.
 * Cada perfil: assert exacto de name, nivel, status, cidade, mutual, headline, current, past.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { profilesFromExtract } from "./linkedin-list-profiles.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIX = (id) => ({
  ocr: resolve(ROOT, `test/fixtures/linkedin-list-profiles-${id}.ocr.json`),
  expected: resolve(
    ROOT,
    `test/fixtures/linkedin-list-profiles-${id}.expected.json`,
  ),
  png: resolve(ROOT, `test/fixtures/linkedin-list-profiles-${id}.png`),
});

const FIELD_KEYS = [
  "name",
  "nivel",
  "status",
  "cidade",
  "mutualConnections",
  "headline",
  "current",
  "past",
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe("linkedin-list-profiles — fixtures lista People", () => {
  for (const id of ["01", "02", "03"]) {
    const paths = FIX(id);

    it(`fixture ${id}: extrai exatamente cada atributo de cada perfil`, () => {
      const ocr = loadJson(paths.ocr);
      const expected = loadJson(paths.expected);
      assert.ok(Array.isArray(ocr) && ocr.length > 0, "OCR fixture vazia");
      assert.ok(
        Array.isArray(expected) && expected.length > 0,
        "expected fixture vazia",
      );

      const got = profilesFromExtract(ocr).map((p) => p.fields);
      assert.equal(
        got.length,
        expected.length,
        `qtd perfis: got=${got.length} expected=${expected.length}`,
      );

      for (let i = 0; i < expected.length; i++) {
        const exp = expected[i];
        const actual = got[i];
        assert.ok(actual, `perfil[${i}] ausente`);
        for (const key of FIELD_KEYS) {
          assert.equal(
            actual[key],
            exp[key],
            `perfil[${i}] (${exp.name}).${key}: got=${JSON.stringify(actual[key])} expected=${JSON.stringify(exp[key])}`,
          );
        }
        assert.deepEqual(
          actual,
          exp,
          `perfil[${i}] fields completos devem bater`,
        );
      }
    });
  }
});
