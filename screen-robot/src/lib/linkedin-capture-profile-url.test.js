import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  isPeopleResultsScreen,
  isSearchComposeScreen,
} from "./linkedin-capture-profile-url.js";

function els(...texts) {
  return texts.map((text, i) => ({ text, x: 100, y: 200 + i * 40 }));
}

describe("leaveProfile screen classifiers", () => {
  it("lista People (vários Connect/Pending + 2nd) → true", () => {
    const e = els(
      "People",
      "Quelvy Timoteo",
      "2nd",
      "Pending",
      "Denise Alves de Oliveira",
      "2nd",
      "Connect",
      "Comprador",
    );
    assert.equal(isSearchComposeScreen(e), false);
    assert.equal(isPeopleResultsScreen(e), true);
  });

  it("perfil aberto (1 Connect + About) → não é lista", () => {
    const e = els(
      "DENISE ALVES DE OLIVEIRA",
      "2nd",
      "Message",
      "Connect",
      "About",
      "Activity",
      "500+ connections",
      "Americana, São Paulo, Brazil",
    );
    assert.equal(isPeopleResultsScreen(e), false);
  });

  it("busca comprador (Show all / Recent) → compose, não lista", () => {
    const show = els("Search", "comprador", "Show all results", "People");
    assert.equal(isSearchComposeScreen(show), true);
    assert.equal(isPeopleResultsScreen(show), false);

    const recent = els("Search", "Recent", "Clear all", "comprador");
    assert.equal(isSearchComposeScreen(recent), true);
    assert.equal(isPeopleResultsScreen(recent), false);
  });

  it('"Search" sozinho não conta como lista nem compose', () => {
    const e = els("Search", "Home", "My Network");
    assert.equal(isSearchComposeScreen(e), false);
    assert.equal(isPeopleResultsScreen(e), false);
  });
});
