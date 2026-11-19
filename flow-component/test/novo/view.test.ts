import { describe, expect, it } from "vitest";
import { icon } from "../../novo/icons";
import { layout } from "../../novo/layout";
import { apply, cubeName, DEFAULT_AGENTS, emptyProject, isCube, locate, type Command, type Fn, type Project } from "../../novo/model";
import { sampleProject } from "../../novo/sample";
import { countForStep } from "../../novo/scope";
import { build, colW, tableWidth, dataText, colX, esc, G, planWidth, renderPlan, renderTable, rowY, toolsFor, toolsHtml, type Ui } from "../../novo/view";

function base() {
  let p = emptyProject("T"); p.agents = structuredClone([...DEFAULT_AGENTS]);
  const run = (c: Command): string => { const r = apply(p, c); p = r.project; return r.created ?? ""; };
  const root = run({ type: "newFlow", title: "R" });
  const ids = ["A", "B", "C", "D"].map(t => run({ type: "addChild", id: root, title: t })) as [string, string, string, string];
  const ui = (x: Partial<Ui> = {}): Ui => ({ closed: new Set(), sel: null, txtIn: false, ...x });
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
  it("paralelo só é oferecido quando há função irmã anterior", () => { const t = base(); expect(acts(t, t.ids[0]!)).not.toContain("parallel"); expect(acts(t, t.ids[1]!)).toContain("parallel"); });
  it.each(["if", "for", "try"] as const)("bloco %s: as MESMAS ações (filho, condição, irmão à direita, incluir, tirar, remover)", kind => {
    const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind }); const tools = toolsFor(t.p, b);
    expect(tools.map(x => x.act)).toEqual(kind === "if" ? ["addChild", "wrap", "wrap", "wrap", "addElse", "addSibling", "setScope", "setScope", "unwrap"] : ["addChild", "wrap", "wrap", "wrap", "addSibling", "setScope", "setScope", "unwrap"]);
    expect(tools.filter(x => x.act === "wrap").map(x => x.data!["kind"])).toEqual(["if", "for", "try"]);   // todo bloco aceita condição, laço e try/catch expect(tools.at(-1)!.danger).toBe(true);
    expect(tools[0]!.title).toContain(kind === "try" ? "try" : kind);
  });
  it("else: filho (no else), irmão à direita e remover o else; if sem else oferece 'Adicionar else' e some quando existe", () => {
    const t = base(), i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" });
    expect(toolsFor(t.p, i).some(x => x.act === "addElse")).toBe(true); t.run({ type: "addElse", id: i }); expect(toolsFor(t.p, i).some(x => x.act === "addElse")).toBe(false);
    const e = toolsFor(t.p, i, "else"); expect(e.map(x => x.act)).toEqual(["addChild", "addSibling", "removeElse"]); expect(e[0]).toMatchObject({ data: { else: "1" } }); expect(e[0]!.title).toContain("else"); expect(e.at(-1)).toMatchObject({ icon: "trash", danger: true });
  });
  it("catch: filho (no catch), irmão à direita e remover; sem incluir/tirar", () => {
    const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind: "try" }), c = toolsFor(t.p, b, "catch");
    expect(c.map(x => x.act)).toEqual(["addChild", "addSibling", "unwrap"]); expect(c[0]).toMatchObject({ data: { catch: "1" } }); expect(c[0]!.title).toContain("catch");
  });
  it("toolsHtml gera botões acessíveis com data-*; id desconhecido não gera nada", () => {
    const t = base(), h = toolsHtml(toolsFor(t.p, t.ids[0]!)); expect(h).toContain('data-act="addChild"'); expect(h).toContain('aria-label="Adicionar filho'); expect(h).toContain('data-kind="if"'); expect(h).toContain("danger");
    expect(toolsFor(t.p, "zzz")).toEqual([]);
  });
});

