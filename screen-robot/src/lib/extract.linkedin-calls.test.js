/**
 * Matriz extractFromImage × engine × icons na fixture LinkedIn People.
 * Grava tempo + resposta + imagem em test/output/linkedin-people-extract-calls.{json,md}
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { extractFromImage } from "./extract-engines.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE = resolve(ROOT, "test/fixtures/linkedin-people-comprador-connect.png");
const OUT_DIR = resolve(ROOT, "test/output");
const OUT_JSON = resolve(OUT_DIR, "linkedin-people-extract-calls.json");
const OUT_MD = resolve(OUT_DIR, "linkedin-people-extract-calls.md");

const ENGINES = [
  "tesseract",
  "macos-vision",
  "rapidocr",
  "paddleocr",
  "easyocr",
  "all",
];

function relFromRepo(p) {
  return relative(resolve(ROOT, ".."), p).replaceAll("\\", "/");
}

function counts(result) {
  const list = Array.isArray(result) ? result : [];
  return {
    hits: list.length,
    texts: list.filter((e) => e.type === "text").length,
    icons: list.filter((e) => e.type === "icon").length,
  };
}

function renderMd(rows) {
  const img = relFromRepo(IMAGE);
  const imgRel = "../fixtures/linkedin-people-comprador-connect.png";
  const lines = [
    "# Extract LinkedIn — chamadas (engine × icons)",
    "",
    `Imagem de entrada: [\`${img}\`](${imgRel})`,
    "",
    `![entrada](${imgRel})`,
    "",
    "Gerado pelo teste `lib/extract.linkedin-calls.test.js`.",
    "",
    "| chamada | engine | icons | ms | ok | texts | icons | erro |",
    "|---------|--------|-------|----|----|-------|-------|------|",
  ];
  for (const r of rows) {
    const c = counts(r.result);
    const err = r.error ? String(r.error).replace(/\|/g, "\\|").slice(0, 80) : "";
    lines.push(
      `| \`${r.call}\` | ${r.engine} | ${r.icons} | ${r.ms} | ${r.ok} | ${c.texts} | ${c.icons} | ${err} |`,
    );
  }
  for (const r of rows) {
    const c = counts(r.result);
    lines.push(
      "",
      `## ${r.call}`,
      "",
      `- imagem: \`${img}\``,
      `- engine: \`${r.engine}\``,
      `- icons: \`${r.icons}\``,
      `- duração: **${r.ms} ms**`,
      `- ok: ${r.ok}`,
      `- hits: ${c.hits} (texts=${c.texts}, icons=${c.icons})`,
    );
    if (r.error) {
      lines.push(`- erro: \`${r.error.slice(0, 400)}\``);
    }
    lines.push("", "```json", JSON.stringify(r.result ?? [], null, 2), "```", "");
  }
  return lines.join("\n");
}

describe("extract LinkedIn — engine × icons", () => {
  it("roda cada engine com icons true e false e grava o relatório", async () => {
    assert.ok(existsSync(IMAGE), `falta fixture ${IMAGE}`);
    const image = relFromRepo(IMAGE);
    /** @type {object[]} */
    const rows = [];

    for (const engine of ENGINES) {
      for (const icons of [false, true]) {
        const call = `extractFromImage({ engine: "${engine}", icons: ${icons} })`;
        const t0 = Date.now();
        /** @type {object} */
        const row = {
          call,
          engine,
          icons,
          image,
          ms: 0,
          ok: false,
          error: null,
          result: [],
        };
        try {
          const result = await extractFromImage(IMAGE, {
            engine,
            icons,
            timeoutMs: 180000,
          });
          row.ms = Date.now() - t0;
          row.result = result;
          row.ok = true;
          assert.ok(Array.isArray(result), `${call} deve devolver array`);
          if (!icons) {
            assert.equal(
              result.filter((e) => e.type === "icon").length,
              0,
              `${call} não pode ter icon`,
            );
          } else if (result.some((e) => e.type === "text")) {
            assert.ok(
              result.some((e) => e.type === "icon"),
              `${call} deve ter ao menos 1 icon`,
            );
          }
        } catch (e) {
          row.ms = Date.now() - t0;
          row.error = String(e.message || e);
          const unavailable = /OCR_ENGINE_UNAVAILABLE|EXTRACT_OCR_FAILED|OCR_ENGINE_UNKNOWN/.test(
            row.error,
          );
          if (!unavailable) throw e;
        }
        rows.push(row);
        const c = counts(row.result);
        console.log(
          `${call} ${row.ms}ms ok=${row.ok} texts=${c.texts} icons=${c.icons}` +
            (row.error ? ` err=${row.error.slice(0, 80)}` : ""),
        );
      }
    }

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      OUT_JSON,
      JSON.stringify({ image, generatedAt: new Date().toISOString(), rows }, null, 2) +
        "\n",
      "utf8",
    );
    writeFileSync(OUT_MD, renderMd(rows), "utf8");
    console.log(`saved=${OUT_JSON}`);
    console.log(`saved=${OUT_MD}`);

    const tessOff = rows.find((r) => r.engine === "tesseract" && r.icons === false);
    const tessOn = rows.find((r) => r.engine === "tesseract" && r.icons === true);
    assert.ok(tessOff?.ok, "tesseract icons=false deve ok");
    assert.ok(tessOn?.ok, "tesseract icons=true deve ok");
  }, { timeout: 900_000 });
});
