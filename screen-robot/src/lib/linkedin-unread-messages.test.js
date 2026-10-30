import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  findMessagingIconInXml,
  findUnreadChipInXml,
  isSponsoredUnread,
  mergeUnreadByName,
  parseUnreadConversationDesc,
  unreadConversationsFromUiXml,
} from "./linkedin-unread-messages.js";

describe("linkedin-unread-messages", () => {
  it("isSponsoredUnread", () => {
    assert.equal(
      isSponsoredUnread({
        message: "Sponsored • Transforme a Gestão…",
      }),
      true,
    );
    assert.equal(isSponsoredUnread({ message: "Bom dia" }), false);
  });

  it("parseUnreadConversationDesc", () => {
    assert.deepEqual(
      parseUnreadConversationDesc(
        "Button, Laércio Germano, Opa, 8:49 AM, 1 unread message",
      ),
      {
        name: "Laércio Germano",
        message: "Opa",
        time: "8:49 AM",
        unreadCount: 1,
      },
    );
    assert.equal(
      parseUnreadConversationDesc(
        "Button, Marcello, You: oi, Oct 5",
      ),
      null,
    );
  });

  it("unreadConversationsFromUiXml", () => {
    const xml = `
<node content-desc="Button, Ana Silva, Bom dia, Yesterday, 2 unread messages" resource-id="com.linkedin.android:id/messaging_conversation_list_item_container" clickable="true" bounds="[0,200][540,300]" />
<node content-desc="Button, Bob, You: hi, Oct 1" resource-id="com.linkedin.android:id/messaging_conversation_list_item_container" clickable="true" bounds="[0,300][540,400]" />
`;
    const rows = unreadConversationsFromUiXml(xml);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, "Ana Silva");
    assert.equal(rows[0].message, "Bom dia");
    assert.equal(rows[0].unreadCount, 2);
    assert.equal(rows[0].time, "Yesterday");
  });

  it("findMessagingIconInXml / findUnreadChipInXml", () => {
    const xml = `
<node content-desc="messaging, 1 new notification available" resource-id="com.linkedin.android:id/home_messaging" clickable="true" bounds="[450,45][540,111]" />
<node text="Unread" resource-id="com.linkedin.android:id/messaging_filter_chip" clickable="true" bounds="[318,129][431,201]" />
`;
    assert.deepEqual(findMessagingIconInXml(xml), { x: 495, y: 78 });
    assert.deepEqual(findUnreadChipInXml(xml), { x: 374, y: 165 });
  });

  it("mergeUnreadByName", () => {
    const m = mergeUnreadByName(
      [{ name: "A", message: "1", unreadCount: 1, time: "1" }],
      [
        { name: "a", message: "dup", unreadCount: 9, time: "2" },
        { name: "B", message: "2", unreadCount: 1, time: "3" },
      ],
    );
    assert.equal(m.length, 2);
    assert.equal(m[0].message, "1");
  });
});
