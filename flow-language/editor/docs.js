/* Flow IDE · Docs › Fundamentos
 * Explica cada conceito da linguagem Flow (flow-language/README.md · FOP · flow-dev/docs/linguagem-flow.md)
 * usando o próprio Flow IDE como exemplo: ícones, barras, dados e responsáveis abaixo são desenhados
 * a partir do estado atual do fluxo “Fazer onboarding da Acme” (U, CAT, LAYERS…). Mudou no Flow, muda aqui.
 * Fica fora do index.html de propósito: entra por cima das funções globais (win, bar, explorer, tFor, view, paint).
 */
(() => {
  const PLAN = "onb", ROOT = "u9", ATIVAR = "u16";

  // ================= peças visuais (as mesmas classes do IDE) =================
  const isComp = u => !!u && flowKids(u).some(k => !k.arch && !isData(k));
  const fnKids = id => kidsPlan(id).filter(k => !k.arch && !isFolder(k) && !isData(k));
  const fnKind = u => { const a = agent(u.agent); return !a ? "nag" : a.type === "ia" ? "abs" : "conc"; };
  const mk = (n, abs) => `<span class="dk-d"><i class="mk${abs ? " a" : ""}"></i>${esc(n)}</span>`;
  const code = (txt, lang = "") => `<pre class="dk-code"${lang ? ` data-l="${lang}"` : ""}><code>${esc(txt)}</code></pre>`;
  const P = (...ps) => ps.map(p => `<p>${p}</p>`).join("");
  const H = t => `<h3>${t}</h3>`;
  const RULE = t => `<div class="dk-rule">${icon("info")}<span>${t}</span></div>`;
  const TABLE = (head, rows, cls = "") => `<table class="dk-t ${cls}"><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const link = (sec, t) => `<button class="dk-a" data-act="doc-sec" data-sec="${sec}">${t}</button>`;
  /** Bloco “No Flow IDE”: o conceito aplicado no fluxo de exemplo + botão que leva ao lugar exato no Flow. */
  const EX = (title, html, go, extra = "") => `<section class="dk-ex"><header>${icon("workflow")}<b>No Flow IDE</b><span>${title}</span></header><div class="dk-ex-b">${html}</div>${go || extra ? `<footer>${extra}${go ? `<button class="btn pri" data-act="doc-go" data-k="${go[0]}">${icon("arrow-up-right")}${go[1]}</button>` : ""}</footer>` : ""}</section>`;
  const TRY = (k, on, offTxt, onTxt) => `<button class="btn" data-act="doc-try" data-k="${k}">${icon(on ? "undo-2" : "flask-conical")}${on ? onTxt : offTxt}</button>`;

  /** Linha igual à do Explorar › Funções (fnIcon decide sólido · preto · vazado). */
  function dkFn(id, lvl = 0, deep = false) {
    const u = $u(id); if (!u) return "";
    const comp = isComp(u);
    const row = `<div class="node dk-n" style="padding-left:${8 + lvl * 16}px">${Array.from({ length: lvl }, (_, i) => `<span class="guide" style="left:${16 + i * 16}px"></span>`).join("")}<span class="car">${comp ? icon(deep ? "chevron-down" : "chevron-right") : ""}</span>${fnIcon(u)}<span class="t">${esc(u.title)}</span><span class="meta">${comp ? `<span class="dk-mut">${fnKids(u.id).length} filhas</span>` : agChip(u.agent)}</span></div>`;
    return row + (deep && comp ? fnKids(u.id).map(k => dkFn(k.id, lvl + 1, true)).join("") : "");
  }
  /** Linha igual à do Explorar › Dados (cubo vermelho · preto quando abstrato). */
  function dkDado(name, lvl = 0, deep = true) {
    const abs = dadoIsAbs(name), ks = dKids(name), has = dadoHasValue(name);
    const val = ks.length ? `${ks.filter(dadoHasValue).length}/${ks.length} campos` : has ? esc(DATA_VAL[name]) : "sem valor";
    const row = `<div class="node dk-n" style="padding-left:${8 + lvl * 16}px">${Array.from({ length: lvl }, (_, i) => `<span class="guide" style="left:${16 + i * 16}px"></span>`).join("")}<span class="car">${ks.length ? icon(deep ? "chevron-down" : "chevron-right") : ""}</span><span class="fi dado${abs ? " abs" : ""}">${icon("box")}</span><span class="t mono">${esc(lvl ? dLeaf(name) : name)}</span><span class="meta"><span class="dk-ty">${DTYPE_N[dType(name)]}</span><span class="dk-mut${has ? "" : " i"}">${val}</span>${abs ? `<span class="dk-tag a">abstrato</span>` : `<span class="dk-tag">sólido</span>`}</span></div>`;
    return row + (deep ? ks.map(k => dkDado(k, lvl + 1, true)).join("") : "");
  }
  /** Barra de função como no Flow: IA = só borda (abstrata), sem responsável = vazada, lib/script/pessoa = preenchida. */
  const dkBar = (u, w, style = "") => `<span class="fbar dk-fb ${fnKind(u)}" style="--c:var(--fn);width:${w}px;${style}"><span class="fb-t">${esc(u.title)}${u.loop ? " ↻" : ""}</span></span>`;
  /** Entradas → função → saídas (□ concreto · ■ abstrato). */
  function dkIO(id) {
    const u = $u(id); if (!u) return "";
    const ins = u.ins || [], outs = (u.outs || []).map(o => o[0]);
    return `<div class="dk-io"><div class="dk-io-c"><small>entradas</small>${ins.map(n => mk(n, dadoIsAbs(n))).join("") || `<span class="dk-mut">—</span>`}</div>
      <span class="dk-arr">${icon("arrow-right")}</span><div class="dk-io-f">${dkBar(u, 190)}${agChip(u.agent)}</div>
      <span class="dk-arr">${icon("arrow-right")}</span><div class="dk-io-c"><small>saídas</small>${outs.map(n => mk(n, false)).join("") || `<span class="dk-mut">—</span>`}</div></div>`;
  }
  /** Mini-Flow: as mesmas barras no eixo s0…sN, com o passo real de cada função (flowLayout). */
  function dkFlow(ids, { sum = null, mark = {} } = {}) {
    const list = (sum ? [sum, ...ids] : ids).map($u).filter(Boolean);
    if (!list.length) return "";
    const top = flowTop(list[0]);
    const { layout } = flowLayout(list[0].plan, top.id);
    const rows = list.map(u => ({ u, ...(layout[u.id] || { s: 0, e: 0 }) }));
    const s0 = Math.min(...rows.map(r => r.s)), n = Math.max(...rows.map(r => r.e)) + 1 - s0;
    const CW = Math.max(84, Math.min(130, Math.floor(560 / Math.max(n, 1)))), LP = 18, TOP = 30, RH = 30;
    const axis = Array.from({ length: n + 1 }, (_, i) => `<i class="dk-div" style="left:${LP + i * CW}px"></i><span class="dk-sx" style="left:${LP + i * CW}px">s${i}</span>`).join("");
    const bars = rows.map((r, i) => {
      const x = LP + (r.s - s0) * CW, w = (r.e - r.s + 1) * CW, y = TOP + i * RH;
      // texto fora da barra (padrão do Flow): nome à direita, com a marca da estrutura (∥, ↻…)
      const lbl = `<span class="dk-bl" style="left:${x + w - 4}px;top:${y + 4}px">${mark[r.u.id] ? `<em>${mark[r.u.id]}</em>` : ""}${esc(r.u.title)}${r.u.loop ? " <em>↻</em>" : ""}</span>`;
      if (r.u.id === sum) return `<span class="dk-sum" style="left:${x}px;width:${w}px;top:${y + 8}px"><b>${esc(r.u.title)}</b></span>`;
      return `<span class="fbar dk-fb ${fnKind(r.u)}" style="--c:var(--fn);position:absolute;left:${x + 10}px;top:${y + 4}px;width:${w - 20}px"><span class="fb-t">&nbsp;</span></span>` + lbl;
    }).join("");
    return `<div class="dk-flow-w"><div class="dk-flow" style="width:${LP * 2 + n * CW + 200}px;height:${TOP + rows.length * RH + 6}px">${axis}${bars}</div></div>`;
  }
  /** Dados acumulados em cada sN (o “bag” sob o eixo do Flow). */
  function dkBags(rootId) {
    const ks = fnKids(rootId), { layout } = flowLayout(PLAN, rootId);
    const prod = new Set(ks.flatMap(u => (u.outs || []).map(o => o[0])));
    const ext = [...new Set(ks.flatMap(u => u.ins || []).filter(n => !prod.has(n)))];
    const s0 = Math.min(...ks.map(u => layout[u.id]?.s ?? 0)), n = Math.max(...ks.map(u => layout[u.id]?.e ?? 0)) + 1 - s0;
    return Array.from({ length: n + 1 }, (_, i) => {
      const got = ks.filter(u => (layout[u.id]?.e ?? 0) + 1 - s0 <= i).flatMap(u => (u.outs || []).map(o => o[0]));
      const novos = new Set(ks.filter(u => (layout[u.id]?.e ?? 0) + 1 - s0 === i).flatMap(u => (u.outs || []).map(o => o[0])));
      return `<div class="dk-bag"><b>s${i}</b>${[...ext.map(x => [x, true]), ...got.map(x => [x, false])].map(([x, a]) => `<span class="dk-d${novos.has(x) ? " new" : ""}"><i class="mk${a ? " a" : ""}"></i>${esc(x)}</span>`).join("") || `<span class="dk-mut">vazio</span>`}</div>`;
    }).join("");
  }
  /** Abstratos que uma camada (composição de topo) pede ao state. */
  function dkState(rootId) {
    const all = desc(rootId).filter(k => !k.arch && !isFolder(k) && !isData(k));
    const prod = new Set(all.flatMap(u => (u.outs || []).map(o => o[0])));
    const dados = [...new Set(all.flatMap(u => u.ins || []).filter(n => !prod.has(n)))];
    const ias = [...new Set(all.filter(u => !isComp(u)).map(u => agent(u.agent)).filter(a => a && a.type === "ia"))];
    return { dados, ias, prod: [...prod] };
  }

  // ================= “experimente”: mexe de verdade no modelo e devolve =================
  const TRYS = {
    "sem-resp": { on: () => $u("u14").agent == null, set: on => { const u = $u("u14"); if (on) { TRYS["sem-resp"].prev = u.agent; u.agent = null; } else u.agent = TRYS["sem-resp"].prev || "a1"; } },
    "valor-cliente": {
      keys: { "dados_cliente.nome": "Acme Ltda", "dados_cliente.cnpj": "12.345.678/0001-90", "dados_cliente.contatos.email": "compras@acme.com", "dados_cliente.contatos.telefone": "+55 11 4000-1234" },
      on: () => dadoHasValue("dados_cliente"),
      set: on => Object.entries(TRYS["valor-cliente"].keys).forEach(([k, v]) => { if (on) DATA_VAL[k] = v; else delete DATA_VAL[k]; }),
    },
  };
  const tryOn = k => TRYS[k].on();

  // ================= conteúdo =================
  const T_ONB = () => esc($u(ROOT)?.title || "Fazer onboarding da Acme");
  const DOCS = [
    { id: "visao", g: "Começar", t: "O que é o Flow", ic: "book-open",
      lead: "Flow é uma linguagem para criar código mexendo nele de forma visual. Você desenha funções, dados e ligações; o mesmo desenho vira JavaScript, TypeScript, C ou Python.",
      body: () => P(
        "A base é a <b>Programação Orientada a Fluxo (FOP)</b>: o software é um fluxo de <b>dados</b> e <b>funções</b>, separado em <b>camadas</b> que podem ser trocadas. O Flow IDE é onde esse fluxo é desenhado, preenchido e exportado.",
        `Cada página desta docs explica um conceito e, embaixo, mostra o mesmo conceito no fluxo de exemplo <b>${T_ONB()}</b>. Os ícones e barras de exemplo são desenhados com o estado atual do IDE: se você mudar o fluxo, a docs muda junto.`)
        + H("O modelo em uma tabela")
        + TABLE(["Conceito", "Definição", ""], [
          ["<b>Fluxo</b>", "dados + funções", link("roteiros", "Roteiros")],
          ["<b>Dado</b>", "unidade de informação", link("dado", "Dado")],
          ["<b>Função</b>", "unidade de mudança de estado", link("funcao", "Função")],
          ["<b>Entrada / saída</b>", "endereços nomeados; <i>n</i> entradas e <i>n</i> saídas por função", link("estado-mudanca", "Estado e mudança")],
          ["<b>Contexto</b>", "conjunto de entradas; a execução ocorre quando a camada está completa", link("camadas", "Camadas e contexto")],
          ["<b>Camada</b>", "endereços que se conhecem; unidade substituível", link("camadas", "Camadas e contexto")],
          ["<b>Composição</b>", "sequência, paralelo, seleção, repetição", link("ordem", "Ordem")],
        ])
        + code("FOP (fundamentos)  →  Flow Language  →  Flow IDE  →  código\n   (modelo)            (criação visual)   (ferramenta)   (JS · TS · C · Python)")
        + EX("o fluxo de exemplo, como aparece em Explorar › Funções", dkFn(ROOT, 0, true) + dkFn(ATIVAR, 0, true), ["roteiro", "Abrir o fluxo de exemplo"]) },

    { id: "roteiros", g: "Fundamentos", t: "Software são roteiros", ic: "clapperboard",
      lead: "Um software é um roteiro que trabalha com informação. Quem programa é um roteirista: em vez de cenas, controla uma máquina de estados.",
      body: () => P("Todo roteiro responde a quatro perguntas. No Flow cada resposta tem um lugar fixo na tela.")
        + TABLE(["Pergunta", "No software", `Em “${T_ONB()}”`], [
          ["<b>Quem</b>", "o agente (responsável) que executa", [...new Set(fnKids(ROOT).map(u => u.agent))].map(id => agChip(id)).join(" ")],
          ["<b>O quê</b>", "o verbo, ou seja, a função", fnKids(ROOT).map(u => esc(u.title)).join(" · ")],
          ["<b>Quando</b>", "a ordem: sequência, paralelo, seleção, repetição", "Coletar → Rascunhar → Revisar → ◇ if → (Traduzir ∥ Gerar contrato) → Enviar"],
          ["<b>Para o quê</b>", "o estado final que se quer alcançar", mk("envio_id", false) + " a proposta enviada ao cliente"],
        ])
        + RULE("Exemplo do bolo: os <b>ingredientes</b> são os dados, a <b>receita</b> é o roteiro e a <b>pessoa</b> é o agente. Troque a pessoa e o bolo continua o mesmo. Troque a receita e muda o bolo.")
        + EX("o roteiro é a coluna Nome; quem executa é a coluna Responsável", dkFlow(fnKids(ROOT).map(u => u.id)), ["roteiro", "Ver o roteiro no Flow"]) },

    { id: "estado-mudanca", g: "Fundamentos", t: "Estado e mudança", ic: "arrow-right-left",
      lead: "O software é feito de estados e movimentos. O dado guarda a informação; a função transforma a informação.",
      body: () => `<blockquote class="dk-q">“Nada é permanente, exceto a mudança.” <span>— Heráclito</span></blockquote>`
        + P("Uma função recebe entradas, muda o estado e devolve saídas. Entradas e saídas são <b>endereços nomeados</b>: o nome da saída de uma função vira o endereço de entrada de quem vem depois.",
          "É assim que o Flow liga as etapas sem você desenhar setas: <span class=\"mono\">rascunho</span> sai de Rascunhar proposta e entra em Revisar proposta.")
        + RULE("Entradas → processamento → saídas. “Entra porco, sai linguiça.”")
        + EX("cada etapa com o que entra (antes da barra) e o que sai (depois)", dkIO("u10") + dkIO("u11") + dkIO("u12"), ["io", "Abrir Rascunhar proposta"]) },

    { id: "funcao", g: "Fundamentos", t: "Função", ic: "circle",
      lead: "A função é um verbo: a unidade de mudança de estado. O nome sempre começa com um verbo no infinitivo.",
      body: () => P("Comprar celular, Enviar proposta, Gerar contrato. Se não é verbo, não é função, e o Flow não aceita. Por isso <b>Explorar › Funções</b> não tem agrupadores como “Pessoal” ou “Site”: só verbos.",
        "Toda função tem um <b>ID único</b>. O nome pode repetir; as referências usam o ID.")
        + TABLE(["Elemento", "Regra", "Notação"], [["Função", "verbo no infinitivo; <i>n</i> entradas e <i>n</i> saídas", "○"], ["Composição", "função com funções filhas", "○ com filhos"]])
        + EX("teste um nome do jeito que o Flow testa ao renomear (F2)",
          `<label class="dk-verb"><span>Nome da função</span><input data-doc-verb value="Enviar proposta" spellcheck="false" aria-label="Nome da função"><output data-doc-verb-out>${verbOut("Enviar proposta")}</output></label>`
          + `<div class="dk-list">${fnKids(ROOT).concat(fnKids(ATIVAR)).map(u => `<span class="dk-chk${isVerbTitle(u.title) ? "" : " no"}">${icon(isVerbTitle(u.title) ? "check" : "x")}${esc(u.title)}</span>`).join("")}</div>`,
          ["verbo", "Renomear uma função no Flow"]) },

    { id: "dado", g: "Fundamentos", t: "Dado", ic: "box",
      lead: "O dado é uma caixa com nome e conteúdo. É um substantivo em snake_case, tem tipo e pode ter campos filhos.",
      body: () => P("Um dado pode ser simples (<span class=\"mono\">proposta_aprovada</span>, booleano) ou uma árvore (<span class=\"mono\">dados_cliente.contatos.email</span>). O pai só fica sólido quando <b>todos</b> os campos têm valor.")
        + H("Tipos e o que viram no código")
        + TABLE(["Flow", "JS", "TS", "C"], [["Texto", "string", "string", "char*"], ["Número", "number", "number", "double"], ["Inteiro", "number", "number", "int"], ["Booleano", "boolean", "boolean", "bool"], ["Data", "Date", "Date", "time_t"], ["Lista", "Array", "T[]", "T* + tamanho"], ["Objeto (com campos)", "{…}", "interface", "struct"], ["Arquivo", "caminho / Blob", "Blob", "FILE*"]].map(r => r.map((c, i) => i ? `<span class="mono">${esc(c)}</span>` : c)), "mono-cols")
        + EX("Explorar › Dados: o mesmo dado com tipo, campos e valor", dkDado("dados_cliente") + dkDado("proposta_aprovada") + dkDado("contrato"), ["dado", "Abrir o painel de dados_cliente"]) },

    { id: "abstrato", g: "Fundamentos", t: "Abstrato e sólido", ic: "square-dashed",
      lead: "Toda linguagem é feita de símbolos, e cada símbolo é um endereço. Abstrato é o espaço vazio; sólido é o que preenche o espaço.",
      body: () => TABLE(["", "Abstrato ■", "Sólido □"], [["O que é", "um espaço vazio, um personagem sem ator", "o que preenche o espaço"], ["Endereço", "não definido", "definido"], ["Forma", "isomórfico (forma)", "polimórfico (matéria)"], ["Exemplo", "<span class=\"mono\">dados_cliente</span> que ninguém da camada produz", "<span class=\"mono\">dados_cliente</span> com valor, ou produzido na mesma camada"]])
        + P("Um <b>roteiro abstrato</b> tem endereços não preenchidos. Um <b>roteiro sólido</b> tem todos definidos. Para executar, todos os objetos precisam estar presentes.")
        + RULE(`O mesmo dado muda de símbolo conforme a camada. <span class="mono">dados_cliente</span> é produzido em <b>${T_ONB()}</b> (□ lá dentro), mas em <b>${esc($u(ATIVAR).title)}</b> ninguém o produz: lá ele chega pelo <span class="mono">state</span> e aparece como ■.`)
        + EX(`em ${esc($u(ATIVAR).title)}, Criar conta no sistema pede dados_cliente`, dkIO("u18") + dkDado("dados_cliente"), ["abstrato", "Ver o ■ no Flow"],
          TRY("valor-cliente", tryOn("valor-cliente"), "Experimente: definir o valor de dados_cliente", "Desfazer o valor")) },

    { id: "preenchimento", g: "Fundamentos", t: "Regra do preenchimento", ic: "circle-dot",
      lead: "Uma regra só vale para dado e para função: algo fica sólido quando tudo o que está dentro dele está preenchido.",
      body: () => TABLE(["Símbolo", "Quando"], [
          [`<span class="node dk-i"><span class="fi plan ok">${icon("circle")}</span></span> Função sólida`, "a folha tem responsável; a composição tem <b>todas</b> as filhas preenchidas"],
          [`<span class="node dk-i"><span class="fi plan pend">${icon("circle")}</span></span> Função preta`, "é uma composição e <b>alguma filha ainda falta</b> preencher"],
          [`<span class="node dk-i"><span class="fi plan">${icon("circle")}</span></span> Função vazada`, "folha sem responsável (espaço abstrato)"],
          [`<span class="node dk-i"><span class="fi dado">${icon("box")}</span></span> Dado sólido`, "tem valor, ou é produzido na mesma camada; com campos, quando todos têm valor"],
          [`<span class="node dk-i"><span class="fi dado abs">${icon("box")}</span></span> Dado abstrato`, "vem de fora da camada e ainda não tem valor"],
        ])
        + RULE("Se a raiz está sólida, o roteiro pode executar. Se está preta, siga o preto até achar o que falta.")
        + EX("os ícones abaixo são os do Explorar, calculados agora", dkFn(ROOT, 0, true) + dkFn("u24"), ["preenchimento", "Ver no Flow"],
          TRY("sem-resp", tryOn("sem-resp"), "Experimente: tirar o responsável de Gerar contrato", "Devolver o responsável")) },

    { id: "agentes", g: "Fundamentos", t: "Agentes e responsáveis", ic: "user-round-cog",
      lead: "O agente é quem comanda e/ou executa uma operação: a fonte de energia do verbo. O roteiro não depende dele.",
      body: () => P("Cliente comanda e servidor executa; um agente pode ser os dois na mesma operação. Cada agente tem seus roteiros e pode ter mais de uma responsabilidade.",
        "No Flow o responsável é <b>injetado</b>, não faz parte do roteiro. Trocar o agente (outra IA, outra biblioteca, outra pessoa) não muda o fluxo.")
        + code("Rascunhar proposta(dados_cliente) -> rascunho   @ agente Lia\nRascunhar proposta(dados_cliente) -> rascunho   @ script rascunhar()   // mesmo roteiro, outro ator")
        + EX("o select da coluna Responsável agrupa os mesmos tipos do catálogo",
          `<div class="dk-ags">${Object.entries(TYPES).map(([k, v]) => `<div><small>${icon(v.ic)}${v.n}</small>${CAT.filter(c => c.type === k).map(c => `<span class="dk-ag">${agChip(c.id)}<em>${inUse(c.id).length || "livre"}</em></span>`).join("")}</div>`).join("")}</div>`,
          ["agente", "Trocar o responsável de Gerar contrato"]) },

    { id: "ordem", g: "Fundamentos", t: "Ordem: sequência e paralelo", ic: "git-commit-horizontal",
      lead: "A ordem diz quando cada verbo acontece. Sequência: b começa quando a termina. Paralelo: a e b no mesmo passo.",
      body: () => TABLE(["Estrutura", "No fluxo", "Leitura"], [["Sequência", "<span class=\"mono\">a → b</span>", "b começa quando a termina"], ["Paralelo", "<span class=\"mono\">a ∥ b</span>", "mesmo passo <span class=\"mono\">sN</span>"]])
        + P("No Flow a ordem vem da ordem das linhas: cada irmão é o passo seguinte do anterior. Paralelos dividem o mesmo passo. Para criar, use <b>Irmão</b> (próximo passo) e <b>Filho</b> (dentro da função).")
        + EX("Traduzir proposta ∥ Gerar contrato dividem o mesmo passo", dkFlow(fnKids(ROOT).map(u => u.id), { mark: { u13: "∥", u14: "∥" } }), ["ordem", "Ver o paralelo no Flow"]) },

    { id: "selecao", g: "Fundamentos", t: "Seleção", ic: "diamond",
      lead: "Seleção decide se um trecho roda. O corpo só executa se o teste passar; senão, o fluxo volta a um passo anterior.",
      body: () => TABLE(["Forma", "No Flow"], [["if / else", "<span class=\"mono\">◇ if (proposta_aprovada)</span> numa linha própria, com o corpo dentro"], ["senão ↺", "volta à etapa indicada (recursão)"], ["switch", "várias seleções seguidas sobre o mesmo dado"]])
        + code("Revisar proposta(rascunho) -> proposta_aprovada   @ agente Davi\nif (proposta_aprovada) {\n  paralelo { Traduzir proposta … ; Gerar contrato … }\n  Enviar ao cliente …\n} senão ↺ Rascunhar proposta")
        + EX(`corpo do ◇ if (${esc(STRUCTS[0].test)})`, `<div class="dk-if"><span class="dk-ift">◇ if (${esc(STRUCTS[0].test)})</span>${STRUCTS[0].body.map($u).filter(u => u && !isData(u)).map(u => dkFn(u.id, 1)).join("")}<span class="dk-else">senão ↺ ${esc($u("u12").cond ? $u($u("u12").cond[1]).title : "Rascunhar proposta")}</span></div>`, ["selecao", "Ver a seleção no Flow"]) },

    { id: "repeticao", g: "Fundamentos", t: "Repetição", ic: "repeat",
      lead: "Repetição roda a mesma função uma vez por item. Formas: for, while, do while e recursão.",
      body: () => P("No Flow a repetição é uma linha <span class=\"mono\">↻ for (item of lista)</span> sobre a função. A lista pode ser um valor fixo ou um campo de um dado.")
        + code(`for (idioma of ["en", "es"]) Traduzir proposta(proposta_aprovada, idioma) -> proposta_{idioma}`)
        + EX("todas as funções com ↻ no fluxo de exemplo", `<div class="dk-loops">${U.filter(u => !u.arch && u.loop && u.plan === PLAN).map(u => `<div><span class="dk-lp">↻ for (${esc(u.loop[0])} of ${esc(u.loop[1])})</span>${dkFn(u.id, 1)}</div>`).join("")}</div>`, ["repeticao", "Ver a repetição no Flow"]) },

    { id: "composicao", g: "Fundamentos", t: "Composição", ic: "list-tree",
      lead: "Uma instrução pode ter instruções filhas. Assim um verbo grande é feito de verbos menores.",
      body: () => P(`<b>${T_ONB()}</b> é uma composição de ${fnKids(ROOT).length} funções. O tempo dela vai do primeiro ao último filho; no Flow ela aparece como barra-resumo por cima das filhas.`,
        "Toda função vira composição quando você cria o primeiro <b>Filho</b> nela. A seta da coluna Nome abre e fecha a composição (sanfona).")
        + EX("barra-resumo da composição e as filhas no eixo", dkFlow(fnKids(ROOT).map(u => u.id), { sum: ROOT }), ["composicao", "Abrir a composição no Flow"]) },

    { id: "estados", g: "Fundamentos", t: "Estados s0 … sN", ic: "milestone",
      lead: "Os estados são as divisórias entre os passos. O que existe em s3 é o acúmulo de todos os dados até ali.",
      body: () => P("Cada função vai de <span class=\"mono\">sN</span> a <span class=\"mono\">sN+1</span>. Sob cada divisória o Flow lista os dados daquele estado: folha = □, árvore (com campos) = cubo. O botão <b>Todos os dados</b> mostra o acumulado; <b>Só os novos</b> mostra o que nasceu naquele passo.",
        "Em s0 estão só as entradas que vêm de fora (■). Daí em diante cada passo soma as saídas (□).")
        + EX(`dados acumulados em cada estado de ${T_ONB()} (em destaque, os novos)`, `<div class="dk-bags">${dkBags(ROOT)}</div>`, ["estados", "Ver os estados no Flow"]) },

    { id: "camadas", g: "Fundamentos", t: "Camadas e contexto", ic: "layers",
      lead: "Endereços que se conhecem ficam na mesma camada. O que vem de fora chega pelo state, e a camada só executa com o contexto completo.",
      body: () => P("Um dado produzido dentro da camada é sólido ali dentro. Um dado que vem de outra camada é abstrato e entra pelo <span class=\"mono\">state</span>: <span class=\"mono\">function f(state)</span>.",
        "A camada é <b>substituível</b>: dá para trocar o ator, a biblioteca ou o objeto sem reescrever o roteiro. <b>Contexto</b> é o conjunto de entradas; com todas presentes, o contexto está completo e a camada pode rodar.")
        + RULE("O que muda junto fica junto. Esse é o critério para decidir a camada.")
        + EX("o que cada camada pede ao state", [ROOT, ATIVAR].map(id => { const st = dkState(id); return `<div class="dk-layer"><b>${fnIcon($u(id))}${esc($u(id).title)}</b><div><small>dados de fora</small>${st.dados.map(n => mk(n, true)).join("") || `<span class="dk-mut">nenhum</span>`}</div><div><small>agentes injetados</small>${st.ias.map(a => agChip(a.id)).join(" ") || `<span class="dk-mut">nenhum</span>`}</div></div>`; }).join(""), ["camadas", "Abrir Contexto · camadas"]) },

    { id: "modulos", g: "Fundamentos", t: "Módulos", ic: "files",
      lead: "Módulo é o arquivo que guarda dados e funções que mudam juntos. Scripts próprios moram nele e podem ser responsáveis.",
      body: () => P("Convenção: <span class=\"mono\">*.layer.js</span> para funções, <span class=\"mono\">*.data.js</span> para dados. Um módulo pode ter uma informação, várias, uma função ou várias. Um <b>script próprio</b> (<span class=\"mono\">ƒ validarCnpj()</span>) é uma função escrita por você que pode executar qualquer etapa.")
        + EX("Explorar › Módulos", (ensureLayers(), LAYERS.slice(0, 6).map(l => `<div class="dk-mod"><b>${icon("file-code-2")}${esc(l.file)}</b><span>${l.items.map(([k, v]) => k === "fn" ? `<span class="dk-mi">${$u(v) ? fnIcon($u(v)) : ""}${esc($u(v)?.title || v)}</span>` : k === "dado" ? `<span class="dk-mi">${mk(v, dadoIsAbs(v))}</span>` : `<span class="dk-mi mono">ƒ ${esc(agent(v)?.name || v)}</span>`).join("")}</span></div>`).join("")), ["modulos", "Abrir Explorar › Módulos"]) },

    { id: "transpilacao", g: "Do desenho ao código", t: "Transpilação", ic: "file-code-2",
      lead: "O mesmo fluxo vira código em qualquer linguagem. O desenho é igual em todas: cada função recebe o state, o que se conhece é importado e o que vem de fora chega pelo state.",
      body: s => { const tab = s.docTab || "flow"; return `<nav class="seg dk-tabs">${[["flow", "Flow"], ["js", "JavaScript"], ["ts", "TypeScript"], ["c", "C"]].map(([k, n]) => `<button data-act="doc-tab" data-t="${k}" aria-current="${k === tab}">${n}</button>`).join("")}</nav>` + code(CODE[tab], tab)
        + H("O que a transpilação preserva")
        + TABLE(["Flow", "JS", "TS", "C"], [["Função (verbo)", "async function", "async function tipada", "função"], ["Dado com campos", "objeto", "interface", "struct"], ["Paralelo", "Promise.all", "Promise.all", "pthread"], ["Repetição", "map / for", "map / for", "for"], ["Seleção / senão ↺", "if / while", "if / while", "if / do while"], ["Abstrato (fora da camada)", "campo do state", "campo de State…", "campo do struct State…"], ["Concreto (mesma camada)", "import", "import", "protótipo + link"], ["Responsável", "objeto no state", "interface injetada", "ponteiro de função"]])
        + EX("o painel Código mostra o JavaScript do fluxo atual", `<p class="dk-mut" style="margin:0">Exemplo acima: <b>${esc($u(ATIVAR).title)}</b>. O painel Código à direita acompanha o desenho em JavaScript.</p>`, ["transpilar", "Ver código ao vivo"]); } },

    { id: "editar", g: "Do desenho ao código", t: "Editar o fluxo", ic: "mouse-pointer-click",
      lead: "Clique, preencha, execute. Do desenho ao código são quatro passos.",
      body: () => code("desenhar (Flow)  →  preencher (responsáveis + valores)  →  raiz sólida  →  Executar / Exportar")
        + P("1. <b>Clique</b> numa linha ou barra: ela fica selecionada e aparece <b>Editar · Filho · Irmão · Remover</b>.",
          "2. <b>Editar</b> abre título, contexto, responsável, entradas e saídas.",
          "3. <b>Filho</b> cria uma função dentro (a de cima vira composição). <b>Irmão</b> cria o próximo passo.",
          "4. O nome nasce editável: <b>Enter</b> confirma, <b>Esc</b> cancela.")
        + TABLE(["Atalho (função selecionada)", "Ação"], [["<kbd>C</kbd> · <kbd>Enter</kbd>", "novo irmão"], ["<kbd>⇧C</kbd> · <kbd>Tab</kbd>", "novo filho"], ["<kbd>E</kbd>", "editar"], ["<kbd>F2</kbd>", "renomear"], ["<kbd>⌘</kbd> <kbd>⌫</kbd>", "remover"]])
        + EX("a raiz sólida é o sinal de que o roteiro está completo", dkFn(ROOT) + dkFn(ATIVAR) + dkFn("u24"), ["editar", "Praticar no Flow"]) },

    { id: "roteiristas", g: "Do desenho ao código", t: "Bons roteiristas", ic: "pen-line",
      lead: "Software bom é maleável: a mudança deve custar o menor esforço possível.",
      body: () => { const fns = U.filter(u => !u.arch && u.plan === PLAN && !isFolder(u) && !isData(u)); return `<ul class="dk-ul">
          <li>Separe <b>roteiro</b>, <b>agente</b> e <b>estado</b>.</li>
          <li>Dependa de <b>abstrações</b>: entradas de <i>setup</i> (injeção) e entradas de execução.</li>
          <li>Use nomes do domínio. <b>Funções são verbos, dados são substantivos.</b></li>
          <li>O que muda junto fica junto (mesmo módulo).</li></ul>`
        + EX("o fluxo de exemplo na régua", TABLE(["Critério", "Agora"], [
          ["Funções com nome de verbo", `${fns.filter(u => isVerbTitle(u.title)).length} de ${fns.length}`],
          ["Funções com responsável injetado", `${fns.filter(u => !isComp(u) && agent(u.agent)).length} de ${fns.filter(u => !isComp(u)).length} folhas`],
          ["Dados com tipo definido", `${stateCatalog().filter(d => DATA_TYPE[d.name]).length} de ${stateCatalog().length}`],
          ["Módulos", `${(ensureLayers(), LAYERS.length)}`],
        ]), ["roteiro", "Abrir o fluxo de exemplo"]); } },

    { id: "glossario", g: "Referência", t: "Glossário", ic: "book-a",
      lead: "Os termos da linguagem em uma linha.",
      body: () => TABLE(["Termo", "Definição curta"], [["Roteiro / fluxo", "sequência de verbos que leva de um estado inicial a um estado final"], ["Função", "verbo; unidade de mudança de estado"], ["Dado", "substantivo; unidade de informação, com tipo e campos opcionais"], ["Abstrato", "endereço vazio: dado sem valor vindo de fora, ou função sem responsável"], ["Sólido", "endereço preenchido"], ["Agente / responsável", "quem executa a função (IA, biblioteca, script, pessoa)"], ["Composição", "função feita de funções filhas"], ["Estado sN", "divisória entre passos; acúmulo dos dados até ali"], ["Camada", "endereços que se conhecem"], ["Contexto", "conjunto de entradas de uma camada"], ["Módulo", "arquivo com dados e funções de uma camada"], ["state", "entrada de fora da camada, por onde chegam os abstratos"]]) },
  ];
  const CODE = {
    flow: `módulo credenciais.layer.js

função Ativar cliente(state) {
  paralelo {
    Agendar kickoff(envio_id)             -> kickoff     @ agente Lia
    Criar conta no sistema(dados_cliente) -> conta_id    @ node:http
  }
  Gerar credenciais(conta_id) -> credenciais             @ node:crypto
  for (contato of dados_cliente.contatos)
    Enviar boas-vindas(credenciais, contato) -> boas_vindas @ script montarBoasVindas()
}`,
    js: `// Gerado pelo Flow.dev · camada "ativar-cliente"
import { criarContaNoSistema } from './criar-conta-no-sistema.js';   // concreto (mesma camada)
import { gerarCredenciais } from './gerar-credenciais.js';
import { montarBoasVindas } from './credenciais.layer.js';           // script próprio

export async function ativarCliente(state) {
  const { envio_id, dados_cliente, lia } = state;                     // abstratos: chegam de fora

  const [{ kickoff }, { conta_id }] = await Promise.all([             // paralelo
    lia.agendarKickoff({ ...state, envio_id }),
    criarContaNoSistema({ ...state, dados_cliente }),
  ]);
  const { credenciais } = await gerarCredenciais({ ...state, conta_id });

  const boas_vindas = await Promise.all(                              // repetição
    dados_cliente.contatos.map(contato => montarBoasVindas({ ...state, credenciais, contato }))
  );
  return { kickoff, conta_id, credenciais, boas_vindas };
}`,
    ts: `export interface Contato { email: string; telefone: string }
export interface DadosCliente { nome: string; cnpj: string; contatos: Contato[] }
export interface Credenciais { usuario: string; senha: string }

export interface StateAtivar {          // endereços abstratos da camada
  envio_id: string;
  dados_cliente: DadosCliente;
  lia: { agendarKickoff(i: { envio_id: string }): Promise<{ kickoff: Date }> };  // injetado
}

export async function ativarCliente(state: StateAtivar) {
  const { envio_id, dados_cliente, lia } = state;
  const [{ kickoff }, { conta_id }] = await Promise.all([
    lia.agendarKickoff({ envio_id }),
    criarContaNoSistema({ dados_cliente }),
  ]);
  const { credenciais } = await gerarCredenciais({ conta_id });
  const boas_vindas = await Promise.all(
    dados_cliente.contatos.map((contato: Contato) => montarBoasVindas({ credenciais, contato })),
  );
  return { kickoff, conta_id, credenciais, boas_vindas };
}`,
    c: `/* objeto -> struct · lista -> ponteiro + tamanho · responsável -> ponteiro de função (injeção) */
typedef struct {                                   /* state: endereços abstratos */
  char *envio_id;
  DadosCliente *dados_cliente;
  time_t (*agendar_kickoff)(const char *envio_id); /* agente Lia, injetado */
} StateAtivar;

SaidaAtivar ativar_cliente(StateAtivar *state) {
  SaidaAtivar out = {0};
  pthread_t t; ArgKickoff a = { state, 0 };        /* paralelo: kickoff ∥ criar conta */
  pthread_create(&t, NULL, kickoff_job, &a);
  out.conta_id = criar_conta_no_sistema(state->dados_cliente);
  pthread_join(t, NULL);
  out.kickoff = a.kickoff;

  out.credenciais = gerar_credenciais(out.conta_id);   /* sequência */

  int n = state->dados_cliente->n_contatos;            /* repetição */
  out.boas_vindas = malloc(sizeof(char *) * n);
  for (int i = 0; i < n; i++)
    out.boas_vindas[i] = montar_boas_vindas(&out.credenciais, &state->dados_cliente->contatos[i]);
  return out;
}`,
  };
  function verbOut(v) { return String(v).trim() ? (isVerbTitle(v) ? `${icon("check")}aceito: começa com verbo` : `${icon("x")}recusado: função começa com verbo (Comprar…, Enviar…, Fazer…)`) : ""; }
  const docOf = id => DOCS.find(d => d.id === id) || DOCS[0];

  // ================= telas =================
  function docBar(s) {
    const d = docOf(s.docSec);
    return `<div class="bar"><div class="crumb"><span>Docs</span>${icon("chevron-right")}<span>${esc(d.g)}</span>${icon("chevron-right")}<b>${esc(d.t)}</b></div><div class="acts"><button class="btn" data-act="doc-go" data-k="roteiro">${icon("workflow")}Abrir o Flow</button></div></div>`;
  }
  function docView(s) {
    const d = docOf(s.docSec), i = DOCS.indexOf(d), prev = DOCS[i - 1], next = DOCS[i + 1];
    const groups = [...new Set(DOCS.map(x => x.g))];
    const nInG = DOCS.filter(x => x.g === d.g).indexOf(d) + 1;
    return `<div class="doc">
      <nav class="doc-toc" aria-label="Seções da docs"><div class="doc-toc-h">${icon("book-open")}<b>Docs</b><small>Linguagem Flow</small></div>
        ${groups.map(g => `<div class="doc-g"><small>${esc(g)}</small>${DOCS.filter(x => x.g === g).map(x => `<button data-act="doc-sec" data-sec="${x.id}" aria-current="${x.id === d.id}">${icon(x.ic)}${esc(x.t)}</button>`).join("")}</div>`).join("")}
      </nav>
      <div class="doc-main"><article class="doc-in">
        <div class="doc-kick">${esc(d.g)} · ${String(nInG).padStart(2, "0")}</div>
        <h1>${esc(d.t)}</h1>
        <p class="doc-lead">${d.lead}</p>
        ${d.body(s)}
        <nav class="doc-pn">${prev ? `<button data-act="doc-sec" data-sec="${prev.id}">${icon("arrow-left")}<span><small>Anterior</small>${esc(prev.t)}</span></button>` : "<span></span>"}${next ? `<button class="nx" data-act="doc-sec" data-sec="${next.id}"><span><small>Próxima</small>${esc(next.t)}</span>${icon("arrow-right")}</button>` : ""}</nav>
        <p class="doc-src">Fontes: Flow-Oriented Programming · flow-language/README.md · flow-dev/docs/linguagem-flow.md</p>
      </article></div>
    </div>`;
  }

  // ================= “aplicar no Flow”: cada conceito abre o lugar exato no IDE =================
  const openFlow = (...ids) => ids.forEach(id => FLOW_CLOSED.delete(id));
  function goFlow(sel, extra = {}) {
    const u = sel && $u(sel);
    const root = u && !isFolder(u) ? flowTop(u).id : ROOT;
    view("flow", { plan: PLAN, flowRoot: root, sel: sel || null, flash: sel || null, fromDoc: cur.docSec, ...extra });
    if (sel && typeof revealFn === "function" && u && !isData(u)) revealFn(sel);
  }
  const DOC_GO = {
    roteiro: () => { openFlow(ROOT); goFlow(ROOT); },
    io: () => { openFlow(ROOT); goFlow("u11", { drawer: "u11" }); },
    verbo: () => { openFlow(ATIVAR); goFlow("u24", { ren: "u24" }); },
    dado: () => { goFlow(null); OPEN.add("dt:dados_cliente"); OPEN.add("dt:dados_cliente.contatos"); revealDado("dados_cliente"); cur.dadoEdit = "dados_cliente"; },
    abstrato: () => { openFlow(ATIVAR); goFlow("u18", { estado: "dados_cliente" }); },
    preenchimento: () => { openFlow(ROOT); goFlow("u14"); },
    agente: () => { openFlow(ROOT); goFlow("u14", { drawer: "u14", picker: true }); },
    ordem: () => { openFlow(ROOT); goFlow("u13"); },
    selecao: () => { openFlow(ROOT); goFlow("u12"); },
    repeticao: () => { openFlow(ATIVAR); goFlow("u23"); },
    composicao: () => { openFlow(ROOT); goFlow(ROOT); },
    estados: () => { openFlow(ROOT); goFlow("u15", { dadosTodos: true }); },
    camadas: () => { openFlow(ROOT); goFlow("d2", { ctxPanel: true, flowRoot: ROOT }); },
    modulos: () => { goFlow(null); SEC_CLOSED.delete("arquivos"); ensureLayers(); LAYERS.slice(0, 2).forEach(l => OPEN.add("ly:" + l.id)); setTimeout(() => holder.querySelector('.ex [data-sec="arquivos"]')?.scrollIntoView({ block: "start" }), 40); },
    transpilar: () => { goFlow(null, {}); try { if (!CODE.open) { toggleCode(true); } } catch (e) {} },
    editar: () => { openFlow(ROOT); goFlow("u11"); },
  };

  // ================= ligações no IDE =================
  let DOC_TOP = false;
  Object.assign(ACT, {
    docs: t => { view("docs", { docSec: t.dataset.sec || cur.fromDoc || cur.docSec || "visao" }); DOC_TOP = true; },
    "doc-sec": t => { cur.docSec = t.dataset.sec; DOC_TOP = true; },
    "doc-tab": t => { cur.docTab = t.dataset.t; },
    "doc-go": t => { const f = DOC_GO[t.dataset.k]; if (!f) return false; f(); },
    "doc-try": t => { const k = t.dataset.k, on = !TRYS[k].on(); TRYS[k].set(on); toast(k === "sem-resp" ? (on ? "Gerar contrato ficou sem responsável: veja a composição ficar preta" : "Responsável devolvido: a composição voltou a ficar sólida") : (on ? "dados_cliente com valor: o ■ virou □" : "Valor desfeito: dados_cliente voltou a ser ■ na Ativação"), "flask-conical"); },
  });

  const baseWin = win, baseBar = bar, baseExplorer = explorer, baseTFor = tFor, baseView = view, basePaint = paint;
  bar = function (s) {
    const h = baseBar(s);
    if (!s.fromDoc) return h;
    const d = docOf(s.fromDoc);
    return h.replace('<div class="acts">', `<div class="acts"><button class="btn ghost dk-back" data-act="docs" data-sec="${d.id}" title="Voltar à página da docs">${icon("book-open")}Docs · ${esc(d.t)}</button>`);
  };
  win = function (s) {
    if (s.v !== "docs") return baseWin(s);
    const b = bar, f = flow; bar = docBar; flow = docView;
    try { return baseWin(s); } finally { bar = b; flow = f; }
  };
  explorer = function (s) {
    return baseExplorer(s).replace('<div class="ex-cfg">', `<div class="ex-cfg"><button data-act="docs" class="${s.v === "docs" ? "on" : ""}">${icon("book-open")}<span><b>Docs</b><small>Fundamentos da linguagem Flow</small></span></button>`);
  };
  tFor = function (s) {
    if (s.v === "docs" && !s.exp && !s.ctx && !s.newn && s.q == null) return s.docSec === "preenchimento" ? "T-61" : s.docSec === "transpilacao" ? "T-62" : "T-60";
    return baseTFor(s);
  };
  view = function (v, extra = {}) { if (cur) delete cur.fromDoc; return baseView(v, extra); };
  paint = function (keepScroll = true) {
    const m = holder.querySelector(".doc-main"), top = m && !DOC_TOP ? m.scrollTop : 0;
    basePaint(keepScroll);
    const m2 = holder.querySelector(".doc-main"); if (m2) m2.scrollTop = DOC_TOP ? 0 : top;
    DOC_TOP = false;
  };

  // na docs, clicar numa função do Explorar leva ao Flow (como em Configurações)
  holder.addEventListener("click", e => { if (cur?.v === "docs" && e.target.closest(".ex [data-node]")) baseView("flow"); }, true);
  // na docs não há função selecionada: atalhos de edição (F2, ⌫, ⌘D/X/C/V) não mexem no fluxo escondido
  document.addEventListener("keydown", e => {
    if (!player.classList.contains("open") || cur?.v !== "docs" || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || "")) return;
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === "F2" || e.key === "Delete" || (mod && /^(backspace|d|x|c|v)$/i.test(e.key))) e.stopImmediatePropagation();
  }, true);
  // teste do verbo: atualiza só o resultado, sem repintar (o cursor fica no campo)
  holder.addEventListener("input", e => { const t = e.target.closest?.("[data-doc-verb]"); if (!t) return; const o = t.parentElement.querySelector("[data-doc-verb-out]"); if (o) { o.innerHTML = verbOut(t.value); o.classList.toggle("no", !!t.value.trim() && !isVerbTitle(t.value)); lucide.createIcons(); } });

  // ================= galeria e player =================
  FLOWS.push({ id: "docs", n: String(FLOWS.length + 1).padStart(2, "0"), title: "Docs", us: "fundamentos",
    desc: "Fundamentos da linguagem Flow (FOP) dentro do IDE: cada conceito com o exemplo vivo do fluxo Onboarding Acme e um botão que aplica o conceito no Flow.",
    steps: [["T-60", "Fundamentos"], ["T-61", "Regra do preenchimento"], ["T-62", "Transpilação"]] });
  Object.assign(SCREENS, {
    "T-60": { s: { v: "docs", docSec: "visao" }, name: "Docs · Fundamentos", us: ["docs", "FOP"], notes: "Explorar › Docs. Índice à esquerda (Começar · Fundamentos · Do desenho ao código · Referência). Cada página: conceito, regra e o bloco “No Flow IDE”, desenhado com o estado atual do fluxo de exemplo. O botão do bloco abre o lugar exato no Flow e deixa “Docs · …” na barra para voltar." },
    "T-61": { s: { v: "docs", docSec: "preenchimento" }, name: "Regra do preenchimento", us: ["docs", "sólido × abstrato"], notes: "Ícones sólido · preto · vazado calculados agora. “Experimente” tira o responsável de Gerar contrato e a composição fica preta na hora; desfazer devolve." },
    "T-62": { s: { v: "docs", docSec: "transpilacao", docTab: "js" }, name: "Transpilação", us: ["docs", "export"], notes: "O mesmo fluxo (Ativar cliente) em Flow, JavaScript, TypeScript e C, e a tabela do que a transpilação preserva. O botão abre o Exportar com o fluxo atual." },
  });
  ORDER.push("T-60", "T-61", "T-62");
  const F = FLOWS[FLOWS.length - 1];
  plist.insertAdjacentHTML("beforeend", `<h4>${F.n} · ${F.title}</h4>` + F.steps.map(([id]) => `<a data-t="${id}"><span>${id}</span>${SCREENS[id].name}</a>`).join(""));
  document.getElementById("flownav").innerHTML = FLOWS.map(f => `<a href="#${f.id}"><b>${f.n}</b>${f.title}</a>`).join("");
  buildGallery();
  const h0 = location.hash.slice(1); if (F.steps.some(([id]) => id === h0) && !player.classList.contains("open")) openT(h0);
})();
