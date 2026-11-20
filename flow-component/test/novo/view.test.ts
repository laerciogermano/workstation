import { describe, expect, it } from "vitest";
import { icon } from "../../novo/icons";
import { layout } from "../../novo/layout";
import { apply, cubeName, DEFAULT_AGENTS, emptyProject, isCube, locate, type Command, type Fn, type Project } from "../../novo/model";
import { sampleProject } from "../../novo/sample";
import { countForRow, countForStep } from "../../novo/scope";
import { build, planHeight, PLAN_PAD_BOTTOM, STATE_ROW, statesByStep, dataLinks, clampCodeWidth, CODE_DEFAULT, CODE_MIN, parsePrefs, colW, tableWidth, dataText, colX, esc, G, planGutter, planWidth, renderPlan, renderTable, rowY, toolsFor, toolsHtml, type Ui } from "../../novo/view";

function base() {
  let p = emptyProject("T"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const root = run({ type: "newFlow", title: "root" });
  const ids = ["fa", "fb", "fc", "fd"].map(t => run({ type: "addChild", id: root, title: t })) as [string, string, string, string];
  const ui = (x: Partial<Ui> = {}): Ui => ({ closed: new Set(), sel: null, txtIn: true, ...x });
  const view = (x: Partial<Ui> = {}) => build(p, root, ui(x));
  return { run, root, ids, ui, view, get p(): Project { return p; } };
}
const acts = (t: ReturnType<typeof base>, id: string, part?: "main" | "catch"): string[] => toolsFor(t.p, id, part).map(x => x.act);

describe("ferramentas: regras únicas dos blocos", () => {
  it("raiz: só filho; sem irmão, if, for, try, remover", () => { const t = base(); expect(acts(t, t.root)).toEqual(["toggle", "addChild"]); const solo = base(); solo.run({ type: "remove", id: solo.ids[0]! }); });
  it("raiz de um elemento só (sem filhos) também só aceita filho", () => { const p = apply(emptyProject("x"), { type: "newFlow" }); expect(toolsFor(p.project, p.created!).map(x => x.act)).toEqual(["addChild"]); });
  it("função comum: filho, irmão, if, for, try, remover; sair do bloco só quando está num bloco", () => {
    const t = base(); expect(acts(t, t.ids[0]!)).toEqual(["addChild", "addSibling", "wrap", "wrap", "wrap", "remove"]);
    expect(toolsFor(t.p, t.ids[0]!).filter(x => x.act === "wrap").map(x => x.data!["kind"])).toEqual(["if", "for", "try"]);
    t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }); expect(acts(t, t.ids[1]!)).toContain("exitScope"); expect(acts(t, t.ids[0]!)).not.toContain("exitScope");
  });
  it("a barra da função tem UMA só lixeira (remover a função), mesmo com dados de entrada e saída", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" });
    const tr = toolsFor(t.p, t.ids[0]!).filter(x => x.icon === "trash"); expect(tr.map(x => x.act)).toEqual(["remove"]); expect(acts(t, t.ids[0]!)).not.toContain("removeData");
    t.run({ type: "assign", id: t.ids[1]!, agent: "console" }); expect(toolsFor(t.p, t.ids[1]!).filter(x => x.icon === "trash")).toHaveLength(1);
    const b = t.run({ type: "wrap", id: t.ids[2]!, kind: "if" }); expect(toolsFor(t.p, b).filter(x => x.icon === "trash")).toHaveLength(1); expect(toolsFor(t.p, b, "else").filter(x => x.icon === "trash")).toHaveLength(1);
  });
  it("paralelo só é oferecido quando há função irmã anterior", () => { const t = base(); expect(acts(t, t.ids[0]!)).not.toContain("parallel"); expect(acts(t, t.ids[1]!)).toContain("parallel"); });
  it.each(["if", "for", "try"] as const)("bloco %s: as MESMAS ações (toggle, filho, condição, irmão à direita, incluir, tirar, remover)", kind => {
    const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind }); const tools = toolsFor(t.p, b);
    expect(tools.map(x => x.act)).toEqual(kind === "if" ? ["toggle", "addChild", "wrap", "wrap", "wrap", "addElse", "addSibling", "setScope", "setScope", "remove"] : ["toggle", "addChild", "wrap", "wrap", "wrap", "addSibling", "setScope", "setScope", "remove"]);
    expect(tools.filter(x => x.act === "wrap").map(x => x.data!["kind"])).toEqual(["if", "for", "try"]);   // todo bloco aceita condição, laço e try/catch expect(tools.at(-1)!.danger).toBe(true);
    expect(tools[0]).toMatchObject({ act: "toggle", icon: "chevron" });
    expect(tools.find(x => x.act === "addChild")!.title).toContain(kind === "try" ? "try" : kind);
    expect(tools.at(-1)).toMatchObject({ act: "remove", danger: true }); expect(tools.at(-1)!.title).toMatch(/everything inside/);
  });
  it("else: filho (no else), irmão à direita e remover o else; if sem else oferece 'Add else' e some quando existe", () => {
    const t = base(), i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" });
    expect(toolsFor(t.p, i).some(x => x.act === "addElse")).toBe(true); t.run({ type: "addElse", id: i }); expect(toolsFor(t.p, i).some(x => x.act === "addElse")).toBe(false);
    const e = toolsFor(t.p, i, "else"); expect(e.map(x => x.act)).toEqual(["toggle", "addChild", "addSibling", "removeElse"]); expect(e.find(x => x.act === "addChild")).toMatchObject({ data: { else: "1" } }); expect(e.find(x => x.act === "addChild")!.title).toContain("else"); expect(e.at(-1)).toMatchObject({ icon: "trash", danger: true });
  });
  it("catch: filho (no catch), irmão à direita e remover o try inteiro (com tudo dentro)", () => {
    const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind: "try" }), c = toolsFor(t.p, b, "catch");
    expect(c.map(x => x.act)).toEqual(["toggle", "addChild", "addSibling", "remove"]); expect(c.find(x => x.act === "addChild")).toMatchObject({ data: { catch: "1" } }); expect(c.find(x => x.act === "addChild")!.title).toContain("catch");
  });
  it("remover o bloco maior apaga if/for/try aninhados e as funções de dentro", () => {
    const t = base(), outer = t.run({ type: "wrap", id: t.ids[1]!, kind: "try" });
    const mid = t.run({ type: "wrap", id: t.ids[1]!, kind: "for" });
    const inner = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" });
    t.run({ type: "remove", id: outer });
    expect(locate(t.p, outer)).toBeNull(); expect(locate(t.p, mid)).toBeNull(); expect(locate(t.p, inner)).toBeNull(); expect(locate(t.p, t.ids[1]!)).toBeNull();
    expect(t.view().scene.rows.some(r => r.id === t.ids[0]!)).toBe(true);
  });
  it("toolsHtml gera botões acessíveis com data-*; id desconhecido não gera nada", () => {
    const t = base(), h = toolsHtml(toolsFor(t.p, t.ids[0]!)); expect(h).toContain('data-act="addChild"'); expect(h).toContain('aria-label="Add child'); expect(h).toContain('data-kind="if"'); expect(h).toContain("danger");
    expect(toolsFor(t.p, "zzz")).toEqual([]);
  });
});

