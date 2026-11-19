import { describe, expect, it } from "vitest";
import { icon } from "../../novo/icons";
import { layout } from "../../novo/layout";
import { apply, DEFAULT_AGENTS, emptyProject, locate, type Command, type Fn, type Project } from "../../novo/model";
import { sampleProject } from "../../novo/sample";
import { countForStep } from "../../novo/scope";
import { build, colX, esc, G, planWidth, renderPlan, renderTable, rowY, toolsFor, toolsHtml, type Ui } from "../../novo/view";

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
    expect(tools.map(x => x.act)).toEqual(["addChild", "wrap", "addSibling", "setScope", "setScope", "unwrap"]); expect(tools.at(-1)!.danger).toBe(true);
    expect(tools[0]!.title).toContain(kind === "try" ? "try" : kind);
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

describe("tabela", () => {
  it("raiz mostra o arquivo; função sem responsável mostra círculo tracejado com +; concreta mostra a lib; todas têm o círculo da função", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[1]!, agent: "http" });
    const h = t.view().table; expect(h).toContain("r.ts"); expect(h).toContain("fav arquivo"); expect(h).toContain("fav none"); expect(h).toContain("node:http"); expect(h).toContain("fav maquina");
    expect((h.match(/class="fn-dot /g) ?? []).length).toBe(4); expect(h).toContain("fn-dot conc"); expect(h).toContain("fn-dot nag");
  });
  it("lib concreta mostra seletor de task; IA mostra a etiqueta do agente e a pessoa responsável", () => {
    const t = base(); t.run({ type: "assign", id: t.ids[0]!, agent: "http" }); t.run({ type: "assign", id: t.ids[1]!, agent: "lia" }); t.run({ type: "setResp", id: t.ids[1]!, resp: "ana" });
    const h = t.view().table; expect(h).toContain('class="task-pick"'); expect(h).toContain("<option selected>get</option>"); expect(h).toContain("agent-tag"); expect(h).toContain("Ana Souza"); expect(h).toContain('data-change="setResp"');
  });
  it("clicar no texto renomeia (data-act=rename); composta tem a sanfona", () => {
    const t = base(); t.run({ type: "addChild", id: t.ids[0]!, title: "A1" }); const h = t.view().table; expect(h).toContain('data-act="rename"'); expect(h).toContain('data-act="toggle"'); expect(h).toContain("gi");
    expect(t.view({ closed: new Set([t.ids[0]!]) }).table).not.toContain(">A1<"); expect(t.view({ closed: new Set([t.ids[0]!]) }).table).toContain("car shut");
  });
  it("blocos: linhas if/for/try/catch com rótulos e as mesmas ferramentas; indentam por profundidade", () => {
    const t = base(); const i = t.run({ type: "wrap", id: t.ids[0]!, kind: "if", test: "ok" }); t.run({ type: "setIf", id: i, test: "ok", elseTo: t.ids[2]! });
    t.run({ type: "wrap", id: t.ids[1]!, kind: "for", v: "x", coll: "xs" }); t.run({ type: "wrap", id: t.ids[3]!, kind: "try" });
    const h = t.view().table; expect(h).toContain("if (ok) · senão → C"); expect(h).toContain("for (x of xs)"); expect(h).toContain('class="trd">try'); expect(h).toContain('class="trd c">catch'); expect(h).toContain("se o try falhar");
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
