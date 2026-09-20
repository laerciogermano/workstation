/**
 * Unitário — extract.js createExtract (dump stub).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createExtract } from "./extract.js";

const SAMPLE = `
<node index="0" text="" class="android.widget.FrameLayout" bounds="[0,0][1080,2400]" />
<node index="1" text="Entrar" class="android.widget.TextView" clickable="true" bounds="[100,1800][900,1900]" />
<node index="2" text="" content-desc="icon" class="android.widget.ImageButton" bounds="[10,10][80,80]" />
<node index="3" text="" class="androidx.recyclerview.widget.RecyclerView" bounds="[0,400][1080,1600]" />
<node index="4" text="" class="android.widget.ImageView" bounds="[20,420][120,520]" />
`;

describe("createExtract", () => {
  it("enriquece árvore a cada chamada", async () => {
    const extract = createExtract("s", {
      dumpUiXml: () => SAMPLE,
    });
    const t1 = await extract();
    assert.equal(t1.type, "root");
    assert.ok(t1.children.some((c) => c.type === "text" && c.text === "Entrar"));

    const t2 = await extract();
    assert.equal(t2.children[0]?.type, "other");

    const t3 = await extract();
    const flat = [];
    const walk = (n) => {
      flat.push(n.type);
      (n.children || []).forEach(walk);
    };
    walk(t3);
    assert.ok(flat.includes("icon"));

    const t4 = await extract();
    walk(t4);
    const types4 = [];
    const w4 = (n) => {
      types4.push(n.type);
      (n.children || []).forEach(w4);
    };
    w4(t4);
    assert.ok(types4.includes("list"));

    const t5 = await extract();
    const types5 = [];
    const w5 = (n) => {
      types5.push(n.type);
      (n.children || []).forEach(w5);
    };
    w5(t5);
    assert.ok(types5.includes("image"));
  });
});
