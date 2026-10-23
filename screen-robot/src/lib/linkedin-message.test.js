import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  escapeMessageForAdb,
  findHeaderMessage,
  findSendMessageInSheet,
  findWriteAMessage,
  isMessageFieldEmpty,
} from "./linkedin-message.js";

describe("linkedin-message helpers", () => {
  it("findHeaderMessage", () => {
    assert.deepEqual(
      findHeaderMessage([{ text: "Message", x: 255, y: 602 }]),
      { text: "Message", x: 255, y: 602 },
    );
    assert.equal(
      findHeaderMessage([{ text: "Send profile in a message", x: 100, y: 400 }]),
      null,
    );
  });

  it("findWriteAMessage", () => {
    assert.ok(
      findWriteAMessage([{ text: "Write a message...", x: 186, y: 459 }]),
    );
    assert.ok(
      findWriteAMessage([{ text: "Writeamessage...", x: 186, y: 836 }]),
    );
  });

  it("findSendMessageInSheet", () => {
    assert.ok(
      findSendMessageInSheet([{ text: "Send a message", x: 100, y: 400 }]),
    );
  });

  it("escapeMessageForAdb não usa %2C", () => {
    const e = escapeMessageForAdb("Bom dia Laércio, tudo bem?");
    assert.equal(e.includes("%2C"), false);
    assert.equal(e.includes(","), true);
    assert.match(e, /Bom%s/);
    assert.match(e, /Laércio/);
  });

  it("isMessageFieldEmpty", () => {
    assert.equal(
      isMessageFieldEmpty([{ text: "Write a message...", y: 836 }]),
      true,
    );
    assert.equal(
      isMessageFieldEmpty([{ text: "Bom dia Laércio", y: 800 }]),
      false,
    );
  });
});
