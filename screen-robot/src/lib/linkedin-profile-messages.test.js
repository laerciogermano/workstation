import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  dedupeMessagesForDb,
  mergeMessagesChronological,
  messageKey,
  messagesFromUiXml,
  normalizeMessageBody,
  parseSenderNameLine,
} from "./linkedin-profile-messages.js";

describe("linkedin-profile-messages", () => {
  it("parseSenderNameLine", () => {
    assert.deepEqual(parseSenderNameLine("Matheus ConectMax  •  8:47 AM"), {
      sender: "Matheus ConectMax",
      time: "8:47 AM",
    });
    assert.deepEqual(parseSenderNameLine("Laércio Germano x  •  8:49 AM"), {
      sender: "Laércio Germano",
      time: "8:49 AM",
    });
  });

  it("messagesFromUiXml herda sender", () => {
    const xml = `
<node resource-id="com.linkedin.android:id/messaging_toolbar_title" text="Laércio Germano" bounds="[108,55][396,88]" />
<node resource-id="com.linkedin.android:id/sender_name" text="Matheus ConectMax • 8:47 AM" bounds="[78,300][400,330]" />
<node resource-id="com.linkedin.android:id/body" text="oi" bounds="[78,332][200,360]" />
<node resource-id="com.linkedin.android:id/sender_name" text="Laércio Germano x • 8:49 AM" bounds="[78,389][400,410]" />
<node resource-id="com.linkedin.android:id/body" text="Opa" bounds="[78,417][200,440]" />
<node resource-id="com.linkedin.android:id/body" text="Pega meu email" bounds="[78,502][400,530]" />
`;
    const { peer, messages } = messagesFromUiXml(xml);
    assert.equal(peer, "Laércio Germano");
    assert.equal(messages.length, 3);
    assert.equal(messages[0].from, "me");
    assert.equal(messages[0].message, "oi");
    assert.equal(messages[1].from, "peer");
    assert.equal(messages[2].sender, "Laércio Germano");
    assert.equal(messages[2].message, "Pega meu email");
  });

  it("mergeMessagesChronological prepende antigas", () => {
    const a = [
      { sender: "A", message: "mid", time: "2", from: "me" },
      { sender: "B", message: "new", time: "3", from: "peer" },
    ];
    const page = [
      { sender: "A", message: "old", time: "1", from: "me" },
      { sender: "A", message: "mid", time: "2", from: "me" },
      { sender: "B", message: "new", time: "3", from: "peer" },
    ];
    const m = mergeMessagesChronological(a, page);
    assert.equal(m.length, 3);
    assert.equal(m[0].message, "old");
    assert.equal(m[2].message, "new");
    assert.equal(messageKey(m[0]), "old");
  });

  it("dedupeMessagesForDb colapsa acento/unknown", () => {
    assert.equal(
      normalizeMessageBody("Bom dia Laércio"),
      normalizeMessageBody("Bom dia Laercio"),
    );
    const out = dedupeMessagesForDb([
      {
        sender: "unknown",
        message: "Bom dia Laercio, oi",
        time: null,
        from: "unknown",
      },
      {
        sender: "Matheus ConectMax",
        message: "Bom dia Laércio, oi",
        time: "8:45 AM",
        from: "me",
      },
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].from, "me");
    assert.match(out[0].message, /Laércio/);
  });
});