describe("remover: sempre o mesmo ícone de lixeira", () => {
  it("função, if, for, try, catch e data usam a lixeira (e só ela é usada para remover)", () => {
    const t = base(); const ids = { i: t.run({ type: "wrap", id: t.ids[0]!, kind: "if" }), f: t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }), y: t.run({ type: "wrap", id: t.ids[2]!, kind: "try" }) };
    const rem = [...toolsFor(t.p, t.ids[0]!), ...toolsFor(t.p, ids.i), ...toolsFor(t.p, ids.f), ...toolsFor(t.p, ids.y), ...toolsFor(t.p, ids.y, "catch")].filter(x => x.act === "remove");
    expect(rem.length).toBe(5); expect(new Set(rem.map(x => x.icon))).toEqual(new Set(["trash"])); expect(rem.every(x => x.danger)).toBe(true);
    // nenhum outro botão usa a lixeira; bloco não oferece mais unwrap na UI
    expect([...toolsFor(t.p, ids.i), ...toolsFor(t.p, t.ids[3]!)].filter(x => x.icon === "trash").every(x => x.act === "remove")).toBe(true);
    expect(toolsFor(t.p, ids.i).some(x => x.act === "unwrap")).toBe(false);
  });
  it("o botão de remover um dado (caixa do quadrado) também é a lixeira", async () => {
    const { icon } = await import("../../novo/icons"); expect(icon("trash")).toContain("M3 6h18");   // a mesma lixeira usada em todos os botões de remover
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "x" }); expect(t.view().table).not.toContain("rmIo");   // a tabela não tem mais botões de dado
  });

});

describe("tabela", () => {
  it("raiz mostra o arquivo; função sem responsável mostra círculo tracejado com +; concreta mostra a lib; todas têm o círculo da função", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[1]!, agent: "math" });
    const h = t.view().table; expect(h).toContain('class="rp-n">root<'); expect(h).toContain("fav arquivo"); expect(h).toContain("fav none"); expect(h).toContain("Math"); expect(h).toContain("fav maquina");
    expect((h.match(/class="fn-dot /g) ?? []).length).toBe(5);   // as 4 folhas + a função de primeira ordem (círculo, não árvore) expect(h).toContain("fn-dot conc"); expect(h).toContain("fn-dot nag");
  });
  it("lib concreta mostra seletor de função; IA mostra a etiqueta do agente e a pessoa responsável", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "math" }); t.run({ type: "assign", id: t.ids[1]!, agent: "lia" }); t.run({ type: "setResp", id: t.ids[1]!, resp: "ana" });
    const h = t.view().table; expect(h).toContain('class="task-pick"'); expect(h).toContain("<option selected>random</option>"); expect(h).toContain("agent-tag"); expect(h).toContain("Ana Souza"); expect(h).toContain('data-change="setResp"');
  });
  it("clicar no text renomeia (data-act=rename); composta tem a sanfona", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[0]!, title: "a1" }); const h = t.view().table; expect(h).toContain('data-act="rename"'); expect(h).toContain('data-act="toggle"'); expect(h).toContain("fn-dot");
    expect(t.view({ closed: new Set([t.ids[0]!]) }).table).not.toContain(">A1<"); expect(t.view({ closed: new Set([t.ids[0]!]) }).table).toContain("car shut");
  });
  it("blocos: linhas if/for/try/catch com rótulos e as mesmas ferramentas; indentam por profundidade", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.ids[0]!, kind: "if", test: "ok" }); t.run({ type: "addElse", id: i });
    t.run({ type: "wrap", id: t.ids[1]!, kind: "for", v: "x", coll: "xs" }); t.run({ type: "wrap", id: t.ids[3]!, kind: "try" });
    const h = t.view().table; expect(h).toContain("if (ok)"); expect(h).toContain('class="trd e">else'); expect(h).toContain("elserow"); expect(h).toContain("for (x of xs)"); expect(h).toContain("try · catch"); expect(h).toContain('class="trd c">catch'); expect(h).toContain("if the try fails");
    for (const k of ["ifrow", "forrow", "tryrow", "catchrow"]) expect(h).toContain(k); expect(h).toMatch(/padding-left:\d+px/); expect(h).not.toContain('class="rails"');
    expect(h).toContain('data-act="toggle"'); expect(h).toContain("class=\"car\"");   // chevron de collapse na coluna esquerda dos blocos
  });
  it("a tabela não tem linhas de input/output; só a linha escolhida fica marcada", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); const h = t.view({ sel: t.ids[0]! }).table;
    expect(h).not.toContain("iorow"); expect(h).not.toContain("input · output"); expect(h).not.toContain("io-arg"); expect(h).toContain("grow sel"); expect((h.match(/class="grow/g) ?? []).length).toBe(5);
  });

});

