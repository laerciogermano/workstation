import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CONNECTION_STATUS,
  connectionStatusFromInviteStatus,
  findExactConnect,
  findMoreOverflow,
  findSkip,
  hasFollow,
  hasPageDoesNotExist,
  hasPending,
  normalizeLinkedInProfileUrl,
  syncConnectionFromInviteStatus,
} from "./linkedin-connect.js";

describe("linkedin-connect helpers", () => {
  it("connectionStatusFromInviteStatus", () => {
    assert.equal(
      connectionStatusFromInviteStatus("pending"),
      CONNECTION_STATUS.PENDING,
    );
    assert.equal(
      connectionStatusFromInviteStatus("connected"),
      CONNECTION_STATUS.CONNECTED,
    );
    assert.equal(connectionStatusFromInviteStatus("connect"), null);
    assert.equal(connectionStatusFromInviteStatus(null), null);
  });

  it("syncConnectionFromInviteStatus skip quando Connect", async () => {
    const out = await syncConnectionFromInviteStatus({
      profileUrl: "https://www.linkedin.com/in/ana",
      inviteStatus: "connect",
      baseUrl: "http://127.0.0.1:9",
    });
    assert.equal(out.notified, false);
    assert.match(String(out.reason), /sem conexão/i);
  });

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

  it("hasPageDoesNotExist (404 LinkedIn)", () => {
    assert.equal(
      hasPageDoesNotExist([
        { text: "This page doesn’t exist" },
        { text: "Please check your URL or return to LinkedIn home." },
      ]),
      true,
    );
    assert.equal(
      hasPageDoesNotExist([
        { text: "This page" },
        { text: "doesn't exist" },
      ]),
      true,
    );
    assert.equal(hasPageDoesNotExist([{ text: "Connect" }]), false);
  });

  it("findMoreOverflow usa icon à direita de Message", () => {
    const hit = findMoreOverflow([
      { type: "text", text: "Message", x: 353, y: 653 },
      { type: "icon", x: 492, y: 652 },
    ]);
    assert.deepEqual(hit, { x: 492, y: 652, via: "icon" });
  });
});
