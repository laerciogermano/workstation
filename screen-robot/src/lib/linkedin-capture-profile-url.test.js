import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  isPeopleResultsScreen,
  isProfileScreen,
  isSearchComposeScreen,
} from "./linkedin-capture-profile-url.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  it("lista com Invite…connect + Skills no cargo → ainda é lista", () => {
    const e = els(
      "Filter by People",
      "Michelle Fernandes Costa Verified • 2nd",
      "Invite Michelle Fernandes Costa to connect",
      "Compradora | Category Management | Skills",
      "Thais Ricci Verified • 2nd",
      "Invite Thais Ricci to connect",
    );
    assert.equal(isProfileScreen(e), false);
    assert.equal(isPeopleResultsScreen(e), true);
  });

  it("dump real list-round-022 (Michelle) → lista", () => {
    const path = join(
      __dirname,
      "../screenshots/login-extract-profiles/2026-10-23T17-25-56-640Z/list-round-022.json",
    );
    const dump = JSON.parse(readFileSync(path, "utf8"));
    assert.equal(isPeopleResultsScreen(dump), true);
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
    assert.equal(isProfileScreen(e), true);
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