describe("plano (SVG)", () => {
  it("uma barra por função folha, nome ao lado (ou dentro com o modo text), colunas e passos", () => {
    const t = base(), v = t.view({ txtIn: false }); expect((v.plan.match(/class="fn nag/g) ?? []).length).toBe(4); expect(v.plan).toContain("s0"); expect(v.plan).toContain("s3"); expect((v.plan.match(/class="lbl"/g) ?? []).length).toBe(5);   // 4 funções + o resumo da raiz
    const inside = t.view({ txtIn: true }).plan; expect(inside).toContain('class="fbt nag"'); expect((inside.match(/class="lbl"/g) ?? []).length).toBe(1);
  });
  it("função concreta e abstrata têm classes diferentes; selecionada ganha destaque", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "math" }); t.run({ type: "assign", id: t.ids[1]!, agent: "lia" });
    const p = t.view({ sel: t.ids[0]! }).plan; expect(p).toContain("fn conc sel"); expect(p).toContain("fn abs");
  });
  it("o traço de ligação existe só onde há dado ligando as funções (no passo vizinho); tirou a entrada, o traço some", () => {
    const t = base(); const n = (): number => (t.view().plan.match(/class="dep"/g) ?? []).length; expect(n()).toBe(0);                      // sem dados, sem traços
    t.run({ type: "addOutput", id: t.ids[0]!, name: "x" }); t.run({ type: "addInput", id: t.ids[1]!, name: "x" }); expect(n()).toBe(1);   // A produz, B usa
    t.run({ type: "addOutput", id: t.ids[1]!, name: "y" }); t.run({ type: "addInput", id: t.ids[2]!, name: "y" }); expect(n()).toBe(2);   // B → C
    t.run({ type: "removeInput", id: t.ids[2]!, name: "y" }); expect(n()).toBe(1);                                                        // a entrada de C saiu: o traço B → C some
    t.run({ type: "removeInput", id: t.ids[1]!, name: "x" }); expect(n()).toBe(0);
  });
  it("paralelas não se ligam entre si; as duas ligam à função do passo seguinte que usa os dados delas", () => {
    const t = base(); t.run({ type: "setParallel", id: t.ids[1]!, on: true }); t.run({ type: "addOutput", id: t.ids[0]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "y" });
    t.run({ type: "addInput", id: t.ids[2]!, name: "x" }); t.run({ type: "addInput", id: t.ids[2]!, name: "y" }); expect((t.view().plan.match(/class="dep"/g) ?? []).length).toBe(2);
  });

  it("função sem I/O: só fantasmas (+) para adicionar; não inventa input_/output_", () => {
    const t = base();
    expect((t.view().plan.match(/class="ghost"/g) ?? []).length).toBe(10);   // 4 folhas × in+out + raiz in+out
    expect(t.view().plan).not.toContain("input_"); expect(t.view().plan).not.toContain("output_");
    expect(t.view().plan).toContain(`data-act="addIo" data-id="${t.root}" data-kind="in"`);
    expect(t.view().plan).toContain(`data-act="addIo" data-id="${t.root}" data-kind="out"`);
    t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); t.run({ type: "addInput", id: t.ids[1]!, name: "y" }); t.run({ type: "addInput", id: t.ids[2]!, name: "externo" });
    const p = t.view().plan; expect(p).toContain('class="dot"'); expect(p).toContain('class="dot a"'); expect(p).toContain('data-act="editData"');
    expect(p).toContain(`data-act="addIo" data-id="${t.ids[0]}" data-kind="in"`);   // ainda sem entrada em fa
  });
  it("lib void (console.log) não inventa output_*: sem marca nem rótulo de saída", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "console" });
    const p = t.view().plan;
    expect(p).not.toContain("output_log"); expect(p).not.toContain(`data-act="editData" data-id="${t.ids[0]}" data-side="out"`);
    expect(p).not.toContain(`data-act="addIo" data-id="${t.ids[0]}" data-kind="out"`);   // contrato void: sem fantasma de saída
    expect(p).toContain(`data-act="editData" data-id="${t.ids[0]}" data-side="in"`); expect(p).toContain(">text<");
  });
  it("1ª ordem com I/O declarado mostra os nomes (e some o fantasma daquele lado)", () => {
    const t = base();
    t.run({ type: "addInput", id: t.root, name: "x" }); t.run({ type: "addOutput", id: t.root, name: "y" });
    const p = t.view().plan; expect(p).toContain(`data-act="editData" data-id="${t.root}" data-side="in"`); expect(p).toContain(`data-act="editData" data-id="${t.root}" data-side="out"`); expect(p).toContain(">x<"); expect(p).toContain(">y<");
    expect(p).not.toContain(`data-act="addIo" data-id="${t.root}"`);
  });
  it("blocos: banda tracejada, etiqueta, alça e triângulo do if; catch com X; edição só em if/for", () => {
    const t = base(); t.run({ type: "wrap", id: t.ids[0]!, kind: "if", test: "ok" }); t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }); t.run({ type: "wrap", id: t.ids[2]!, kind: "try" });
    const p = t.view().plan; for (const c of ["bande if", "bande lp", "bande tr", "bande ca"]) expect(p).toContain(c); expect(p).toContain('class="fif"'); expect(p).toContain("data-drag="); expect(p).toContain("catch · if the try fails");
    expect((p.match(/data-act="editBlock"/g) ?? []).length).toBe(2); expect(p).toContain('class="flp"'); expect(p).toContain('class="ftr"'); expect(p).toContain('class="fca"'); expect(p).toContain(">for (item of items)<"); expect(p).not.toContain("↻ for (");
    expect(p).toMatch(new RegExp(`<line class="bande if" x1="${G.IND}\\.5"`));   // if no depth 1 (0 = 1ª ordem)
    expect(p).toMatch(/<line class="bande co" x1="0\.5"/);   // 1ª ordem cobre o escopo na divisória
    expect((p.match(/class="bande co"/g) ?? []).length).toBeGreaterThan(1);   // folhas também têm traço
  });
  it("etiqueta do if começa depois do triângulo e cobre os passos do bloco", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" }); t.run({ type: "setScope", id: i, count: 2 }); const v = t.view(), g = planGutter(v.scene);
    const m = v.plan.match(/<g class="pill if"[^>]*><rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/)!; expect(Number(m[1])).toBe(colX(1, G.W, g) + 11); expect(Number(m[2])).toBeGreaterThan(G.W);
  });
  it("etiqueta do for alinha com o if: ↻ na linha e pill depois do ícone", () => {
    const t = base(); t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }); const v = t.view(), g = planGutter(v.scene);
    const m = v.plan.match(/<g class="pill lp"[^>]*><rect x="([\d.]+)"/)!; expect(Number(m[1])).toBe(colX(1, G.W, g) + 11);
    expect(v.plan).toMatch(new RegExp(`class="flp" x="${colX(1, G.W, g)}"`));
  });
  it("try e catch alinham com o if: escudo/triângulo na linha e pill depois (catch na coluna seguinte)", () => {
    const t = base(); t.run({ type: "wrap", id: t.ids[1]!, kind: "try" }); const v = t.view(), g = planGutter(v.scene);
    expect(Number(v.plan.match(/<g class="pill tr"[^>]*><rect x="([\d.]+)"/)![1])).toBe(colX(1, G.W, g) + 11);
    expect(Number(v.plan.match(/<g class="pill ca"[^>]*><rect x="([\d.]+)"/)![1])).toBe(colX(2, G.W, g) + 11);   // sequência após o try
    expect(v.plan).toContain('class="ftr"'); expect(v.plan).toContain('class="fca"');
  });
  it("composta mostra a barra-resumo; fechada continua com o resumo", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[1]!, title: "b1" }); expect(t.view().plan).toContain('class="sum"'); expect(t.view({ closed: new Set([t.ids[1]!]) }).plan).toContain('class="sum"');
  });
  it("geometria: colunas e linhas", () => { const t = base(), s = t.view().scene; expect(colX(1) - colX(0)).toBe(G.W); expect(rowY(2) - rowY(1)).toBe(G.RH); expect(planWidth(s)).toBeGreaterThan(colX(s.nSteps)); expect(renderPlan(t.p, locate(t.p, t.root)!.node as Fn, layout(locate(t.p, t.root)!.node as Fn), t.ui())).toContain("<svg"); });
  it("esc escapa HTML e ícones são SVG", () => { expect(esc('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;"); expect(icon("plus")).toContain("<svg"); expect(icon("package")).toContain("<path"); expect(icon("naoexiste")).toContain("<svg"); });
  it("projeto padrão (main) renderiza tabela e plano sem erro", () => {
    const s = sampleProject(); for (const f of s.project.flows) { const v = build(s.project, f.id, { closed: new Set(), sel: null, txtIn: false }); expect(v.table.length).toBeGreaterThan(50); expect(v.plan).toContain("</svg>"); }
    expect(renderTable(s.project, layout(s.project.flows[0]!), { closed: new Set(), sel: null, txtIn: false })).toContain("main");
    expect(() => build(s.project, "nope", { closed: new Set(), sel: null, txtIn: false })).toThrow();
  });
});

describe("quadrado do dado", () => {
  it("fica na linha da função, na coluna de entrada / saída (onde nasce a caixa fantasma), e não na linha de baixo", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[1]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "y" });
    const v = t.view(), g = planGutter(v.scene), row = v.scene.rows.findIndex(r => r.id === t.ids[1] && r.kind === "fn"), cy = rowY(row) + G.RH / 2;
    const squares = [...v.plan.matchAll(/<rect class="dot(?: a)?" x="([\d.]+)" y="([\d.]+)" width="8" height="8"\/>/g)].map(m => ({ x: Number(m[1]) + 4, y: Number(m[2]) + 4 }));
    expect(squares).toHaveLength(2); expect(squares.every(q => q.y === cy)).toBe(true); expect(squares.map(q => q.x)).toEqual([colX(1, G.W, g), colX(2, G.W, g)]);
    // o fantasma que existia no mesmo ponto some quando o dado é criado
    expect(v.plan).not.toMatch(new RegExp(`data-act="addIo" data-id="${t.ids[1]}" data-kind="in"`));
  });
  it("o nome do dado fica na altura do quadrado: entradas à esquerda dele, saídas à direita", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[1]!, name: "customer_data" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "draft" });
    const v = t.view(), g = planGutter(v.scene), fnRow = v.scene.rows.findIndex(r => r.id === t.ids[1] && r.kind === "fn"), cy = rowY(fnRow) + G.RH / 2;
    const names = [...v.plan.matchAll(/<text class="dn (in|out)"[^>]*? x="([\d.]+)" y="([\d.]+)" text-anchor="(\w+)">([^<]+)</g)].map(m => ({ side: m[1], x: Number(m[2]), y: Number(m[3]), anchor: m[4], n: m[5] })).filter(n => n.n === "customer_data" || n.n === "draft");
    expect(names.map(n => [n.side, n.anchor, n.n])).toEqual([["in", "end", "customer_data"], ["out", "start", "draft"]]);
    expect(names.map(n => n.x)).toEqual([colX(1, G.W, g) - G.GAP, colX(2, G.W, g) + G.GAP]); expect(names.every(n => Math.abs(n.y - 3.5 - cy) < 0.01)).toBe(true);   // mesma altura do quadrado
  });
  it("um dado do tipo objeto aparece como cubo", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "v" }); t.run({ type: "setArg", id: t.ids[0]!, name: "v", value: "{ a: 1 }" });
    expect(t.view().plan).toContain('class="cube');
  });
  it("estados embaixo do plano: só os novos de cada passo, ou todos os disponíveis (os antigos ficam esmaecidos)", () => {
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "r1" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "r2" });
    const news = (t.view().plan.match(/class="stt"/g) ?? []).length, all = t.view({ allData: true }).plan;
    expect(news).toBe(2);   // só r1 + r2 (sem inventar I/O vazio)
    expect((all.match(/class="stt/g) ?? []).length).toBeGreaterThan(news); expect(all).toContain('class="stt old"');
  });
  it("dado inicializado com valor aparece nos estados: objeto vira cubo com os campos indentados embaixo", async () => {
    const { objectFields, statesByStep, stateRows } = await import("../../novo/view");
    expect(objectFields("{ id, score: 1, ...rest, nested: { a, b } }")).toEqual(["id", "score", "rest", "nested"]); expect(objectFields("ratio * 100")).toBeNull();
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "value" }); t.run({ type: "setArg", id: t.ids[0]!, name: "value", value: "{ id, score }" });
    const items = [...statesByStep(t.view().scene).values()].flat().find(i => i.name === "value")!; expect(items).toMatchObject({ cube: true, fields: ["id", "score"] }); expect(stateRows([items])).toBe(3);
    const plan = t.view().plan; expect(plan).toContain('class="stt sub"'); expect(plan).toContain(">value<");
  });
  it("listas longas viram reticências no plano (a lista inteira fica no tooltip) e o nome da função se afasta do dado da saída", () => {
    expect(dataText(["a", "b"])).toBe("a, b"); expect(dataText(["proposal_approved", "customer_data"])).toMatch(/…$/); expect(dataText(["proposal_approved", "customer_data"]).length).toBe(24);
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "result" }); const p = t.view({ txtIn: false }).plan;
    const lbl = Number(p.match(/<text class="lbl" x="([\d.]+)"[^>]*>fa</)![1]); expect(lbl).toBeGreaterThan(colX(1, G.WS) + G.GAP + "result".length * 5.6);
  });
  it("função de primeira ordem: o nome fica centrado em cima da barra (não à direita)", () => {
    const t = base(); t.run({ type: "addOutput", id: t.root, name: "report" });
    const p = t.view().plan, g = planGutter(t.view().scene);
    const m = p.match(new RegExp(`<text class="lbl" x="([\\d.]+)" y="([\\d.]+)" text-anchor="middle"[^>]*>${t.p.flows[0]!.title}<`))!;
    expect(m).toBeTruthy();
    const x1 = colX(0, G.W, g) + 21, x2 = colX(t.view().scene.nSteps, G.W, g) - 21;
    expect(Number(m[1])).toBeCloseTo((x1 + x2) / 2, 5); expect(Number(m[2])).toBe(rowY(0) + G.RH / 2 - 22);
  });
  it("entrada cujo dado alguém produz = quadrado cheio; vinda de fora = vazado; saída sempre cheia", () => {
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); t.run({ type: "addInput", id: t.ids[1]!, name: "y" }); t.run({ type: "addInput", id: t.ids[2]!, name: "de_fora" });
    const p = t.view().plan; expect((p.match(/class="dot a"/g) ?? []).length).toBe(1); expect((p.match(/class="dot"/g) ?? []).length).toBe(2);
  });
  it("mesmo nome = mesma referência: entrada inicializada em A preenche a marca de B e liga o traço", () => {
    const t = base();
    t.run({ type: "assign", id: t.ids[0]!, agent: "console" }); t.run({ type: "setArg", id: t.ids[0]!, name: "text", value: '"Hello"' });
    t.run({ type: "addInput", id: t.ids[1]!, name: "text" });
    const p = t.view().plan;
    const markB = p.match(new RegExp(`data-act="editData" data-id="${t.ids[1]}" data-side="in"[\\s\\S]*?</g>`))?.[0] ?? "";
    expect(markB).toContain('class="dot"'); expect(markB).not.toContain('class="dot a"');   // cheio: referencia o text de A
    expect((p.match(/class="dep"/g) ?? []).length).toBe(1);
    const names = [...statesByStep(t.view().scene, false, t.p).values()].flat().map(x => x.name);
    expect(names.filter(n => n === "text")).toHaveLength(1);   // só o init; B não inventa text abstrato de fora
    expect(statesByStep(t.view().scene, true, t.p).get(1)?.some(x => x.name === "text" && x.value === '"Hello"')).toBe(true);
  });
  it("mesmo nome herda tudo: objeto em A → pin e estado de B também são cubo (com os campos)", () => {
    const t = base();
    t.run({ type: "addInput", id: t.ids[0]!, name: "input" });
    t.run({ type: "setArg", id: t.ids[0]!, name: "input", value: '{ field1: "sdfdsfsdf" }' });
    t.run({ type: "addOutput", id: t.ids[0]!, name: "output" });
    t.run({ type: "addInput", id: t.ids[1]!, name: "input" });
    const p = t.view({ allData: true }).plan;
    const markA = p.match(new RegExp(`data-act="editData" data-id="${t.ids[0]}" data-side="in"[\\s\\S]*?</g>`))?.[0] ?? "";
    const markB = p.match(new RegExp(`data-act="editData" data-id="${t.ids[1]}" data-side="in"[\\s\\S]*?</g>`))?.[0] ?? "";
    expect(markA).toContain('class="cube'); expect(markB).toContain('class="cube'); expect(markB).not.toContain('class="dot');
    const at1 = statesByStep(t.view().scene, true, t.p).get(1) ?? [];
    const inputAt1 = at1.find(x => x.name === "input");
    expect(inputAt1).toMatchObject({ cube: true, fields: ["field1"] });
    expect(p).toContain('class="scube"'); expect((p.match(/class="scube"/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});

describe("dado e cubo: [] = cubo (state); UM nome = quadrado; 2+ = cubo", () => {
  it("regras: isCube e nome do cubo (input_/output_ + função)", () => {
    expect(isCube([])).toBe(true); expect(isCube(["a"])).toBe(false); expect(isCube(["a", "b"])).toBe(true);
    const t = base(); t.run({ type: "rename", id: t.ids[0]!, title: "gerarContrato" }); const f = locate(t.p, t.ids[0]!)!.node as Fn;
    expect(cubeName(f, "in")).toBe("input_gerarcontrato"); expect(cubeName(f, "out")).toBe("output_gerarcontrato");
  });
  it("um dado = quadrado; dois ou mais = cubo no plano (no mesmo ponto), com o nome do cubo e os campos no tooltip", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[1]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "y" });
    let p = t.view().plan; expect((p.match(/class="dot/g) ?? []).length).toBe(2);
    t.run({ type: "addInput", id: t.ids[1]!, name: "z" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "w" }); p = t.view().plan;
    expect((p.match(/class="dot/g) ?? []).length).toBe(0);
    expect(p).toContain(">input_fb<"); expect(p).toContain(">output_fb<"); expect(p).toContain("<title>x\nz</title>"); expect(p).toContain("<title>y, w</title>");
    const sc = t.view().scene, g = planGutter(sc), row = sc.rows.findIndex(r => r.id === t.ids[1] && r.kind === "fn"), cy = rowY(row) + G.RH / 2;
    const ys = [...p.matchAll(/<path class="cube(?: a)?" transform="translate\(([\d.]+) ([\d.]+)\)"/g)].map(m => ({ x: Number(m[1]) + 5, y: Number(m[2]) + 5.5 }));
    const onB = ys.filter(q => q.y === cy); expect(onB.map(q => q.x)).toEqual([colX(1, G.W, g), colX(2, G.W, g)]);   // cubos de B na mesma altura do antigo quadrado
  });
  it("entrada de fora (state) = cubo vazado; saída = cubo cheio", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "a" }); t.run({ type: "addInput", id: t.ids[0]!, name: "b" }); expect(t.view().plan).toContain('class="cube a"');
    t.run({ type: "addOutput", id: t.ids[0]!, name: "c" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "d" }); expect(t.view().plan).toMatch(/class="cube" /);
  });
  it("clicar no marcador abre a caixa (editData): quadrado e cubo, no plano", () => {
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); let p = t.view().plan;
    expect(p).toContain(`data-act="editData" data-id="${t.ids[0]}" data-side="out"`); expect(p).toContain('class="dot');
    t.run({ type: "addOutput", id: t.ids[0]!, name: "w" }); p = t.view().plan; expect(p).toContain('class="cube'); expect(p).toContain(`data-act="editData" data-id="${t.ids[0]}" data-side="out"`);
  });

  it("juntar um segundo dado pelo + funciona pelo mesmo comando e o código usa todos os campos", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "p" }); t.run({ type: "addInput", id: t.ids[0]!, name: "q" });
    expect((locate(t.p, t.ids[0]!)!.node as Fn).ins).toEqual(["p", "q"]);
  });
});