describe("remover: sempre o mesmo ícone de lixeira", () => {
  it("função, if, for, try, catch e dados usam a lixeira (e só ela é usada para remover)", () => {
    const t = base(); const ids = { i: t.run({ type: "wrap", id: t.ids[0]!, kind: "if" }), f: t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }), y: t.run({ type: "wrap", id: t.ids[2]!, kind: "try" }) };
    const rem = [...toolsFor(t.p, t.ids[0]!), ...toolsFor(t.p, ids.i), ...toolsFor(t.p, ids.f), ...toolsFor(t.p, ids.y), ...toolsFor(t.p, ids.y, "catch")].filter(x => x.act === "remove" || x.act === "unwrap");
    expect(rem.length).toBe(5); expect(new Set(rem.map(x => x.icon))).toEqual(new Set(["trash"])); expect(rem.every(x => x.danger)).toBe(true);
    // nenhum outro botão usa a lixeira
    expect([...toolsFor(t.p, ids.i), ...toolsFor(t.p, t.ids[3]!)].filter(x => x.icon === "trash").every(x => x.act === "remove" || x.act === "unwrap")).toBe(true);
  });
  it("o botão de remover entrada/saída também é a lixeira", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "x" }); const h = t.view().table;
    expect(h).toMatch(/data-act="rmIo"[^>]*>\s*<svg[^>]*>.*M3 6h18/); expect(h).not.toContain(">×<");
  });
});

describe("tabela", () => {
  it("raiz mostra o arquivo; função sem responsável mostra círculo tracejado com +; concreta mostra a lib; todas têm o círculo da função", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[1]!, agent: "http" });
    const h = t.view().table; expect(h).toContain("r.ts"); expect(h).toContain("fav arquivo"); expect(h).toContain("fav none"); expect(h).toContain("node:http"); expect(h).toContain("fav maquina");
    expect((h.match(/class="fn-dot /g) ?? []).length).toBe(4); expect(h).toContain("fn-dot conc"); expect(h).toContain("fn-dot nag");
  });
  it("lib concreta mostra seletor de função; IA mostra a etiqueta do agente e a pessoa responsável", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "http" }); t.run({ type: "assign", id: t.ids[1]!, agent: "lia" }); t.run({ type: "setResp", id: t.ids[1]!, resp: "ana" });
    const h = t.view().table; expect(h).toContain('class="task-pick"'); expect(h).toContain("<option selected>get</option>"); expect(h).toContain("agent-tag"); expect(h).toContain("Ana Souza"); expect(h).toContain('data-change="setResp"');
  });
  it("clicar no texto renomeia (data-act=rename); composta tem a sanfona", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[0]!, title: "A1" }); const h = t.view().table; expect(h).toContain('data-act="rename"'); expect(h).toContain('data-act="toggle"'); expect(h).toContain("gi");
    expect(t.view({ closed: new Set([t.ids[0]!]) }).table).not.toContain(">A1<"); expect(t.view({ closed: new Set([t.ids[0]!]) }).table).toContain("car shut");
  });
  it("blocos: linhas if/for/try/catch com rótulos e as mesmas ferramentas; indentam por profundidade", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.ids[0]!, kind: "if", test: "ok" }); t.run({ type: "addElse", id: i });
    t.run({ type: "wrap", id: t.ids[1]!, kind: "for", v: "x", coll: "xs" }); t.run({ type: "wrap", id: t.ids[3]!, kind: "try" });
    const h = t.view().table; expect(h).toContain("if (ok)"); expect(h).toContain('class="trd e">else'); expect(h).toContain("elserow"); expect(h).toContain("for (x of xs)"); expect(h).toContain('class="trd">try'); expect(h).toContain('class="trd c">catch'); expect(h).toContain("se o try falhar");
    for (const k of ["ifrow", "forrow", "tryrow", "catchrow"]) expect(h).toContain(k); expect(h).toMatch(/padding-left:\d+px/);
  });
  it("linhas de entrada/saída mostram os nomes com botão de remover; a linha escolhida fica marcada", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); const h = t.view({ sel: t.ids[0]! }).table;
    expect(h).toContain("entrada · saída"); expect(h).toContain('data-act="rmIo"'); expect(h).toContain('data-kind="in"'); expect(h).toContain('data-kind="out"'); expect(h).toContain("grow sel");
  });
});

