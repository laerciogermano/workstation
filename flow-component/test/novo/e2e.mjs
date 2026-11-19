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
const flowSel = v => ev(`(()=>{const s=document.getElementById("flowSel");s.value=[...s.options].find(o=>o.textContent==="${v}").value;s.dispatchEvent(new Event("change",{bubbles:true}))})()`);
const tests = []; const test = (name, fn) => tests.push([name, fn]);

test("abre com main (só a raiz) e fazer_onboarding; seletor lista os dois", async () => {
  assert.deepEqual(await ev(`[...document.querySelectorAll("#flowSel option")].map(o=>o.textContent)`), ["main", "fazer_onboarding"]);
  assert.match(await code(), /export async function main\(state: State\)/); assert.equal(await ev(`document.querySelectorAll(".grow").length`), 1);
});
test("fantasma de entrada: passar o mouse e clicar abre a caixa e adiciona a entrada", async () => {
  await click(".ghost[data-kind=in]"); assert.ok(await ev(`!!document.querySelector(".dlg")`)); await type("pedido");
  assert.equal(await ev(`!!document.querySelector(".dlg")`), false); assert.match(await ev(`document.querySelector(".iorow")?.innerText ?? ""`), /pedido/);
});
test("fantasma de saída adiciona a saída; remover pelo × tira o dado", async () => {
  await click(".ghost[data-kind=out]"); await type("resultado"); assert.match(await code(), /let resultado: unknown/);
  await ev(`document.querySelector('[data-act=rmIo][data-name=resultado]').style.opacity=1`); const cc = await center("[data-act=rmIo][data-name=resultado]"); await click("[data-act=rmIo][data-name=resultado]"); assert.doesNotMatch(await code(), /resultado/, JSON.stringify(cc) + " " + await ev(`document.elementFromPoint(${cc[0]},${cc[1]}).outerHTML.slice(0,120)`));
});
test("Esc cancela a caixa; clicar no texto da task renomeia", async () => {
  await click(".ghost[data-kind=out]"); await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(150); assert.equal(await ev(`!!document.querySelector(".dlg")`), false);
  await click('.grow b[data-act=rename]'); await ev(`document.querySelector(".dlg input").value=""`); await type("principal"); assert.match(await code(), /export async function principal\(/);
});
test("círculo da função à esquerda do nome (na coluna Task), e círculo do responsável", async () => {
  assert.equal(await ev(`document.querySelectorAll(".grow .nm .fn-dot").length`), 1); assert.ok(await ev(`!!document.querySelector(".grow .fav.arquivo")`));
});
test("botões do hover na tabela: filho, irmão, if, for, try; raiz só aceita filho", async () => {
  await flowSel("fazer_onboarding"); await wait(200);
  const rootTools = await ev(`[...document.querySelectorAll(".grow")[0].querySelectorAll(".fl-tools .ib")].map(b=>b.dataset.act)`); assert.deepEqual(rootTools, ["toggle", "addChild"]);
  const rows0 = await ev(`document.querySelectorAll(".grow").length`);
  const hover = async idx => { const c = await ev(`(()=>{const r=document.querySelectorAll(".grow")[${idx}].getBoundingClientRect();return [r.x+60,r.y+r.height/2]})()`); await mouse("mouseMoved", ...c); };
  await hover(3); await click(`.grow[data-i="3"] .fl-tools [data-act=wrap][data-kind=if]`); assert.match(await code(), /if \(condicao\) \{/);
  assert.ok((await ev(`document.querySelectorAll(".grow").length`)) > rows0);
});
test("clicar na etiqueta do if edita a condição; o código acompanha", async () => {
  await click(".plan .pill.if[data-act=editBlock]"); await ev(`document.querySelector(".dlg input").value=""`); await type("estoque_ok"); await ev(`document.querySelector(".dlg input").value=""`); await type("");
  assert.match(await code(), /if \(estoque_ok\) \{/);
});
test("filho de um bloco entra na primeira posição; sair do bloco; desfazer/refazer pelos botões", async () => {
  const blockRow = `.grow.ifrow`; const c = await center(blockRow); await mouse("mouseMoved", c[0] - 40, c[1]);
  const before = await ev(`document.querySelectorAll(".grow").length`); await click(`${blockRow} .fl-tools [data-act=addChild]`); assert.equal(await ev(`document.querySelectorAll(".grow").length`), before + 1);
  assert.match(await ev(`document.querySelectorAll(".grow")[${await ev(`[...document.querySelectorAll(".grow")].findIndex(r=>r.classList.contains("ifrow"))`)} + 1].innerText`), /Fazer nova função/);
  await click("#undo"); assert.equal(await ev(`document.querySelectorAll(".grow").length`), before); await click("#redo"); assert.equal(await ev(`document.querySelectorAll(".grow").length`), before + 1);
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
test("responsável: trocar pelo seletor atualiza o código (lib concreta vira import)", async () => {
  await ev(`(()=>{const s=document.querySelector('select[data-change=assign]');s.value="fs";s.dispatchEvent(new Event("change",{bubbles:true}))})()`); await wait(200); assert.match(await code(), /import \* as node_fs from "node:fs"/);
});
test("zoom, ajustar, modo texto, abrir/fechar tudo e abas funcionam", async () => {
  await click("#zin"); assert.notEqual(await ev(`document.getElementById("zv").textContent`), "100%"); await click("#fit");
  await click("#txtIn"); assert.ok(await ev(`!!document.querySelector(".plan .fbt")`)); await click("#txtIn");
  await click("#collapse"); await click("#expand"); await click('[data-tab=cmd]'); assert.ok(await ev(`document.getElementById("p-cmd").classList.contains("on")`)); await click('[data-tab=ts]');
});
test("zoom: roda do mouse aproxima/afasta no ponteiro; arrastar o fundo move; teclas + − 0", async () => {
  await click("#fit"); const z = async () => Number((await ev(`document.getElementById("zv").textContent`)).replace("%", ""));
  const z0 = await z(), c = await ev(`(()=>{const r=document.getElementById("scroll").getBoundingClientRect();return [r.x+r.width*0.7,r.y+r.height*0.8]})()`);
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: c[0], y: c[1], deltaX: 0, deltaY: -300 }); await wait(250); const z1 = await z(); assert.ok(z1 > z0, `roda para cima deveria aproximar (${z0} → ${z1})`);
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: c[0], y: c[1], deltaX: 0, deltaY: 600 }); await wait(250); assert.ok((await z()) < z1, "roda para baixo deveria afastar");
  await ev(`document.activeElement.blur()`); await send("Input.dispatchKeyEvent", { type: "keyDown", key: "+", text: "+" }); await wait(200); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "+" }); const z2 = await z();
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "-", text: "-" }); await wait(200); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "-" }); assert.ok((await z()) < z2, "tecla − afasta");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "0", text: "0" }); await wait(250); await send("Input.dispatchKeyEvent", { type: "keyUp", key: "0" }); assert.equal(await z(), z0, "0 ajusta à tela");
  // pan: aproxima, depois arrasta o fundo (área vazia abaixo das linhas)
  await send("Input.dispatchMouseEvent", { type: "mouseWheel", x: c[0], y: c[1], deltaX: 0, deltaY: -900 }); await wait(250);
  const sl0 = await ev(`document.getElementById("scroll").scrollLeft`), bg = await ev(`(()=>{const r=document.getElementById("scroll").getBoundingClientRect();return [r.x+r.width-30,r.y+r.height-12]})()`);
  await mouse("mouseMoved", ...bg); await mouse("mousePressed", ...bg, { button: "left", clickCount: 1 }); await mouse("mouseMoved", bg[0] - 120, bg[1] - 5); await mouse("mouseMoved", bg[0] - 240, bg[1] - 10); await mouse("mouseReleased", bg[0] - 240, bg[1] - 10, { button: "left", clickCount: 1 });
  assert.ok((await ev(`document.getElementById("scroll").scrollLeft`)) > sl0, "arrastar o fundo para a esquerda rola o conteúdo para a direita"); await click("#fit");
});
test("console de comandos executa um comando e mostra erro de regra", async () => {
  await click('[data-tab=cmd]'); await ev(`(()=>{const s=document.getElementById("cmdSel");s.value="addChild";s.dispatchEvent(new Event("change"));document.getElementById("payload").value=JSON.stringify({id:flowApp.ui.flow,title:"via_comando"})})()`);
  await click("#run"); assert.match(await ev(`document.getElementById("res").innerText`), /ok/); await click('[data-tab=ts]'); assert.match(await code(), /viaComando/);
  await click('[data-tab=cmd]'); await ev(`document.getElementById("payload").value=JSON.stringify({id:flowApp.ui.flow,kind:"try"})`); await ev(`(()=>{const s=document.getElementById("cmdSel");s.value="wrap";})()`); await ev(`document.getElementById("payload").value=JSON.stringify({id:flowApp.ui.flow,kind:"try"})`);
  await click("#run"); assert.match(await ev(`document.getElementById("res").innerText`), /raiz não aceita try/); await click('[data-tab=ts]');
});
test("nova função cria um fluxo e troca para ele; reiniciar volta ao exemplo", async () => {
  await click("#newFlow"); assert.equal(await ev(`document.querySelectorAll("#flowSel option").length`), 3); await click('[data-tab=cmd]'); await click("#reset");
  assert.equal(await ev(`document.querySelectorAll("#flowSel option").length`), 2); await click('[data-tab=ts]');
});
test("temas: trocar de tema não quebra e usa as cores do tema", async () => {
  await ev(`document.querySelector('.tb-temas button[data-id="eternos-black"]').click()`); assert.equal(await ev(`document.documentElement.dataset.tema`), "eternos-black");
  assert.equal(await ev(`getComputedStyle(document.querySelector(".fx")).backgroundColor`), "rgb(11, 11, 11)");
});

await send("Runtime.enable"); await send("Page.enable");
await send("Page.navigate", { url: `http://127.0.0.1:${port}/flow-novo.html?tema=eternos-black` }); await wait(1800);
let failed = 0;
for (const [name, fn] of tests) { try { await fn(); console.log("  ✓", name); } catch (e) { failed++; console.log("  ✗", name, "\n   ", String(e.message).split("\n")[0]); } }
if (errors.length) { failed++; console.log("  ✗ erros de console:", errors.join(" | ")); }
console.log(failed ? `\n${failed} falha(s)` : `\n${tests.length} testes de navegador passaram`);
chrome.kill(); server.close(); process.exit(failed ? 1 : 0);