describe("valor só no estado embaixo (ao lado da marca: só o nome)", () => {
  const dn = (plan: string, side: "in" | "out"): string[] => [...plan.matchAll(new RegExp(`<text class="dn ${side}"[^>]*>([^<]*)<title>([^<]*)</title></text>`, "g"))].map(m => `${m[1]!.replace(/&quot;/g, '"')} | ${m[2]!.replace(/&quot;/g, '"')}`);
  const dnFind = (plan: string, side: "in" | "out", pred: (s: string) => boolean): string => dn(plan, side).find(pred)!;
  const st = (plan: string): string[] => [...plan.matchAll(/<g class="stt[^"]*"[^>]*>[\s\S]*?<text class="dn st"[^>]*>([^<]*)/g)].map(m => m[1]!.replace(/&quot;/g, '"'));
  it("função de lib: ao lado só o nome; valor completo no tooltip e no estado embaixo", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "console" }); expect(dnFind(t.view().plan, "in", s => s.startsWith("text |"))).toBe("text | text = (not filled in yet)");
    t.run({ type: "setArg", id: t.ids[0]!, name: "text", value: '"Hello, world"' }); expect(dnFind(t.view().plan, "in", s => s.startsWith("text |"))).toBe('text | text = "Hello, world"');
    expect(st(t.view().plan)).toContain('text = "Hello, world"');
    t.run({ type: "setArg", id: t.ids[0]!, name: "text", value: "customer.name" }); expect(dnFind(t.view().plan, "in", s => s.startsWith("text |"))).toBe("text | text = customer.name");
  });
  it("valor longo no estado é cortado com reticências; tooltip do estado fica inteiro", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "console" }); const long = '"' + "x".repeat(80) + '"'; t.run({ type: "setArg", id: t.ids[0]!, name: "text", value: long });
    expect(dnFind(t.view().plan, "in", s => s.startsWith("text |"))).toBe(`text | text = ${long}`);
    const shown = st(t.view().plan).find(s => s.startsWith("text ="))!; expect(shown.length).toBe(26); expect(shown.endsWith("…")).toBe(true);
    expect(t.view().plan).toContain(`<title>${esc(long)}</title>`);
  });
  it("vários parâmetros (cubo): ao lado só o nome do cubo; tooltip com valores", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[1]!, agent: "math" }); t.run({ type: "setTask", id: t.ids[1]!, task: "max" }); t.run({ type: "setArg", id: t.ids[1]!, name: "a", value: "3" });
    const row = dnFind(t.view().plan, "in", s => s.startsWith("input_max")); expect(row.split(" | ")[0]).toBe("input_max"); expect(row.split(" | ")[1]).toBe("a = 3\nb = (not filled in yet)");
    expect(st(t.view().plan)).toContain("a = 3");
  });
  it("objeto literal: campos com valor no estado embaixo", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "console" }); t.run({ type: "setArg", id: t.ids[0]!, name: "text", value: '{ field1: "sdfsfsdfds" }' });
    expect(dnFind(t.view().plan, "in", s => s.startsWith("text |")).startsWith("text |")).toBe(true);
    const labels = st(t.view().plan); expect(labels).toContain("text"); expect(labels).toContain('field1 = "sdfsfsdfds"');
  });
  it("função comum e saídas: só o nome (sem valor)", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); const p = t.view().plan;
    expect(dn(p, "in")).toContain("x | x"); expect(dn(p, "out")).toContain("y | y");
  });
});