describe("plano (SVG)", () => {
  it("uma barra por função folha, nome ao lado (ou dentro com o modo texto), colunas e passos", () => {
    const t = base(), v = t.view(); expect((v.plan.match(/class="fn nag/g) ?? []).length).toBe(4); expect(v.plan).toContain("s0"); expect(v.plan).toContain("s3"); expect((v.plan.match(/class="lbl"/g) ?? []).length).toBe(5);   // 4 funções + o resumo da raiz
    const inside = t.view({ txtIn: true }).plan; expect(inside).toContain('class="fbt nag"'); expect((inside.match(/class="lbl"/g) ?? []).length).toBe(1);
  });
  it("função concreta e abstrata têm classes diferentes; selecionada ganha destaque", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "http" }); t.run({ type: "assign", id: t.ids[1]!, agent: "lia" });
    const p = t.view({ sel: t.ids[0]! }).plan; expect(p).toContain("fn conc sel"); expect(p).toContain("fn abs");
  });
  it("sequência liga as funções com cotovelos; paralelas não se ligam entre si", () => {
    const t = base(); const n = (s: string): number => (s.match(/class="dep"/g) ?? []).length; expect(n(t.view().plan)).toBe(3); t.run({ type: "setParallel", id: t.ids[1]!, on: true }); expect(n(t.view().plan)).toBe(3);   // A>C, B>C, C>D (A e B não se ligam)
    t.run({ type: "setParallel", id: t.ids[3]!, on: true }); expect(n(t.view().plan)).toBe(4);   // C e D no mesmo passo: A>C, A>D, B>C, B>D
  });
  it("fantasmas de entrada/saída só onde falta; marcas onde há dados (abstrata = vazada, concreta = cheia)", () => {
    const t = base(); expect((t.view().plan.match(/class="ghost"/g) ?? []).length).toBe(8);
    t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); t.run({ type: "addInput", id: t.ids[1]!, name: "y" }); t.run({ type: "addInput", id: t.ids[2]!, name: "externo" });
    const p = t.view().plan; expect((p.match(/class="ghost"/g) ?? []).length).toBe(8 - 3); expect(p).toContain('class="dot"'); expect(p).toContain('class="dot a"'); expect(p).toContain('data-act="addIo"');
  });
  it("blocos: banda tracejada, etiqueta, alça e losango do if; catch vermelho; edição só em if/for", () => {
    const t = base(); t.run({ type: "wrap", id: t.ids[0]!, kind: "if", test: "ok" }); t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }); t.run({ type: "wrap", id: t.ids[2]!, kind: "try" });
    const p = t.view().plan; for (const c of ["band if", "band lp", "band tr", "band ca"]) expect(p).toContain(c); expect(p).toContain('class="fif"'); expect(p).toContain("data-drag="); expect(p).toContain("catch · se o try falhar");
    expect((p.match(/data-act="editBlock"/g) ?? []).length).toBe(2); expect(p).toContain("↻ for (item of itens)");
  });
  it("etiqueta do if começa depois do losango e cobre os passos do bloco", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" }); t.run({ type: "setScope", id: i, count: 2 }); const p = t.view().plan;
    const m = p.match(/<g class="pill if"[^>]*><rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/)!; expect(Number(m[1])).toBe(colX(1) + 11); expect(Number(m[2])).toBeGreaterThan(G.W);
  });
  it("composta mostra a barra-resumo; fechada continua com o resumo", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[1]!, title: "B1" }); expect(t.view().plan).toContain('class="sum"'); expect(t.view({ closed: new Set([t.ids[1]!]) }).plan).toContain('class="sum"');
  });
  it("geometria: colunas e linhas", () => { const t = base(), s = t.view().scene; expect(colX(1) - colX(0)).toBe(G.W); expect(rowY(2) - rowY(1)).toBe(G.RH); expect(planWidth(s)).toBeGreaterThan(colX(s.nSteps)); expect(renderPlan(t.p, locate(t.p, t.root)!.node as Fn, layout(locate(t.p, t.root)!.node as Fn), t.ui())).toContain("<svg"); });
  it("esc escapa HTML e ícones são SVG", () => { expect(esc('<a href="x">&')).toBe("&lt;a href=&quot;x&quot;&gt;&amp;"); expect(icon("plus")).toContain("<svg"); expect(icon("package")).toContain("<path"); expect(icon("naoexiste")).toContain("<svg"); });
  it("exemplo completo renderiza tabela e plano sem erro nos dois fluxos", () => {
    const s = sampleProject(); for (const f of s.project.flows) { const v = build(s.project, f.id, { closed: new Set(), sel: null, txtIn: false }); expect(v.table.length).toBeGreaterThan(50); expect(v.plan).toContain("</svg>"); }
    expect(renderTable(s.project, layout(s.project.flows[1]!), { closed: new Set(), sel: null, txtIn: false })).toContain("node:http");
    expect(() => build(s.project, "nope", { closed: new Set(), sel: null, txtIn: false })).toThrow();
  });
});

