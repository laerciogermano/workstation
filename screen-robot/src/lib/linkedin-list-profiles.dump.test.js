/**
 * Lista People via dump (uiautomator): badge Verified + nome ALL CAPS + avatar.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanName,
  hasLinkedInMemberLimit,
  isValidProfileName,
  profilesFromExtract,
} from "./linkedin-list-profiles.js";

describe("linkedin-list-profiles dump", () => {
  it("hasLinkedInMemberLimit detecta frase e OCR partido", () => {
    assert.equal(
      hasLinkedInMemberLimit([{ text: "LinkedIn Member", x: 200, y: 300 }]),
      true,
    );
    assert.equal(
      hasLinkedInMemberLimit([
        { text: "LinkedIn", x: 200, y: 300 },
        { text: "Member", x: 280, y: 300 },
      ]),
      true,
    );
    assert.equal(
      hasLinkedInMemberLimit([{ text: "Samuel Lopes", x: 200, y: 300 }]),
      false,
    );
  });

  it("cleanName remove Verified e tipografa ALL CAPS", () => {
    assert.equal(cleanName("Quelvy Timoteo Verified • 2nd"), "Quelvy Timoteo");
    assert.equal(
      cleanName("DENISE ALVES DE OLIVEIRA • 2nd"),
      "Denise Alves de Oliveira",
    );
    assert.ok(isValidProfileName("Denise Alves de Oliveira"));
  });

  it("profilesFromExtract (dump): 1 card por pessoa, sem Verified duplicado", () => {
    const els = [
      { text: "Invite Samuel Lopes to connect", x: 444, y: 331 },
      { text: "Samuel Lopes • 2nd", x: 234, y: 310 },
      { text: "Samuel Lopes", x: 60, y: 343 },
      {
        text: "Comprador | Compras | Suprimentos |",
        x: 234,
        y: 347,
      },
      { text: "Invite Quelvy Timoteo to connect", x: 444, y: 553 },
      { text: "Quelvy Timoteo Verified • 2nd", x: 234, y: 555 },
      { text: "Quelvy Timoteo", x: 60, y: 565 },
      {
        text: "Comprador | Suprimentos | Analista de Compras",
        x: 234,
        y: 599,
      },
      { text: "Invite DENISE ALVES DE OLIVEIRA to connect", x: 444, y: 778 },
      { text: "DENISE ALVES DE OLIVEIRA • 2nd", x: 234, y: 780 },
      { text: "DENISE ALVES DE OLIVEIRA", x: 60, y: 790 },
      {
        text: "Supplay chain | Comprador | Compradora",
        x: 234,
        y: 824,
      },
    ];
    const cards = profilesFromExtract(els, { engine: "macos-vision" });
    const names = cards.map((c) => c.name);
    assert.deepEqual(names, [
      "Samuel Lopes",
      "Quelvy Timoteo",
      "Denise Alves de Oliveira",
    ]);
    assert.ok(!names.some((n) => /verified/i.test(n)));
  });
});
