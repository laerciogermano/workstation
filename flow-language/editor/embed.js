/* Flow Language · modo incorporado (?demo=artigo | ?demo=cN)
 * Monta o roteiro do artigo (artigo-flows.js, gerado de flow-component/docs/roteiro.md + Meditações) como um fluxo do próprio
 * editor: o artigo é a função raiz, cada capítulo uma filha, cada subseção uma filha do capítulo. Mostra só o Flow (sem barra, explorar nem código).
 */
(() => {
  const demo = new URLSearchParams(location.search).get("demo");
  if (!demo || !window.ARTIGO) return;
  const slug = t => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const short = t => { const w = slug(t).split("_"); let o = ""; for (const x of w) { if ((o + "_" + x).length > 30 && o) break; o = o ? o + "_" + x : x; } return o; };
  const PLAN = "artigo", LANE = LANES[0].id;
  PLANS.push({ id: PLAN, name: "Artigo Flow" });
  U.push({ id: "fa", kind: "folder", title: "Artigo", parent: null, lane: LANE, plan: PLAN, arch: false });
  let n = 0;
  const mk = (parent, title, ctx, agent, ins, outs, extra = {}) => { const u = { id: "ar" + (++n), kind: "file", title, ctx, parent, agent, col: "c1", lane: LANE, plan: PLAN, arch: false, st: "pendente", ins, outs: outs.map(o => [o, "out/" + o + ".md"]), ...extra }; U.push(u); return u; };
  const only = /^c(\d+)$/.test(demo) ? +demo.slice(1) : 0;
  const root = only ? { id: "fa" } : mk("fa", "escrever_artigo", "Flow: o roteiro do artigo, capítulo a capítulo", "m1", [], ["artigo"]);
  let capRoot = root, prevC = null;
  ARTIGO.caps.forEach(c => {
    if (only && only !== c.n) return;
    const top = mk(only ? "fa" : root.id, "cap_" + String(c.n).padStart(2, "0") + "_" + short(c.t), c.t, "m1", prevC ? ["cap_" + (c.n - 1)] : [], ["cap_" + c.n]);
    if (prevC) DEPS.push([prevC.id, top.id]);
    prevC = top;
    if (only === c.n) capRoot = top; else if (!only) return;   // visão geral: só os 12 capítulos; as filhas ficam em cada capítulo
    let prev = null, pOut = null;
    [...c.s.map(t => [t, "m1"]), ...c.x.map(t => [t, "a1"])].forEach(([t, ag], i) => {
      const o = "c" + c.n + "_s" + (i + 1);
      const k = mk(top.id, short(t), t, ag, pOut ? [pOut] : [], [o]);
      if (prev) DEPS.push([prev.id, k.id]);
      prev = k; pOut = o;
    });
  });
  const flowRoot = only ? capRoot.id : root.id;
  document.documentElement.classList.add("embed");
  const st = document.createElement("style");
  st.textContent = `html.embed .tb, html.embed .live, html.embed .full-exit, html.embed .code-tog, html.embed .vdock, html.embed .flegend, html.embed .bar-tools, html.embed .fl-tools{display:none!important}
  html.embed .body{grid-template-columns:minmax(0,1fr)!important}`;
  document.head.append(st);
  CODE.open = false; setTema("eternos");
  SCREENS["T-ART"] = { s: { v: "flow", plan: PLAN, flowRoot, sel: null }, name: "Artigo", us: [], notes: "" };
  openT("T-ART");

})();
