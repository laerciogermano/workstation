/**
 * Prints salvas (PNG) → extract(OCR na imagem) → parse → assert exacto por atributo.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { extract } from "./extract.js";
import { profilesFromExtract } from "./linkedin-list-profiles.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "test/output");
const ENGINE = process.env.SCREEN_ROBOT_OCR || "macos-vision";

const FIX = (id) => ({
  id,
  png: resolve(ROOT, `test/fixtures/linkedin-list-profiles-${id}.png`),
  expected: resolve(
    ROOT,
    `test/fixtures/linkedin-list-profiles-${id}.expected.json`,
  ),
});

const FIELD_KEYS = [
  "name",
  "title",
  "level",
  "connection",
  "city",
  "mutualConnections",
  "current",
  "past",
];

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Print salva (PNG) → extract OCR da imagem.
 * @param {string} pngPath
 */
async function extractFromImage(pngPath) {
  assert.ok(existsSync(pngPath), `print ausente: ${pngPath}`);
  const els = await extract(
    { serial: "fixture", engine: ENGINE },
    { captureFrame: async () => pngPath },
  );
  assert.ok(Array.isArray(els) && els.length > 0, "extract da imagem vazio");
  return els;
}

describe("linkedin-list-profiles — print → extract imagem → atributos", () => {
  for (const id of ["01", "02", "03"]) {
    const paths = FIX(id);

    it(`fixture ${id}: print PNG → extract → cada atributo exacto`, async () => {
      const expected = loadJson(paths.expected);
      assert.ok(expected.length > 0, "expected vazio");

      const ocr = await extractFromImage(paths.png);
      mkdirSync(OUT_DIR, { recursive: true });
      writeFileSync(
        resolve(OUT_DIR, `linkedin-list-profiles-${id}.from-image.ocr.json`),
        JSON.stringify(ocr, null, 2) + "\n",
        "utf8",
      );

      const got = profilesFromExtract(ocr, { engine: ENGINE }).map((p) => p.fields);
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
        assert.deepEqual(actual, exp, `perfil[${i}] fields completos`);
      }
    });
  }
});
