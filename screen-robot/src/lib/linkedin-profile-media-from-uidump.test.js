import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseProfileMediaBoundsFromUiXml } from "./linkedin-profile-media-from-uidump.js";
import { parseProfileHeaderFromUiXml } from "./linkedin-profile-from-uidump.js";

const JOSIMARI = `
<hierarchy bounds="[0,0][540,960]">
  <node content-desc="Cover photo" bounds="[0,117][540,252]" />
  <node content-desc="Profile photo" bounds="[24,180][180,336]" />
  <node content-desc="Josimari is a Premium member" bounds="[24,280][200,320]" />
  <node content-desc="Manage notifications about Josimari Bromatti" bounds="[400,280][520,320]" />
  <node content-desc="View Josimari’s verifications" bounds="[24,340][400,370]" />
  <node text="Josimari Bromatti" bounds="[24,360][300,390]" />
  <node text="· 2nd" bounds="[310,360][380,390]" />
  <node text="Compradora Técnica Sênior | Especialista de Compras Indiretas e Técnicas | Strategic Sourcing, Contratos e Negociação | CAPEX, OPEX e MRO | Indústria e Energia | SAP e Ariba" bounds="[24,450][520,520]" />
  <node text="São Bernardo do Campo, São Paulo, Brazil" bounds="[24,540][500,570]" />
  <node text="500+" bounds="[24,580][80,610]" />
  <node text="connections" bounds="[90,580][220,610]" />
  <node text="Kleber Danilo, Murilo and 2 other mutual connections" bounds="[24,630][500,660]" />
  <node content-desc="Invite Josimari Bromatti to connect" bounds="[40,700][200,760]" />
  <node text="Message" bounds="[220,700][380,760]" />
  <node text="About" bounds="[24,800][100,830]" />
</hierarchy>
`;

describe("linkedin-profile-media-from-uidump", () => {
  it("parseProfileMediaBoundsFromUiXml Cover + Profile photo", () => {
    const m = parseProfileMediaBoundsFromUiXml(JOSIMARI);
    assert.deepEqual(m.cover, {
      left: 0,
      top: 117,
      width: 540,
      height: 135,
    });
    assert.deepEqual(m.photo, {
      left: 24,
      top: 180,
      width: 156,
      height: 156,
    });
    assert.equal(m.dumpSize?.width, 540);
  });
});

describe("parseProfileHeaderFromUiXml Josimari", () => {
  it("ignora Premium/notifications e pega nome + cargo", () => {
    const { header } = parseProfileHeaderFromUiXml(JOSIMARI, {
      nameHint: "Josimari Bromatti",
    });
    assert.equal(header.name, "Josimari Bromatti");
    assert.match(String(header.headline || ""), /Compradora Técnica/i);
    assert.notEqual(header.company, "Josimari Bromatti");
    assert.match(String(header.location || ""), /São Bernardo/);
    assert.equal(header.connectionDegree, "2nd");
    assert.equal(header.canConnect, true);
    assert.match(String(header.connections || ""), /500/);
  });
});