describe("quadrado do dado", () => {
  it("fica na linha da função, na coluna de entrada / saída (onde nasce a caixa fantasma), e não na linha de baixo", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[1]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "y" });
    const v = t.view(), row = v.scene.rows.findIndex(r => r.id === t.ids[1] && r.kind === "fn"), cy = rowY(row) + G.RH / 2;
    const squares = [...v.plan.matchAll(/<rect class="dot(?: a)?" x="([\d.]+)" y="([\d.]+)" width="8" height="8"\/>/g)].map(m => ({ x: Number(m[1]) + 4, y: Number(m[2]) + 4 }));
    expect(squares).toHaveLength(2); expect(squares.every(q => q.y === cy)).toBe(true); expect(squares.map(q => q.x)).toEqual([colX(1), colX(2)]);
    // o fantasma que existia no mesmo ponto some quando o dado é criado
    expect(v.plan).not.toMatch(new RegExp(`data-act="addIo" data-id="${t.ids[1]}" data-kind="in"`));
  });
  it("o nome do dado fica na altura do quadrado: entradas à esquerda dele, saídas à direita", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[1]!, name: "dados_cliente" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "rascunho" });
    const v = t.view(), fnRow = v.scene.rows.findIndex(r => r.id === t.ids[1] && r.kind === "fn"), cy = rowY(fnRow) + G.RH / 2;
    const names = [...v.plan.matchAll(/<text class="dn (in|out)" x="([\d.]+)" y="([\d.]+)" text-anchor="(\w+)">([^<]+)</g)].map(m => ({ side: m[1], x: Number(m[2]), y: Number(m[3]), anchor: m[4], n: m[5] }));
    expect(names.map(n => [n.side, n.anchor, n.n])).toEqual([["in", "end", "dados_cliente"], ["out", "start", "rascunho"]]);
    expect(names.map(n => n.x)).toEqual([colX(1) - G.GAP, colX(2) + G.GAP]); expect(names.every(n => Math.abs(n.y - 3.5 - cy) < 0.01)).toBe(true);   // mesma altura do quadrado
  });
  it("listas longas viram reticências no plano (a lista inteira fica no tooltip) e o nome da função se afasta do dado da saída", () => {
    expect(dataText(["a", "b"])).toBe("a, b"); expect(dataText(["proposta_aprovada", "dados_cliente"])).toMatch(/…$/); expect(dataText(["proposta_aprovada", "dados_cliente"]).length).toBe(24);
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "resultado" }); const p = t.view().plan;
    const lbl = Number(p.match(/<text class="lbl" x="([\d.]+)"[^>]*>A</)![1]); expect(lbl).toBeGreaterThan(colX(1) + G.GAP + "resultado".length * 5.6);
  });
  it("entrada cujo dado alguém produz = quadrado cheio; vinda de fora = vazado; saída sempre cheia", () => {
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); t.run({ type: "addInput", id: t.ids[1]!, name: "y" }); t.run({ type: "addInput", id: t.ids[2]!, name: "de_fora" });
    const p = t.view().plan; expect((p.match(/class="dot a"/g) ?? []).length).toBe(1); expect((p.match(/class="dot"/g) ?? []).length).toBe(2);
  });
});

