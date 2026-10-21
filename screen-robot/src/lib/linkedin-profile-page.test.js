import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProfilePageOcr } from "./linkedin-profile-page.js";

describe("parseProfilePageOcr", () => {
  it("fatiar About / Experience / Education + url", () => {
    const els = [
      { text: "Ana Silva" },
      { text: "Compradora Sênior" },
      { text: "2nd" },
      { text: "Belo Horizonte, Brazil" },
      { text: "About" },
      { text: "Experiente em compras." },
      { text: "Experience" },
      { text: "Compradora at ACME" },
      { text: "Education" },
      { text: "UFMG" },
      { text: "Skills" },
      { text: "Procurement" },
      { text: "https://www.linkedin.com/in/ana-silva-123" },
    ];
    const p = parseProfilePageOcr(els, { nameHint: "Ana Silva" });
    assert.equal(p.headline, "Compradora Sênior");
    assert.match(p.location || "", /Belo Horizonte/);
    assert.match(p.about || "", /Experiente/);
    assert.match(p.experience || "", /ACME/);
    assert.match(p.education || "", /UFMG/);
    assert.match(p.skills || "", /Procurement/);
    assert.equal(p.connectionDegree, "2nd");
    assert.equal(p.profileUrl, "https://www.linkedin.com/in/ana-silva-123");
  });
});