describe("tabela: largura acompanha o aninhamento", () => {
  it("cada nível de if aumenta tableWidth (não engole o plano)", () => {
    const t = base();
    const w0 = tableWidth(t.view().scene, t.p);
    let cur = t.ids[1]!;
    for (let i = 0; i < 8; i++) {
      const bif = t.run({ type: "wrap", id: cur, kind: "if" });
      cur = t.run({ type: "addChild", id: bif, title: `n${i}` });
    }
    const wDeep = tableWidth(t.view().scene, t.p);
    expect(t.view().scene.maxDepth).toBeGreaterThanOrEqual(8);
    expect(wDeep).toBeGreaterThan(w0 + 8 * G.IND * 2);
  });
});

describe("modo text: barra na largura do text, com padding", () => {
  it("colW cresce com o nome mais comprido e só no modo text", () => {
    const t = base(); expect(colW(t.view().scene, { txtIn: false })).toBe(G.WS); expect(colW(t.view().scene, { txtIn: true })).toBe(G.W);
    t.run({ type: "rename", id: t.ids[0]!, title: "umNomeDeFuncaoBemCompridoMesmoDeVerdade" });
    const big = colW(t.view().scene, { txtIn: true }); expect(big).toBeGreaterThan(G.W); expect(colW(t.view().scene, { txtIn: false })).toBe(G.WS);
  });
  it("a barra tem folga dos dois lados e as colunas acompanham", () => {
    const t = base(); t.run({ type: "rename", id: t.ids[0]!, title: "umNomeDeFuncaoBemCompridoMesmoDeVerdade" });
    const v = t.view({ txtIn: true }), m = v.plan.match(/<rect class="fn nag" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/)!;
    expect(Number(m[2])).toBeGreaterThanOrEqual("umNomeDeFuncaoBemCompridoMesmoDeVerdade".length * 6.2 + 24); expect(v.w).toBe(Number(m[2]) + 2 * G.INS);
    expect(planWidth(v.scene, v.w)).toBeGreaterThan(planWidth(v.scene));
  });
});

