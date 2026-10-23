import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { elementsFromUiXml, findByTextInUiDump } from "./ui-dump.js";

const SAMPLE = `
<hierarchy>
  <node text="Search" bounds="[20,40][100,80]" />
  <node text="Show all" bounds="[40,900][200,940]" />
  <node content-desc="Connect" bounds="[40,430][200,490]" />
</hierarchy>
`;

describe("ui-dump", () => {
  it("elementsFromUiXml", () => {
    const els = elementsFromUiXml(SAMPLE);
    assert.ok(els.length >= 3);
    assert.equal(els.find((e) => e.text === "Show all")?.y, 920);
  });

  it("findByTextInUiDump", () => {
    const hit = findByTextInUiDump(SAMPLE, ["Show all results", "Show all"], {
      minScore: 0.7,
    });
    assert.ok(hit);
    assert.equal(hit.source, "dump");
    assert.equal(hit.x, 120);
    assert.equal(hit.y, 920);
  });
});
