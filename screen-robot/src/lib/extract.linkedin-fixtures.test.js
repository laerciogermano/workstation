/**
 * Merge OCR (engine=all) nas fixtures LinkedIn existentes em test/fixtures/.
 * Piloto: People/comprador/Connect → depois tela inicial (login).
 */
import assert from "node:assert/strict";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  extractFromImage,
  extractMergedFromImage,
  findConnectHits,
} from "./extract-engines.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = resolve(ROOT, "test/fixtures");
const OUT_DIR = resolve(ROOT, "test/output");

const PEOPLE = resolve(FIXTURES, "linkedin-people-comprador-connect.png");
const TELA_INICIAL = resolve(FIXTURES, "linkedin-tela-inicial.png");

function hasText(els, re) {
  return (els || []).some((e) => re.test(String(e.text || "")));
}

function texts(els) {
  return (els || []).map((e) => String(e.text || "").trim()).filter(Boolean);
}

describe("extract LinkedIn fixtures — merge all", () => {
  it("People/comprador: merge encontra Connect + People + comprador", async () => {
    assert.ok(existsSync(PEOPLE), `falta fixture ${PEOPLE}`);

    const { elements, engines } = await extractMergedFromImage(PEOPLE, {
      onEngineError: ({ engine, error }) =>
        console.log(`WARN ${engine}: ${String(error).slice(0, 120)}`),
    });

    const okEngines = engines.filter((e) => e.ok).map((e) => e.engine);
    assert.ok(okEngines.length >= 2, `esperado ≥2 engines ok, got ${okEngines}`);

    const connects = findConnectHits(elements);
    const exact = elements.filter((e) =>
      /^connect$/i.test(String(e.text || "").trim()),
    );

    assert.ok(
      exact.length >= 1,
      `merge deve ter text===Connect (got ${exact.length}; connect-ish=${connects.length})`,
    );
    assert.ok(hasText(elements, /people/i), "esperado People no merge");
    assert.ok(hasText(elements, /comprador/i), "esperado comprador no merge");
    assert.ok(
      hasText(elements, /campinas|brazil/i),
      "esperado Campinas ou Brazil (localização nos cards)",
    );

    // coords de Connect na faixa típica do pill (lista People)
    for (const c of exact) {
      assert.ok(c.y > 180 && c.y < 900, `Connect y fora da faixa: ${c.y}`);
      assert.ok(c.x > 350, `Connect x esperado à direita: ${c.x}`);
    }

    mkdirSync(OUT_DIR, { recursive: true });
    const out = resolve(OUT_DIR, "linkedin-people-merge.json");
    writeFileSync(
      out,
      JSON.stringify(
        {
          fixture: basename(PEOPLE),
          engines,
          hits: elements.length,
          connectExact: exact,
          sample: elements.slice(0, 20),
        },
        null,
        2,
      ) + "\n",
    );
    console.log(
      `people merge hits=${elements.length} connectExact=${exact.length} ok=${okEngines.join(",")}`,
    );
  });

  it("tela inicial: merge encontra Sign in / Join (login)", async () => {
    assert.ok(existsSync(TELA_INICIAL), `falta fixture ${TELA_INICIAL}`);

    const elements = await extractFromImage(TELA_INICIAL, { engine: "all" });

    assert.ok(elements.length >= 5, `poucos hits: ${elements.length}`);
    assert.ok(
      hasText(elements, /sign\s*in|email/i),
      `esperado Sign in / Email; got=${texts(elements).slice(0, 15).join(" | ")}`,
    );
    assert.ok(
      hasText(elements, /join|linked/i),
      `esperado Join ou Linked; got=${texts(elements).slice(0, 15).join(" | ")}`,
    );

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      resolve(OUT_DIR, "linkedin-tela-inicial-merge.json"),
      JSON.stringify(
        {
          fixture: basename(TELA_INICIAL),
          hits: elements.length,
          texts: texts(elements),
        },
        null,
        2,
      ) + "\n",
    );
    console.log(`tela-inicial merge hits=${elements.length}`);
  });
});
