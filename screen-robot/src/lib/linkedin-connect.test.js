import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findExactConnect,
  findMoreOverflow,
  findSkip,
  hasFollow,
  hasPending,
  normalizeLinkedInProfileUrl,
} from "./linkedin-connect.js";

describe("linkedin-connect helpers", () => {
  it("normalizeLinkedInProfileUrl", () => {
    assert.equal(
      normalizeLinkedInProfileUrl(
        "https://www.linkedin.com/in/ana-silva-123?utm=1",
      ),
      "https://www.linkedin.com/in/ana-silva-123",
    );
    assert.equal(normalizeLinkedInProfileUrl("foo"), null);
  });

  it("findExactConnect ignora connections", () => {
    assert.equal(
      findExactConnect([{ text: "500+connections", x: 10, y: 10 }]),
      null,
    );
    assert.deepEqual(
      findExactConnect([{ text: "+ Connect", x: 112, y: 562 }]),
      { text: "+ Connect", x: 112, y: 562 },
    );
  });

  it("hasPending / findSkip / hasFollow", () => {
    assert.equal(hasPending([{ text: "Pending" }]), true);
    assert.equal(hasPending([{ text: "Connect" }]), false);
    assert.deepEqual(findSkip([{ text: "Skip", x: 269, y: 816 }]), {
      text: "Skip",
      x: 269,
      y: 816,
    });
    assert.equal(hasFollow([{ text: "+ Follow" }]), true);
  });

  it("findMoreOverflow usa icon à direita de Message", () => {
    const hit = findMoreOverflow([
      { type: "text", text: "Message", x: 353, y: 653 },
      { type: "icon", x: 492, y: 652 },
    ]);
    assert.deepEqual(hit, { x: 492, y: 652, via: "icon" });
  });
});
