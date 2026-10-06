/**
 * extract OCR na fixture People/comprador (print com pills + Connect).
 * Imprime no console e grava em test/output/.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { extract } from "./extract.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE = resolve(ROOT, "test/fixtures/linkedin-people-comprador-connect.png");
const OUT_DIR = resolve(ROOT, "test/output");
const OUT_JSON = resolve(OUT_DIR, "linkedin-people-comprador-connect.ocr.json");
const OUT_TXT = resolve(OUT_DIR, "linkedin-people-comprador-connect.ocr.txt");

describe("extract — fixture People comprador", () => {
  it("OCR da fixture, print no console e salva em test/output", async () => {
    const els = await extract(
      { serial: "fixture" },
      { captureFrame: async () => FIXTURE },
    );

    assert.ok(Array.isArray(els), "extract deve devolver array");
    assert.ok(els.length > 0, "OCR não pode ser vazio");
    const texts = els.filter((e) => e.type === "text");
    const icons = els.filter((e) => e.type === "icon");
    assert.ok(els.every((e) => e.type === "text" || e.type === "icon"));
    assert.ok(texts.every((e) => typeof e.text === "string"));
    assert.ok(els.every((e) => typeof e.x === "number" && typeof e.y === "number"));
    assert.ok(icons.length >= 1, "fixture deve ter ao menos 1 ícone");
    assert.ok(icons.every((e) => e.text === undefined));

    const payload = els.map((e) =>
      e.type === "icon"
        ? { type: "icon", x: e.x, y: e.y }
        : { type: "text", text: e.text, x: e.x, y: e.y },
    );
    const lines = els.map((e) =>
      e.type === "icon"
        ? `icon @${e.x},${e.y}`
        : `${JSON.stringify(e.text)} @${e.x},${e.y}`,
    );
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2) + "\n", "utf8");
    writeFileSync(OUT_TXT, [`hits=${els.length}`, ...lines, ""].join("\n"), "utf8");

    console.log("\n=== OCR extract (fixture people-comprador-connect) ===");
    console.log(`hits=${els.length}`);
    for (const line of lines) console.log(line);
    console.log(`saved=${OUT_JSON}`);
    console.log(`saved=${OUT_TXT}`);
    console.log("=== fim OCR ===\n");

    assert.ok(
      texts.some((e) => /comprador/i.test(String(e.text || ""))),
      "esperado token comprador na fixture",
    );
  });
});