describe("else no flow (mesmo princípio do catch)", () => {
  it("aparece linha de else na tabela e faixa + etiqueta no plano, e some quando o else some", () => {
    const t = base(), i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if", test: "ok" });
    let v = t.view(); expect(v.table).not.toContain("elserow"); expect(v.plan).not.toContain("band el");
    t.run({ type: "addElse", id: i, title: "planoB" }); v = t.view();
    expect(v.table).toContain("elserow"); expect(v.table).toContain('class="trd e">else'); expect(v.table).toContain("planoB"); expect(v.plan).toContain("bande el"); expect(v.plan).toContain("else"); expect(v.plan).toContain('data-part="else"');
    expect(v.scene.rows.filter(r => r.kind === "else")).toHaveLength(1);
    t.run({ type: "removeElse", id: i }); expect(t.view().table).not.toContain("elserow");
  });
  it("o else cobre as mesmas linhas que o conteúdo dele (faixa até a última função do else)", () => {
    const t = base(), i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" }); t.run({ type: "addElse", id: i }); t.run({ type: "addChild", id: i, else: true, title: "antes" });
    const v = t.view(), el = v.scene.rows.findIndex(r => r.kind === "else"), row = v.scene.rows[el]!, h = (row.last - el + 1) * G.RH;
    expect(row.last).toBeGreaterThan(el); expect((v.plan.match(/class="bande el"/g) ?? []).length).toBe(1);
    const m = v.plan.match(/<line class="bande el" x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="([\d.]+)"/)!; expect(Number(m[2]) - Number(m[1])).toBe(h);
  });
});

