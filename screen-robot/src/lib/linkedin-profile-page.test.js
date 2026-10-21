import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProfilePageOcr } from "./linkedin-profile-page.js";

describe("parseProfilePageOcr", () => {
  it("cabeçalho: nome, empresas, conexões, Connect/Message", () => {
    const els = [
      { text: "Search", y: 81 },
      { text: "Aline Emanuelle Fonseca • 2nd", y: 374 },
      { text: "Rede Mater Dei", y: 416 },
      { text: "Rede Mater Dei de Saúde", y: 450 },
      { text: "Belo Horizonte, Minas Gerais, Brazil", y: 482 },
      { text: "235 connections", y: 515 },
      { text: "Marcello and Marcello are mutual", y: 550 },
      { text: "connections", y: 578 },
      { text: "&+ Connect", y: 638 },
      { text: "1 Message", y: 639 },
      { text: "Open to work", y: 715 },
      { text: "Buyer and Supply Chain Analyst roles", y: 741 },
      { text: "Activity", y: 870 },
    ];
    const p = parseProfilePageOcr(els, { nameHint: "Aline Emanuelle" });
    assert.equal(p.name, "Aline Emanuelle Fonseca");
    assert.equal(p.connectionDegree, "2nd");
    assert.equal(p.company, "Rede Mater Dei\nRede Mater Dei de Saúde");
    assert.match(p.location || "", /Belo Horizonte/);
    assert.equal(p.connections, "235 connections");
    assert.match(p.mutualConnections || "", /Marcello.*mutual/i);
    assert.equal(p.canConnect, true);
    assert.equal(p.canMessage, true);
  });

  it("fatiar About / Experience / Education + url", () => {
    const els = [
      { text: "Ana Silva • 2nd", y: 100 },
      { text: "ACME", y: 140 },
      { text: "ACME Indústria", y: 170 },
      { text: "Belo Horizonte, Brazil", y: 200 },
      { text: "About", y: 300 },
      { text: "Experiente em compras.", y: 330 },
      { text: "Experience", y: 400 },
      { text: "Compradora Sênior", y: 430 },
      { text: "ACME", y: 450 },
      { text: "Jan 2020 - Present", y: 470 },
      { text: "Education", y: 500 },
      { text: "UFMG", y: 530 },
      { text: "Skills", y: 560 },
      { text: "Procurement", y: 590 },
      { text: "https://www.linkedin.com/in/ana-silva-123", y: 620 },
    ];
    const p = parseProfilePageOcr(els, { nameHint: "Ana Silva" });
    assert.equal(p.name, "Ana Silva");
    assert.equal(p.company, "ACME\nACME Indústria");
    assert.match(p.location || "", /Belo Horizonte/);
    assert.match(p.about || "", /Experiente/);
    assert.match(p.experience || "", /Compradora Sênior/);
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
