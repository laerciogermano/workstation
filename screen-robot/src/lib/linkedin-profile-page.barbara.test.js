/**
 * Dump: "Bárbara Oliveira" + slug barbaraoliveira-comprador não pode virar nome.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  nameHintFromLinkedInUrl,
  parseProfileHeader,
  stripLinkedInSlugIdFromName,
} from "./linkedin-profile-page.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BARBARA_JSON = join(
  __dirname,
  "../screenshots/login-extract-profile-detail/2026-10-23T16-55-25-077Z/card-00.json",
);

describe("barbara profile header (dump)", () => {
  it("nameHintFromLinkedInUrl tira -comprador do slug", () => {
    assert.equal(
      nameHintFromLinkedInUrl(
        "https://www.linkedin.com/in/barbaraoliveira-comprador",
      ),
      "Barbaraoliveira",
    );
    assert.equal(
      stripLinkedInSlugIdFromName("Barbaraoliveira Comprador"),
      "Barbaraoliveira",
    );
  });

  it("parse usa Bárbara Oliveira do dump, não o slug", () => {
    const els = JSON.parse(readFileSync(BARBARA_JSON, "utf8"));
    const hint = nameHintFromLinkedInUrl(
      "https://www.linkedin.com/in/barbaraoliveira-comprador",
    );
    const h = parseProfileHeader(els, { nameHint: hint });
    assert.equal(h.name, "Bárbara Oliveira");
    assert.match(h.headline || "", /Comprador/i);
    assert.match(h.company || "", /FEI/i);
    assert.match(h.location || "", /São Bernardo/);
    assert.equal(h.canConnect, true);
  });
});