describe("estados embaixo das colunas e título do plano", () => {
  it("o título do plano é só o nome do fluxo (sem o nome do projeto)", () => { const t = base(); const p = t.view().plan; expect(p).toContain(">root</text>"); expect(p).not.toContain("T · root"); expect(p).not.toContain("New project"); });
  it("embaixo de cada coluna aparecem os dados (estados) que chegam nela: quadrado, ou cubo quando a função devolve vários", () => {
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "p" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "q" });
    const m = statesByStep(t.view().scene); expect([...m.keys()]).toEqual([1, 2]); expect(m.get(1)).toMatchObject([{ name: "x", cube: false, fields: ["x"], side: "out" }]); expect(m.get(2)).toMatchObject([{ name: "output_fb", cube: true, fields: ["p", "q"], side: "out" }]); expect(m.get(1)![0]!.owner).toBeTruthy();   // cada dado sabe a função dona (menu do estado)
    const plan = t.view().plan; expect((plan.match(/class="sdot"/g) ?? []).length).toBe(1);
    expect((plan.match(/class="scube"/g) ?? []).length).toBe(1);   // só output_fb
    expect(plan).toContain(">x</text>"); expect(plan).toContain(">output_fb</text>");
    expect(planHeight(t.view().scene)).toBeGreaterThan(rowY(t.view().scene.rows.length) + 66);
  });
  it("funções do mesmo passo empilham os estados na mesma coluna e a altura cresce", () => {
    const t = base(); t.run({ type: "setParallel", id: t.ids[1]!, on: true }); t.run({ type: "addOutput", id: t.ids[0]!, name: "a1" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "a2" });
    const sc = t.view().scene; expect(statesByStep(sc).get(1)!.map(x => x.name)).toEqual(["a1", "a2"]); expect(planHeight(sc)).toBe(rowY(sc.rows.length) + 66 + 2 * STATE_ROW + PLAN_PAD_BOTTOM);
  });
  it("sem dados não há estados embaixo", () => {
    const t = base(); expect(statesByStep(t.view().scene).size).toBe(0);
    expect(statesByStep(t.view().scene, false, t.p).size).toBe(0);
    expect(t.view().plan).not.toContain("sdot"); expect(t.view().plan).not.toContain("scube");
    expect(t.view().plan).toContain('class="ghost"');   // só fantasmas para declarar I/O
  });
  it("entrada com literal (text = false) aparece embaixo no estado do passo", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "console" }); t.run({ type: "setArg", id: t.ids[0]!, name: "text", value: "false" });
    const m = statesByStep(t.view().scene); expect([...m.values()].flat().map(x => x.name)).toContain("text");
    expect(t.view().plan).toMatch(/class="stt"[^>]*>[\s\S]*?>text</);
  });
  it("entrada de uma composição (função com filhas) aparece no estado embaixo", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[1]!, title: "b1" }); t.run({ type: "addInput", id: t.ids[1]!, name: "y" });
    const m = statesByStep(t.view().scene, false, t.p); expect([...m.values()].flat().map(x => x.name)).toContain("y");
    expect(m.get(1)!.find(x => x.name === "y")).toMatchObject({ name: "y", abs: true, side: "in", owner: t.ids[1] });
    expect(t.view().plan).toContain('class="sdot a"');
  });
  it("sem I/O declarado: fantasma (+) no diagrama e nada inventado nos estados", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[1]!, title: "b1" }); t.run({ type: "rename", id: t.ids[1]!, title: "fazerBenchmarking" });
    const names = [...statesByStep(t.view().scene, false, t.p).values()].flat().map(x => x.name);
    expect(names).not.toContain("input_fazerbenchmarking"); expect(names).not.toContain("output_fazerbenchmarking");
    expect(t.view().plan).toContain(`data-act="addIo" data-id="${t.ids[1]}"`); expect(t.view().plan).not.toContain("input_fazerbenchmarking");
  });
});

describe("source das funções abstratas", () => {
  it("função sem responsável mostra 'abstract' no source; com lib mostra o nome da lib; IA sem pessoa também mostra 'abstract'", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[1]!, agent: "math" }); t.run({ type: "assign", id: t.ids[2]!, agent: "lia" }); const h = t.view().table;
    expect((h.match(/rp-n abs">abstract</g) ?? []).length).toBe(3); expect(h).toContain(">Math<"); t.run({ type: "setResp", id: t.ids[2]!, resp: "ana" }); expect((t.view().table.match(/rp-n abs">abstract</g) ?? []).length).toBe(2);
  });
});

