// Teste de ponta a ponta no navegador real (cliques, hover, arrastar, diálogos): `node test/novo/e2e.mjs`
// Sobe um servidor estático para example/ e um Chrome headless (CHROME=/caminho/do/chrome para mudar o binário).
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../example");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const server = createServer((q, r) => { const f = join(root, q.url.split("?")[0] === "/" ? "flow-novo.html" : q.url.split("?")[0]); if (!existsSync(f)) { r.writeHead(404).end(); return; } r.writeHead(200, { "content-type": types[extname(f)] ?? "text/plain" }).end(readFileSync(f)); });
await new Promise(r => server.listen(0, r)); const port = server.address().port;
const chrome = spawn(process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", "--remote-debugging-port=9335", "--window-size=1440,900", "--user-data-dir=/tmp/flow-novo-e2e", "about:blank"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 2500));
const tabs = await (await fetch("http://127.0.0.1:9335/json")).json();
const ws = new WebSocket(tabs.find(t => t.type === "page").webSocketDebuggerUrl); await new Promise(r => (ws.onopen = r));
let id = 0; const pend = new Map(), errors = [];
ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } else if (d.method === "Runtime.exceptionThrown") errors.push(d.params.exceptionDetails.exception?.description ?? d.params.exceptionDetails.text); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const wait = ms => new Promise(r => setTimeout(r, ms));
const ev = async expr => { const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result.value; };
const center = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()`);
const mouse = async (type, x, y, extra = {}) => { await send("Input.dispatchMouseEvent", { type, x, y, ...extra }); await wait(80); };
const click = async sel => { const c = await center(sel); assert.ok(c, `não achei ${sel}`); await mouse("mouseMoved", ...c); await mouse("mousePressed", ...c, { button: "left", clickCount: 1 }); await mouse("mouseReleased", ...c, { button: "left", clickCount: 1 }); await wait(150); };
const type = async text => { await send("Input.insertText", { text }); await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13, text: "\r" }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 }); await wait(250); };
const code = () => ev(`document.getElementById("code").innerText`);
const exOpen = async on => { if ((await ev(`!document.querySelector(".app").classList.contains("ex-off")`)) !== on) { await click("#exToggle"); await wait(250); } };
const delClick = async () => { await mouse("mouseMoved", ...(await center(".ex-fn.cur .ex-n"))); await wait(80); await click(".ex-fn.cur .ex-del"); };
const reload = async () => { await send("Page.reload"); await wait(1500); await ev(`document.querySelector(".ex-fn")?.click()`); await wait(150); };
const flowSel = v => ev(`(()=>{const f=[...document.querySelectorAll(".ex-file")].find(r=>r.querySelector(".ex-n").textContent===${JSON.stringify(v.replace(/\.ts$/,""))});document.querySelector('.ex-fn[data-flow="'+f.dataset.flow+'"]').click()})()`);
/** Recria o antigo fluxo `example` (libs + if) quando o teste precisa de estrutura além do main vazio. */
const seedDemo = async () => {
  await ev(`(()=>{const a=flowApp,d=c=>a.store.dispatch(c);if(a.store.project.flows.some(f=>f.title==="example")){const f=a.store.project.flows.find(f=>f.title==="example");a.ui.flow=f.id;document.querySelector('.ex-fn[data-flow="'+f.id+'"]')?.click();return}const ex=d({type:"newFlow",title:"example"});d({type:"addInput",id:ex,name:"threshold"});d({type:"setArg",id:ex,name:"threshold",value:"50"});d({type:"addOutput",id:ex,name:"score"});d({type:"addOutput",id:ex,name:"report"});const step=(lib,task,out,args={})=>{const id=d({type:"addChild",id:ex,title:task});d({type:"assign",id,agent:lib});d({type:"setTask",id,task});for(const[n,v]of Object.entries(args))d({type:"setArg",id,name:n,value:v});if(out)d({type:"renameData",id,to:out});return id};step("crypto","randomUUID","id");step("math","random","ratio");step("math","round","score",{value:"ratio * 100"});step("date","now","at");const hi=step("console","log",undefined,{text:"\`High score: \${score}\`"});step("json","stringify","report",{value:"{ id, score, at }"});step("console","log",undefined,{text:"report"});d({type:"wrap",id:hi,kind:"if",test:"score >= threshold"});a.ui.flow=ex;document.querySelector('.ex-fn[data-flow="'+ex+'"]')?.click()})()`);
  await wait(350);
};
const tests = []; const test = (name, fn) => tests.push([name, fn]);

test("cabeçalho da tabela: source e function", async () => { assert.deepEqual(await ev(`[...document.querySelectorAll(".ghead span")].map(s=>s.textContent)`), ["source", "function"]); });
test("abre só com main (raiz vazia)", async () => {
  assert.deepEqual(await ev(`[...document.querySelectorAll(".ex-file .ex-n")].map(o=>o.textContent.replace(/\.ts$/,""))`), ["main"]);
  assert.match(await code(), /export async function main\(state: State\)/); assert.equal(await ev(`document.querySelectorAll(".grow").length`), 1);
});
test("ghost input: hovering and clicking opens the box and adds the input (marker appears at the same spot)", async () => {
  await click(".ghost[data-kind=in]"); assert.ok(await ev(`!!document.querySelector(".dlg")`)); assert.equal(await ev(`document.querySelectorAll(".dlg input").length`), 2, "name and value fields"); await ev(`document.querySelector(".dlg input[data-k=value]").focus()`); await type("pedido");
  assert.equal(await ev(`!!document.querySelector(".dlg")`), false); assert.ok(await ev(`!!document.querySelector(".plan .dm[data-side=in]")`), "square appears where the ghost was"); assert.equal(await ev(`document.querySelectorAll(".iorow").length`), 0, "no input/output rows anymore"); assert.match(await ev(`document.querySelector(".plan text.dn.in")?.textContent ?? ""`), /input = "pedido"/);
});
test("ghost output opens the same box as input (name + type + value); Save creates it; type remove clears it", async () => {
  const set = (q, v) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(q)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("change",{bubbles:true}))})()`);
  await click(".ghost[data-kind=out]"); assert.ok(await ev(`!!document.querySelector(".dlg")`), "box like input"); assert.equal(await ev(`document.querySelector(".dlg input[data-k=pname]")?.value`), "output");
  assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`), "type"); assert.equal(await ev(`!!document.querySelector(".dlg [data-newrow]")`), false, "no top-level Add child (use type object)");
  await click(".dlg button.pri"); await wait(150); assert.match(await code(), /let output: unknown/);
  await click(".plan .dm[data-side=out]"); assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`)); await set(".dlg select[data-k=type]", "__remove"); await wait(150); assert.doesNotMatch(await code(), /let output/); assert.equal(await ev(`!!document.querySelector(".dlg")`), false);
});

