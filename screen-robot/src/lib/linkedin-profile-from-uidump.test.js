import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseProfileHeaderFromUiXml,
  profileElementsFromUiXml,
} from "./linkedin-profile-from-uidump.js";

const SAMPLE = `
<hierarchy>
  <node text="Search" bounds="[20,40][100,80]" />
  <node text="Rafaela Ferreira" resource-id="com.linkedin.android:id/profile_top_card_name" bounds="[24,220][400,260]" />
  <node text="• 2nd" bounds="[410,220][480,260]" />
  <node text="Compradora Pleno" bounds="[24,270][500,300]" />
  <node text="PanAir Engenharia" bounds="[24,305][400,335]" />
  <node text="Greater Belo Horizonte" bounds="[24,340][400,370]" />
  <node text="500+ connections" bounds="[24,380][300,410]" />
  <node content-desc="Connect" clickable="true" bounds="[40,430][200,490]" />
  <node content-desc="Message" clickable="true" bounds="[220,430][380,490]" />
</hierarchy>
`;

describe("linkedin-profile-from-uidump", () => {
  it("profileElementsFromUiXml ordena por y", () => {
    const els = profileElementsFromUiXml(SAMPLE);
    assert.ok(els.length >= 5);
    assert.equal(els[0].text, "Search");
    const name = els.find((e) => e.text === "Rafaela Ferreira");
    assert.ok(name);
    assert.equal(name.y, 240);
  });

  it("parseProfileHeaderFromUiXml preenche header", () => {
    const { header } = parseProfileHeaderFromUiXml(SAMPLE, {
      nameHint: "Rafaela Ferreira",
    });
    assert.equal(header.name, "Rafaela Ferreira");
    assert.match(String(header.headline || ""), /Compradora/i);
    assert.match(String(header.location || ""), /Belo Horizonte/i);
    assert.equal(header.canConnect, true);
    assert.equal(header.inviteStatus, "connect");
  });
});