describe("alça do bloco (arrastar)", () => {
  it("countForStep conta os itens (do bloco + irmãos seguintes) cobertos até o passo", () => {
    const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }), sc = layout(t.p.flows[0]!);
    expect(countForStep(t.p, sc, b, 1)).toBe(1); expect(countForStep(t.p, sc, b, 2)).toBe(2); expect(countForStep(t.p, sc, b, 3)).toBe(3); expect(countForStep(t.p, sc, b, 99)).toBe(3); expect(countForStep(t.p, sc, b, -5)).toBe(1);
    expect(countForStep(t.p, sc, t.ids[0]!, 3)).toBe(1);   // função não tem escopo
  });
  it("arrastar a alça pra baixo: a linha sob o ponteiro decide quantos itens o bloco engloba (do bloco + irmãos seguintes)", () => {
    const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }), sc = layout(t.p.flows[0]!), rowOf = (id: string): number => sc.rows.findIndex(r => r.id === id && r.kind === "fn");
    expect(countForRow(t.p, sc, b, rowOf(t.ids[1]!)).count).toBe(1); expect(countForRow(t.p, sc, b, rowOf(t.ids[2]!)).count).toBe(2); expect(countForRow(t.p, sc, b, rowOf(t.ids[3]!)).count).toBe(3);
    expect(countForRow(t.p, sc, b, 99).count).toBe(3); expect(countForRow(t.p, sc, b, 0).count).toBe(1);   // nunca menos de 1
    expect(countForRow(t.p, sc, b, rowOf(t.ids[2]!)).lastRow).toBe(rowOf(t.ids[2]!));   // a guia fica na última linha do item que fecha o bloco
    t.run({ type: "setScope", id: b, count: countForRow(t.p, sc, b, rowOf(t.ids[3]!)).count }); expect(locate(t.p, b)!.node.kids).toHaveLength(3);
  });
  it("aplicar o result com setScope aumenta e diminui o bloco (if, for, try)", () => {
    for (const kind of ["if", "for", "try"] as const) {
      const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind }), sc = layout(t.p.flows[0]!);
      const step = sc.span.get(t.ids[3]!)!.e;   // try empurra C/D por causa do catch — usar o passo do último irmão
      const n = countForStep(t.p, sc, b, step); t.run({ type: "setScope", id: b, count: n }); expect(locate(t.p, b)!.node.kids).toHaveLength(3);
      t.run({ type: "setScope", id: b, count: countForStep(t.p, layout(t.p.flows[0]!), b, 0) }); expect(locate(t.p, b)!.node.kids).toHaveLength(1);
    }
  });
});

describe("painel de código: largura e preferências", () => {
  it("clampCodeWidth respeita o mínimo, 70% da área e values inválidos", () => {
    expect(clampCodeWidth(100, 1400)).toBe(CODE_MIN); expect(clampCodeWidth(480, 1400)).toBe(480); expect(clampCodeWidth(5000, 1400)).toBe(980); expect(clampCodeWidth(NaN, 1400)).toBe(CODE_DEFAULT);
    expect(clampCodeWidth(900, 500)).toBe(350); expect(clampCodeWidth(900, 300)).toBe(CODE_MIN);   // área pequena: 70% dela, nunca abaixo do mínimo
    expect(clampCodeWidth(480.4, 1400)).toBe(480);
  });
  it("parsePrefs: lê o salvo, completa o que faltar e volta ao padrão quando estiver estragado", () => {
    expect(parsePrefs(JSON.stringify({ codeW: 640, codeOpen: true }))).toEqual({ codeW: 640, codeOpen: true }); expect(parsePrefs(JSON.stringify({ codeW: 700 }))).toEqual({ codeW: 700, codeOpen: false });
    expect(parsePrefs(null)).toEqual({ codeW: CODE_DEFAULT, codeOpen: false }); expect(parsePrefs("{ quebrado")).toEqual({ codeW: CODE_DEFAULT, codeOpen: false }); expect(parsePrefs(JSON.stringify({ codeW: "x", codeOpen: 1 }))).toEqual({ codeW: CODE_DEFAULT, codeOpen: false });
  });
});

describe("traços de ligação: só entre passos vizinhos (nunca pulam uma coluna)", () => {
  it("função distante que usa o dado de outra NÃO ganha traço pulando colunas", () => {
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "x" }); t.run({ type: "addInput", id: t.ids[3]!, name: "x" });   // A (passo 0) produz; D (passo 3) usa
    expect(dataLinks(t.p, t.view().scene)).toEqual([]); expect((t.view().plan.match(/class="dep"/g) ?? []).length).toBe(0);
  });
  it("função do else/catch (após o bloco) ganha o traço do dado do passo vizinho, contínuo (sem tracejado)", () => {
    // else começa no passo seguinte ao último do if → o produtor vizinho é o último do if (C), não o anterior (B)
    const t = base(); const i = t.run({ type: "wrap", id: t.ids[2]!, kind: "if", test: "ok" }); const e = t.run({ type: "addElse", id: i, title: "planB" }); t.run({ type: "addOutput", id: t.ids[2]!, name: "dados" }); t.run({ type: "addInput", id: e, name: "dados" });
    const v = t.view(), links = dataLinks(t.p, v.scene); expect(links).toHaveLength(1); expect([(links[0]!.from.node as Fn).title, (links[0]!.to.node as Fn).title]).toEqual(["fc", "planB"]); expect(links[0]!.to.s - links[0]!.from.e).toBe(1);
    expect(v.plan).toContain('class="dep"'); expect(v.plan).not.toMatch(/stroke-dasharray/);
  });
  it("catch usando o dado do último do try liga; dado que ninguém produz não liga; valor preenchido citando um dado liga", () => {
    const t = base(); const tr = t.run({ type: "wrap", id: t.ids[1]!, kind: "try" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "q" }); const h = (locate(t.p, tr)!.node as { catchKids: { id: string }[] }).catchKids[0]!.id;
    t.run({ type: "addInput", id: h, name: "q" }); t.run({ type: "addInput", id: t.ids[2]!, name: "nobody" }); const name = (l: { from: { node: unknown }; to: { node: unknown }; name: string }): string => `${(l.from.node as Fn).title}>${(l.to.node as Fn).title}:${l.name}`;
    expect(dataLinks(t.p, t.view().scene).map(name)).toEqual(["fb>handleError:q"]);
    t.run({ type: "addInput", id: t.ids[1]!, name: "extra" }); t.run({ type: "setArg", id: t.ids[1]!, name: "extra", value: "q + 1" }); expect(dataLinks(t.p, t.view().scene).map(name)).toContain("fb>handleError:q");
  });
});
