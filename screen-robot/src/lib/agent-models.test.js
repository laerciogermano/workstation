import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AGENT_MODELS, parseModelSelection } from "./agent-models.js";
import { shouldPromptModels } from "./select-models.js";

describe("agent-models", () => {
  it("parseModelSelection: número único", () => {
    const s = parseModelSelection("1");
    assert.equal(s.length, 1);
    assert.equal(s[0].id, AGENT_MODELS[0].id);
  });

  it("parseModelSelection: vários + all", () => {
    const multi = parseModelSelection("1,3");
    assert.equal(multi.length, 2);
    assert.equal(multi[0].id, AGENT_MODELS[0].id);
    assert.equal(multi[1].id, AGENT_MODELS[2].id);
    assert.equal(parseModelSelection("a").length, AGENT_MODELS.length);
    assert.equal(parseModelSelection("all").length, AGENT_MODELS.length);
  });

  it("parseModelSelection: id direto", () => {
    const s = parseModelSelection("gemini-3.8-flash");
    assert.equal(s[0].id, "gemini-3.8-flash");
    assert.equal(s[0].provider, "gemini");
  });

  it("parseModelSelection: vazio/inválido", () => {
    assert.deepEqual(parseModelSelection(""), []);
    assert.deepEqual(parseModelSelection("99"), []);
  });
});

describe("shouldPromptModels", () => {
  it("abre menu só em TTY sem model/noPrompt", () => {
    assert.equal(shouldPromptModels({ isTTY: true }), true);
    assert.equal(shouldPromptModels({ isTTY: true, model: "x" }), false);
    assert.equal(shouldPromptModels({ isTTY: true, noPrompt: true }), false);
    assert.equal(shouldPromptModels({ isTTY: false }), false);
  });
});
