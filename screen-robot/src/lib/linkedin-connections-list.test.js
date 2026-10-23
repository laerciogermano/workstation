import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  connectionsFromExtract,
  mergeConnections,
  normalizeConnectedOn,
} from "./linkedin-connections-list.js";

describe("linkedin-connections-list", () => {
  it("normalizeConnectedOn", () => {
    assert.equal(
      normalizeConnectedOn("0ctober23,2026"),
      "October 23, 2026",
    );
  });

  it("connectionsFromExtract cards", () => {
    const els = [
      { text: "Connections", y: 87 },
      { text: "260 connections", y: 165 },
      { text: "Locations", y: 251 },
      { text: "LaercioGermano", y: 319 },
      { text: "StaffFullStackSoftware", y: 350 },
      { text: "Engineering", y: 378 },
      { text: "Connectedon0ctober23,2026", y: 402 },
      { text: "Rejane Aleixo", y: 613 },
      { text: "Buyer-Brazil", y: 644 },
      { text: "Connectedon0ctober20,2026", y: 669 },
    ];
    const list = connectionsFromExtract(els);
    assert.equal(list.length, 2);
    assert.match(list[0].name, /Laercio/i);
    assert.equal(list[0].connectedOn, "October 23, 2026");
    assert.equal(list[1].name, "Rejane Aleixo");
  });

  it("mergeConnections", () => {
    const a = [{ name: "A", title: null, connectedOn: "x" }];
    const b = [
      { name: "A", title: null, connectedOn: "x" },
      { name: "B", title: "t", connectedOn: "y" },
    ];
    assert.equal(mergeConnections(a, b).length, 2);
  });
});
