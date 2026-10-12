import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  booleanQueryForProfile,
  companyFromCurrent,
} from "./linkedin-boolean-query.js";

describe("linkedin-boolean-query", () => {
  it("monta boolean com nome e empresa do current", () => {
    assert.equal(companyFromCurrent("Comprador at Grupo GPS"), "Grupo GPS");
    assert.equal(
      booleanQueryForProfile({
        name: "Alexandre Silva",
        current: "Comprador at Grupo GPS",
      }),
      '"Alexandre Silva" AND "Grupo GPS"',
    );
  });

  it("só nome quando não há current", () => {
    assert.equal(
      booleanQueryForProfile({ name: "Nayara Alves" }),
      '"Nayara Alves"',
    );
  });
});
