/**
 * Dump real: Activity@0 offscreen + slug id alfanumérico no hint.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { parseProfileHeaderFromUiXml } from "./linkedin-profile-from-uidump.js";
import {
  nameHintFromLinkedInUrl,
  parseProfileHeader,
  stripLinkedInSlugIdFromName,
} from "./linkedin-profile-page.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HELEN_JSON = join(
  __dirname,
  "../screenshots/login-extract-profile-detail/2026-10-23T16-51-56-703Z/card-00.json",
);

describe("helen profile header (dump)", () => {
  it("nameHintFromLinkedInUrl remove 6bb660189", () => {
    assert.equal(
      nameHintFromLinkedInUrl(
        "https://www.linkedin.com/in/helen-nogueira-6bb660189",
      ),
      "Helen Nogueira",
    );
    assert.equal(
      stripLinkedInSlugIdFromName("Helen Nogueira 6bb660189"),
      "Helen Nogueira",
    );
  });

  it("parse ignora Activity@0 e preenche nome/cargo/empresa", () => {
    const els = JSON.parse(readFileSync(HELEN_JSON, "utf8"));
    const hint = nameHintFromLinkedInUrl(
      "https://www.linkedin.com/in/helen-nogueira-6bb660189",
    );
    const h = parseProfileHeader(els, { nameHint: hint });
    assert.equal(h.name, "Helen Nogueira");
    assert.equal(h.connectionDegree, "2nd");
    assert.equal(h.headline, "Compradora");
    assert.match(h.company || "", /Elba Equipamentos/i);
    assert.ok(!/Pontif/i.test(h.company || ""));
    assert.match(h.location || "", /Belo Horizonte/);
    assert.match(h.connections || "", /500/);
    assert.match(h.mutualConnections || "", /Marcello.*mutual/i);
    assert.ok(!/aocgog/i.test(h.mutualConnections || ""));
    assert.equal(h.canConnect, true);
    assert.equal(h.canMessage, true);
  });
});