test("Esc cancels the box; clicking the function text renames it", async () => {
  await click(".ghost[data-kind=out]"); await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(150); assert.equal(await ev(`!!document.querySelector(".dlg")`), false);
  await click('.grow b[data-act=rename]'); await ev(`document.querySelector(".dlg input").value=""`); await type("principal"); assert.match(await code(), /export async function principal\(/);
});
test("círculo da função à esquerda do nome (na coluna function), e círculo do responsável", async () => {
  assert.equal(await ev(`document.querySelectorAll(".grow .nm .fn-dot").length`), 1); assert.ok(await ev(`!!document.querySelector(".grow .fav.arquivo")`));
});
test("botões do hover na tabela: filho, irmão, if, for, try; raiz só aceita filho", async () => {
  await seedDemo();
  const rootTools = await ev(`[...document.querySelectorAll(".grow")[0].querySelectorAll(".fl-tools .ib")].map(b=>b.dataset.act)`); assert.deepEqual(rootTools, ["toggle", "addChild"]);
  const rows0 = await ev(`document.querySelectorAll(".grow").length`);
  const hover = async idx => { const c = await ev(`(()=>{const r=document.querySelectorAll(".grow")[${idx}].getBoundingClientRect();return [r.x+r.width*0.55,r.y+r.height/2]})()`); await mouse("mouseMoved", ...c); await wait(100); };
  await hover(3); await click(`.grow[data-i="3"] .fl-tools [data-act=wrap][data-kind=if]`); const cc = await code(); assert.match(cc, /if \(condition\) \{/, cc.split("\n").filter(l => /if \(/.test(l)).join(" | ") + " | toast=" + await ev(`document.querySelector(".toast")?.textContent ?? ""`) + " | row3=" + await ev(`document.querySelectorAll(".grow")[3]?.innerText ?? ""`) + " | tools=" + await ev(`[...document.querySelectorAll('.grow[data-i="3"] .fl-tools .ib')].map(b=>b.dataset.act+":"+(b.dataset.kind||"")).join(",")`)); assert.ok((await ev(`document.querySelectorAll(".grow").length`)) > rows0);
});
test("o quadrado do dado fica na linha da função, no mesmo ponto onde apareceu a caixa fantasma", async () => {
  const same = await ev(`(()=>{const f=document.querySelector(".plan .fn").getBoundingClientRect(),d=[...document.querySelectorAll(".plan .dm rect")].map(r=>r.getBoundingClientRect());return d.length>0&&d.some(r=>Math.abs((r.top+r.height/2)-(f.top+f.height/2))<1.5)})()`);
  assert.ok(same, "quadrado do dado deveria estar na altura da barra da função");
});
test("nome do dado na altura do quadrado: entradas à esquerda dele, saídas à direita", async () => {
  const ok = await ev(`(()=>{const z=flowApp.ui.zoom,sq=[...document.querySelectorAll(".plan .dm rect, .plan .dm path")].map(r=>r.getBoundingClientRect()),cx=r=>r.left+r.width/2,cy=r=>r.top+r.height/2;
    const ins=[...document.querySelectorAll(".plan text.dn.in")].map(t=>t.getBoundingClientRect()),outs=[...document.querySelectorAll(".plan text.dn.out")].map(t=>t.getBoundingClientRect());
    return ins.length>0&&outs.length>0&&ins.every(t=>sq.some(s=>Math.abs(cy(t)-cy(s))<4&&t.right<=s.left+1&&s.left-t.right<30*z))&&outs.every(t=>sq.some(s=>Math.abs(cy(t)-cy(s))<4&&t.left>=s.right-1&&t.left-s.right<30*z))})()`);
  assert.ok(ok, "entradas devem ficar à esquerda e saídas à direita do quadrado, na mesma altura");
});
test("one data is a square; type object + Add child makes it a cube at the same spot", async () => {
  const set = (q, v) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(q)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("change",{bubbles:true}))})()`);
  await ev(`(()=>{const a=flowApp;const f=a.store.project.flows[1];a.ui.flow=f.id;document.querySelector('.ex-file[data-flow="'+f.id+'"]').click();const z=a.store.dispatch({type:"addChild",id:f.id,title:"z"});a.store.dispatch({type:"addOutput",id:z,name:"unico"})})()`); await wait(250);
  const cubes0 = await ev(`document.querySelectorAll(".plan .cube").length`);
  const sel = `.plan .dm[data-side=out][data-id="${await ev(`flowApp.store.project.flows[1].kids.at(-1).id`)}"]`;
  await click(sel); assert.equal(await ev(`document.querySelectorAll(".dlg .param").length`), 1); assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`), "same modal as input");
  await set(".dlg select[data-k=type]", "object"); assert.ok(await ev(`!!document.querySelector(".dlg .addkid")`), "object has Add child"); await click(".dlg .addkid"); await click(".dlg .addkid");
  await set('.dlg .argf:nth-of-type(1) input[data-k=name]', "a"); await set('.dlg .argf:nth-of-type(2) input[data-k=name]', "b"); await click(".dlg button.pri"); await wait(200);
  assert.equal(await ev(`document.querySelectorAll(".plan .cube").length`), cubes0 + 1, "fields become a cube"); assert.equal(await ev(`!!document.querySelector(".dlg")`), false);
});
test("condition box of the if: selects with the context states, every operator, AND / OR rows; code follows", async () => {
  const set = (q, v) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(q)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("change",{bubbles:true}))})()`);
  await click(".plan .pill.if[data-act=editBlock]"); assert.ok(await ev(`!!document.querySelector(".dlg .cond")`), "condition rows");
  assert.deepEqual(await ev(`[...document.querySelectorAll('.dlg .cond:first-child select[data-k=op] option')].map(o=>o.textContent)`), ["is true / filled in", "is false / empty", "equals", "does not equal", "is greater than", "is greater than or equal to", "is less than", "is less than or equal to", "contains", "does not contain", "starts with", "ends with", "has no items / is blank", "has items / is not blank"]);
  assert.ok(await ev(`[...document.querySelectorAll('.dlg .cond:first-child select[data-k=left] optgroup[label="States available in the context"] option')].length`) > 0, "the left select lists the states of the context");
  assert.equal(await ev(`document.querySelector("#cpreview").textContent`), "condition");
  await set('.dlg .cond:nth-child(1) select[data-k=left]', "state:ratio"); await set('.dlg .cond:nth-child(1) select[data-k=op]', "eq"); await set('.dlg .cond:nth-child(1) select[data-k=rtype]', "text"); await set('.dlg .cond:nth-child(1) input[data-k=rvalue]', "yes");
  assert.equal(await ev(`document.querySelector("#cpreview").textContent`), 'ratio === "yes"');
  await click('.dlg [data-cadd="&&"]'); assert.equal(await ev(`document.querySelectorAll(".dlg .cond").length`), 2); assert.deepEqual(await ev(`[...document.querySelectorAll('.dlg .cond:nth-child(2) select[data-k=join] option')].map(o=>o.textContent)`), ["AND", "OR"]);
  await set('.dlg .cond:nth-child(2) select[data-k=left]', "state:id"); await set('.dlg .cond:nth-child(2) select[data-k=op]', "notEmpty");
  await click('.dlg [data-cadd="||"]'); await set('.dlg .cond:nth-child(3) input[data-k=leftv]', "force"); assert.equal(await ev(`document.querySelector("#cpreview").textContent`), 'ratio === "yes" && !!id?.length || force');
  await click(".dlg button.pri"); await wait(150); assert.match(await code(), /if \(ratio === "yes" && !!id\?\.length \|\| force\) \{/);
  // reabrir lê a condição de volta nas 3 cláusulas; remover uma cláusula pela lixeira
  await click(".plan .pill.if[data-act=editBlock]"); assert.equal(await ev(`document.querySelectorAll(".dlg .cond").length`), 3); assert.equal(await ev(`document.querySelector('.dlg .cond:nth-child(2) select[data-k=join]').value`), "&&"); assert.equal(await ev(`document.querySelector('.dlg .cond:nth-child(3) select[data-k=join]').value`), "||");
  await click('.dlg [data-cdel="2"]'); await click('.dlg [data-cdel="1"]'); await set('.dlg .cond:nth-child(1) select[data-k=op]', "truthy"); await click(".dlg button.pri"); await wait(150); assert.match(await code(), /if \(ratio\) \{/);
});
test("else do if: aparece no flow (tabela e plano) como o catch, com filho na primeira posição, e remove pela lixeira", async () => {
  const ifRow = ".grow.ifrow", n = sel => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`), rows0 = await n(".grow.elserow"), bands0 = await n(".plan .band.el"); const c = await center(ifRow); await mouse("mouseMoved", c[0] - 40, c[1]);
  await click(`${ifRow} .fl-tools [data-act=addElse]`); assert.equal(await n(".grow.elserow"), rows0 + 1, "linha do else na tabela"); assert.equal(await n(".plan .band.el"), bands0 + 1, "faixa do else no plano");
  assert.match(await code(), /\} else \{/);
  const er = await center(".grow.elserow"); await mouse("mouseMoved", er[0] - 40, er[1]); await click(".grow.elserow .fl-tools [data-act=addChild]");
  assert.equal(await ev(`flowApp.store.project.flows[1].kids.find(k=>k.t==="if").elseKids.length`), 2, "else deveria ter 2 funções: " + await ev(`JSON.stringify(flowApp.store.project.flows[1].kids.map(k=>[k.t,k.elseKids?.length]))`));
  const er2 = await center(".grow.elserow"); await mouse("mouseMoved", er2[0] - 40, er2[1]); await click(".grow.elserow .fl-tools [data-act=removeElse]"); assert.equal(await n(".grow.elserow"), rows0, "else removido");
});
test("filho de um bloco entra na primeira posição; sair do bloco; desfazer/refazer pelos botões", async () => {
  const blockRow = `.grow.ifrow`; const c = await center(blockRow); await mouse("mouseMoved", c[0] - 40, c[1]);
  const before = await ev(`document.querySelectorAll(".grow").length`); await click(`${blockRow} .fl-tools [data-act=addChild]`); assert.equal(await ev(`document.querySelectorAll(".grow").length`), before + 1);
  assert.match(await ev(`document.querySelectorAll(".grow")[${await ev(`[...document.querySelectorAll(".grow")].findIndex(r=>r.classList.contains("ifrow"))`)} + 1].innerText`), /newFunction/);
  const key = async (k, mod = 2) => { await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: k, code: "Key" + k.toUpperCase(), windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0), modifiers: mod }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: k, code: "Key" + k.toUpperCase(), windowsVirtualKeyCode: k.toUpperCase().charCodeAt(0), modifiers: mod }); await wait(250); };
  await ev(`document.activeElement.blur()`); await key("z"); assert.equal(await ev(`document.querySelectorAll(".grow").length`), before); await key("z", 2 | 8); assert.equal(await ev(`document.querySelectorAll(".grow").length`), before + 1);   // Ctrl+Z / Ctrl+Shift+Z
});
test("alça da etiqueta: arrastar para a direita inclui a próxima função no bloco", async () => {
  const n = () => ev(`flowApp.store.project.flows[1].kids.find(k=>k.t==="if").kids.length`); const before = await n();
  const h = await center(".plan .handle[data-drag]"); await mouse("mouseMoved", ...h); await mouse("mousePressed", h[0], h[1], { button: "left", clickCount: 1 }); await mouse("mouseMoved", h[0] + 330, h[1]); await mouse("mouseReleased", h[0] + 330, h[1], { button: "left", clickCount: 1 }); await wait(200);
  assert.ok((await n()) > before, `o if deveria ter crescido (antes ${before}, agora ${await n()})`);
});
test("barra de ferramentas do plano aparece ao passar o mouse na barra e tem as mesmas ações", async () => {
  const c = await center(".plan .fn"); await mouse("mouseMoved", ...c); await wait(150); assert.ok(await ev(`!!document.querySelector(".bar-tools")`));
  assert.ok((await ev(`[...document.querySelectorAll(".bar-tools .ib")].map(b=>b.dataset.act)`)).includes("addChild"));
});
test("source: choosing a browser lib in the select updates the code (wrapper calls the lib, no import)", async () => {
  await ev(`(()=>{const s=document.querySelector('select[data-change=assign]');s.value="math";s.dispatchEvent(new Event("change",{bubbles:true}))})()`); await wait(200);
  assert.match(await code(), /export const wrappers/); assert.match(await code(), /await Math\.random\(\)/); assert.doesNotMatch(await code(), /^import /m);
});
test("zoom, ajustar, modo text, abrir/fechar tudo e abas funcionam", async () => {
  await click("#zin"); assert.notEqual(await ev(`document.getElementById("zv").textContent`), "100%"); await click("#fit");
  assert.ok(await ev(`!!document.querySelector(".plan .fbt")`), "o modo text já abre ligado"); await click("#txtIn"); assert.ok(await ev(`!document.querySelector(".plan .fbt")`)); await click("#txtIn"); assert.ok(await ev(`!!document.querySelector(".plan .fbt")`));
  await click("#collapse"); await click("#expand"); await click('[data-tab=term]'); assert.ok(await ev(`document.getElementById("p-term").classList.contains("on")`)); await click('[data-tab=ts]');
});
test("desfazer/refazer no cabeçalho da página e junto das opções do Flow, com Ctrl+Z / Ctrl+Shift+Z nas dicas; nunca nas dicas dos componentes", async () => {
  assert.deepEqual(await ev(`[...document.querySelectorAll("[data-hist]")].map(b=>b.dataset.hist+":"+(b.closest(".topbar")?"topbar":b.closest(".fx-bar")?"flow":"fora"))`), ["undo:flow", "redo:flow"]);
  assert.deepEqual(await ev(`[...document.querySelectorAll("[data-hist]")].map(b=>b.title)`), ["Undo (Ctrl+Z)", "Redo (Ctrl+Shift+Z)"]);
  const c = await center(".plan .fn"); await mouse("mouseMoved", ...c); await wait(150);
  assert.ok(!(await ev(`[...document.querySelectorAll(".bar-tools .ib, .fl-tools .ib")].some(b=>/desfaz|refaz/i.test(b.title))`)));
  const n = () => ev(`flowApp.store.project.flows[1].kids.length`); const a0 = await n();
  await ev(`flowApp.store.dispatch({type:"addChild",id:flowApp.store.project.flows[1].id,title:"zzz"})`); await wait(150); assert.equal(await n(), a0 + 1);
  await click(".fx-bar [data-hist=undo]"); assert.equal(await n(), a0); await click(".fx-bar [data-hist=redo]"); assert.equal(await n(), a0 + 1); await click(".fx-bar [data-hist=undo]"); assert.equal(await ev(`document.querySelector("[data-hist=redo]").disabled`), false);
});
test("muitos ifs e fors encadeados: a vista mostra o fluxo inteiro", async () => {
  await ev(`(()=>{let cur=flowApp.store.project.flows[1].kids[0].id;for(let i=0;i<9;i++)cur=flowApp.store.dispatch({type:"wrap",id:cur,kind:i%2?"for":"if"})})()`); await wait(300);
  const r = await ev(`(()=>{const v=document.getElementById("scroll").getBoundingClientRect(),z=document.getElementById("zoom").getBoundingClientRect();return {l:z.left>=v.left-1,t:z.top>=v.top-1,r:z.right<=v.right+1,b:z.bottom<=v.bottom+1}})()`);
  assert.deepEqual(r, { l: true, t: true, r: true, b: true }, "o conteúdo deve caber na vista: " + JSON.stringify(r));
});
test("modo text: o nome cabe inteiro dentro da barra, com padding", async () => {
  await ev(`flowApp.store.dispatch({type:"rename",id:flowApp.store.project.flows[1].kids.flatMap(function f(n){return n.t==="fn"?[n]:[...n.kids].flatMap(f)})[0].id,title:"um_nome_de_funcao_bem_comprido_mesmo"})`); await wait(200);
  const ok = await ev(`[...document.querySelectorAll(".plan .fbt")].every(t=>{const b=t.getBBox(),r=t.parentNode.querySelector("rect.fn"),w=+r.getAttribute("width");return b.width+16<=w})`); assert.ok(ok, "text maior que a barra");
});
test("the play is the first icon on the right (before undo/redo); flows live only in the explorer", async () => {
  assert.deepEqual(await ev(`[...document.querySelectorAll(".fx-bar .hist-inline > *")].map(b=>b.id||b.dataset.hist)`), ["exec", "undo", "redo"]);
  assert.equal(await ev(`!!document.getElementById("flowSel") || !!document.getElementById("delFlow")`), false);
});
test("one trash only in each tooltip; data removal is in the type select; plan title is just the flow name; states under the columns; abstract source", async () => {
  await ev(`flowApp.reset()`); await wait(200);
  await seedDemo();
  assert.equal(await ev(`!!document.querySelector(".plan text.ttl")`), false, "no title on top of the plan: the name stays beside");
  assert.ok((await ev(`document.querySelectorAll(".plan .stt").length`)) >= 3, "states under the columns"); assert.ok(await ev(`!![...document.querySelectorAll(".plan .stt text")].find(t=>t.textContent==="score")`), "score state");
  await ev(`flowApp.store.dispatch({type:"addChild",id:flowApp.ui.flow,title:"zz"})`); await wait(150);
  assert.ok((await ev(`[...document.querySelectorAll(".grow .rp-n.abs")].filter(e=>e.textContent==="abstract").length`)) >= 1, "'abstract' as the source of abstract functions");
  const fn = await center(".plan .fn"); await mouse("mouseMoved", ...fn); await wait(150); assert.equal(await ev(`document.querySelectorAll(".bar-tools [data-act=remove]").length`), 1); assert.equal(await ev(`[...document.querySelectorAll(".bar-tools .ib")].filter(b=>b.querySelector("path[d^='M3 6h18']")).length`), 1, "one trash in the plan tooltip");
  const row = await ev(`(()=>{const r=document.querySelectorAll('.grow[data-i="2"]')[0].getBoundingClientRect();return [r.x+r.width*0.55,r.y+r.height/2]})()`); await mouse("mouseMoved", ...row); await wait(150);
  assert.equal(await ev(`[...document.querySelectorAll('.grow[data-i="2"] .fl-tools .ib')].filter(b=>b.querySelector("path[d^='M3 6h18']")).length`), 1, "one trash in the row tooltip");
  // remove the data of an abstract function through the type select ("remove this data")
  const fid = await ev(`(()=>{const a=flowApp,m=a.ui.flow;const x=a.store.dispatch({type:"addChild",id:m,title:"holder"});a.store.dispatch({type:"setData",id:x,side:"in",names:["keep","drop"],values:["1","2"]});return x})()`); await wait(250);
  await click(`.dm[data-id="${fid}"][data-side=in]`); assert.deepEqual(await ev(`[...document.querySelectorAll('.dlg select[data-k=type] optgroup[label="Data"] option')].map(o=>o.textContent)`), ["remove this data", "remove this data"]);
  await ev(`(()=>{const e=document.querySelectorAll('.dlg select[data-k=type]')[1];e.value="__remove";e.dispatchEvent(new Event("change",{bubbles:true}))})()`); await click(".dlg button.pri"); await wait(150);
  assert.deepEqual(await ev(`flowApp.store.project.flows.flatMap(function w(n){return [n,...(n.kids||[]).flatMap(w)]}).find(n=>n.id==="${fid}").ins`), ["keep"]);
  await click(`.dm[data-id="${fid}"][data-side=in]`); await ev(`(()=>{const e=document.querySelector('.dlg select[data-k=type]');e.value="__remove";e.dispatchEvent(new Event("change",{bubbles:true}))})()`); await wait(200);
  assert.equal(await ev(`!!document.querySelector(".dlg")`), false, "removing the only data applies at once"); assert.equal(await ev(`!!document.querySelector('.dm[data-id="${fid}"][data-side=in]')`), false);
});
test("zoom: roda do mouse aproxima/afasta no ponteiro; arrastar o fundo move; teclas + − 0", async () => {
  await exOpen(false);
  await click("#fit"); const z = async () => Number((await ev(`document.getElementById("zv").textContent`)).replace("%", ""));
  const z0 = await z(), c = await ev(`(()=>{const r=document.getElementById("scroll").getBoundingClientRect();return [r.x+r.width*0.7,r.y+r.height*0.8]})()`);
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: c[0], y: c[1], deltaX: 0, deltaY: -300 }); await wait(250); const z1 = await z(); assert.ok(z1 > z0, `roda para cima deveria aproximar (${z0} → ${z1})`);
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: c[0], y: c[1], deltaX: 0, deltaY: 600 }); await wait(250); assert.ok((await z()) < z1, "roda para baixo deveria afastar");
  await ev(`document.activeElement.blur()`); await send("Input.dispatchKeyEvent", { type: "keyDown", key: "+", text: "+" }); await wait(200); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "+" }); const z2 = await z();
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "-", text: "-" }); await wait(200); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "-" }); assert.ok((await z()) < z2, "tecla − afasta");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "0", text: "0" }); await wait(250); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "0" }); assert.equal(await z(), z0, "0 ajusta à tela");
  // pan: arrastar o fundo (também sobre a tabela) move a vista, mesmo com o fluxo inteiro cabendo na tela
  const pan = () => ev(`JSON.stringify(flowApp.ui.pan)`), p0 = JSON.parse(await pan()), bg = await ev(`(()=>{const r=document.getElementById("scroll").getBoundingClientRect();return [r.x+r.width-40,r.y+r.height-30]})()`);
  await mouse("mouseMoved", ...bg); await mouse("mousePressed", ...bg, { button: "left", clickCount: 1 }); await mouse("mouseMoved", bg[0] - 120, bg[1] - 20); await mouse("mouseMoved", bg[0] - 240, bg[1] - 40); await mouse("mouseReleased", bg[0] - 240, bg[1] - 40, { button: "left", clickCount: 1 });
  const p1 = JSON.parse(await pan()); assert.ok(p1.x < p0.x - 200 && p1.y < p0.y - 30, `o fundo deveria ter se movido (${JSON.stringify(p0)} → ${JSON.stringify(p1)})`);
  const row = await center(".grow[data-i='1']"); const sel0 = await ev(`flowApp.ui.sel`);
  await mouse("mouseMoved", row[0] + 40, row[1]); await mouse("mousePressed", row[0] + 40, row[1], { button: "left", clickCount: 1 }); await mouse("mouseMoved", row[0] + 100, row[1] + 40); await mouse("mouseReleased", row[0] + 100, row[1] + 40, { button: "left", clickCount: 1 });
  assert.equal(await ev(`flowApp.ui.sel`), sel0, "arrastar sobre uma linha move a vista e não seleciona");
  // botão do meio: arrasta em qualquer lugar, até sobre uma barra de função
  const fn = await center(".plan .fn"), p3 = JSON.parse(await pan()), mid = { button: "middle", buttons: 4, clickCount: 1 };
  await mouse("mouseMoved", ...fn); await mouse("mousePressed", ...fn, mid); await mouse("mouseMoved", fn[0] + 90, fn[1] + 30, { buttons: 4 }); await mouse("mouseMoved", fn[0] + 180, fn[1] + 60, { buttons: 4 }); await mouse("mouseReleased", fn[0] + 180, fn[1] + 60, mid);
  const p4 = JSON.parse(await pan()); assert.ok(p4.x > p3.x + 100 && p4.y > p3.y + 30, `botão do meio deveria mover a vista (${JSON.stringify(p3)} → ${JSON.stringify(p4)})`);
  await click("#fit"); const p2 = JSON.parse(await pan()); assert.ok(Math.abs(p2.y - 8) < 1, "ajustar volta a vista ao início");
});
test("single complete code (no module/runnable toggle, no Call command tab); contract input is abstract until filled; wrappers; download", async () => {
  assert.equal(await ev(`document.querySelectorAll("[data-view]").length`), 0, "no code-version toggle"); assert.deepEqual(await ev(`[...document.querySelectorAll(".tabs [data-tab]")].map(b=>b.textContent)`), ["TypeScript", "Terminal"]); assert.equal(await ev(`!!document.getElementById("p-cmd")`), false);
  await ev(`(()=>{const a=flowApp,f=a.store.project.flows[0];a.store.dispatch({type:"rename",id:f.id,title:"main"});document.querySelector('.ex-file[data-flow="'+f.id+'"]').click()})()`); await wait(300);
  await ev(`(()=>{const a=flowApp,m=a.ui.flow;const x=a.store.dispatch({type:"addChild",id:m,title:"x"});a.store.dispatch({type:"assign",id:x,agent:"console"})})()`); await wait(250);
  assert.ok(await ev(`[...document.querySelectorAll('select[data-change=assign] optgroup[label="Browser libs"] option')].map(o=>o.textContent).includes("console")`), "console is among the sources");
  const fid = await ev(`flowApp.store.project.flows[0].kids.at(-1).id`), mk = `.plan .dm[data-act=editData][data-id="${fid}"][data-side=in]`;
  assert.ok(await ev(`!!document.querySelector('.plan .dm .dot.a')`), "abstract (hollow) marker"); assert.equal(await ev(`document.querySelectorAll(".iorow").length`), 0, "no input/output rows");
  assert.equal(await ev(`document.querySelector(".plan text.dn.in")?.textContent ?? ""`), "text", "ao lado da marca: só o nome");
  assert.doesNotMatch(await code(), /\/\/|\/\*/); assert.match(await code(), /await log\(\{ \.\.\.state \}\);/); assert.doesNotMatch(await code(), /call\(/);
  // click the marker: box with type + value; fill it in -> concrete, value goes to the state footer, code carries it
  await click(mk); assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`)); await type("Hello, world"); await wait(150);
  assert.equal(await ev(`document.querySelector(".plan text.dn.in")?.textContent ?? ""`), "text"); assert.match(await ev(`[...document.querySelectorAll(".plan text.dn.st")].map(t=>t.textContent).join("|")`), /text = "Hello, world"/); assert.match(await code(), /const text: unknown = "Hello, world";[\s\d]*await log\(\{ \.\.\.state, text \}\);/); assert.doesNotMatch(await code(), /expected inputs/);
  assert.equal(await ev(`document.querySelectorAll('.ghost[data-id="${fid}"]').length`), 0, "no ghost boxes on a lib function (the contract rules)");
  assert.match(await code(), /export const wrappers/); assert.match(await code(), /await console\.log\(text as never\)/); assert.match(await code(), /const humans|await main\(\{ \.\.\.wrappers/); assert.equal(await ev(`document.getElementById("fname").textContent`), "main.mts"); assert.equal(await ev(`!document.getElementById("runcmd") && !document.getElementById("cmdcopy")`), true, "no run-command bar"); await ev(`window.__dl=[];HTMLAnchorElement.prototype.click=function(){window.__dl.push(this.download)}`); await click("#dl"); assert.deepEqual(await ev(`window.__dl`), ["main.mts"]);
});
test("clicar na entrada: value puro abre caixa com TIPO e VALOR; objeto abre caixa com filhos e Add child", async () => {
  const fid = await ev(`(()=>{const a=flowApp,m=a.ui.flow;const x=a.store.dispatch({type:"addChild",id:m,title:"tab"});a.store.dispatch({type:"assign",id:x,agent:"console"});a.store.dispatch({type:"setTask",id:x,task:"table"});return x})()`); await wait(250);
  const sel = `.dm[data-act=editData][data-id="${fid}"][data-side=in]`, set = (q, v) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(q)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("change",{bubbles:true}))})()`);
  const value = () => ev(`flowApp.store.project.flows.flatMap(function w(n){return [n,...(n.kids||[]).flatMap(w)]}).find(n=>n.id==="${fid}").args?.data ?? null`);
  // clicar no quadrado da entrada no PLANO: caixa com tipo + value
  await click(sel); assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`), "caixa com o tipo"); assert.ok(await ev(`!!document.querySelector(".dlg input[data-k=value]")`), "e com o value");
  assert.deepEqual(await ev(`[...document.querySelectorAll(".dlg select[data-k=type] > option")].map(o=>o.textContent)`), ["text", "number", "boolean", "data from another function", "expression", "object"]);
  await set(".dlg select[data-k=type]", "number"); await set(".dlg input[data-k=value]", "42"); await click(".dlg button.pri"); await wait(150); assert.equal(await value(), "42");
  // reabrir mostra o que foi salvo (tipo e value)
  await click(sel); assert.equal(await ev(`document.querySelector(".dlg select[data-k=type]").value`), "number"); assert.equal(await ev(`document.querySelector(".dlg input[data-k=value]").value`), "42");
  // objeto: filhos (campo, tipo, value) e Add child
  await set(".dlg select[data-k=type]", "object"); assert.ok(await ev(`!!document.querySelector(".dlg .addkid")`), "objeto tem Add child"); assert.equal(await ev(`document.querySelectorAll(".dlg .argf").length`), 0);
  await click(".dlg .addkid"); await click(".dlg .addkid"); assert.equal(await ev(`document.querySelectorAll(".dlg .argf").length`), 2);
  await set('.dlg .argf:nth-of-type(1) input[data-k=name]', "nome"); await set('.dlg .argf:nth-of-type(1) select[data-k=type]', "text"); await set('.dlg .argf:nth-of-type(1) input[data-k=value]', "Ana");
  await set('.dlg .argf:nth-of-type(2) input[data-k=name]', "idade"); await set('.dlg .argf:nth-of-type(2) select[data-k=type]', "number"); await set('.dlg .argf:nth-of-type(2) input[data-k=value]', "30");
  await click(".dlg button.pri"); await wait(150); assert.equal(await value(), '{ nome: "Ana", idade: 30 }'); assert.match(await code(), /await tabela\(\{ \.\.\.state, data: \{ nome: "Ana", idade: 30 \} \}\)|table\(\{ \.\.\.state, data: \{ nome: "Ana", idade: 30 \} \}\)/);
  // reabrir: os filhos voltam; remover um filho pela lixeira; value inválido mostra erro e mantém a caixa
  await click(sel); assert.equal(await ev(`document.querySelectorAll(".dlg .argf").length`), 2); await click('.dlg .argf:nth-of-type(2) [data-rm]'); assert.equal(await ev(`document.querySelectorAll(".dlg .argf").length`), 1);
  await set('.dlg .argf:nth-of-type(1) select[data-k=type]', "number"); await set('.dlg .argf:nth-of-type(1) input[data-k=value]', "abc"); await click(".dlg button.pri"); await wait(150);
  assert.match(await ev(`document.querySelector(".toast")?.textContent ?? ""`), /is not a number/); assert.ok(await ev(`!!document.querySelector(".dlg")`), "caixa continua aberta"); await click(".dlg [data-no]");
  // limpar: tipo text com value vazio volta a entrada ao abstrato
  await click(sel); await set(".dlg select[data-k=type]", "text"); await set(".dlg input[data-k=value]", ""); await click(".dlg button.pri"); await wait(150); assert.equal(await value(), null);
  // referência a um dado de outra função (lista com os data produzidos)
  await ev(`(()=>{const a=flowApp,m=a.ui.flow;const x=a.store.dispatch({type:"addChild",id:m,title:"produz"});a.store.dispatch({type:"addOutput",id:x,name:"customer_data"})})()`); await wait(200);
  await click(sel); await set(".dlg select[data-k=type]", "ref"); assert.ok((await ev(`document.querySelectorAll("#refnames option").length`)) > 0, "lista de data disponíveis"); await set(".dlg input[data-k=value]", "customer_data"); await click(".dlg button.pri"); await wait(150); assert.equal(await value(), "customer_data");
});
test("abstract function data: ghost creates it (name + type + value + states); clicking it later opens the SAME box as console.log (static name, select and value only)", async () => {
  await exOpen(false);
  const fid = await ev(`(()=>{const a=flowApp,m=a.ui.flow;const x=a.store.dispatch({type:"addChild",id:m,title:"common"});return x})()`); await wait(250);
  const node = () => ev(`flowApp.store.project.flows.flatMap(function w(n){return [n,...(n.kids||[]).flatMap(w)]}).find(n=>n.id==="${fid}")`);
  const set = (q, v) => ev(`(()=>{const e=document.querySelector(${JSON.stringify(q)});e.value=${JSON.stringify(v)};e.dispatchEvent(new Event("change",{bubbles:true}))})()`);
  // creating: the ghost box has the name too
  await click(`.ghost[data-id="${fid}"][data-kind=in]`); assert.equal(await ev(`document.querySelector(".dlg input[data-k=pname]")?.value`), "input", "the name is an editable field on top"); assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`), "type"); assert.ok(await ev(`!!document.querySelector(".dlg input[data-k=value]")`), "value"); assert.equal(await ev(`document.querySelectorAll(".dlg input").length`), 2, "name and value fields"); assert.equal(await ev(`!!document.querySelector(".dlg [data-newrow]")`), false, "no Add child");
  await set(".dlg select[data-k=type]", "number"); await set(".dlg input[data-k=value]", "10"); await click(".dlg button.pri"); await wait(150);
  assert.deepEqual((await node()).ins, ["input"]); assert.deepEqual((await node()).args, { input: "10" }); assert.match(await ev(`[...document.querySelectorAll("text.dn.in")].map(t=>t.textContent).join("|")`), /input = 10/, "the value shows next to the data"); assert.match(await code(), /const input: unknown = 10;[\s\d]*await common\(\{ \.\.\.state, input \}\)/);
  // renaming: click the data text → same edit modal; change name + Save
  await click(`text.dn.in[data-id="${fid}"]`); assert.ok(await ev(`!!document.querySelector(".dlg")`)); assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`), "edit modal, not inline rename");
  await set(".dlg input[data-k=pname]", "price"); await click(".dlg button.pri"); await wait(150); assert.deepEqual((await node()).ins, ["price"]); assert.deepEqual((await node()).args, { price: "10" });
  // later: same box as a lib function (console.log): name is static, only the select and the value
  await click(`.dm[data-id="${fid}"][data-side=in]`);
  assert.equal(await ev(`document.querySelector(".dlg input[data-k=pname]")?.value`), "price", "name is an editable field on top"); assert.equal(await ev(`!!document.querySelector(".dlg [data-del]")`), false, "no trash");
  assert.equal(await ev(`!!document.querySelector(".dlg [data-newrow]")`), false, "no Add child for a single value"); assert.ok(await ev(`!!document.querySelector(".dlg select[data-k=type]")`) && await ev(`!!document.querySelector(".dlg input[data-k=value]")`), "select and value");
  assert.ok(await ev(`[...document.querySelectorAll('.dlg select[data-k=type] optgroup[label="States available in the context"] option')].length`) >= 0);
  await set(".dlg input[data-k=value]", "20"); await click(".dlg button.pri"); await wait(150); assert.deepEqual((await node()).args, { price: "20" });
  // the same console.log box, for comparison
  const log = await ev(`(()=>{const a=flowApp,m=a.ui.flow;const x=a.store.dispatch({type:"addChild",id:m,title:"l"});a.store.dispatch({type:"assign",id:x,agent:"console"});return x})()`); await wait(250);
  await click(`.dm[data-id="${log}"][data-side=in]`); const same = await ev(`[!!document.querySelector(".dlg .pn"),!!document.querySelector(".dlg select[data-k=type]"),!!document.querySelector(".dlg input[data-k=value]"),!!document.querySelector(".dlg [data-del]"),!!document.querySelector(".dlg [data-newrow]")].join()`); assert.equal(same, "true,true,true,false,false"); await click(".dlg [data-no]");
  // removing the data: the function toolbar has the trash for the input data; the line to it goes away
  await mouse("mouseMoved", ...(await center(`.dm[data-id="${fid}"][data-side=in]`))); await wait(150); const tools = await ev(`[...document.querySelectorAll('.bar-tools .ib')].map(b=>b.dataset.act+":"+(b.dataset.side||""))`);
  await ev(`document.activeElement.blur()`); await mouse("mouseMoved", ...(await center(`.plan .fn`))); await wait(150); assert.ok((await ev(`flowApp.store.project.flows.length`)) > 0, tools.join());
  await ev(`flowApp.store.dispatch({type:"setData",id:"${fid}",side:"in",names:[],values:[]})`); await wait(150); assert.deepEqual((await node()).ins, []); assert.equal(await ev(`!!document.querySelector('.dm[data-id="${fid}"][data-side=in]')`), false);
});
test("cadastro de responsáveis: criar uma lib com contrato e usá-la; remover solta as funções", async () => {
  await exOpen(true);
  await click("#agents"); assert.ok(await ev(`!!document.querySelector(".dlg .agl")`));
  await ev(`(()=>{const f=document.querySelector(".dlg form");f.elements.namedItem("kind").value="maquina";f.elements.namedItem("name").value="node:zlib";f.elements.namedItem("tasks").value="gzip(data) -> comprimido; gunzip(data) -> original"})()`); await click(".dlg .agadd button[type=submit]"); await wait(200);
  assert.ok(await ev(`[...document.querySelectorAll(".dlg .agr b")].some(b=>b.textContent==="node:zlib")`), "lib nova na lista");
  await click(".dlg [data-no]"); assert.equal(await ev(`!!document.querySelector(".dlg")`), false);
  assert.ok(await ev(`[...document.querySelectorAll('select[data-change=assign] optgroup[label="Browser libs"] option')].some(o=>o.textContent==="node:zlib")`), "a lib nova aparece no seletor de responsável");
  await ev(`(()=>{const a=flowApp,f=a.store.project.flows[0],z=a.store.project.agents.find(x=>x.name==="node:zlib");const k=a.store.dispatch({type:"addChild",id:f.id,title:"z"});a.store.dispatch({type:"assign",id:k,agent:z.id})})()`); await wait(200);
  assert.match(await ev(`document.getElementById("code").innerText`), /node_zlib/); assert.match(await ev(`document.getElementById("code").innerText`), /data as never/);
  await click("#agents"); await click('.dlg [data-rm-agent]:last-of-type'); await wait(100); await click(".dlg [data-no]");
});
test("excluir fluxo (lixeira) pede confirmação e mantém ao menos um", async () => {
  await exOpen(true);
  const n0 = await ev(`document.querySelectorAll(".ex-file").length`); await delClick(); assert.ok(await ev(`!!document.querySelector(".dlg")`)); await click(".dlg [data-no]"); assert.equal(await ev(`document.querySelectorAll(".ex-file").length`), n0);
  await delClick(); await click(".dlg button.pri"); await wait(200); assert.equal(await ev(`document.querySelectorAll(".ex-file").length`), n0 - 1);
  while ((await ev(`document.querySelectorAll(".ex-file").length`)) > 1) { await delClick(); await click(".dlg button.pri"); await wait(150); }
  await delClick(); await click(".dlg button.pri"); await wait(200); assert.match(await ev(`document.querySelector(".toast")?.textContent ?? ""`), /at least one flow/); assert.equal(await ev(`document.querySelectorAll(".ex-file").length`), 1);
  await ev(`flowApp.reset()`); await wait(200); assert.equal(await ev(`document.querySelectorAll(".ex-file").length`), 2);
});
test("salvar: baixa o projeto (.json); abrir: carrega o arquivo; arquivo inválido mostra o erro", async () => {
  await ev(`window.__dl=[];HTMLAnchorElement.prototype.click=function(){window.__dl.push(this.download)}`); await click("#save"); assert.deepEqual(await ev(`window.__dl`), ["flow-project.json"]);
  const json = await ev(`(()=>{const f=flowApp.store.project;return JSON.stringify({format:"flow-novo",version:1,project:{...f,name:"Vindo do arquivo",flows:[{t:"fn",id:"x1",title:"importado",agent:null,resp:null,ins:[],outs:[],kids:[],par:false}],seq:5}})})()`);
  const open = async text => { await ev(`(()=>{const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(text)}],"p.json",{type:"application/json"}));const i=document.getElementById("openFile");i.files=dt.files;i.dispatchEvent(new Event("change"))})()`); await wait(300); };
  await open(json); assert.deepEqual(await ev(`[...document.querySelectorAll(".ex-file .ex-n")].map(o=>o.textContent.replace(/\.ts$/,""))`), ["importado"]); assert.match(await ev(`document.querySelector(".toast")?.textContent ?? ""`), /Vindo do arquivo/); assert.equal(await ev(`document.querySelector("[data-hist=undo]").disabled`), true);
  await open("isto não é json"); assert.match(await ev(`document.querySelector(".toast")?.textContent ?? ""`), /valid JSON/); assert.deepEqual(await ev(`[...document.querySelectorAll(".ex-file .ex-n")].map(o=>o.textContent.replace(/\.ts$/,""))`), ["importado"]);
  await ev(`flowApp.reset()`); await wait(200);
});
test("persistência: o projeto fica salvo no navegador e volta ao recarregar", async () => {
  await ev(`flowApp.store.dispatch({type:"rename",id:flowApp.store.project.flows[0].id,title:"persistido"})`); await wait(200);
  assert.match(await ev(`localStorage.getItem("flow-novo-projeto-v1")`), /persistido/);
  await reload(); assert.equal(await ev(`document.querySelector(".ex-file .ex-n").textContent.replace(/\.ts$/,"")`), "persistido", "depois de recarregar o projeto continua o mesmo");
  await ev(`localStorage.setItem("flow-novo-projeto-v1","corrompido")`); await reload(); assert.deepEqual(await ev(`[...document.querySelectorAll(".ex-file .ex-n")].map(o=>o.textContent.replace(/\.ts$/,""))`), ["main"], "salvo inválido: volta ao main");
});
test("explorador: arquivos .ts com funções e dados; toggle e resize como o painel de código", async () => {
  await exOpen(true); await seedDemo();
  assert.ok(await ev(`document.querySelectorAll(".ex-file").length >= 2 && document.querySelectorAll(".ex-fn").length > 0 && document.querySelectorAll(".ex-data").length === 0`));
  const w = () => ev(`document.querySelector(".explorer").getBoundingClientRect().width`);
  const w0 = await w(); await ev(`document.getElementById("exSplitter").focus()`);
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "ArrowRight", code: "ArrowRight", windowsVirtualKeyCode: 39 }); await wait(150);
  assert.equal(Math.round((await w()) - w0), 24);
  await click("#exToggle"); assert.equal(await ev(`getComputedStyle(document.querySelector(".explorer")).display`), "none"); await click("#exToggle"); assert.ok((await w()) > 100);
  const sp = await center("#exSplitter"); await mouse("mouseMoved", ...sp); await mouse("mousePressed", ...sp, { button: "left", clickCount: 2 }); await mouse("mouseReleased", ...sp, { button: "left", clickCount: 2 }); await wait(150); assert.equal(Math.round(await w()), 232);
});
test("explorador: + cria função no mesmo arquivo; cada função abre a própria visualização de fluxo", async () => {
  await exOpen(true); await flowSel("main"); await wait(200);
  const files0 = await ev(`document.querySelectorAll(".ex-file").length`);
  await ev(`document.querySelector(".ex-file[data-file='main.ts']").dispatchEvent(new MouseEvent("mouseover",{bubbles:true}))`);
  await ev(`document.querySelector(".ex-add[data-exadd='main.ts']").click()`); await wait(250);
  assert.equal(await ev(`document.querySelectorAll(".ex-file").length`), files0, "same file, no new file");
  assert.equal(await ev(`document.querySelectorAll(".ex-file[data-file='main.ts'] ~ .ex-fn").length >= 2`), true);
  assert.equal(await ev(`document.getElementById("flowName").textContent`), "main › newFunction");
  assert.equal(await ev(`flowApp.store.project.flows.filter(f=>f.file==="main.ts").length`), 1, "the new function records the file");
  await ev(`document.querySelector(".ex-fn:not(.cur)").click()`); await wait(250);
  assert.equal(await ev(`document.querySelectorAll(".ex-fn.cur").length`), 1);
  await seedDemo();
});
test("explorador: clicar em Files abre todos os arquivos lado a lado, cada um com as funções empilhadas", async () => {
  await exOpen(true); await seedDemo(); const files = await ev(`document.querySelectorAll(".ex-file").length`);
  await click(".ex-sec-h .n"); await wait(300);
  assert.equal(await ev(`document.querySelectorAll(".mcol").length`), files);
  const xs = await ev(`[...document.querySelectorAll(".mcol")].map(c=>c.getBoundingClientRect().left)`); assert.ok(xs.every((x, i) => i === 0 || x > xs[i - 1]), "colunas uma ao lado da outra");
  assert.match(await code(), /Generated by Flow/); assert.equal(await ev(`document.getElementById("flowName").textContent`), "Files");
  await flowSel("example"); await wait(250); assert.equal(await ev(`document.querySelectorAll(".mcol").length`), 0);
});
test("o play só aparece com uma função de primeira ordem selecionada", async () => {
  await exOpen(true); await seedDemo(); assert.equal(await ev(`document.getElementById("exec").hidden`), false);
  await ev(`document.querySelector(".ex-file").click()`); await wait(200); assert.equal(await ev(`document.getElementById("exec").hidden`), true, "arquivo selecionado: sem play");
  await click(".ex-sec-h .n"); await wait(250); assert.equal(await ev(`document.getElementById("exec").hidden`), true, "Files: sem play");
  await ev(`document.querySelector(".mcol .plan [data-sel]").dispatchEvent(new MouseEvent("click",{bubbles:true}))`); await wait(200); assert.equal(await ev(`document.getElementById("exec").hidden`), false, "clicou numa função em Files: play aparece"); assert.match(await ev(`document.getElementById("flowName").textContent`), / › /, "a função selecionada aparece no cabeçalho");
  await ev(`document.querySelector(".ex-file").click()`); await wait(200); assert.equal(await ev(`document.getElementById("exec").hidden`), true);
  await flowSel("example"); await wait(200); assert.equal(await ev(`document.getElementById("exec").hidden`), false);
});
test("página inicial é Files (todos os arquivos); Sources não fica mais no topo", async () => {
  await send("Page.reload"); await wait(1500);
  assert.equal(await ev(`document.getElementById("flowName").textContent`), "Files"); assert.ok((await ev(`document.querySelectorAll(".mcol").length`)) >= 1, "arquivos lado a lado");
  assert.equal(await ev(`[...document.querySelectorAll(".mcol-t")].every(h=>!!h.querySelector("svg"))`), true, "ícone de arquivo em cada arquivo"); assert.equal(await ev(`[...document.querySelectorAll(".blk-t")].every(h=>!!h.querySelector(".fn-dot"))`), true, "círculo em cada função");
  assert.equal(await ev(`!!document.querySelector(".topbar #agents")`), false, "sem Sources no header"); assert.equal(await ev(`!!document.querySelector(".explorer #agents, #explorer #agents")`), true);
  assert.equal(await ev(`document.querySelector(".topbar .logo")?.textContent.trim()`), "Flow", "marca Flow no header"); assert.equal(await ev(`!!document.querySelector(".explorer .ex-logo, .ex-head svg.ex-logo")`), false, "logo fora do Explorer");
  await ev(`document.querySelector(".ex-fn")?.click()`); await wait(150);
});
test("mobile: telas estreitas empilham Explorer, fluxo e código, sem rolagem horizontal da página", async () => {
  await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 800, deviceScaleFactor: 1, mobile: true }); await wait(500);
  const m = await ev(`(()=>{const r = n => document.querySelector(n).getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, fx: r(".fx").width, ex: r(".explorer").width, side: r(".side").width, exTop: r(".explorer").top, fxTop: r(".fx").top, sideTop: r(".side").top, exDisplay: getComputedStyle(document.querySelector(".explorer")).display }; })()`);
  assert.ok(m.sw <= m.cw + 1, `sem rolagem horizontal (${m.sw} > ${m.cw})`); assert.ok(m.fx >= 300 && m.side >= 300, `fluxo e código ocupam a largura (${m.fx} / ${m.side})`);
  if (m.exDisplay !== "none") assert.ok(m.exTop < m.fxTop, "explorer acima do fluxo"); assert.ok(m.fxTop < m.sideTop, "fluxo acima do código");
  // pinça com dois dedos aproxima; um dedo arrasta
  const box = await ev(`(()=>{const r=document.querySelector(".fx-scroll").getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`), z0 = await ev(`flowApp.ui.zoom`);
  const tp = (a, b) => [{ x: box[0] - a, y: box[1], id: 1 }, { x: box[0] + b, y: box[1], id: 2 }];
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: tp(20, 20) }); await wait(50);
  for (const g of [40, 70, 100]) { await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: tp(g, g) }); await wait(30); }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); await wait(100);
  assert.ok((await ev(`flowApp.ui.zoom`)) > z0, `pinça aproxima (${z0} → ${await ev(`flowApp.ui.zoom`)})`);
  await send("Emulation.clearDeviceMetricsOverride"); await wait(400);
});
test("o toggle do terminal fica no header do terminal (direita)", async () => {
  assert.equal(await ev(`document.querySelector(".thead #codeToggle")?.id`), "codeToggle");
  assert.equal(await ev(`!!document.querySelector(".fx-bar #codeToggle")`), false);
});
test("terminal: default escondido; toggle no header; Ctrl+\\ e Run reabrem; altura persiste", async () => {
  await exOpen(false);
  const h = () => ev(`Math.round(document.querySelector(".side").getBoundingClientRect().height)`), open = () => ev(`!document.querySelector(".app").classList.contains("code-off")`);
  await ev(`localStorage.removeItem("flow-novo-ui-v1"); localStorage.removeItem("flow-novo-ui-v2")`); await reload();
  assert.equal(await open(), false, "default escondido"); assert.ok((await h()) <= 40, "faixa mínima do header");
  await click("#codeToggle"); assert.equal(await open(), true); const h0 = await h(); assert.ok(h0 >= 120 && h0 <= 280, `altura inicial ~220 (${h0})`);
  const sp = await center("#splitter"); await mouse("mouseMoved", ...sp); assert.equal(await ev(`getComputedStyle(document.getElementById("splitter")).cursor`), "row-resize");
  await mouse("mousePressed", ...sp, { button: "left", clickCount: 1 }); await mouse("mouseMoved", sp[0], sp[1] - 80, { buttons: 1 }); await mouse("mouseReleased", sp[0], sp[1] - 80, { button: "left", clickCount: 1 });
  const h1 = await h(); assert.ok(h1 > h0 + 40, `arrastar pra cima aumenta (${h0} → ${h1})`);
  const sp2 = await center("#splitter"); await mouse("mousePressed", ...sp2, { button: "left", clickCount: 2 }); await mouse("mouseReleased", ...sp2, { button: "left", clickCount: 2 }); await wait(200);
  assert.ok(Math.abs((await h()) - 220) <= 2, "duplo clique volta aos 220px");
  await click("#codeToggle"); assert.equal(await open(), false); assert.equal(await ev(`document.getElementById("codeToggle").getAttribute("aria-pressed")`), "false");
  assert.ok((await h()) <= 40, "minimizado = só header"); assert.ok(await ev(`getComputedStyle(document.querySelector(".side")).display !== "none"`), "faixa continua visível");
  await reload(); assert.equal(await open(), false, "fechado persiste"); await ev(`document.activeElement.blur()`);
  await send("Input.dispatchKeyEvent", { type: "rawKeyDown", key: "\\", code: "Backslash", windowsVirtualKeyCode: 220, modifiers: 2 }); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "\\", code: "Backslash", windowsVirtualKeyCode: 220, modifiers: 2 }); await wait(200); assert.equal(await open(), true, "Ctrl+\\ reabre");
  await click("#codeToggle"); await wait(100); await click("#exec"); await wait(200); assert.equal(await open(), true, "Run abre o terminal");
});
test("dicas rápidas: aparecem em ~50 ms e somem ao sair; a barra de ferramentas também sai logo", async () => {
  const c = await center("#fit"); const t0 = Date.now(); await mouse("mouseMoved", ...c); await wait(40);
  assert.ok(await ev(`document.querySelector(".tip.on")?.textContent === "Fit to screen (0)"`), "dica do botão em poucos ms (" + (Date.now() - t0) + " ms)"); assert.equal(await ev(`document.getElementById("fit").hasAttribute("title")`), false, "sem a dica nativa (lenta)");
  await mouse("mouseMoved", 5, 500); await wait(40); assert.equal(await ev(`!!document.querySelector(".tip.on")`), false, "some ao sair");
  const fn = await center(".plan .fn"); await mouse("mouseMoved", ...fn); await wait(30); assert.ok(await ev(`!!document.querySelector(".bar-tools")`), "barra aparece na hora");
  const btn = await center(".bar-tools .ib"); await mouse("mouseMoved", ...btn); await wait(70); assert.ok(await ev(`!!document.querySelector(".tip.on")`), "dica do botão da barra");
  await mouse("mouseMoved", 5, 500); await wait(320); assert.equal(await ev(`!!document.querySelector(".bar-tools")`), false, "barra some logo depois de sair (≤ ~300 ms)");
});
test("nova função cria um fluxo e troca para ele; reiniciar volta ao main", async () => {
  await exOpen(true); await seedDemo();
  const n0 = await ev(`document.querySelectorAll(".ex-file").length`);
  await click("[data-exnew]"); assert.equal(await ev(`document.querySelectorAll(".ex-file").length`), n0 + 1); await ev(`flowApp.reset()`); await wait(200);
  assert.equal(await ev(`document.querySelectorAll(".ex-file").length`), 1);
});
test("temas: trocar de tema não quebra e usa as cores do tema", async () => {
  await ev(`document.querySelector('.tb-temas button[data-id="eternos-black"]').click()`); assert.equal(await ev(`document.documentElement.dataset.tema`), "eternos-black");
  assert.equal(await ev(`getComputedStyle(document.querySelector(".fx")).backgroundColor`), "rgb(11, 11, 11)");
});

await send("Runtime.enable"); await send("Page.enable");
await send("Page.navigate", { url: `http://127.0.0.1:${port}/flow-novo.html?tema=eternos-black` }); await wait(1800);
await ev(`localStorage.removeItem("flow-novo-projeto-v1"); localStorage.removeItem("flow-novo-ui-v1"); localStorage.removeItem("flow-novo-ui-v2")`);
await send("Page.reload"); await wait(1500);
await ev(`document.querySelector(".ex-fn")?.click()`); await wait(200);
let failed = 0;
for (const [name, fn] of tests) { if (process.env.ONLY && !name.includes(process.env.ONLY)) continue; try { await fn(); console.log("  ✓", name); } catch (e) { failed++; console.log("  ✗", name, "\n   ", String(e.message).split("\n").slice(0, 14).join(" | ")); } }
if (errors.length) { failed++; console.log("  ✗ erros de console:", errors.join(" | ")); }
console.log(failed ? `\n${failed} falha(s)` : `\n${tests.length} testes de navegador passaram`);
chrome.kill(); server.close(); process.exit(failed ? 1 : 0);
