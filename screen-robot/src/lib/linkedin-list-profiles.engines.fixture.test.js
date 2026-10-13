/**
 * PNG fixtures → extract(rapidocr|tesseract|macos-vision) → profilesFromExtract({ engine })
 * Compara com expected (gold macos-vision). Logs por atributo; assert em nome/connection/qtd
 * + match soft (acentos / reticências) nos demais campos.
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { extract } from "./extract.js";
import { profilesFromExtract } from "./linkedin-list-profiles.js";
import { expandRapidocrText } from "./linkedin-list-profiles-engines.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = resolve(ROOT, "test/output");
const ENGINES = ["macos-vision", "rapidocr", "tesseract"];
const FIX_IDS = ["01", "02", "03"];

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

/** Normaliza para comparar OCR ruidoso com gold macos-vision. */
export function softField(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/^\/\s*/, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\.+$/g, "...")
    .replace(/\s*\.\.\.\s*/g, "...")
    .replace(/\.{2,}/g, "...")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenBag(s) {
  return softField(s)
    .replace(/\//g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/\.+$/g, ""))
    .filter((w) => w && w !== "...");
}

function fieldsMatchSoft(got, exp, key) {
  if (got === exp) return "exact";
  const g = softField(got);
  const e = softField(exp);
  if (g === e) return "soft";
  if (g.replace(/\s/g, "") === e.replace(/\s/g, "")) return "soft";
  // tesseract embaralha ordem (Current: GPS at Comprador Grupo)
  if (
    ["title", "current", "past", "city"].includes(key) &&
    g &&
    e
  ) {
    const bag = tokenBag(got);
    const need = tokenBag(exp);
    if (need.length && need.every((w) => bag.includes(w))) return "soft";
    if (bag.length && need.length && bag.every((w) => need.includes(w))) {
      return "soft";
    }
  }
  if (
    (key === "level" || key === "mutualConnections") &&
    got == null &&
    exp != null
  ) {
    return "ocr-gap";
  }
  return "diff";
}

async function extractFromImage(pngPath, engine) {
  assert.ok(existsSync(pngPath), `print ausente: ${pngPath}`);
  const els = await extract(
    { serial: "fixture", engine },
    { captureFrame: async () => pngPath },
  );
  assert.ok(Array.isArray(els) && els.length > 0, `extract vazio engine=${engine}`);
  return els;
}

describe("expandRapidocrText", () => {
  it("descola CamelCase / at / senior / mutual", () => {
    assert.equal(expandRapidocrText("AlexanderValleSantos"), "Alexander Valle Santos");
    assert.equal(
      expandRapidocrText("Current:CompradoratGrupoGPS"),
      "Current: Comprador at Grupo GPS",
    );
    assert.equal(
      expandRapidocrText("CompradorsenioratSolidoConstrucoes"),
      "Comprador senior at Solido Construcoes",
    );
    assert.equal(expandRapidocrText("2mutualconnections"), "2 mutual connections");
    assert.equal(
      expandRapidocrText("CoordenadordeSuprime..."),
      "Coordenador de Suprime...",
    );
    assert.equal(expandRapidocrText("Danielle Bazanelli"), "Danielle Bazanelli");
    assert.equal(
      expandRapidocrText("SabrinaPatriciadosSantos"),
      "Sabrina Patricia dos Santos",
    );
    assert.equal(
      expandRapidocrText("RafaelUdsondaSilva"),
      "Rafael Udson da Silva",
    );
  });
});

describe("linkedin-list-profiles — engines vs macos-vision gold", () => {
  for (const id of FIX_IDS) {
    const png = resolve(ROOT, `test/fixtures/linkedin-list-profiles-${id}.png`);
    const expectedPath = resolve(
      ROOT,
      `test/fixtures/linkedin-list-profiles-${id}.expected.json`,
    );

    for (const engine of ENGINES) {
      it(`fixture ${id} engine=${engine}: nomes/connection + soft fields`, async () => {
        const expected = loadJson(expectedPath);
        const ocr = await extractFromImage(png, engine);
        mkdirSync(OUT_DIR, { recursive: true });
        writeFileSync(
          resolve(OUT_DIR, `linkedin-list-profiles-${id}.${engine}.ocr.json`),
          JSON.stringify(ocr, null, 2) + "\n",
          "utf8",
        );

        const got = profilesFromExtract(ocr, { engine }).map((p) => p.fields);
        writeFileSync(
          resolve(OUT_DIR, `linkedin-list-profiles-${id}.${engine}.profiles.json`),
          JSON.stringify(got, null, 2) + "\n",
          "utf8",
        );

        console.log(`\n=== fixture ${id} engine=${engine} ===`);
        console.log(`ocrHits=${ocr.length} profiles=${got.length} expected=${expected.length}`);

        assert.equal(
          got.length,
          expected.length,
          `${engine}/${id}: qtd perfis got=${got.length} expected=${expected.length}`,
        );

        for (let i = 0; i < expected.length; i++) {
          const exp = expected[i];
          const actual = got[i];
          assert.ok(actual, `${engine}/${id}: perfil[${i}] ausente`);
          assert.equal(
            actual.name,
            exp.name,
            `${engine}/${id}: perfil[${i}].name`,
          );
          assert.equal(
            actual.connection,
            exp.connection,
            `${engine}/${id}: perfil[${i}] (${exp.name}).connection`,
          );

          for (const key of FIELD_KEYS) {
            const kind = fieldsMatchSoft(actual[key], exp[key], key);
            const line = `  [${i}] ${key}: ${kind} got=${JSON.stringify(actual[key])} exp=${JSON.stringify(exp[key])}`;
            console.log(line);
            if (key === "name" || key === "connection") {
              assert.equal(kind, "exact", line);
            } else {
              assert.ok(
                kind === "exact" || kind === "soft" || kind === "ocr-gap",
                line,
              );
            }
          }
        }
      });
    }
  }
});