describe("dado e cubo: cada lado tem UM dado (quadrado); mais de um vira CUBO", () => {
  it("regras: isCube e nome do cubo (entrada_/saida_ + função)", () => {
    expect(isCube([])).toBe(false); expect(isCube(["a"])).toBe(false); expect(isCube(["a", "b"])).toBe(true);
    const t = base(); t.run({ type: "rename", id: t.ids[0]!, title: "Gerar contrato" }); const f = locate(t.p, t.ids[0]!)!.node as Fn;
    expect(cubeName(f, "in")).toBe("entrada_gerar_contrato"); expect(cubeName(f, "out")).toBe("saida_gerar_contrato");
  });
  it("um dado = quadrado; dois ou mais = cubo no plano (no mesmo ponto), com o nome do cubo e os campos no tooltip", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[1]!, name: "x" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "y" });
    let p = t.view().plan; expect((p.match(/class="dot/g) ?? []).length).toBe(2); expect(p).not.toContain('class="cube');
    t.run({ type: "addInput", id: t.ids[1]!, name: "z" }); t.run({ type: "addOutput", id: t.ids[1]!, name: "w" }); p = t.view().plan;
    expect((p.match(/class="cube/g) ?? []).length).toBe(2); expect((p.match(/class="dot/g) ?? []).length).toBe(0);
    expect(p).toContain(">entrada_b<"); expect(p).toContain(">saida_b<"); expect(p).toContain("<title>x, z</title>"); expect(p).toContain("<title>y, w</title>");
    const row = t.view().scene.rows.findIndex(r => r.id === t.ids[1] && r.kind === "fn"), cy = rowY(row) + G.RH / 2;
    const ys = [...p.matchAll(/<path class="cube(?: a)?" transform="translate\(([\d.]+) ([\d.]+)\)"/g)].map(m => ({ x: Number(m[1]) + 5, y: Number(m[2]) + 5.5 }));
    expect(ys.map(q => q.x)).toEqual([colX(1), colX(2)]); expect(ys.every(q => q.y === cy)).toBe(true);   // o cubo fica onde ficaria o quadrado
  });
  it("entrada de fora (state) = cubo vazado; saída = cubo cheio", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "a" }); t.run({ type: "addInput", id: t.ids[0]!, name: "b" }); expect(t.view().plan).toContain('class="cube a"');
    t.run({ type: "addOutput", id: t.ids[0]!, name: "c" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "d" }); expect(t.view().plan).toMatch(/class="cube" /);
  });
  it("tabela: quadrado com nome, ou cubo com os campos, lixeira por campo e + para juntar mais um dado", () => {
    const t = base(); t.run({ type: "addOutput", id: t.ids[0]!, name: "y" }); let h = t.view().table;
    expect(h).toContain('class="sq out"'); expect(h).not.toContain("io-cube"); expect(h).toContain('data-act="addIo" data-id="' + t.ids[0] + '" data-kind="out"');
    t.run({ type: "addOutput", id: t.ids[0]!, name: "w" }); h = t.view().table;
    expect(h).toContain("io-d cubed"); expect(h).toContain("io-cube"); expect(h).toContain("saida_a"); expect(h).toContain("fld"); expect((h.match(/data-act="rmIo"/g) ?? []).length).toBe(2);
  });
  it("a tabela cresce para a linha de dados com cubo caber inteira", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "e" }); const before = t.view().scene;
    t.run({ type: "addInput", id: t.ids[0]!, name: "uma_entrada_com_nome_bem_grande" }); t.run({ type: "addInput", id: t.ids[0]!, name: "outra_entrada_igualmente_grande" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "saida_um" }); t.run({ type: "addOutput", id: t.ids[0]!, name: "saida_dois" });
    expect(tableWidth(t.view().scene)).toBeGreaterThan(tableWidth(before));
  });
  it("juntar um segundo dado pelo + funciona pelo mesmo comando e o código usa todos os campos", () => {
    const t = base(); t.run({ type: "addInput", id: t.ids[0]!, name: "p" }); t.run({ type: "addInput", id: t.ids[0]!, name: "q" });
    expect((locate(t.p, t.ids[0]!)!.node as Fn).ins).toEqual(["p", "q"]);
  });
});

