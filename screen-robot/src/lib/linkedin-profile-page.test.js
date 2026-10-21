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

  it("Experience completo até Interests — sem More profiles / chrome / dups", () => {
    const els = [
      { text: "Experience" },
      { text: "Comprador" },
      { text: "Rede Mater Dei de Saúde" },
      { text: "Oct 2024 - Present • 2 yrs 1 mo" },
      { text: "Search" },
      { text: "Comprador" },
      { text: "Rede Mater Dei de Saúde" },
      { text: "Oct 2024 - Present • 2 yrs 1 mo" },
      { text: "Comprador" },
      { text: "Instituto Mario Penna" },
      { text: "Jan 2022 - Oct 2024 • 2 yrs 10 mos" },
      { text: "Comprador" },
      { text: "Qualis Soluções para Saúde" },
      { text: "Oct 2021 - Jan 2022 • 4 mos" },
      { text: "Compradora" },
      { text: "Fundação Hospitalar São francisco de" },
      { text: "Assis" },
      { text: "Sep 2017 - Sep 2021 • 4 yrs 1 mo" },
      { text: "Interests" },
      { text: "More profiles for you" },
      { text: "Comprador Pleno da empresa Civilnobre" },
    ];
    const p = parseProfilePageOcr(els);
    assert.match(p.experience || "", /Rede Mater Dei/);
    assert.match(p.experience || "", /Instituto Mario Penna/);
    assert.match(p.experience || "", /Qualis/);
    assert.match(p.experience || "", /Fundação Hospitalar/);
    assert.match(p.experience || "", /Assis/);
    assert.doesNotMatch(p.experience || "", /Civilnobre/);
    assert.doesNotMatch(p.experience || "", /Search/);
    assert.match(p.experience || "", /Oct 2024 - Present/);
    assert.match(p.experience || "", /Sep 2017 - Sep 2021/);
    // 1º cargo não duplicado pelo overlap de scroll
    assert.equal(
      (p.experience.match(/Oct 2024 - Present/g) || []).length,
      1,
    );
  });
});
