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

test("cabeçalho da tabela: source e function", async () => { assert.deepEqual(await ev(`[...document.querySelectorAll(".ghead span")].map(s=>s.textContent)`), ["source", "function"]); });
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
test("Esc cancela a caixa; clicar no texto da função renomeia", async () => {
  await click(".ghost[data-kind=out]"); await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 }); await wait(150); assert.equal(await ev(`!!document.querySelector(".dlg")`), false);
  await click('.grow b[data-act=rename]'); await ev(`document.querySelector(".dlg input").value=""`); await type("principal"); assert.match(await code(), /export async function principal\(/);
});
test("círculo da função à esquerda do nome (na coluna function), e círculo do responsável", async () => {
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
test("um dado é quadrado; juntar mais um pelo + vira cubo no mesmo ponto", async () => {
  await ev(`(()=>{const a=flowApp;const f=a.store.project.flows[1];a.ui.flow=f.id;const s=document.getElementById("flowSel");s.value=f.id;s.dispatchEvent(new Event("change",{bubbles:true}));const z=a.store.dispatch({type:"addChild",id:f.id,title:"z"});a.store.dispatch({type:"addOutput",id:z,name:"unico"})})()`); await wait(250);
  const cubes0 = await ev(`document.querySelectorAll(".plan .cube").length`);
  await ev(`document.querySelectorAll('.iorow .io-d .x.plus').forEach(b=>b.style.opacity=1)`);
  await click(`.iorow:has([data-kind=out][data-name=unico]) .x.plus`); await type("segundo");
  assert.equal(await ev(`document.querySelectorAll(".plan .cube").length`), cubes0 + 1, "o par de dados vira um cubo"); assert.ok(await ev(`!![...document.querySelectorAll(".iorow .cubed")].find(e=>e.textContent.includes("unico")&&e.textContent.includes("segundo"))`));
});
test("clicar na etiqueta do if edita a condição; o código acompanha", async () => {
  await click(".plan .pill.if[data-act=editBlock]"); await ev(`document.querySelector(".dlg input").value=""`); await type("estoque_ok");
  assert.match(await code(), /if \(estoque_ok\) \{/);
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
  assert.match(await ev(`document.querySelectorAll(".grow")[${await ev(`[...document.querySelectorAll(".grow")].findIndex(r=>r.classList.contains("ifrow"))`)} + 1].innerText`), /Fazer nova função/);
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
test("responsável: trocar pelo seletor atualiza o código (lib concreta vira import)", async () => {
  await ev(`(()=>{const s=document.querySelector('select[data-change=assign]');s.value="fs";s.dispatchEvent(new Event("change",{bubbles:true}))})()`); await wait(200); assert.match(await code(), /import \* as node_fs from "node:fs"/);
});
test("zoom, ajustar, modo texto, abrir/fechar tudo e abas funcionam", async () => {
  await click("#zin"); assert.notEqual(await ev(`document.getElementById("zv").textContent`), "100%"); await click("#fit");
  assert.ok(await ev(`!!document.querySelector(".plan .fbt")`), "o modo texto já abre ligado"); await click("#txtIn"); assert.ok(await ev(`!document.querySelector(".plan .fbt")`)); await click("#txtIn"); assert.ok(await ev(`!!document.querySelector(".plan .fbt")`));
  await click("#collapse"); await click("#expand"); await click('[data-tab=cmd]'); assert.ok(await ev(`document.getElementById("p-cmd").classList.contains("on")`)); await click('[data-tab=ts]');
});
test("desfazer/refazer no cabeçalho da página e junto das opções do Flow, com Ctrl+Z / Ctrl+Shift+Z nas dicas; nunca nas dicas dos componentes", async () => {
  assert.deepEqual(await ev(`[...document.querySelectorAll("[data-hist]")].map(b=>b.dataset.hist+":"+(b.closest(".topbar")?"topbar":b.closest(".fx-bar")?"flow":"fora"))`), ["undo:topbar", "redo:topbar", "undo:flow", "redo:flow"]);
  assert.deepEqual(await ev(`[...document.querySelectorAll("[data-hist]")].map(b=>b.title)`), ["Desfazer (Ctrl+Z)", "Refazer (Ctrl+Shift+Z)", "Desfazer (Ctrl+Z)", "Refazer (Ctrl+Shift+Z)"]);
  const c = await center(".plan .fn"); await mouse("mouseMoved", ...c); await wait(150);
  assert.ok(!(await ev(`[...document.querySelectorAll(".bar-tools .ib, .fl-tools .ib")].some(b=>/desfaz|refaz/i.test(b.title))`)));
  const n = () => ev(`flowApp.store.project.flows[1].kids.length`); const a0 = await n();
  await ev(`flowApp.store.dispatch({type:"addChild",id:flowApp.store.project.flows[1].id,title:"zzz"})`); await wait(150); assert.equal(await n(), a0 + 1);
  await click(".topbar [data-hist=undo]"); assert.equal(await n(), a0); await click(".topbar [data-hist=redo]"); assert.equal(await n(), a0 + 1); await click(".fx-bar [data-hist=undo]"); assert.equal(await n(), a0); await click(".fx-bar [data-hist=redo]"); assert.equal(await n(), a0 + 1); await click(".fx-bar [data-hist=undo]"); assert.equal(await ev(`document.querySelector("[data-hist=redo]").disabled`), false);
});
test("muitos ifs e fors encadeados: a vista mostra o fluxo inteiro", async () => {
  await ev(`(()=>{let cur=flowApp.store.project.flows[1].kids[0].id;for(let i=0;i<9;i++)cur=flowApp.store.dispatch({type:"wrap",id:cur,kind:i%2?"for":"if"})})()`); await wait(300);
  const r = await ev(`(()=>{const v=document.getElementById("scroll").getBoundingClientRect(),z=document.getElementById("zoom").getBoundingClientRect();return {l:z.left>=v.left-1,t:z.top>=v.top-1,r:z.right<=v.right+1,b:z.bottom<=v.bottom+1}})()`);
  assert.deepEqual(r, { l: true, t: true, r: true, b: true }, "o conteúdo deve caber na vista: " + JSON.stringify(r));
});
test("modo texto: o nome cabe inteiro dentro da barra, com padding", async () => {
  await ev(`flowApp.store.dispatch({type:"rename",id:flowApp.store.project.flows[1].kids.flatMap(function f(n){return n.t==="fn"?[n]:[...n.kids].flatMap(f)})[0].id,title:"um_nome_de_funcao_bem_comprido_mesmo"})`); await wait(200);
  const ok = await ev(`[...document.querySelectorAll(".plan .fbt")].every(t=>{const b=t.getBBox(),r=t.parentNode.querySelector("rect.fn"),w=+r.getAttribute("width");return b.width+16<=w})`); assert.ok(ok, "texto maior que a barra");
});
test("zoom: roda do mouse aproxima/afasta no ponteiro; arrastar o fundo move; teclas + − 0", async () => {
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
test("exportar e rodar: console.log no Node, versão executável, baixar e copiar o comando", async () => {
  await ev(`(()=>{const a=flowApp,f=a.store.project.flows[0];a.store.dispatch({type:"rename",id:f.id,title:"main"});const s=document.getElementById("flowSel");s.value=f.id;s.dispatchEvent(new Event("change",{bubbles:true}))})()`); await wait(300);
  await ev(`(()=>{const a=flowApp,m=a.ui.flow;const x=a.store.dispatch({type:"addChild",id:m,title:"x"});a.store.dispatch({type:"assign",id:x,agent:"console"});a.store.dispatch({type:"addInput",id:x,name:"mensagem"})})()`); await wait(200);
  assert.ok(await ev(`[...document.querySelectorAll('select[data-change=assign] optgroup[label="Libs Node.js"] option')].map(o=>o.textContent).includes("node:console")`), "node:console deve estar entre as opções de responsável");
  assert.match(await code(), /import \* as node_console from "node:console"/); assert.match(await code(), /call\(node_console, "log", \{ \.\.\.state \}\)/);
  await click('[data-view=run]'); assert.ok(await ev(`!document.getElementById("runhint").hidden`)); assert.equal(await ev(`document.getElementById("runcmd").textContent`), "node --experimental-strip-types main.mts"); assert.equal(await ev(`document.getElementById("fname").textContent`), "main.mts");
  assert.match(await code(), /const result = await main\(/); assert.match(await code(), /call\(node_console, "log", data\(/);
  await ev(`window.__dl=[];HTMLAnchorElement.prototype.click=function(){window.__dl.push(this.download)}`); await click("#dl"); assert.deepEqual(await ev(`window.__dl`), ["main.mts"]);
  await click('[data-view=mod]'); assert.ok(await ev(`document.getElementById("runhint").hidden`)); await click("#dl"); assert.deepEqual(await ev(`window.__dl`), ["main.mts", "main.ts"]); assert.doesNotMatch(await code(), /const result = await/);
});
test("cadastro de responsáveis: criar uma lib nova e usá-la; remover solta as funções", async () => {
  await click("#agents"); assert.ok(await ev(`!!document.querySelector(".dlg .agl")`));
  await ev(`(()=>{const f=document.querySelector(".dlg form");f.elements.namedItem("kind").value="maquina";f.elements.namedItem("name").value="node:zlib";f.elements.namedItem("tasks").value="gzip, gunzip"})()`); await click(".dlg .agadd button[type=submit]"); await wait(200);
  assert.ok(await ev(`[...document.querySelectorAll(".dlg .agr b")].some(b=>b.textContent==="node:zlib")`), "lib nova na lista");
  await click(".dlg [data-no]"); assert.equal(await ev(`!!document.querySelector(".dlg")`), false);
  assert.ok(await ev(`[...document.querySelectorAll('select[data-change=assign] optgroup[label="Libs Node.js"] option')].some(o=>o.textContent==="node:zlib")`), "a lib nova aparece no seletor de responsável");
  await ev(`(()=>{const a=flowApp,f=a.store.project.flows[0],z=a.store.project.agents.find(x=>x.name==="node:zlib");a.store.dispatch({type:"assign",id:f.kids[0]?.id??a.store.dispatch({type:"addChild",id:f.id,title:"z"}),agent:z.id})})()`); await wait(200);
  assert.match(await ev(`document.getElementById("code").innerText`), /node:zlib|node_zlib/);
  await click("#agents"); await click('.dlg [data-rm-agent]:last-of-type'); await wait(100); await click(".dlg [data-no]");
});
test("excluir fluxo (lixeira) pede confirmação e mantém ao menos um", async () => {
  const n0 = await ev(`document.querySelectorAll("#flowSel option").length`); await click("#delFlow"); assert.ok(await ev(`!!document.querySelector(".dlg")`)); await click(".dlg [data-no]"); assert.equal(await ev(`document.querySelectorAll("#flowSel option").length`), n0);
  await click("#delFlow"); await click(".dlg button.pri"); await wait(200); assert.equal(await ev(`document.querySelectorAll("#flowSel option").length`), n0 - 1);
  while ((await ev(`document.querySelectorAll("#flowSel option").length`)) > 1) { await click("#delFlow"); await click(".dlg button.pri"); await wait(150); }
  await click("#delFlow"); await click(".dlg button.pri"); await wait(200); assert.match(await ev(`document.querySelector(".toast")?.textContent ?? ""`), /pelo menos um fluxo/); assert.equal(await ev(`document.querySelectorAll("#flowSel option").length`), 1);
  await click('[data-tab=cmd]'); await click("#reset"); await click('[data-tab=ts]'); assert.equal(await ev(`document.querySelectorAll("#flowSel option").length`), 2);
});
test("salvar: baixa o projeto (.json); abrir: carrega o arquivo; arquivo inválido mostra o erro", async () => {
  await ev(`window.__dl=[];HTMLAnchorElement.prototype.click=function(){window.__dl.push(this.download)}`); await click("#save"); assert.deepEqual(await ev(`window.__dl`), ["projeto-flow.json"]);
  const json = await ev(`(()=>{const f=flowApp.store.project;return JSON.stringify({format:"flow-novo",version:1,project:{...f,name:"Vindo do arquivo",flows:[{t:"fn",id:"x1",title:"importado",agent:null,resp:null,ins:[],outs:[],kids:[],par:false}],seq:5}})})()`);
  const open = async text => { await ev(`(()=>{const dt=new DataTransfer();dt.items.add(new File([${JSON.stringify(text)}],"p.json",{type:"application/json"}));const i=document.getElementById("openFile");i.files=dt.files;i.dispatchEvent(new Event("change"))})()`); await wait(300); };
  await open(json); assert.deepEqual(await ev(`[...document.querySelectorAll("#flowSel option")].map(o=>o.textContent)`), ["importado"]); assert.match(await ev(`document.querySelector(".toast")?.textContent ?? ""`), /Vindo do arquivo/); assert.equal(await ev(`document.getElementById("undo")?.disabled ?? document.querySelector("[data-hist=undo]").disabled`), true);
  await open("isto não é json"); assert.match(await ev(`document.querySelector(".toast")?.textContent ?? ""`), /JSON válido/); assert.deepEqual(await ev(`[...document.querySelectorAll("#flowSel option")].map(o=>o.textContent)`), ["importado"]);
  await click('[data-tab=cmd]'); await click("#reset"); await click('[data-tab=ts]');
});
test("persistência: o projeto fica salvo no navegador e volta ao recarregar", async () => {
  await ev(`flowApp.store.dispatch({type:"rename",id:flowApp.store.project.flows[0].id,title:"persistido"})`); await wait(200);
  assert.match(await ev(`localStorage.getItem("flow-novo-projeto-v1")`), /persistido/);
  await send("Page.reload"); await wait(1500); assert.equal(await ev(`document.querySelector("#flowSel option").textContent`), "persistido", "depois de recarregar o projeto continua o mesmo");
  await ev(`localStorage.setItem("flow-novo-projeto-v1","corrompido")`); await send("Page.reload"); await wait(1500); assert.deepEqual(await ev(`[...document.querySelectorAll("#flowSel option")].map(o=>o.textContent)`), ["main", "fazer_onboarding"], "salvo inválido: volta ao exemplo");
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
for (const [name, fn] of tests) { try { await fn(); console.log("  ✓", name); } catch (e) { failed++; console.log("  ✗", name, "\n   ", String(e.message).split("\n").slice(0, 4).join(" | ")); } }
if (errors.length) { failed++; console.log("  ✗ erros de console:", errors.join(" | ")); }
console.log(failed ? `\n${failed} falha(s)` : `\n${tests.length} testes de navegador passaram`);
chrome.kill(); server.close(); process.exit(failed ? 1 : 0);
