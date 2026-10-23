/**
 * Activity offscreen "Parabéns! &#127881;" não pode virar o nome.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { parseProfileHeaderFromUiXml } from "./linkedin-profile-from-uidump.js";
import { parseProfileHeader } from "./linkedin-profile-page.js";
import { elementsFromUiXml } from "./ui-dump.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = join(
  __dirname,
  "../screenshots/login-extract-profiles/2026-10-23T17-14-02-189Z",
);

describe("maranei profile — ignora Parabéns Activity", () => {
  it("dump XML → name=Maranei Mara (não Parabéns)", () => {
    const xml = readFileSync(join(DIR, "profile-004-page.xml"), "utf8");
    assert.equal(
      elementsFromUiXml(xml).some((e) => /parab/i.test(e.text)),
      false,
      "nó [0,0][0,0] não entra no extract",
    );
    const { header } = parseProfileHeaderFromUiXml(xml, {
      nameHint: "Maranei Mara",
    });
    assert.equal(header.name, "Maranei Mara");
    assert.match(header.headline || "", /Compradora/i);
    assert.match(header.company || "", /SRA/i);
  });

  it("mesmo se o JSON antigo trouxer Parabéns@0,0 → ignora", () => {
    const els = JSON.parse(
      readFileSync(join(DIR, "profile-004-page.json"), "utf8"),
    );
    const h = parseProfileHeader(els, { nameHint: "Maranei Mara" });
    assert.equal(h.name, "Maranei Mara");
  });
});