describe("modo texto: barra na largura do texto, com padding", () => {
  it("colW cresce com o nome mais comprido e só no modo texto", () => {
    const t = base(); expect(colW(t.view().scene, { txtIn: false })).toBe(G.W); expect(colW(t.view().scene, { txtIn: true })).toBe(G.W);
    t.run({ type: "rename", id: t.ids[0]!, title: "um_nome_de_funcao_bem_comprido_mesmo_de_verdade" });
    const big = colW(t.view().scene, { txtIn: true }); expect(big).toBeGreaterThan(G.W); expect(colW(t.view().scene, { txtIn: false })).toBe(G.W);
  });
  it("a barra tem folga dos dois lados e as colunas acompanham", () => {
    const t = base(); t.run({ type: "rename", id: t.ids[0]!, title: "um_nome_de_funcao_bem_comprido_mesmo_de_verdade" });
    const v = t.view({ txtIn: true }), m = v.plan.match(/<rect class="fn nag" x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/)!;
    expect(Number(m[2])).toBeGreaterThanOrEqual("um_nome_de_funcao_bem_comprido_mesmo_de_verdade".length * 6.2 + 24); expect(v.w).toBe(Number(m[2]) + 2 * G.INS);
    expect(planWidth(v.scene, v.w)).toBeGreaterThan(planWidth(v.scene));
  });
});

describe("else no flow (mesmo princípio do catch)", () => {
  it("aparece linha de else na tabela e faixa + etiqueta no plano, e some quando o else some", () => {
    const t = base(), i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if", test: "ok" });
    let v = t.view(); expect(v.table).not.toContain("elserow"); expect(v.plan).not.toContain("band el");
    t.run({ type: "addElse", id: i, title: "Plano B" }); v = t.view();
    expect(v.table).toContain("elserow"); expect(v.table).toContain('class="trd e">else'); expect(v.table).toContain("Plano B"); expect(v.plan).toContain("band el"); expect(v.plan).toContain("else · senão"); expect(v.plan).toContain('data-part="else"');
    expect(v.scene.rows.filter(r => r.kind === "else")).toHaveLength(1);
    t.run({ type: "removeElse", id: i }); expect(t.view().table).not.toContain("elserow");
  });
  it("o else cobre as mesmas linhas que o conteúdo dele (faixa até a última função do else)", () => {
    const t = base(), i = t.run({ type: "wrap", id: t.ids[1]!, kind: "if" }); t.run({ type: "addElse", id: i }); t.run({ type: "addChild", id: i, else: true, title: "Antes" });
    const v = t.view(), el = v.scene.rows.findIndex(r => r.kind === "else"), row = v.scene.rows[el]!;
    expect(row.last).toBeGreaterThan(el); expect((v.plan.match(/class="band el"/g) ?? []).length).toBe(1); expect(v.plan).toContain(`height="${(row.last - el + 1) * G.RH}"`);
  });
});

describe("alça do bloco (arrastar)", () => {
  it("countForStep conta os itens (do bloco + irmãos seguintes) cobertos até o passo", () => {
    const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind: "for" }), sc = layout(t.p.flows[0]!);
    expect(countForStep(t.p, sc, b, 1)).toBe(1); expect(countForStep(t.p, sc, b, 2)).toBe(2); expect(countForStep(t.p, sc, b, 3)).toBe(3); expect(countForStep(t.p, sc, b, 99)).toBe(3); expect(countForStep(t.p, sc, b, -5)).toBe(1);
    expect(countForStep(t.p, sc, t.ids[0]!, 3)).toBe(1);   // função não tem escopo
  });
  it("aplicar o resultado com setScope aumenta e diminui o bloco (if, for, try)", () => {
    for (const kind of ["if", "for", "try"] as const) {
      const t = base(), b = t.run({ type: "wrap", id: t.ids[1]!, kind }); const n = countForStep(t.p, layout(t.p.flows[0]!), b, 3); t.run({ type: "setScope", id: b, count: n }); expect(locate(t.p, b)!.node.kids).toHaveLength(3);
      t.run({ type: "setScope", id: b, count: countForStep(t.p, layout(t.p.flows[0]!), b, 0) }); expect(locate(t.p, b)!.node.kids).toHaveLength(1);
    }
  });
});
