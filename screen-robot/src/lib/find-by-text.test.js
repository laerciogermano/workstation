/**
 * Unitário — findByText / matchByText (US-23 / SC-29).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findByText, matchByText } from "./extract.js";

const SIGN_IN_SPLIT = [
  { type: "text", text: "Sign", bounds: { x: 236, y: 815, w: 75, h: 37 } },
  { type: "text", text: "in", bounds: { x: 326, y: 815, w: 27, h: 29 } },
  { type: "text", text: "with", bounds: { x: 366, y: 814, w: 72, h: 30 } },
  { type: "text", text: "Email", bounds: { x: 453, y: 814, w: 94, h: 30 } },
  { type: "text", text: "Join", bounds: { x: 86, y: 480, w: 71, h: 29 } },
];

describe("matchByText", () => {
  it("une palavras OCR vizinhas com score elevado (Sign in with Email)", () => {
    const hit = matchByText(SIGN_IN_SPLIT, "Sign in with Email", {
      minScore: 0.8,
    });
    assert.ok(hit);
    assert.equal(hit.elements.length, 4);
    assert.ok(hit.score >= 0.8);
    assert.match(hit.text, /sign in with email/);
    assert.ok(hit.center[0] > 236 && hit.center[0] < 547);
    assert.ok(Math.abs(hit.center[1] - 830) < 40);
  });

  it("match em um único elemento", () => {
    const hit = matchByText(
      [{ type: "text", text: "Entrar", bounds: { x: 10, y: 10, w: 100, h: 40 } }],
      "Entrar",
      { minScore: 0.9 },
    );
    assert.ok(hit);
    assert.equal(hit.elements.length, 1);
    assert.equal(hit.score, 1);
  });

  it("retorna null abaixo do limiar", () => {
    const hit = matchByText(SIGN_IN_SPLIT, "Completely unrelated phrase", {
      minScore: 0.9,
    });
    assert.equal(hit, null);
  });

  it("não escolhe substring curta (ex. with) no lugar da frase", () => {
    const hit = matchByText(SIGN_IN_SPLIT, "Sign in with Email", {
      minScore: 0.75,
    });
    assert.ok(hit);
    assert.ok(hit.elements.length >= 3);
    assert.ok(!/^(with|in|sign|email)$/i.test(hit.text));
  });

  it("aceita lista plana de elementos", () => {
    const list = SIGN_IN_SPLIT.map((e) => ({ ...e }));
    const hit = matchByText(list, "Sign in with Email", { minScore: 0.8 });
    assert.ok(hit);
    assert.equal(hit.elements.length, 4);
  });
});

describe("findByText", () => {
  it("encapsula extractElements (não recebe lista)", async () => {
    let called = false;
    const hit = await findByText("s", "Sign in with Email", {
      minScore: 0.8,
      extractElements: async () => {
        called = true;
        return { elements: SIGN_IN_SPLIT, framePath: "/tmp/x.png" };
      },
    });
    assert.equal(called, true);
    assert.ok(hit);
    assert.equal(hit.elements.length, 4);
    assert.match(hit.text, /sign in with email/);
  });
});
