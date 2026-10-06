/**
 * raw-gpt: mesmo prompt de entrada → action só { type, x, y } (sem motivo).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { compactOcr } from "./agent-decide.js";
import {
  DEFAULT_PROMPT,
  SYSTEM_PROMPT,
  buildUserText,
  decideRawAction,
  parseActionTypeXY,
} from "./raw-gpt-decide.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OCR_FIXTURE = join(
  __dirname,
  "../test/fixtures/agent-ocr-people-connect.json",
);

describe("raw-gpt-decide", () => {
  it("mesmo prompt/OCR → action { type, x, y } sem motivo", async () => {
    const ocr = compactOcr(JSON.parse(readFileSync(OCR_FIXTURE, "utf8")));
    const expectedUser = buildUserText(DEFAULT_PROMPT, ocr);

    const fetchStub = async (_url, init) => {
      const body = JSON.parse(init.body);
      assert.equal(body.response_format.type, "json_object");
      assert.equal(body.messages[0].role, "system");
      assert.equal(body.messages[0].content, SYSTEM_PROMPT);
      assert.equal(body.messages[1].role, "user");
      assert.equal(body.messages[1].content, expectedUser);
      assert.match(body.messages[1].content, /Jornada:\nNa tela People do LinkedIn/);
      assert.match(body.messages[1].content, /"text":"Connect"/);

      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  action: {
                    type: "tap",
                    x: 458,
                    y: 344,
                    direction: null,
                    text: null,
                    code: null,
                    ms: null,
                    motivo: "tocando Connect do comprador",
                  },
                }),
              },
            },
          ],
        }),
      };
    };

    const out = await decideRawAction(
      { prompt: DEFAULT_PROMPT, ocr, apiKey: "test-key" },
      { fetch: fetchStub },
    );

    assert.deepEqual(
      { type: out.type, x: out.x, y: out.y },
      { type: "tap", x: 458, y: 344 },
    );
    assert.equal("motivo" in out, false);
    assert.deepEqual(Object.keys(parseActionTypeXY(out.raw)).sort(), [
      "type",
      "x",
      "y",
    ]);
  });
});
