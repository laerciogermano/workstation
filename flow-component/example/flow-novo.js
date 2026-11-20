"use strict";
(() => {
  // novo/model.ts
  var FlowError = class extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
    code;
  };
  var fail = (code, msg) => {
    throw new FlowError(code, msg);
  };
  function locate(p, id) {
    const visit = (list, parent, slot, flow) => {
      for (let i = 0; i < list.length; i++) {
        const n = list[i];
        if (n.id === id) return { node: n, list, index: i, parent, slot, flow };
        const sub = n.t === "try" ? visit(n.kids, n, "kids", flow) ?? visit(n.catchKids, n, "catch", flow) : n.t === "if" ? visit(n.kids, n, "kids", flow) ?? visit(n.elseKids, n, "else", flow) : visit(n.kids, n, "kids", flow);
        if (sub) return sub;
      }
      return null;
    };
    for (const f of p.flows) {
      if (f.id === id) return { node: f, list: p.flows, index: p.flows.indexOf(f), parent: null, slot: "kids", flow: f };
      const hit = visit(f.kids, f, "kids", f);
      if (hit) return hit;
    }
    return null;
  }
  var need = (p, id) => locate(p, id) ?? fail("not_found", `Element ${id} does not exist`);
  var isRoot = (p, id) => p.flows.some((f) => f.id === id);
  var filesOf = (p) => [...new Set(p.flows.map((f) => flowFile(f)))];
  var fileAgent = (p, file) => {
    const fns = p.flows.filter((f) => flowFile(f) === file);
    return fns.length ? { id: `file:${file}`, kind: "arquivo", name: file, tasks: fns.map((f) => f.title), contracts: Object.fromEntries(fns.map((f) => [f.title, { ins: [...f.ins], outs: [...f.outs] }])) } : void 0;
  };
  var agentOf = (p, id) => id ? id.startsWith("file:") ? fileAgent(p, id.slice(5)) : p.agents.find((a) => a.id === id) : void 0;
  var hasContract = (a) => a?.kind === "maquina" || a?.kind === "arquivo";
  var isComposite = (n) => n.kids.length > 0;
  var insideBlock = (p, id) => {
    const l = locate(p, id);
    return !!l && !!l.parent && l.parent.t !== "fn";
  };
  var kidsOf = (n) => n.t === "try" ? [...n.kids, ...n.catchKids] : n.t === "if" ? [...n.kids, ...n.elseKids] : n.kids;
  var altKids = (n) => n.t === "try" ? n.catchKids : n.t === "if" ? n.elseKids : null;
  function walk(list, f) {
    for (const n of list) {
      f(n);
      walk(kidsOf(n), f);
    }
  }
  var fnsOf = (flow) => {
    const out = [];
    walk(flow.kids, (n) => {
      if (n.t === "fn") out.push(n);
    });
    return out;
  };
  var isCube = (names) => names.length > 1;
  var cubeName = (f, side) => `${side === "in" ? "input" : "output"}_${f.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "function"}`;
  var slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "flow";
  var flowFile = (f) => f.file ?? `${slug(f.title)}.ts`;
  var nextId = (p) => `n${++p.seq}`;
  var newFn = (p, title = "New function") => ({ t: "fn", id: nextId(p), title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false });
  var ident = /^[A-Za-z_][A-Za-z0-9_]*$/;
  var RESERVED = new Set("break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static await".split(" "));
  var cleanName = (s, what) => {
    const v = String(s ?? "").trim();
    if (RESERVED.has(v)) return fail("invalid", `${what} cannot be the reserved word \u201C${v}\u201D`);
    return ident.test(v) ? v : fail("invalid", `${what} is invalid: use letters, numbers and _ (e.g. customer_data)`);
  };
  var cleanText = (s, what, max = 120) => {
    const v = String(s ?? "").trim();
    return v && v.length <= max ? v : fail("invalid", `${what} cannot be empty`);
  };
  function emptyProject(name = "New project") {
    return { name, flows: [], agents: [], seq: 0 };
  }
  function parseSignature(text) {
    const m = /^\s*([A-Za-z_$][\w$]*)\s*(?:\(([^)]*)\))?\s*(?:->\s*(.*))?$/.exec(text);
    if (!m) return null;
    const names = (s) => (s ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    const hasSig = m[2] !== void 0 || m[3] !== void 0, raw = names(m[2]), optional = raw.filter((x) => x.endsWith("?")).map((x) => x.slice(0, -1));
    return { task: m[1], contract: hasSig ? { ins: raw.map((x) => x.replace(/\?$/, "")), outs: names(m[3]), ...optional.length ? { optional } : {} } : { ins: ["input"], outs: ["result"] } };
  }
  var lib = (id, name, sigs) => {
    const contracts = {}, tasks = [];
    for (const sg of sigs) {
      const r = parseSignature(sg);
      tasks.push(r.task);
      contracts[r.task] = r.contract;
    }
    return { id, kind: "maquina", name, tasks, contracts };
  };
  var DEFAULT_AGENTS = [
    lib("console", "console", ["log(text)", "info(text)", "warn(text)", "error(text)", "debug(text)", "table(data)"]),
    lib("math", "Math", ["random() -> number", "round(value) -> result", "floor(value) -> result", "ceil(value) -> result", "abs(value) -> result", "max(a, b) -> result", "min(a, b) -> result", "pow(base, exponent) -> result", "sqrt(value) -> result"]),
    lib("json", "JSON", ["stringify(value) -> text", "parse(text) -> value"]),
    lib("date", "Date", ["now() -> timestamp", "parse(text) -> timestamp"]),
    lib("crypto", "crypto", ["randomUUID() -> uuid"]),
    lib("perf", "performance", ["now() -> time"]),
    lib("web", "globalThis", ["fetch(url, options?) -> response", "atob(text) -> result", "btoa(text) -> result", "structuredClone(value) -> copy"]),
    { id: "lia", kind: "ia", name: "Lia", tasks: [] },
    { id: "teo", kind: "ia", name: "Teo", tasks: [] },
    { id: "davi", kind: "ia", name: "Davi", tasks: [] },
    { id: "ana", kind: "pessoa", name: "Ana Souza", tasks: [] },
    { id: "bruno", kind: "pessoa", name: "Bruno Lima", tasks: [] }
  ];
  var contractOf = (p, f) => {
    const a = agentOf(p, f.agent);
    return hasContract(a) ? a.contracts?.[f.title] ?? null : null;
  };
  function statesFor(p, id) {
    const l = locate(p, id);
    if (!l) return [];
    const out = [], seen = /* @__PURE__ */ new Set();
    let found = false;
    const add = (r) => {
      if (!seen.has(r.name)) {
        seen.add(r.name);
        out.push(r);
      }
    };
    const visit = (nodes, loops) => {
      for (const n of nodes) {
        if (found) return;
        if (n.id === id) {
          found = true;
          loops.forEach((v) => add({ name: v, from: "for", kind: "loop" }));
          return;
        }
        if (n.t === "fn") {
          if (n.kids.length) visit(n.kids, loops);
          else if (!found) n.outs.forEach((o) => add({ name: o, from: n.title, kind: "data" }));
        } else if (n.t === "for") visit(n.kids, [...loops, n.v]);
        else {
          visit(n.kids, loops);
          if (!found && n.t === "try") visit(n.catchKids, loops);
          if (!found && n.t === "if") visit(n.elseKids, loops);
        }
      }
    };
    visit(l.flow.kids, []);
    if (!found) return [];
    return out.filter((r) => r.kind === "data" || r.kind === "loop");
  }
  function applyContract(p, f) {
    const c = contractOf(p, f);
    if (!c) return;
    f.ins = [...c.ins];
    f.outs = [...c.outs];
    if (f.args) {
      f.args = Object.fromEntries(Object.entries(f.args).filter(([k]) => c.ins.includes(k)));
      if (!Object.keys(f.args).length) delete f.args;
    }
  }
  var str = (a, k) => String(a[k] ?? "");
  function prune(list) {
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.t !== "fn") {
        prune(n.kids);
        if (n.t === "try") prune(n.catchKids);
        if (n.t === "if") prune(n.elseKids);
      } else prune(n.kids);
      if (n.t !== "fn" && n.kids.length === 0) list.splice(i, 1);
    }
  }
  var fixRefs = (_p) => {
    void _p;
  };
  function blockOf(kind, p, a, inner) {
    const id = nextId(p);
    if (kind === "if") return { t: "if", id, test: a["test"] ? cleanText(a["test"], "Condition") : "condition", kids: [inner], elseKids: [] };
    if (kind === "for") return { t: "for", id, v: a["v"] ? cleanName(a["v"], "Variable") : "item", coll: a["coll"] ? cleanText(a["coll"], "Collection") : "items", kids: [inner] };
    return { t: "try", id, kids: [inner], catchKids: [newFn(p, "Handle error")] };
  }
  var HANDLERS = {
    /** Novo fluxo (função raiz). */
    newFlow: (p, a) => {
      const f = newFn(p, a["title"] ? cleanText(a["title"], "Title", 80) : "New flow");
      if (a["file"]) f.file = cleanText(a["file"], "File", 80);
      p.flows.push(f);
      return f.id;
    },
    /** Exclui um fluxo inteiro; o projeto sempre mantém pelo menos um. */
    removeFlow: (p, a) => {
      const l = need(p, str(a, "id"));
      if (!isRoot(p, l.node.id)) return fail("invalid", "Only a whole flow can be deleted");
      if (p.flows.length <= 1) return fail("invalid", "The project needs at least one flow");
      p.flows.splice(l.index, 1);
    },
    /** Cadastro de responsáveis: lib do Node (com as funções dela), pessoa ou agente de IA. */
    addAgent: (p, a) => {
      const kind = str(a, "kind");
      if (!["maquina", "ia", "pessoa"].includes(kind)) return fail("invalid", `Unknown source type: ${kind}`);
      const name = cleanText(a["name"], "Source name", 60);
      if (p.agents.some((x) => x.name.toLowerCase() === name.toLowerCase())) return fail("invalid", `A source named ${name} already exists`);
      const txt = Array.isArray(a["tasks"]) ? a["tasks"].map(String).join(";") : String(a["tasks"] ?? ""), parts = (txt.includes("(") || txt.includes("->") ? txt.split(/[;\n]/) : txt.split(",")).map((x) => x.trim()).filter(Boolean);
      const contracts = {}, tasks = [];
      if (kind === "maquina") for (const part of parts) {
        const r = parseSignature(part);
        if (!r) return fail("invalid", `Invalid function: "${part}" (use name(inputs) -> outputs)`);
        if (tasks.includes(r.task)) continue;
        for (const nm of [...r.contract.ins, ...r.contract.outs]) cleanName(nm, "Data name");
        tasks.push(r.task);
        contracts[r.task] = r.contract;
      }
      if (kind === "maquina" && !tasks.length) return fail("invalid", "A lib needs at least one function (e.g. gzip(data) -> compressed)");
      const id = `a${++p.seq}`;
      p.agents.push(kind === "maquina" ? { id, kind, name, tasks, contracts } : { id, kind, name, tasks: [] });
      return id;
    },
    /** Remove o responsável; as funções que o usavam ficam sem responsável. */
    removeAgent: (p, a) => {
      const id = str(a, "id");
      if (!agentOf(p, id)) return fail("not_found", `Source ${id} does not exist`);
      p.agents = p.agents.filter((x) => x.id !== id);
      for (const f of p.flows) walk([f], (n) => {
        if (n.t === "fn") {
          if (n.agent === id) n.agent = null;
          if (n.resp === id) n.resp = null;
        }
      });
    },
    rename: (p, a) => {
      const l = need(p, str(a, "id"));
      if (l.node.t !== "fn") return fail("invalid", "Only functions have a name");
      l.node.title = cleanText(a["title"], "Name", 80);
    },
    /** Renomeia um arquivo: todas as funções dele passam ao novo nome e quem o usa como fonte (file:nome) acompanha. */
    renameFile: (p, a) => {
      const from = str(a, "from"), to = cleanText(a["to"], "File name", 80).replace(/\s+/g, "-"), file = /\.[A-Za-z0-9]+$/.test(to) ? to : `${to}.ts`;
      const own = p.flows.filter((f) => flowFile(f) === from);
      if (!own.length) return fail("not_found", `File ${from} does not exist`);
      if (file !== from && p.flows.some((f) => flowFile(f) === file)) return fail("invalid", `File ${file} already exists`);
      for (const f of own) f.file = file;
      for (const f of p.flows) walk([f], (n) => {
        if (n.t === "fn" && n.agent === `file:${from}`) n.agent = `file:${file}`;
      });
    },
    /** Filho: função → no fim da lista dela; bloco → na PRIMEIRA posição (o lugar do cabeçalho); `catch` → primeira posição do catch. */
    addChild: (p, a) => {
      const l = need(p, str(a, "id")), n = l.node, f = newFn(p, a["title"] ? cleanText(a["title"], "Name", 80) : void 0);
      if (n.t === "fn") n.kids.push(f);
      else if (n.t === "try" && a["catch"]) n.catchKids.unshift(f);
      else if (n.t === "if" && a["else"]) n.elseKids.unshift(f);
      else n.kids.unshift(f);
      return f.id;
    },
    /** Irmão: entra na lista de quem o recebe (dentro do bloco, se for o caso). Num bloco = irmão à direita, fora dele. */
    addSibling: (p, a) => {
      const l = need(p, str(a, "id"));
      if (isRoot(p, l.node.id)) return fail("root", "The flow root cannot have siblings");
      const f = newFn(p, a["title"] ? cleanText(a["title"], "Name", 80) : void 0);
      l.list.splice(l.index + (a["before"] ? 0 : 1), 0, f);
      return f.id;
    },
    remove: (p, a) => {
      const l = need(p, str(a, "id"));
      if (isRoot(p, l.node.id)) return fail("root", "The flow root cannot be removed");
      l.list.splice(l.index, 1);
      for (const f of p.flows) prune(f.kids);
      fixRefs(p);
    },
    /** Cerca a função (ou o bloco) com um if / for / try. A raiz não aceita. */
    wrap: (p, a) => {
      const l = need(p, str(a, "id")), kind = str(a, "kind");
      if (!["if", "for", "try"].includes(kind)) return fail("invalid", `Unknown block: ${kind}`);
      if (isRoot(p, l.node.id)) return fail("root", `The root flow does not accept ${kind}`);
      const b = blockOf(kind, p, a, l.node);
      l.list.splice(l.index, 1, b);
      return b.id;
    },
    /** Remove o bloco e devolve os filhos à lista de fora (no try, o catch some). */
    unwrap: (p, a) => {
      const l = need(p, str(a, "id"));
      if (l.node.t === "fn") return fail("invalid", "Only blocks can be undone");
      l.list.splice(l.index, 1, ...l.node.kids);
      fixRefs(p);
    },
    /** Sair do escopo: o item e os seguintes saem do bloco e ficam logo depois dele. */
    exitScope: (p, a) => {
      const l = need(p, str(a, "id"));
      if (!l.parent || l.parent.t === "fn") return fail("invalid", "This function is not inside a block");
      const block = l.parent, outer = need(p, block.id), moved = l.list.splice(l.index);
      outer.list.splice(outer.index + 1, 0, ...moved);
      for (const f of p.flows) prune(f.kids);
      fixRefs(p);
    },
    /** Tamanho do bloco: aumentar adota os irmãos seguintes; diminuir devolve os últimos para fora. */
    setScope: (p, a) => {
      const l = need(p, str(a, "id")), b = l.node;
      if (b.t === "fn") return fail("invalid", "Only blocks have a scope");
      const target = Math.max(1, Math.floor(Number(a["count"])) || 1);
      if (target > b.kids.length) b.kids.push(...l.list.splice(l.index + 1, target - b.kids.length));
      else if (target < b.kids.length) l.list.splice(l.index + 1, 0, ...b.kids.splice(target));
    },
    setFor: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "for") return fail("invalid", "Not a for");
      n.v = cleanName(a["v"], "Variable");
      n.coll = cleanText(a["coll"], "Collection");
    },
    setIf: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "if") return fail("invalid", "Not an if");
      n.test = cleanText(a["test"], "Condition");
    },
    /** Cria o else do if (uma função dentro dele, como o try cria o catch). */
    addElse: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "if") return fail("invalid", "Only an if has an else");
      if (n.elseKids.length) return fail("invalid", "This if already has an else");
      const f = newFn(p, a["title"] ? cleanText(a["title"], "Name", 80) : void 0);
      n.elseKids.push(f);
      return f.id;
    },
    removeElse: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "if") return fail("invalid", "Only an if has an else");
      n.elseKids = [];
    },
    addInput: (p, a) => io(p, a, "ins", true),
    removeInput: (p, a) => io(p, a, "ins", false),
    addOutput: (p, a) => io(p, a, "outs", true),
    removeOutput: (p, a) => io(p, a, "outs", false),
    /** Responsável: lib (concreta), pessoa ou IA (abstrata). Concreta força uma função do catálogo da lib. */
    assign: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have a source");
      const ag = a["agent"] ? agentOf(p, str(a, "agent")) ?? fail("not_found", `Source ${str(a, "agent")} does not exist`) : void 0;
      n.agent = ag?.id ?? null;
      if (ag?.kind !== "ia") n.resp = null;
      if (hasContract(ag) && !ag.tasks.includes(n.title)) n.title = ag.tasks[0] ?? n.title;
      if (hasContract(ag)) applyContract(p, n);
      if (n.args) {
        n.args = Object.fromEntries(Object.entries(n.args).filter(([k]) => n.ins.includes(k)));
        if (!Object.keys(n.args).length) delete n.args;
      }
    },
    setTask: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have a lib function");
      const ag = agentOf(p, n.agent), t = cleanText(a["task"], "Function", 80);
      if (hasContract(ag) && !ag.tasks.includes(t)) return fail("invalid", `Function "${t}" does not exist in ${ag.name}`);
      n.title = t;
      applyContract(p, n);
    },
    /** Renomeia um dado de entrada ou saída de uma função comum (nas de lib o contrato manda). */
    renameIo: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
      if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
      const key = str(a, "side") === "out" ? "outs" : "ins", from = str(a, "from"), to = cleanName(a["to"], "Data name"), i = n[key].indexOf(from);
      if (i < 0) return fail("not_found", `${from} does not exist`);
      if (from !== to && n[key].includes(to)) return fail("invalid", `${to} already exists`);
      n[key][i] = to;
      if (key === "ins" && n.args?.[from] !== void 0) {
        const { [from]: v, ...rest } = n.args;
        n.args = { ...rest, [to]: v ?? "" };
      }
    },
    /** Troca de uma vez todos os dados de um lado (entrada ou saída) de uma função comum: nomes e, nas entradas, os valores. */
    setData: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
      if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
      const side = str(a, "side") === "out" ? "out" : "in", names = (Array.isArray(a["names"]) ? a["names"] : []).map((x) => cleanName(x, "Data name")), values = Array.isArray(a["values"]) ? a["values"].map((x) => String(x ?? "").trim()) : [];
      if (new Set(names).size !== names.length) return fail("invalid", "Duplicate data name");
      if (values.some((v) => v.length > 300)) return fail("invalid", "Value too large");
      if (side === "out") {
        n.outs = names;
        return;
      }
      n.ins = names;
      const args = {};
      names.forEach((nm, i) => {
        if (values[i]) args[nm] = values[i];
      });
      if (Object.keys(args).length) n.args = args;
      else delete n.args;
    },
    /** Dá um nome ao dado que a lib devolve (quando ela devolve um só): é o nome que as outras funções usam para pegá-lo. */
    renameData: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have an output");
      const c = contractOf(p, n);
      if (!c) return fail("invalid", "The output name can only change on lib functions");
      if (c.outs.length !== 1) return fail("invalid", "Renaming only works when the lib returns a single data");
      n.outs = [cleanName(a["to"], "Data name")];
    },
    /** Preenche uma entrada de função de lib: um texto/expressão fixa (ex.: "Olá") ou o nome de um dado produzido antes. Vazio limpa. */
    setArg: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have inputs");
      const name = str(a, "name");
      if (!n.ins.includes(name)) return fail("not_found", `${n.title} has no input ${name}`);
      const v = str(a, "value").trim();
      if (v.length > 300) return fail("invalid", "Value too large");
      const args = { ...n.args ?? {} };
      if (v) args[name] = v;
      else delete args[name];
      if (Object.keys(args).length) n.args = args;
      else delete n.args;
    },
    /** Pessoa responsável por uma função de IA. */
    setResp: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have a source");
      const ag = a["resp"] ? agentOf(p, str(a, "resp")) : void 0;
      if (a["resp"] && ag?.kind !== "pessoa") return fail("invalid", "The AI\u2019s person in charge must be a person");
      n.resp = ag?.id ?? null;
    },
    /** Executa junto da função anterior (mesmo passo). */
    setParallel: (p, a) => {
      const l = need(p, str(a, "id"));
      if (l.node.t !== "fn") return fail("invalid", "Only functions run in parallel");
      if (a["on"] && !(l.list[l.index - 1]?.t === "fn")) return fail("invalid", "There is no previous function to run together with");
      l.node.par = !!a["on"];
    }
  };
  function io(p, a, key, add) {
    const n = need(p, str(a, "id")).node;
    if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
    if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
    const name = cleanName(a["name"], "Data name");
    if (add) {
      if (!n[key].includes(name)) n[key].push(name);
    } else {
      n[key] = n[key].filter((x) => x !== name);
      if (key === "ins" && n.args) {
        delete n.args[name];
        if (!Object.keys(n.args).length) delete n.args;
      }
    }
  }
  var COMMAND_NAMES = Object.keys(HANDLERS);
  function apply(p, cmd) {
    const h = HANDLERS[cmd.type];
    if (!h) throw new FlowError("invalid", `Unknown command: ${String(cmd.type)}`);
    const next = structuredClone(p), { type: _t, ...args } = cmd;
    void _t;
    const created = h(next, args);
    return created ? { project: next, created } : { project: next };
  }
  var Store = class {
    constructor(project) {
      this.project = project;
    }
    project;
    past = [];
    future = [];
    subs = /* @__PURE__ */ new Set();
    subscribe(f) {
      this.subs.add(f);
      return () => this.subs.delete(f);
    }
    dispatch(cmd) {
      const r = apply(this.project, cmd);
      this.past.push(this.project);
      this.future = [];
      this.project = r.project;
      this.emit();
      return r.created;
    }
    /** Troca o projeto inteiro (abrir arquivo, reiniciar): zera o histórico. */
    load(project) {
      this.past = [];
      this.future = [];
      this.project = project;
      this.emit();
    }
    get canUndo() {
      return this.past.length > 0;
    }
    get canRedo() {
      return this.future.length > 0;
    }
    undo() {
      const prev = this.past.pop();
      if (!prev) return;
      this.future.push(this.project);
      this.project = prev;
      this.emit();
    }
    redo() {
      const nx = this.future.pop();
      if (!nx) return;
      this.past.push(this.project);
      this.project = nx;
      this.emit();
    }
    emit() {
      for (const f of this.subs) f();
    }
  };
  var FORMAT = "flow-novo";
  var VERSION = 1;
  var serialize = (p) => JSON.stringify({ format: FORMAT, version: VERSION, project: p }, null, 2);
  function parseProject(text) {
    let raw;
    try {
      raw = JSON.parse(text);
    } catch {
      return fail("invalid", "The file is not valid JSON");
    }
    const o = raw;
    if (o?.format !== FORMAT) return fail("invalid", "This file is not a Flow project");
    if (o.version !== VERSION) return fail("invalid", `Version ${String(o.version)} is not supported (expected ${VERSION})`);
    const pr = o.project;
    if (!pr || typeof pr.name !== "string" || !Array.isArray(pr.flows) || !Array.isArray(pr.agents)) return fail("invalid", "Project without a name, flows or sources");
    if (!pr.flows.length) return fail("invalid", "The project has no flow");
    const ids = /* @__PURE__ */ new Set(), strs = (v, what) => Array.isArray(v) && v.every((x) => typeof x === "string") ? v : fail("invalid", `${what} must be a list of texts`);
    const agents = pr.agents.map((a) => {
      if (!a || typeof a.id !== "string" || typeof a.name !== "string" || !["maquina", "ia", "pessoa"].includes(String(a.kind))) return fail("invalid", "Invalid source");
      if (ids.has(a.id)) return fail("invalid", `Duplicate id: ${a.id}`);
      ids.add(a.id);
      const tasks = strs(a.tasks ?? [], "tasks"), cs = a.contracts;
      const contracts = cs ? Object.fromEntries(Object.entries(cs).map(([k, c]) => [k, { ins: strs(c?.ins ?? [], "contract ins"), outs: strs(c?.outs ?? [], "contract outs"), ...c?.optional ? { optional: strs(c.optional, "contract optional") } : {} }])) : void 0;
      return { id: a.id, kind: a.kind, name: a.name, tasks, ...contracts ? { contracts } : {} };
    });
    const node = (n) => {
      if (!n || typeof n.id !== "string") return fail("invalid", "Element without an id");
      if (ids.has(n.id)) return fail("invalid", `Duplicate id: ${n.id}`);
      ids.add(n.id);
      const list = (v) => Array.isArray(v) ? v.map((x) => node(x)) : fail("invalid", `Invalid children list in ${String(n.id)}`);
      if (n.t === "fn") {
        if (typeof n.title !== "string") return fail("invalid", `Function ${n.id} without a name`);
        const agent = n.agent == null ? null : String(n.agent), resp = n.resp == null ? null : String(n.resp);
        if (agent && !agent.startsWith("file:") && !agents.some((a) => a.id === agent)) return fail("invalid", `Function ${n.id} uses a source that does not exist`);
        if (resp && !agents.some((a) => a.id === resp)) return fail("invalid", `Function ${n.id} uses a person that does not exist`);
        const args = n.args && typeof n.args === "object" ? Object.fromEntries(Object.entries(n.args).map(([k, v]) => [k, String(v)])) : void 0;
        return { t: "fn", id: n.id, title: n.title, agent, resp, ins: strs(n.ins ?? [], "ins"), outs: strs(n.outs ?? [], "outs"), kids: list(n.kids ?? []), par: !!n.par, ...args && Object.keys(args).length ? { args } : {}, ...typeof n.file === "string" && n.file ? { file: n.file } : {} };
      }
      if (n.t === "if") return { t: "if", id: n.id, test: String(n.test ?? "condition"), kids: list(n.kids), elseKids: list(n.elseKids ?? []) };
      if (n.t === "for") return { t: "for", id: n.id, v: String(n.v ?? "item"), coll: String(n.coll ?? "items"), kids: list(n.kids) };
      if (n.t === "try") return { t: "try", id: n.id, kids: list(n.kids), catchKids: list(n.catchKids ?? []) };
      return fail("invalid", `Unknown element type in ${n.id}`);
    };
    const flows = pr.flows.map((f) => {
      const n = node(f);
      return n.t === "fn" ? n : fail("invalid", "Every flow starts with a function");
    });
    const seq = Math.max(0, ...[...ids].map((i) => Number(/(\d+)$/.exec(i)?.[1] ?? 0)));
    return migrate({ name: pr.name, flows, agents, seq: Math.max(seq, Number(pr.seq) || 0) });
  }
  function migrate(p) {
    const dflt = (id) => DEFAULT_AGENTS.find((a) => a.id === id);
    for (const d of DEFAULT_AGENTS) {
      if (d.kind !== "maquina") continue;
      const i = p.agents.findIndex((a) => a.id === d.id);
      if (i >= 0 && p.agents[i].kind === "maquina" && p.agents[i].name !== d.name) p.agents[i] = structuredClone(d);
      else if (i < 0 && !p.agents.some((a) => a.name === d.name)) p.agents.push(structuredClone(d));
    }
    const gone = p.agents.filter((a) => a.kind === "maquina" && /^node:/.test(a.name) && ["http", "fs", "os", "path", "crypto", "console"].includes(a.id) && !dflt(a.id)).map((a) => a.id);
    if (gone.length) p.agents = p.agents.filter((a) => !gone.includes(a.id));
    for (const f of p.flows) walk([f], (n) => {
      if (n.t !== "fn") return;
      if (n.agent && !p.agents.some((a2) => a2.id === n.agent)) {
        n.agent = null;
        delete n.args;
      }
      const a = agentOf(p, n.agent);
      if (hasContract(a)) {
        if (!a.tasks.includes(n.title)) {
          n.title = a.tasks[0] ?? n.title;
          applyContract(p, n);
        } else if (!n.ins.length && !n.outs.length) applyContract(p, n);
      }
    });
    return p;
  }

  // novo/args.ts
  var ARG_TYPES = [
    { type: "text", label: "text" },
    { type: "number", label: "number" },
    { type: "boolean", label: "boolean" },
    { type: "ref", label: "data from another function" },
    { type: "expr", label: "expression" },
    { type: "object", label: "object" }
  ];
  var emptyDraft = (type = "text") => ({ type, value: type === "boolean" ? "false" : "", fields: [] });
  var IDENT = /^[A-Za-z_$][\w$]*$/;
  var PATH = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;
  var NUM = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
  var LITERAL_IDENTS = /* @__PURE__ */ new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);
  var isDataRef = (e) => {
    const v = e.trim();
    if (!v || LITERAL_IDENTS.has(v)) return false;
    return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/.test(v);
  };
  function buildArg(d) {
    switch (d.type) {
      case "text":
        return d.value === "" ? "" : JSON.stringify(d.value);
      case "number": {
        const v = d.value.trim();
        if (!v) return "";
        if (!NUM.test(v)) throw new FlowError("invalid", `\u201C${v}\u201D is not a number`);
        return String(Number(v));
      }
      case "boolean":
        return d.value === "true" ? "true" : "false";
      case "ref": {
        const v = d.value.trim();
        if (v && !PATH.test(v)) throw new FlowError("invalid", `\u201C${v}\u201D is not a data name (use letters, numbers and _; e.g. customer.name)`);
        return v;
      }
      case "expr":
        return d.value.trim();
      case "object": {
        const seen = /* @__PURE__ */ new Set();
        for (const f of d.fields) {
          if (!IDENT.test(f.name)) throw new FlowError("invalid", `Invalid field name: \u201C${f.name}\u201D`);
          if (seen.has(f.name)) throw new FlowError("invalid", `Duplicate field: ${f.name}`);
          seen.add(f.name);
        }
        return d.fields.length ? `{ ${d.fields.map((f) => `${f.name}: ${buildArg(f.draft) || "undefined"}`).join(", ")} }` : "{}";
      }
    }
  }
  function inferArg(expr) {
    const e = expr.trim();
    if (!e) return emptyDraft();
    if (/^"(?:[^"\\]|\\.)*"$/.test(e)) {
      try {
        return { type: "text", value: JSON.parse(e), fields: [] };
      } catch {
      }
    }
    if (NUM.test(e)) return { type: "number", value: e, fields: [] };
    if (e === "true" || e === "false") return { type: "boolean", value: e, fields: [] };
    if (PATH.test(e)) return { type: "ref", value: e, fields: [] };
    if (e.startsWith("{")) {
      const o = parseObject(e);
      if (o) return o;
    }
    return { type: "expr", value: e, fields: [] };
  }
  function parseObject(src) {
    let i = 0;
    const ws = () => {
      while (/\s/.test(src[i] ?? "")) i++;
    };
    const value = () => {
      ws();
      const c = src[i];
      if (c === "{") return object();
      if (c === '"') {
        const m2 = /^"(?:[^"\\]|\\.)*"/.exec(src.slice(i));
        if (!m2) return null;
        i += m2[0].length;
        try {
          return { type: "text", value: JSON.parse(m2[0]), fields: [] };
        } catch {
          return null;
        }
      }
      const m = /^[^,}\s][^,}]*/.exec(src.slice(i));
      if (!m) return null;
      const raw = m[0].trim();
      i += m[0].length;
      return raw === "undefined" ? emptyDraft() : inferArg(raw);
    };
    const object = () => {
      if (src[i] !== "{") return null;
      i++;
      const fields = [];
      ws();
      if (src[i] === "}") {
        i++;
        return { type: "object", value: "", fields };
      }
      for (; ; ) {
        ws();
        const k = /^[A-Za-z_$][\w$]*/.exec(src.slice(i));
        if (!k) return null;
        i += k[0].length;
        ws();
        if (src[i] !== ":") return null;
        i++;
        const v = value();
        if (!v) return null;
        fields.push({ name: k[0], draft: v });
        ws();
        if (src[i] === ",") {
          i++;
          continue;
        }
        if (src[i] === "}") {
          i++;
          return { type: "object", value: "", fields };
        }
        return null;
      }
    };
    const r = object();
    ws();
    return r && i === src.length ? r : null;
  }
  var EXPR_RESERVED = /* @__PURE__ */ new Set(["true", "false", "null", "undefined", "typeof", "instanceof", "in", "of", "new", "void", "NaN", "Infinity", "Math", "JSON", "Object", "Array", "Number", "String", "Boolean", "Date", "Set", "Map", "state", "error"]);
  var exprIdents = (expr) => [...expr.replace(/([{,]\s*)[A-Za-z_$][\w$]*(\s*:)/g, "$1$2").replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "").matchAll(/(?<![.\w$])[A-Za-z_$][\w$]*/g)].map((m) => m[0]).filter((w) => !EXPR_RESERVED.has(w));

  // novo/cond.ts
  var COND_OPS = [
    { op: "truthy", label: "is true / filled in", needsRight: false },
    { op: "falsy", label: "is false / empty", needsRight: false },
    { op: "eq", label: "equals", needsRight: true },
    { op: "neq", label: "does not equal", needsRight: true },
    { op: "gt", label: "is greater than", needsRight: true },
    { op: "gte", label: "is greater than or equal to", needsRight: true },
    { op: "lt", label: "is less than", needsRight: true },
    { op: "lte", label: "is less than or equal to", needsRight: true },
    { op: "contains", label: "contains", needsRight: true },
    { op: "notContains", label: "does not contain", needsRight: true },
    { op: "startsWith", label: "starts with", needsRight: true },
    { op: "endsWith", label: "ends with", needsRight: true },
    { op: "empty", label: "has no items / is blank", needsRight: false },
    { op: "notEmpty", label: "has items / is not blank", needsRight: false }
  ];
  var JOINERS = [{ join: "&&", label: "AND" }, { join: "||", label: "OR" }];
  var needsRight = (op) => COND_OPS.find((o) => o.op === op).needsRight;
  var emptyClause = (join = "&&") => ({ left: emptyDraft("ref"), op: "truthy", right: emptyDraft("text"), join });
  var emptyCond = () => ({ clauses: [emptyClause()] });
  var lhs = (d) => d.type === "ref" || d.type === "expr" ? d.value.trim() : buildArg(d);
  function buildClause(c) {
    const L = lhs(c.left);
    if (!L) return "";
    const R = needsRight(c.op) ? buildArg(c.right) : "";
    if (needsRight(c.op) && !R) return "";
    switch (c.op) {
      case "truthy":
        return L;
      case "falsy":
        return `!${/^[\w$.]+$/.test(L) ? L : `(${L})`}`;
      case "eq":
        return `${L} === ${R}`;
      case "neq":
        return `${L} !== ${R}`;
      case "gt":
        return `${L} > ${R}`;
      case "gte":
        return `${L} >= ${R}`;
      case "lt":
        return `${L} < ${R}`;
      case "lte":
        return `${L} <= ${R}`;
      case "contains":
        return `${L}.includes(${R})`;
      case "notContains":
        return `!${L}.includes(${R})`;
      case "startsWith":
        return `${L}.startsWith(${R})`;
      case "endsWith":
        return `${L}.endsWith(${R})`;
      case "empty":
        return `!${L}?.length`;
      case "notEmpty":
        return `!!${L}?.length`;
    }
  }
  function buildCond(d) {
    let out = "";
    d.clauses.forEach((c, i) => {
      const s = buildClause(c);
      if (!s) return;
      out += out ? ` ${c.join} ${s}` : s;
      void i;
    });
    return out;
  }
  function splitTop(s, sep) {
    const out = [];
    let depth = 0, q = "", cur = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (q) {
        cur += c;
        if (c === "\\") {
          cur += s[++i] ?? "";
          continue;
        }
        if (c === q) q = "";
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        q = c;
        cur += c;
        continue;
      }
      if ("([{".includes(c)) depth++;
      else if (")]}".includes(c)) depth--;
      if (depth === 0 && s.startsWith(sep, i)) {
        out.push(cur);
        cur = "";
        i += sep.length - 1;
        continue;
      }
      cur += c;
    }
    out.push(cur);
    return out.map((x) => x.trim());
  }
  var PATH2 = "[A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*";
  function parseClause(raw, join) {
    const s = raw.trim(), mk = (op, l, r) => ({ join, op, left: { ...emptyDraft("ref"), value: l }, right: r === void 0 ? emptyDraft("text") : inferArg(r) });
    let m;
    if (m = new RegExp(`^!!(${PATH2})\\?\\.length$`).exec(s)) return mk("notEmpty", m[1]);
    if (m = new RegExp(`^!(${PATH2})\\?\\.length$`).exec(s)) return mk("empty", m[1]);
    if ((m = new RegExp(`^!(${PATH2})\\.includes\\((.+)\\)$`).exec(s)) && !/\.(includes|startsWith|endsWith)$/.test(m[1])) return mk("notContains", m[1], m[2]);
    if (m = new RegExp(`^(${PATH2})\\.(includes|startsWith|endsWith)\\((.+)\\)$`).exec(s)) {
      const f = m[2];
      return mk(f === "includes" ? "contains" : f, m[1], m[3]);
    }
    if (m = new RegExp(`^(${PATH2})\\s*(===|!==|>=|<=|>|<)\\s*(.+)$`).exec(s)) return mk({ "===": "eq", "!==": "neq", ">=": "gte", "<=": "lte", ">": "gt", "<": "lt" }[m[2]], m[1], m[3]);
    if (m = new RegExp(`^!(${PATH2})$`).exec(s)) return mk("falsy", m[1]);
    if (new RegExp(`^${PATH2}$`).test(s)) return mk("truthy", s);
    return { join, op: "truthy", left: { type: "expr", value: s, fields: [] }, right: emptyDraft("text") };
  }
  function inferCond(expr) {
    const e = expr.trim();
    if (!e) return emptyCond();
    const clauses = [];
    splitTop(e, "||").forEach((orPart, i) => splitTop(orPart, "&&").forEach((p, j) => clauses.push(parseClause(p, i > 0 && j === 0 ? "||" : "&&"))));
    return { clauses };
  }

  // novo/runner.ts
  function formatValue(v) {
    if (typeof v === "string") return v;
    if (v === void 0) return "undefined";
    if (typeof v === "function") return `[Function ${v.name || "anonymous"}]`;
    if (typeof v === "bigint") return `${v}n`;
    if (v instanceof Error) return v.stack || `${v.name}: ${v.message}`;
    if (v && typeof v === "object") {
      try {
        return JSON.stringify(v, (_k, x) => typeof x === "function" ? `[Function ${x.name || "anonymous"}]` : typeof x === "bigint" ? `${x}n` : x, 2) ?? String(v);
      } catch {
        return String(v);
      }
    }
    return String(v);
  }
  function formatArgs(args) {
    return args.map(formatValue).join(" ");
  }
  function formatTable(data) {
    if (!data || typeof data !== "object") return formatValue(data);
    const rows = Array.isArray(data) ? data.map((v, i) => [String(i), v]) : Object.entries(data);
    const cols = [];
    let plain = false;
    for (const [, v] of rows) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        for (const k of Object.keys(v)) if (!cols.includes(k)) cols.push(k);
      } else plain = true;
    }
    const head = ["(index)", ...cols, ...plain ? ["Value"] : []];
    const body = rows.map(([k, v]) => {
      const o = v && typeof v === "object" && !Array.isArray(v) ? v : null;
      return [k, ...cols.map((c) => o && c in o ? formatValue(o[c]) : ""), ...plain ? [o ? "" : formatValue(v)] : []];
    });
    const w = head.map((h, i) => Math.max(h.length, ...body.map((r) => (r[i] ?? "").length)));
    const line = (r) => `\u2502 ${r.map((c, i) => c.padEnd(w[i])).join(" \u2502 ")} \u2502`, bar = (l, m, r) => `${l}${w.map((n) => "\u2500".repeat(n + 2)).join(m)}${r}`;
    return [bar("\u250C", "\u252C", "\u2510"), line(head), bar("\u251C", "\u253C", "\u2524"), ...body.map(line), bar("\u2514", "\u2534", "\u2518")].join("\n");
  }
  async function execute(code, emit, now = () => Date.now()) {
    const t0 = now(), AsyncFunction = Object.getPrototypeOf(async function() {
    }).constructor;
    const mk = (level) => (...args) => emit({ type: "log", level, text: formatArgs(args), t: now() - t0 });
    const con = { log: mk("log"), info: mk("info"), warn: mk("warn"), error: mk("error"), debug: mk("debug"), table: (d) => emit({ type: "log", level: "table", text: formatTable(d), t: now() - t0 }) };
    try {
      await new AsyncFunction("console", code)(con);
      emit({ type: "done", ms: now() - t0 });
    } catch (err) {
      emit({ type: "error", message: err instanceof Error ? err.stack || `${err.name}: ${err.message}` : String(err), ms: now() - t0 });
    }
  }
  var workerSource = () => [formatValue, formatArgs, formatTable, execute].map((f) => f.toString()).join("\n") + "\nself.onmessage = e => { execute(e.data.code, ev => self.postMessage(ev)); };";
  function runInWorker(code, onEvent) {
    const url = URL.createObjectURL(new Blob([workerSource()], { type: "text/javascript" })), w = new Worker(url);
    let over = false;
    const t0 = Date.now();
    const end = () => {
      over = true;
      w.terminate();
      URL.revokeObjectURL(url);
    };
    const mirror = (e) => {
      if (e.type === "log") {
        const fn = e.level === "table" || e.level === "system" ? console.log : console[e.level];
        fn.call(console, e.text);
      } else if (e.type === "error") console.error(e.message);
    };
    w.onmessage = (e) => {
      if (over) return;
      mirror(e.data);
      onEvent(e.data);
      if (e.data.type !== "log") end();
    };
    w.onerror = (e) => {
      if (over) return;
      onEvent({ type: "error", message: e.message || "Worker error", ms: Date.now() - t0 });
      end();
    };
    w.postMessage({ code });
    return { stop: () => {
      if (over) return;
      end();
      const ev = { type: "error", message: "Execution stopped", ms: Date.now() - t0 };
      mirror(ev);
      onEvent(ev);
    } };
  }

  // novo/codegen.ts
  var JS_WORDS = new Set("break case catch class const continue debugger default delete do else enum export extends false finally for function if import in instanceof new null return super switch this throw true try typeof var void while with yield let static implements interface package private protected public await async of type state error call data humans wrappers stubs result".split(" "));
  var camel = (s) => {
    const w = s.normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
    const j = w.map((x, i) => i === 0 ? x.charAt(0).toLowerCase() + x.slice(1) : x.charAt(0).toUpperCase() + x.slice(1)).join("");
    const id = /^[0-9]/.test(j) ? `_${j}` : j || "flow";
    return JS_WORDS.has(id) ? `${id}_` : id;
  };
  function generate(p, rootId, options = {}) {
    const opts = options.js ? { ...options, runnable: true } : options, ts = !opts.js;
    const ty = (withTypes, plain = "") => ts ? withTypes : plain;
    const loc = locate(p, rootId), flow = loc?.node.t === "fn" ? loc.node : null;
    if (!flow) throw new Error(`Flow ${rootId} does not exist`);
    const allFns = flow.kids.length ? fnsOf(flow) : [flow];
    const scopeFns = (nodes) => nodes.flatMap((n) => n.t === "fn" ? [n] : scopeFns(kidsOf(n)));
    const fns = flow.kids.length ? scopeFns(flow.kids) : [flow];
    const used = opts.reg ?? /* @__PURE__ */ new Map(), names = opts.names ?? /* @__PURE__ */ new Map();
    const dataNames = /* @__PURE__ */ new Set([...allFns.flatMap((f) => [...f.ins, ...f.outs])]);
    walk(flow.kids, (n) => {
      if (n.t === "for") dataNames.add(n.v);
    });
    if (!opts.names) for (const f of allFns) {
      let base = camel(f.title);
      if (dataNames.has(base)) base = `${base}Fn`;
      const n = (used.get(base) ?? 0) + 1;
      used.set(base, n);
      let name = n === 1 ? base : `${base}${n}`;
      while (dataNames.has(name) && name !== base) name = `${name}_`;
      names.set(f.id, name);
    }
    const nameOf = (f) => names.get(f.id) ?? camel(f.title);
    const kindOf = (f) => {
      if (f.kids.length) return "local";
      const a = agentOf(p, f.agent);
      return a?.kind === "arquivo" ? "file" : a?.kind === "maquina" ? "lib" : a?.kind === "pessoa" ? "pessoa" : "abs";
    };
    const isModule = (n) => /[:/@]/.test(n);
    const libVar = (n) => isModule(n) ? n.replace(/[^A-Za-z0-9_]/g, "_") : n;
    const produced = [...new Set(fns.flatMap((f) => f.outs))];
    const rootIns = flow.kids.length ? flow.ins : [];
    const producedAll = [...new Set(allFns.flatMap((f) => f.outs))];
    const needed = [.../* @__PURE__ */ new Set([...rootIns, ...allFns.flatMap((f) => f.ins.filter((i) => !f.args?.[i]?.trim() && !contractOf(p, f)?.optional?.includes(i)))])].filter((i) => !producedAll.includes(i));
    const returned = flow.outs;
    const abstract = fns.filter((f) => kindOf(f) === "abs").map(nameOf);
    const libFns = allFns.filter((f) => kindOf(f) === "lib"), callables = fns.filter((f) => kindOf(f) !== "pessoa" && kindOf(f) !== "file" && kindOf(f) !== "local").map(nameOf);
    const libs = [...new Set(allFns.filter((f) => kindOf(f) === "lib").map((f) => agentOf(p, f.agent).name))].filter(isModule);
    const hasHumans = fns.some((f) => kindOf(f) === "pessoa"), hasHumansAll = allFns.some((f) => kindOf(f) === "pessoa"), needFn = allFns.some((f) => !["pessoa", "file", "local"].includes(kindOf(f)));
    const lines = [], map = {};
    const emit = (s) => {
      lines.push(s);
    };
    const mark = (id, a) => {
      map[id] = [a, lines.length];
    };
    const callOf = (f, scope, err) => {
      const entries = /* @__PURE__ */ new Map();
      for (const v of scope) entries.set(v, v);
      if (kindOf(f) === "local") for (const d of declared) entries.set(d, d);
      for (const i of f.ins) if (produced.includes(i) || scope.includes(i) || needed.includes(i)) entries.set(i, i);
      for (const i of f.ins) {
        const expr = f.args?.[i]?.trim();
        if (expr) entries.set(i, initOf(f, i, scope) || !isDataRef(expr) ? i : expr);
      }
      const args = `{ ...state${[...entries].map(([k, v]) => k === v ? `, ${k}` : `, ${k}: ${v}`).join("")}${err ? ", error" : ""} }`;
      const a = agentOf(p, f.agent);
      return kindOf(f) === "pessoa" ? `humans.ask(${JSON.stringify(a.name)}, ${JSON.stringify(f.title)}, ${args})` : `${nameOf(f)}(${args})`;
    };
    const HELPERS = /* @__PURE__ */ new Set(["data", "humans", "state", "error", "stubs", "wrappers", "result"]);
    const initOf = (f, i, scope) => {
      const e = f.args?.[i]?.trim();
      return e && !isDataRef(e) && !scope.includes(i) && !fromStateSet.has(i) && !callables.includes(i) && !dataNamesLoop.has(i) && !HELPERS.has(i) ? e : void 0;
    };
    const initLines = (fs, scope, ind) => fs.flatMap((f) => f.ins.map((i) => [i, initOf(f, i, scope)]).filter((x) => !!x[1]).map(([i, e]) => `${ind}${i} = ${e};`));
    const assign = (f, expr) => f.outs.length ? `({ ${f.outs.join(", ")} } = await ${expr});` : `await ${expr};`;
    const wrapperOf = (f) => {
      const a = agentOf(p, f.agent), c = contractOf(p, f), call = (args) => `${libVar(a.name)}.${f.title}(${args})`, ind = "    ";
      const head = `  ${nameOf(f)}: async (state${ty(": State")})${ty(": Promise<State>")} => {`;
      if (!c) return [head, `${ind}await ${call(`state${ty(" as never")}`)};`, `${ind}return {};`, "  },"];
      const body = [...c.ins.length ? [`${ind}const { ${c.ins.join(", ")} } = state;`] : []], expr = call(c.ins.map((i) => `${i}${ty(" as never")}`).join(", "));
      if (!f.outs.length) body.push(`${ind}await ${expr};`, `${ind}return {};`);
      else if (f.outs.length === 1) body.push(`${ind}return { ${f.outs[0]}: await ${expr} };`);
      else body.push(`${ind}return (await ${expr})${ty(" as State")};`);
      return [head, ...body, "  },"];
    };
    const declared = /* @__PURE__ */ new Set();
    const inferType = (e) => {
      const x = e.trim();
      if (/^"(?:[^"\\]|\\.)*"$|^'(?:[^'\\]|\\.)*'$|^`[^`]*`$/.test(x)) return "string";
      if (/^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(x)) return "number";
      if (/^(?:true|false)$/.test(x)) return "boolean";
      if (/^\[[\s\S]*\]$/.test(x)) return "unknown[]";
      if (/^\{[\s\S]*\}$/.test(x)) return "Record<string, unknown>";
      const bare = x.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "");
      if (!bare.includes(x) && /["'`]/.test(x)) return void 0;
      if (/^!|(?:===?|!==?|<=?|>=?)/.test(bare) && !/[?]/.test(bare)) return "boolean";
      if (/^[\w$.\s()+\-*/%]+$/.test(x) && /[*/%]|\s-\s/.test(x) && !/["'`]/.test(x)) return "number";
      return void 0;
    };
    const typeOf = (n) => inExpr.has(n) ? "any" : "unknown";
    const letLine = (names2, ind) => {
      const ns = names2.filter((n) => !declared.has(n));
      if (!ns.length) return;
      ns.forEach((n) => declared.add(n));
      emit(`${ind}let ${ns.map((n) => `${n}${ty(`: ${typeOf(n)}`)}`).join(", ")};`);
    };
    const list = (nodes, ind, scope, err, key = "r") => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], a = lines.length + 1;
        if (n.t === "fn") {
          const group = [n];
          while (nodes[i + 1]?.t === "fn" && nodes[i + 1].par) group.push(nodes[++i]);
          const ds = (declAt.get(`${key}|${n.id}`) ?? []).filter((x) => !declared.has(x));
          if (group.length === 1) {
            const inl = /* @__PURE__ */ new Set();
            const pre = n.ins.flatMap((x) => {
              const e = initOf(n, x, scope);
              if (!e) return [];
              if (ds.includes(x)) {
                inl.add(x);
                declared.add(x);
                return [`${ind}${writers.get(x) === 1 ? "const" : "let"} ${x}${ty(`: ${writers.get(x) === 1 && !inExpr.has(x) ? inferType(e) ?? typeOf(x) : typeOf(x)}`)} = ${e};`];
              }
              return [`${ind}${x} = ${e};`];
            });
            const constOut = n.outs.length > 0 && n.outs.every((o) => ds.includes(o) && writers.get(o) === 1);
            letLine(ds.filter((x) => !inl.has(x) && !(constOut && n.outs.includes(x))), ind);
            pre.forEach((l) => emit(l));
            const a02 = lines.length + 1;
            if (constOut) {
              n.outs.forEach((o) => declared.add(o));
              emit(`${ind}const { ${n.outs.join(", ")} }${ty(n.outs.some((o) => inExpr.has(o)) ? ": any" : "")} = await ${callOf(n, scope, err)};`);
            } else emit(`${ind}${assign(n, callOf(n, scope, err))}`);
            map[n.id] = [pre.length || ds.length ? a : a02, lines.length];
            continue;
          }
          letLine(ds, ind);
          initLines(group, scope, ind).forEach((l) => emit(l));
          const a0 = lines.length + 1;
          const anyOut = group.some((g) => g.outs.length);
          emit(`${ind}${anyOut ? `const par${a0} = ` : ""}await Promise.all([`);
          group.forEach((g) => emit(`${ind}  ${callOf(g, scope, err)},`));
          emit(`${ind}]);`);
          group.forEach((g, k) => {
            if (g.outs.length) emit(kindOf(g) === "lib" && contractOf(p, g) && g.outs.length === 1 ? `${ind}${g.outs[0]} = par${a0}[${k}];` : `${ind}({ ${g.outs.join(", ")} } = par${a0}[${k}]${ty(" as State")});`);
          });
          group.forEach((g) => {
            map[g.id] = [a, lines.length];
          });
        } else if (n.t === "if") {
          letLine(declAt.get(`${key}|${n.id}`) ?? [], ind);
          const a1 = lines.length + 1;
          emit(`${ind}if (${n.test}) {`);
          list(n.kids, ind + "  ", scope, err, `${n.id}:k`);
          if (n.elseKids.length) {
            emit(`${ind}} else {`);
            list(n.elseKids, ind + "  ", scope, err, `${n.id}:e`);
          }
          emit(`${ind}}`);
          mark(n.id, a1);
        } else if (n.t === "for") {
          letLine(declAt.get(`${key}|${n.id}`) ?? [], ind);
          const a1 = lines.length + 1;
          emit(`${ind}for (const ${n.v} of ${n.coll}) {`);
          list(n.kids, ind + "  ", [...scope, n.v], err, `${n.id}:k`);
          emit(`${ind}}`);
          mark(n.id, a1);
        } else {
          letLine(declAt.get(`${key}|${n.id}`) ?? [], ind);
          const a1 = lines.length + 1;
          emit(`${ind}try {`);
          list(n.kids, ind + "  ", scope, err, `${n.id}:k`);
          emit(`${ind}} catch (error) {`);
          list(n.catchKids, ind + "  ", scope, true, `${n.id}:c`);
          emit(returned.length ? `${ind}  return { ...state, error };` : `${ind}  return;`);
          emit(`${ind}}`);
          mark(n.id, a1);
        }
      }
    };
    const idsOf = exprIdents;
    const inExpr = /* @__PURE__ */ new Set(), fromStateSet = /* @__PURE__ */ new Set();
    const scan = (nodes, scope) => {
      for (const n of nodes) {
        if (n.t === "fn") for (const v of Object.values(n.args ?? {})) for (const id of idsOf(v)) {
          if (scope.includes(id)) continue;
          inExpr.add(id);
          if (!produced.includes(id)) fromStateSet.add(id);
        }
        if (n.t === "if") {
          for (const id of idsOf(n.test)) {
            if (scope.includes(id)) continue;
            inExpr.add(id);
            if (!produced.includes(id)) fromStateSet.add(id);
          }
          scan(n.kids, scope);
          scan(n.elseKids, scope);
        } else if (n.t === "for") {
          for (const id of idsOf(n.coll)) {
            if (scope.includes(id)) continue;
            inExpr.add(id);
            if (!produced.includes(id)) fromStateSet.add(id);
          }
          scan(n.kids, [...scope, n.v]);
        } else if (n.t === "try") {
          scan(n.kids, scope);
          scan(n.catchKids, scope);
        }
      }
    };
    scan(flow.kids, []);
    const fromState = [...fromStateSet].filter((n) => !callables.includes(n) && n !== "humans");
    const dataNamesLoop = /* @__PURE__ */ new Set();
    walk(flow.kids, (n) => {
      if (n.t === "for") dataNamesLoop.add(n.v);
    });
    const inits = [...new Set(fns.flatMap((f) => f.ins.filter((i) => initOf(f, i, []))))].filter((i) => !produced.includes(i) && !fromState.includes(i));
    const declarable = /* @__PURE__ */ new Set([...produced, ...flow.kids.length ? flow.outs : [], ...inits]);
    const usesOf = /* @__PURE__ */ new Map(), writers = /* @__PURE__ */ new Map();
    let seq = 0;
    const addUse = (name, trail) => {
      if (!declarable.has(name)) return;
      const l = usesOf.get(name) ?? [];
      l.push({ keys: trail.map((t) => t[0]), ids: trail.map((t) => t[1]), seq: seq++ });
      usesOf.set(name, l);
    };
    const scanDecl = (nodes, key, trail, scope) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.t === "fn") {
          const group = [n];
          while (nodes[i + 1]?.t === "fn" && nodes[i + 1].par) group.push(nodes[++i]);
          const here = [...trail, [key, n.id]];
          for (const g of group) {
            for (const x of g.ins) {
              const e = g.args?.[x]?.trim();
              if (e) {
                idsOf(e).forEach((id) => addUse(id, here));
                if (initOf(g, x, scope)) {
                  addUse(x, here);
                  writers.set(x, (writers.get(x) ?? 0) + 1);
                }
              } else if (produced.includes(x)) addUse(x, here);
            }
            for (const o of g.outs) {
              addUse(o, here);
              writers.set(o, (writers.get(o) ?? 0) + 1);
            }
          }
        } else {
          const here = [...trail, [key, n.id]];
          if (n.t === "if") {
            idsOf(n.test).forEach((id) => addUse(id, here));
            scanDecl(n.kids, `${n.id}:k`, here, scope);
            scanDecl(n.elseKids, `${n.id}:e`, here, scope);
          } else if (n.t === "for") {
            idsOf(n.coll).forEach((id) => addUse(id, here));
            scanDecl(n.kids, `${n.id}:k`, here, [...scope, n.v]);
          } else {
            scanDecl(n.kids, `${n.id}:k`, here, scope);
            scanDecl(n.catchKids, `${n.id}:c`, here, scope);
          }
        }
      }
    };
    scanDecl(flow.kids, "r", [], []);
    returned.forEach((o) => addUse(o, [["r", "__ret"]]));
    const declAt = /* @__PURE__ */ new Map();
    for (const [name, us] of usesOf) {
      const f0 = us[0];
      let l = 0;
      while (us.every((u) => u.keys.length > l + 1 && u.keys[l + 1] === f0.keys[l + 1] && u.ids[l] === f0.ids[l])) l++;
      const firstUse = us.reduce((m, u) => u.seq < m.seq ? u : m), k = `${f0.keys[l]}|${firstUse.ids[l]}`;
      declAt.set(k, [...declAt.get(k) ?? [], name]);
    }
    if (!opts.inner) {
      for (const l of libs) emit(opts.js ? `const ${libVar(l)} = await import(${JSON.stringify(l)});` : `import * as ${libVar(l)} from ${JSON.stringify(l)};`);
      const byFile = /* @__PURE__ */ new Map();
      for (const f of allFns.filter((x) => kindOf(x) === "file")) {
        const k = agentOf(p, f.agent).name;
        byFile.set(k, [...byFile.get(k) ?? [], f]);
      }
      for (const [file, list2] of byFile) {
        const names2 = [...new Set(list2.map((f) => `${camel(f.title)}${camel(f.title) === nameOf(f) ? "" : ` as ${nameOf(f)}`}`))];
        emit(opts.js ? `const { ${names2.map((n) => n.replace(" as ", ": ")).join(", ")} } = await import(${JSON.stringify("./" + file)});` : `import { ${names2.join(", ")} } from ${JSON.stringify("./" + file)};`);
      }
      if (lines.length > 0) emit("");
      if (ts) {
        emit("type State = Record<string, unknown>;");
        if (needFn) emit("type Fn = (state: State) => Promise<State>;");
        if (hasHumansAll) emit("type Humans = { ask: (who: string, what: string, args: State) => Promise<State> };");
      }
      if (lines.length > 0) emit("");
    }
    emit(`${opts.inner ? "" : ty("export ")}async function ${opts.fnName ?? camel(flow.title)}(state${ty(": State")})${ty(returned.length ? ": Promise<State>" : ": Promise<void>")} {`);
    const startBody = lines.length + 1;
    if (hasHumans) emit(`  const { humans } = state${ty(" as { humans: Humans }")};`);
    if (callables.length) emit(`  const { ${callables.join(", ")} } = state${ty(` as Record<${callables.map((n) => JSON.stringify(n)).join(" | ")}, Fn>`)};`);
    const stateNames = [.../* @__PURE__ */ new Set([...fromState, ...needed.filter((n) => !callables.includes(n) && n !== "humans")])];
    if (stateNames.length) emit(`  const { ${stateNames.join(", ")} } = state${ty(" as Record<string, any>")};`);
    if (flow.kids.length) list(flow.kids, "  ", [], false);
    else {
      letLine([...produced, ...inits], "  ");
      initLines([flow], [], "  ").forEach((l) => emit(l));
      const a = lines.length + 1;
      emit(`  ${assign(flow, callOf(flow, [], false))}`);
      mark(flow.id, a);
    }
    letLine(declAt.get("r|__ret") ?? [], "  ");
    if (returned.length) emit(`  return { ${returned.join(", ")} };`);
    emit("}");
    map[flow.id] = [startBody, lines.length - 1];
    emit("");
    for (const f of fns.filter((x) => kindOf(x) === "local")) {
      const g = generate(p, f.id, { ...options, inner: true, names, reg: used, fnName: nameOf(f) }), off = lines.length;
      g.code.replace(/\n$/, "").split("\n").forEach((l) => emit(l));
      for (const [k, [a, b]] of Object.entries(g.map)) map[k] = [a + off, b + off];
      emit("");
    }
    if (!opts.inner && libFns.length) {
      emit(`${ty("export ")}const wrappers${ty(": Record<string, Fn>")} = {`);
      for (const f of libFns) {
        const start = lines.length + 1;
        for (const l of wrapperOf(f)) emit(l);
        map[`${f.id}:wrapper`] = [start, lines.length];
      }
      emit("};");
      emit("");
    }
    const fnName = camel(flow.title), runFile = `${slug(flow.title)}.mts`, runCommand = `node --experimental-strip-types ${runFile}`;
    if (opts.inner) {
    } else if (opts.runnable) {
      const sim = (f) => `${nameOf(f)}: async () => (${f.outs.length ? `{ ${f.outs.map((o) => `${o}: ${JSON.stringify(`${o} (simulated)`)}`).join(", ")} }` : "{}"})`;
      const given = [...libFns.length ? ["...wrappers"] : [], ...allFns.filter((x) => kindOf(x) === "abs").map(sim), ...hasHumansAll ? [`humans: { ask: async (who${ty(": string")}, what${ty(": string")}) => (console.log(\`[person] \${who}: \${what}\`), {}) }`] : [], ...needed.map((n) => `${n}: ${flow.args?.[n]?.trim() || JSON.stringify(`${n} (simulated)`)}`)];
      const arg = !given.length ? "" : given.length < 3 && given.every((g) => g.length < 30) ? `{ ${given.join(", ")} }` : `{
${given.map((g) => `  ${g},`).join("\n")}
}`;
      if (returned.length) {
        emit(`const result = await ${fnName}(${arg});`);
        emit("console.log(result);");
      } else emit(`await ${fnName}(${arg});`);
    }
    void isComposite;
    void walk;
    return { code: lines.join("\n") + "\n", map, fileName: flowFile(flow), name: fnName, runFile, runCommand };
  }
  function generateFile(p, ids, options = {}) {
    const imports = /* @__PURE__ */ new Set(), types = /* @__PURE__ */ new Set(), parts = [], wrappers = /* @__PURE__ */ new Map();
    let wOpen = "";
    let fileName = "";
    for (const id of ids) {
      const g = generate(p, id, { ...options, runnable: false });
      fileName ||= g.fileName;
      const L = g.code.replace(/\n$/, "").split("\n"), fnI = Math.max(0, L.findIndex((l) => /^(export )?async function /.test(l))), wI = L.findIndex((l) => /^(export )?const wrappers\b/.test(l));
      for (const l of L.slice(0, fnI)) {
        if (/^(import |const \{.*\} = await import)/.test(l)) imports.add(l);
        else if (l.startsWith("type ")) types.add(l);
      }
      const part = L.slice(fnI, wI === -1 ? L.length : wI);
      while (part.length && !part[part.length - 1].trim()) part.pop();
      parts.push(part);
      if (wI !== -1) {
        wOpen ||= L[wI];
        let cur = null;
        for (const l of L.slice(wI + 1)) {
          if (l === "};") break;
          if (/^  \w+: async/.test(l)) cur = wrappers.has(l) ? null : (wrappers.set(l, []), wrappers.get(l));
          cur?.push(l);
        }
      }
    }
    const out = [...imports, ...imports.size ? [""] : [], ...types, ...types.size ? [""] : []];
    parts.forEach((pt) => {
      out.push(...pt, "");
    });
    if (wrappers.size) out.push(wOpen, ...[...wrappers.values()].flat(), "};", "");
    return { code: out.join("\n"), fileName };
  }

  // novo/icons.ts
  var P = {
    plus: ["M5 12h14", "M12 5v14"],
    minus: ["M5 12h14"],
    x: ["M18 6 6 18", "m6 6 12 12"],
    trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", "M10 11v6", "M14 11v6"],
    chevron: ["m6 9 6 6 6-6"],
    diamond: ["M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"],
    repeat: ["m17 2 4 4-4 4", "M3 11v-1a4 4 0 0 1 4-4h14", "m7 22-4-4 4-4", "M21 13v1a4 4 0 0 1-4 4H3"],
    user: ["M20 21a8 8 0 0 0-16 0", "circle:12,8,5"],
    ia: ["M2 21a8 8 0 0 1 10.434-7.62", "circle:10,8,5", "circle:18,18,3", "M18 14v1", "M18 21v1", "M22 18h-1", "M15 18h-1"],
    package: ["m7.5 4.27 9 5.15", "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z", "m3.3 7 8.7 5 8.7-5", "M12 22V12"],
    file: ["M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4", "M14 2v4a2 2 0 0 0 2 2h4", "m5 12-3 3 3 3", "m9 18 3-3-3-3"],
    network: ["rect:16,16,6,6,1", "rect:2,16,6,6,1", "rect:9,2,6,6,1", "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", "M12 12V8"],
    shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M12 8v4", "M12 16h.01"],
    "log-out": ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
    child: ["M2 12h8", "M6 8v8", "M14 12h8", "m18 8 4 4-4 4"],
    sibling: ["M2 12h8", "M6 8v8", "M17 4v15", "m13 15 4 4 4-4"],
    grow: ["M5 12h14", "m13 6 6 6-6 6"],
    shrink: ["M19 12H5", "m11 6-6 6 6 6"],
    parallel: ["M8 3v18", "M16 3v18"],
    branch: ["M6 3v12", "circle:18,6,3", "circle:6,18,3", "M18 9a9 9 0 0 1-9 9"],
    download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"],
    upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
    users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "circle:9,7,4", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    code: ["m16 18 6-6-6-6", "m8 6-6 6 6 6"],
    "panel-right": ["rect:3,3,18,18,2", "M15 3v18"],
    cube: ["M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9z", "M3.5 7.5 12 12.5l8.5-5", "M12 12.5v9"],
    eraser: ["m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21", "M22 21H7", "m5 11 9 9"],
    "panel-left": ["rect:3,3,18,18,2", "M9 3v18"],
    play: ["M6 4v16l14-8z"],
    square: ["rect:6,6,12,12,1"],
    terminal: ["m4 17 6-6-6-6", "M12 19h8"],
    reset: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
    undo: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"],
    redo: ["m15 14 5-5-5-5", "M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13"],
    text: ["M12 4v16", "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2", "M9 20h6"],
    expand: ["m7 15 5 5 5-5", "m7 9 5-5 5 5"],
    collapse: ["m7 20 5-5 5 5", "m7 4 5 5 5-5"],
    fit: ["M15 3h6v6", "m21 3-7 7", "m3 21 7-7", "M9 21H3v-6"],
    copy: ["rect:8,8,14,14,2", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"]
  };
  function icon(name, cls = "") {
    const body = (P[name] ?? []).map((d) => {
      if (d.startsWith("circle:")) {
        const [cx, cy, r] = d.slice(7).split(",");
        return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      }
      if (d.startsWith("rect:")) {
        const [x, y, w, h, rx] = d.slice(5).split(",");
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`;
      }
      return `<path d="${d}"/>`;
    }).join("");
    return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }
  var KIND_ICON = { maquina: "package", pessoa: "user", ia: "ia", arquivo: "file" };

  // novo/scope.ts
  function countForStep(p, scene, blockId, step2) {
    const l = locate(p, blockId);
    if (!l || l.node.t === "fn") return 1;
    const items = [...l.node.kids, ...l.list.slice(l.index + 1)];
    let n = 0;
    for (const it of items) {
      const sp = scene.span.get(it.id);
      if (sp && sp.e > step2) break;
      n++;
    }
    return Math.min(items.length, Math.max(1, n));
  }

  // novo/layout.ts
  function layout(flow, opts = {}) {
    const closed = opts.closed ?? /* @__PURE__ */ new Set();
    const rows = [], span = /* @__PURE__ */ new Map(), leaves = [];
    let maxDepth = 0;
    const place = (list, depth, start, emit, inCatch) => {
      let step2 = start, prev = null;
      const push = (r) => {
        const row = { ...r, last: 0 };
        if (emit) {
          rows.push(row);
          maxDepth = Math.max(maxDepth, r.depth);
        }
        return row;
      };
      for (const n2 of list) {
        if (n2.t === "fn") {
          const hasKids = n2.kids.length > 0, isClosed = hasKids && closed.has(n2.id);
          if (!hasKids) {
            const s = n2.par && prev ? prev.s : step2, sp = { s, e: s };
            step2 = Math.max(step2, s + 1);
            prev = sp;
            if (emit) span.set(n2.id, sp);
            const row = push({ kind: "fn", id: n2.id, node: n2, depth, s, e: s, leaf: true, closed: false });
            if (emit) {
              row.last = rows.length - 1;
              if (!inCatch) leaves.push(row);
            }
          } else {
            const s0 = n2.par && prev ? prev.s : step2;
            const row = push({ kind: "fn", id: n2.id, node: n2, depth, s: s0, e: s0, leaf: false, closed: isClosed });
            const idx = rows.length - 1, next = place(n2.kids, depth + 1, s0, emit && !isClosed, inCatch);
            const sp = { s: s0, e: Math.max(s0, next - 1) };
            prev = sp;
            if (emit) {
              span.set(n2.id, sp);
              row.s = sp.s;
              row.e = sp.e;
              row.last = rows.length - 1;
              void idx;
            }
            step2 = Math.max(step2, next);
          }
        } else {
          prev = null;
          const b = n2;
          const row = push({ kind: "block", id: b.id, node: b, depth, s: step2, e: step2, leaf: false, closed: false });
          const next = place(b.kids, depth + 1, step2, emit, inCatch), sp = { s: step2, e: Math.max(step2, next - 1) };
          if (emit) {
            span.set(b.id, sp);
            row.s = sp.s;
            row.e = sp.e;
          }
          let end = next;
          const alt = altKids(b);
          if (alt && alt.length) {
            const kind = b.t === "try" ? "catch" : "else", count = place(alt, depth + 1, 0, false, true), cs = Math.max(step2, next - count);
            const crow = push({ kind, id: b.id, node: b, depth, s: cs, e: cs, leaf: false, closed: false });
            const cend = place(alt, depth + 1, cs, emit, true);
            if (emit) {
              crow.s = cs;
              crow.e = Math.max(cs, cend - 1);
              span.set(`${b.id}:${kind}`, { s: crow.s, e: crow.e });
              crow.last = rows.length - 1;
            }
            end = Math.max(next, cend);
          }
          if (emit) row.last = rows.length - 1;
          step2 = Math.max(step2, end);
        }
      }
      return step2;
    };
    const rootRow = { kind: "fn", id: flow.id, node: flow, depth: 0, s: 0, e: 0, last: 0, leaf: flow.kids.length === 0, closed: closed.has(flow.id) && flow.kids.length > 0 };
    rows.push(rootRow);
    let n = 1;
    if (flow.kids.length === 0) {
      span.set(flow.id, { s: 0, e: 0 });
      rootRow.last = rows.length - 1;
      leaves.push(rootRow);
    } else {
      n = Math.max(1, place(flow.kids, 1, 0, !rootRow.closed, false));
      span.set(flow.id, { s: 0, e: n - 1 });
      rootRow.e = n - 1;
      rootRow.last = rows.length - 1;
    }
    return { rows, nSteps: n, span, maxDepth, leaves };
  }

  // novo/view.ts
  var G = { RH: 34, HEAD: 52, OX: 120, W: 160, INS: 40, BH: 22, IND: 14, GAP: 16, WS: 100 };
  var planGutter = (sc) => sc.maxDepth * G.IND;
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var tw = (t, px = 6.1) => Math.ceil(t.length * px);
  var valueOf = (f, n) => f.args?.[n]?.trim() || "";
  function inputLabel(_p, f) {
    return isCube(f.ins) ? cubeName(f, "in") : f.ins[0] ?? "";
  }
  var inputTip = (p, f) => {
    const lib3 = !!contractOf(p, f);
    return f.ins.map((n) => lib3 ? `${n} = ${valueOf(f, n) || "(not filled in yet)"}` : valueOf(f, n) ? `${n} = ${valueOf(f, n)}` : n).join("\n");
  };
  var dataText = (names, max = 24) => {
    const t = names.join(", ");
    return t.length > max ? `${t.slice(0, max - 1)}\u2026` : t;
  };
  var stateLabel = (name, value, max = 26) => value != null && value !== "" ? dataText([`${name} = ${value}`], max) : dataText([name], max);
  var colX = (s, w = G.W, gutter = 0) => gutter + G.OX + s * w;
  var rowY = (i) => G.HEAD + i * G.RH;
  var planWidth = (sc, w = G.W) => colX(sc.nSteps, w, planGutter(sc)) + 160;
  var PAD = 12;
  var colW = (sc, ui) => Math.max(ui.minW ?? 0, ui.txtIn ? Math.max(G.W, ...sc.leaves.map((l) => tw(l.node.title, 6.2) + 2 * PAD + 2 * G.INS)) : G.WS);
  function objectPairs(expr) {
    const e = expr.trim();
    if (!e.startsWith("{") || !e.endsWith("}")) return null;
    const parts = [];
    let depth = 0, cur = "", q = "";
    for (const ch of e.slice(1, -1)) {
      if (q) {
        cur += ch;
        if (ch === q) q = "";
        continue;
      }
      if (ch === '"' || ch === "'" || ch === "`") {
        q = ch;
        cur += ch;
        continue;
      }
      if ("{[(".includes(ch)) depth++;
      else if ("}])".includes(ch)) depth--;
      if (ch === "," && depth === 0) {
        parts.push(cur);
        cur = "";
      } else cur += ch;
    }
    parts.push(cur);
    return parts.map((x) => x.trim()).filter(Boolean).map((x) => {
      const m = /^([A-Za-z_$][\w$]*)\s*:\s*(.+)$/s.exec(x);
      if (m) return { name: m[1], value: m[2].trim() };
      return { name: x.replace(/^\.\.\./, "").trim() };
    });
  }
  var stateRows = (items) => items.reduce((n, it) => n + 1 + (it.cube ? it.fields.length : 0), 0);
  function statesByStep(sc, all = false) {
    const m = /* @__PURE__ */ new Map(), add = (col, it) => {
      const list = m.get(col) ?? [];
      if (list.some((x) => x.name === it.name)) return;
      list.push(it);
      m.set(col, list);
    };
    for (const r of sc.rows) {
      if (r.kind !== "fn") continue;
      const f = r.node;
      for (const i of f.ins) {
        const e = f.args?.[i]?.trim();
        if (!e || isDataRef(e)) continue;
        const pairs = objectPairs(e), fields = pairs?.map((p) => p.name) ?? null;
        const fieldValues = pairs ? Object.fromEntries(pairs.filter((p) => p.value != null).map((p) => [p.name, p.value])) : void 0;
        add(r.s, { name: i, cube: !!fields, fields: fields ?? [i], value: e, fieldValues, owner: f.id, side: "in" });
      }
      if (f.outs.length) add(r.e + 1, { name: isCube(f.outs) ? cubeName(f, "out") : f.outs[0], cube: isCube(f.outs), fields: f.outs, owner: f.id, side: "out" });
    }
    const made = /* @__PURE__ */ new Set();
    for (const r of sc.rows) if (r.kind === "fn") r.node.outs.forEach((o) => made.add(o));
    const loopVars = /* @__PURE__ */ new Set();
    for (const r of sc.rows) if (r.kind === "block" && r.node.t === "for") loopVars.add(r.node.v);
    const ext = /* @__PURE__ */ new Map();
    for (const r of sc.rows) if (r.kind === "fn") {
      for (const n of r.node.ins) if (!r.node.args?.[n]?.trim() && !ext.has(n)) ext.set(n, { col: r.s, owner: r.node.id });
      else if (ext.has(n) && r.s < ext.get(n).col) ext.set(n, { col: r.s, owner: ext.get(n).owner });
    }
    for (const [n, e] of ext) if (!made.has(n) && !loopVars.has(n)) add(e.col, { name: n, cube: false, fields: [n], abs: true, owner: e.owner, side: "in" });
    if (!all) return m;
    const cols = [...m.keys()].sort((x, y) => x - y), out = /* @__PURE__ */ new Map();
    let acc = [];
    for (let c = cols[0] ?? 0; c <= sc.nSteps; c++) {
      const fresh2 = m.get(c) ?? [], names = new Set(fresh2.map((i) => i.name));
      acc = [...acc.filter((i) => !names.has(i.name)).map((i) => ({ ...i, old: true })), ...fresh2];
      if (acc.length) out.set(c, acc);
    }
    return out;
  }
  var STATE_ROW = 15;
  var planHeight = (sc, all = false) => rowY(sc.rows.length) + 64 + Math.max(0, ...[...statesByStep(sc, all).values()].map(stateRows)) * STATE_ROW;
  var TABLE_CHROME = 18 + 120 + 14;
  function tableWidth(sc, p) {
    let need2 = 90;
    for (const r of sc.rows) {
      const pad = 10 + r.depth * G.IND * 2;
      let w;
      if (r.kind === "fn") {
        const f = r.node, a = agentOf(p, f.agent);
        w = pad + (r.leaf ? 22 : 38) + (f.title || "unnamed").length * 7.4 + (a?.kind === "ia" ? 28 + a.name.length * 6.5 : 0) + (f.par ? 22 : 0) + (hasContract(a) && r.leaf ? 30 : 0);
      } else {
        const n = r.node;
        const txt = r.kind === "catch" ? "if the try fails" : r.kind === "else" ? "otherwise" : n.t === "try" ? `catch \u2193 ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}` : blockLabel(p, n);
        w = pad + 54 + txt.length * 7.4;
      }
      const part = r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : "main", menu = toolsFor(p, r.id, part).length * 25 + 12 + 24;
      need2 = Math.max(need2, w + menu);
    }
    need2 = Math.max(need2, 90 + sc.maxDepth * G.IND * 2 + 48);
    return Math.round(TABLE_CHROME + need2);
  }
  var CODE_MIN = 300;
  var CODE_DEFAULT = 480;
  var CODE_MAX_RATIO = 0.7;
  var clampCodeWidth = (w, total) => Math.round(Math.min(Math.max(Number.isFinite(w) ? w : CODE_DEFAULT, CODE_MIN), Math.max(CODE_MIN, total * CODE_MAX_RATIO)));
  var DEFAULT_PREFS = { codeW: CODE_DEFAULT, codeOpen: true };
  function parsePrefs(raw) {
    try {
      const o = JSON.parse(raw ?? "null");
      return { codeW: typeof o?.codeW === "number" && Number.isFinite(o.codeW) ? o.codeW : CODE_DEFAULT, codeOpen: typeof o?.codeOpen === "boolean" ? o.codeOpen : true };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  }
  function stateTools(p, owner, side, name) {
    const n = locate(p, owner)?.node;
    if (!n || n.t !== "fn") return [];
    const t = (act, icon2, title, extra = {}) => ({ act, id: owner, icon: icon2, title, data: { side, name }, ...extra });
    if (!name) return [t("editData", "cube", "Edit the data")];
    if (contractOf(p, n)) return side === "out" ? [t("renameOut", "text", "Rename the data")] : [t("editData", "cube", "Set the value")];
    return [t("renameData", "text", "Rename the data"), t("removeIo", "trash", side === "in" ? "Remove the input" : "Remove the output", { danger: true })];
  }
  function toolsFor(p, id, part = "main") {
    const l = locate(p, id);
    if (!l) return [];
    const n = l.node, root = isRoot(p, id), t = (act, ic, title, extra = {}) => ({ act, id, icon: ic, title, ...extra });
    if (n.t === "fn") {
      const out2 = [];
      if (n.kids.length) out2.push(t("toggle", "chevron", "Open / close children"));
      out2.push(t("addChild", "sibling", "Add child (inside this function)"));
      if (!root) {
        out2.push(t("addSibling", "child", "Add sibling (next to it, same block)"), t("wrap", "diamond", "Add selection (if)", { data: { kind: "if" } }), t("wrap", "repeat", "Add repetition (for)", { data: { kind: "for" } }), t("wrap", "shield", "Add try/catch", { data: { kind: "try" } }));
        if (l.list[l.index - 1]?.t === "fn") out2.push(t("parallel", "parallel", n.par ? "Run in sequence" : "Run together with the previous one", { data: { on: String(!n.par) } }));
        if (insideBlock(p, id)) out2.push(t("exitScope", "log-out", "Leave the block (this and the following ones)"));
        out2.push(t("remove", "trash", "Remove", { danger: true }));
      }
      return out2;
    }
    const where = part === "else" ? "else" : part === "catch" ? "catch" : n.t === "for" ? "for" : n.t === "if" ? "if" : "try";
    const out = [t("addChild", "sibling", `Add child (inside the ${where})`, part === "catch" ? { data: { catch: "1" } } : part === "else" ? { data: { else: "1" } } : {})];
    if (part === "main") out.push(t("wrap", "diamond", "Add condition (if) to this block", { data: { kind: "if" } }), t("wrap", "repeat", "Add loop (for) to this block", { data: { kind: "for" } }), t("wrap", "shield", "Add try/catch to this block", { data: { kind: "try" } }));
    if (part === "main" && n.t === "if" && !n.elseKids.length) out.push(t("addElse", "branch", "Add else"));
    out.push(t("addSibling", "child", "Add sibling to the right (outside the block)"));
    if (part === "main") out.push(t("setScope", "grow", "Include the next one in the block", { data: { delta: "1" } }), t("setScope", "shrink", "Take the last one out of the block", { data: { delta: "-1" } }));
    out.push(part === "else" ? t("removeElse", "trash", "Remove else", { danger: true }) : t("remove", "trash", `Remove ${n.t === "try" ? "try/catch" : n.t === "for" ? "repetition (for)" : "selection (if)"} and everything inside`, { danger: true }));
    return out;
  }
  var toolsHtml = (tools) => tools.map((x) => `<button type="button" class="ib${x.danger ? " danger" : ""}" data-act="${x.act}" data-id="${esc(x.id)}" ${Object.entries(x.data ?? {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")} title="${esc(x.title)}" aria-label="${esc(x.title)}">${icon(x.icon)}</button>`).join("");
  function dataLinks(p, sc) {
    const fns = sc.rows.filter((r) => r.kind === "fn" && r.leaf), out = [];
    fns.forEach((b, i) => {
      const f = b.node, c = contractOf(p, f), names = /* @__PURE__ */ new Set();
      for (const n of f.ins) if (!f.args?.[n]?.trim()) names.add(n);
      for (const v of Object.values(f.args ?? {})) for (const id of exprIdents(v)) names.add(id);
      for (const name of names) for (let j = i - 1; j >= 0; j--) {
        const a = fns[j];
        if (a.node.outs.includes(name) && a.e + 1 === b.s) {
          out.push({ from: a, to: b, name });
          break;
        }
      }
    });
    return out;
  }
  var blockLabel = (_p, n) => {
    if (n.t === "if") return `if (${n.test})`;
    if (n.t === "for") return `for (${n.v} of ${n.coll})`;
    return "try";
  };
  var fnKind = (p, f) => {
    if (f.kids.length) return "conc";
    const a = agentOf(p, f.agent);
    return !a ? "nag" : a.kind === "maquina" || a.kind === "arquivo" ? "conc" : "abs";
  };
  var circle = (cls, ic, title) => `<span class="fav ${cls}" title="${esc(title)}">${ic ? icon(ic) : ""}</span>`;
  function agentSelect(p, f, kind) {
    const cur = agentOf(p, kind === "agent" ? f.agent : f.resp), want = (a) => kind === "resp" ? a.kind === "pessoa" : true;
    const groups = ["maquina"].map((k) => {
      const list = p.agents.filter((a) => a.kind === k && want(a));
      return list.length ? `<optgroup label="${{ maquina: "Browser libs", pessoa: "People", ia: "AI agents" }[k]}">${list.map((a) => `<option value="${a.id}"${cur?.id === a.id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    const own = locate(p, f.id)?.flow, files = kind === "agent" ? filesOf(p).filter((x) => !own || x !== flowFile(own)) : [];
    const fileGroup = files.map((x) => `<optgroup label="${esc(x)}">${(agentOf(p, `file:${x}`)?.tasks ?? []).map((t) => `<option value="file:${esc(x)}#${esc(t)}"${f.agent === `file:${x}` && f.title === t ? " selected" : ""}>${esc(t)}</option>`).join("")}</optgroup>`).join("");
    return `<select data-change="${kind === "agent" ? "assign" : "setResp"}" data-id="${esc(f.id)}" aria-label="Source of ${esc(f.title)}"><option value="">Abstract</option>${groups}${fileGroup}</select>`;
  }
  function respCell(p, r) {
    const f = r.node;
    if (isRoot(p, f.id)) return `<span class="c-ag" title="Source: the file of this flow">${circle("arquivo", "file", "File")}<span class="rp-n">${esc(flowFile(f).replace(/\.[^.]+$/, ""))}</span></span>`;
    if (!r.leaf) {
      const own = locate(p, f.id)?.flow, file = own ? flowFile(own).replace(/\.[^.]+$/, "") : "";
      return `<span class="c-ag" title="Source: the file of this flow (a function with children is concrete: it runs its own steps)">${circle("arquivo", "file", "File")}<span class="rp-n">${esc(file)}</span></span>`;
    }
    const a = agentOf(p, f.agent);
    if (a?.kind === "ia") {
      const pe = agentOf(p, f.resp);
      return `<span class="c-ag resp-pick">${pe ? circle("pessoa", "user", `Person: ${pe.name}`) + `<span class="rp-n">${esc(pe.name)}</span>` : circle("none", "plus", "Choose the person in charge") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "resp")}</span>`;
    }
    return `<span class="c-ag resp-pick">${a ? circle(a.kind, KIND_ICON[a.kind], `${a.name}`) + `<span class="rp-n">${esc(a.name)}</span>` : circle("none", "plus", "Choose source") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "agent")}</span>`;
  }
  function taskCell(p, r) {
    const f = r.node, a = agentOf(p, f.agent), pad = r.depth * G.IND * 2;
    const lead = r.leaf ? `<span class="fn-dot ${fnKind(p, f)}" title="Function"></span>` : `<span class="car${r.closed ? " shut" : ""}" data-act="toggle" data-id="${esc(f.id)}" title="Open / close children">${icon("chevron")}</span><span class="fn-dot ${fnKind(p, f)}" title="Function"></span>`;
    const name = hasContract(a) && r.leaf ? `<select class="task-pick" data-change="setTask" data-id="${esc(f.id)}" aria-label="Function of ${esc(a.name)}">${a.tasks.map((t) => `<option${t === f.title ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>` : `<b data-act="rename" data-id="${esc(f.id)}" title="Click to rename">${esc(f.title || "unnamed")}</b>`;
    const iaTag = a?.kind === "ia" ? `<span class="agent-tag resp-pick">${icon("ia")}<span>${esc(a.name)}</span>${agentSelect(p, f, "agent")}</span>` : "";
    return `<span class="nm" style="padding-left:${pad}px">${lead}${name}${iaTag}${f.par ? '<span class="par-tag" title="Runs together with the previous one">\u2225</span>' : ""}</span>`;
  }
  function renderTable(p, sc, ui) {
    return sc.rows.map((r, i) => {
      const sel = ui.sel === r.id ? " sel" : "", base = `data-i="${i}" data-id="${esc(r.id)}"`;
      if (r.kind === "block" || r.kind === "catch" || r.kind === "else") {
        const n = r.node, part = r.kind === "block" ? "main" : r.kind, pad = r.depth * G.IND * 2;
        const tag = r.kind === "catch" ? `<span class="trd c">catch</span><b class="mono">if the try fails</b>` : r.kind === "else" ? `<span class="trd e">else</span><b class="mono">otherwise</b>` : n.t === "if" ? `${icon("diamond", "mini")}<b class="mono">${esc(blockLabel(p, n))}</b>` : n.t === "for" ? `<span class="lpd">\u21BB</span><b class="mono">${esc(blockLabel(p, n))}</b>` : `<span class="trd">try</span><b class="mono">catch \u2193 ${esc(n.t === "try" && n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler")}</b>`;
        return `<div class="grow ifrow ${part === "main" ? n.t + "row" : part + "row"}${sel}" ${base} data-part="${part}"><span class="c-ag"></span><span class="nm" style="padding-left:${pad}px">${tag}</span><span class="fl-tools">${toolsHtml(toolsFor(p, r.id, part))}</span></div>`;
      }
      return `<div class="grow${sel}" ${base}>${respCell(p, r)}${taskCell(p, r)}<span class="fl-tools">${toolsHtml(toolsFor(p, r.id))}</span></div>`;
    }).join("");
  }
  function renderPlan(p, flow, sc, ui) {
    const cw = colW(sc, ui), gutter = planGutter(sc), W = planWidth(sc, cw), H = planHeight(sc, ui.allData), by = /* @__PURE__ */ new Map();
    const colX2 = (n) => gutter + G.OX + n * cw;
    sc.rows.forEach((r, i) => {
      if (r.kind === "fn" || r.kind === "block") by.set(r.id, i);
    });
    const ym = (i) => rowY(i) + G.RH / 2;
    const out = [], bands = [], over = [];
    for (let s = 0; s <= sc.nSteps; s++) out.push(`<line class="vg" x1="${colX2(s)}" y1="${G.HEAD - 8}" x2="${colX2(s)}" y2="${rowY(sc.rows.length) + 4}"/>`);
    sc.rows.forEach((_, i) => out.push(`<line class="hg" x1="${gutter}" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
    const chip = (s, y) => `<g class="chip"><rect x="${colX2(s) - 12}" y="${y - 8}" width="24" height="16" rx="3"/><text x="${colX2(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g><path class="dia" d="M${colX2(s)} ${y + 12} l4 4 l-4 4 l-4 -4z"/>`;
    const top = G.HEAD - 18, bot = rowY(sc.rows.length) + 18;
    for (let s = 0; s <= sc.nSteps; s++) out.push(chip(s, top), chip(s, bot));
    for (const [col, items] of statesByStep(sc, ui.allData)) {
      let row = 0;
      for (const it of items) {
        const y = bot + 34 + row++ * STATE_ROW;
        out.push(`<g class="stt${it.old ? " old" : ""}"${it.owner ? ` data-sthover="${esc(it.owner)}" data-side="${it.side}" data-name="${esc(it.cube ? "" : it.name)}"` : ""}><${it.cube ? `path class="scube" transform="translate(${colX2(col) - 4.5} ${y - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"` : `rect class="sdot${it.abs ? " a" : ""}" x="${colX2(col) - 4}" y="${y - 4}" width="8" height="8"`}/><text class="dn st" x="${colX2(col) + 9}" y="${y + 3.2}">${esc(it.cube ? dataText([it.name], 26) : stateLabel(it.name, it.value, 26))}</text><title>${esc(it.value ?? it.fields.join(", "))}</title></g>`);
        if (it.cube) for (const fld of it.fields) {
          const fy = bot + 34 + row++ * STATE_ROW, fv = it.fieldValues?.[fld];
          out.push(`<g class="stt sub${it.old ? " old" : ""}"><rect class="sdot sm" x="${colX2(col) + 8}" y="${fy - 2.5}" width="5" height="5"/><text class="dn st" x="${colX2(col) + 18}" y="${fy + 3.2}">${esc(stateLabel(fld, fv, 24))}</text><title>${esc(fv != null ? `${fld} = ${fv}` : fld)}</title></g>`);
        }
      }
    }
    out.push(`<line class="axis" x1="${colX2(0)}" y1="${rowY(sc.rows.length) + 4}" x2="${colX2(sc.nSteps)}" y2="${rowY(sc.rows.length) + 4}"/>`);
    const rail = (cls, depth, y0, h) => {
      if (depth <= 0 || h <= 0) return;
      const x = (depth - 1) * G.IND + 0.5;
      bands.push(`<line class="bande ${cls}" x1="${x}" y1="${y0}" x2="${x}" y2="${y0 + h}"/>`);
    };
    sc.rows.forEach((r, i) => {
      if (r.kind !== "fn" || r.leaf || r.depth === 0 || r.last <= i) return;
      rail("co", r.depth, rowY(i + 1), (r.last - i) * G.RH);
    });
    sc.rows.forEach((r, i) => {
      if (r.kind !== "block" && r.kind !== "catch" && r.kind !== "else") return;
      const n = r.node, cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : n.t === "if" ? "if" : n.t === "for" ? "lp" : "tr";
      rail(cls, r.depth, rowY(i), (r.last - i + 1) * G.RH);
      const mark = r.kind === "block" && (n.t === "if" || n.t === "for"), px = colX2(r.s) + (mark ? 11 : 4);
      const txt = r.kind === "catch" ? "catch \xB7 if the try fails" : r.kind === "else" ? "else" : n.t === "try" ? `try \xB7 catch \u2193 ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}` : blockLabel(p, n);
      const w = Math.max(tw(txt) + 12, colX2(r.e + 1) - px - 6), edit = r.kind === "block" && (n.t === "if" || n.t === "for");
      if (mark && n.t === "if") over.push(`<path class="fif" d="M${colX2(r.s)} ${ym(i) - 6} l6 6 l-6 6 l-6 -6z"/>`);
      if (mark && n.t === "for") over.push(`<text class="flp" x="${colX2(r.s)}" y="${ym(i) + 3.5}" text-anchor="middle">\u21BB</text>`);
      over.push(`<g class="pill ${cls}" data-hover="${esc(r.id)}" data-part="${r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : "main"}" ${edit ? `data-act="editBlock" data-id="${esc(r.id)}"` : ""}><rect x="${px}" y="${ym(i) - 8}" width="${w}" height="16"/><text x="${px + 6}" y="${ym(i) + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
      if (r.kind === "block") over.push(`<rect class="handle-hit" data-drag="${esc(r.id)}" x="${px + w - 6}" y="${ym(i) - 12}" width="18" height="26"/><rect class="handle" data-drag="${esc(r.id)}" x="${px + w - 4}" y="${ym(i) - 8}" width="4" height="16" rx="1"><title>Drag to grow or shrink the block</title></rect>`);
    });
    const produced = /* @__PURE__ */ new Set();
    sc.leaves.forEach((l) => l.node.outs.forEach((o) => produced.add(o)));
    const ioMarks = (f, r, i, x1, x2) => {
      const lib3 = !!contractOf(p, f), inAbs = f.ins.some((n) => !(produced.has(n) || f.args?.[n]?.trim() || contractOf(p, f)?.optional?.includes(n)));
      const mark = (x, list, kind, abs, tip) => !list.length ? "" : isCube(list) || kind === "in" && list.length === 1 && /^\s*\{/.test(f.args?.[list[0]] ?? "") ? `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><path class="cube${abs ? " a" : ""}" transform="translate(${x - 5} ${ym(i) - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/><title>${esc(isCube(list) ? `${cubeName(f, kind)}: ${list.join(", ")}` : list[0])} \xB7 ${tip}</title></g>` : `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><rect class="${abs ? "dot a" : "dot"}" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><title>${esc(list[0])} \xB7 ${tip}</title></g>`;
      if (f.ins.length) over.push(`<line class="dlk" x1="${colX2(r.s) + 4}" y1="${ym(i)}" x2="${x1}" y2="${ym(i)}"/>`);
      if (f.outs.length) over.push(`<line class="dlk" x1="${x2}" y1="${ym(i)}" x2="${colX2(r.e + 1) - 4}" y2="${ym(i)}"/>`);
      over.push(mark(colX2(r.s), f.ins, "in", inAbs, inAbs ? "abstract input (state / another layer)" : "concrete input (same layer)"), mark(colX2(r.e + 1), f.outs, "out", false, "output"));
      const insLabel = inputLabel(p, f), insTip = inputTip(p, f), outsLabel = isCube(f.outs) ? cubeName(f, "out") : f.outs[0] ?? "";
      if (f.ins.length) over.push(`<text class="dn in"${!lib3 && f.ins.length === 1 ? ` data-act="renameData" data-id="${esc(f.id)}" data-side="in" data-name="${esc(f.ins[0])}"` : ""} x="${colX2(r.s) - G.GAP}" y="${ym(i) + 3.5}" text-anchor="end">${esc(dataText([insLabel], 40))}<title>${esc(insTip)}</title></text>`);
      if (f.outs.length) over.push(`<text class="dn out"${f.outs.length === 1 ? ` data-act="${lib3 ? "renameOut" : "renameData"}" data-id="${esc(f.id)}" data-side="out" data-name="${esc(f.outs[0])}"` : ""} x="${colX2(r.e + 1) + G.GAP}" y="${ym(i) + 3.5}" text-anchor="start">${esc(dataText([outsLabel]))}<title>${esc(f.outs.join(", "))}</title></text>`);
      const ghost = (x, kind, tip) => `<g class="ghost" data-act="addIo" data-id="${esc(f.id)}" data-kind="${kind}"><circle class="hit" cx="${x}" cy="${ym(i)}" r="11"/><rect class="gh" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><path class="gp" d="M${x - 2} ${ym(i)} h4 M${x} ${ym(i) - 2} v4"/><title>${tip}</title></g>`;
      if (!lib3 && !f.ins.length) over.push(ghost(colX2(r.s), "in", "Add input"));
      if (!lib3 && !f.outs.length) over.push(ghost(colX2(r.e + 1), "out", "Add output"));
    };
    const barX = /* @__PURE__ */ new Map();
    sc.rows.forEach((r, i) => {
      if (r.kind !== "fn") return;
      const f = r.node, selC = ui.sel === f.id ? " sel" : "";
      const lblAfterOuts = (fr) => {
        const outsTxt = dataText([isCube(fr.outs) ? cubeName(fr, "out") : fr.outs[0] ?? ""]);
        return colX2(r.e + 1) + 10 + (fr.outs.length ? G.GAP - 10 + tw(outsTxt, 6.2) + 36 : 0);
      };
      if (!r.leaf) {
        const inset = 21, x12 = colX2(r.s) + inset, x22 = colX2(r.e + 1) - inset;
        over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><path class="sum${selC}" d="M${x12} ${ym(i) - 3.5}H${x22}V${ym(i) + 7.5}L${x22 - 5} ${ym(i) + 3.5}H${x12 + 5}L${x12} ${ym(i) + 7.5}Z"/><title>${esc(f.title)} \xB7 composition = layer</title></g>`);
        ioMarks(f, r, i, x12, x22);
        over.push(`<text class="lbl" x="${lblAfterOuts(f)}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
        return;
      }
      const k = fnKind(p, f), shown = f.title;
      const hasText = ui.txtIn && shown.trim() !== "", cx = (colX2(r.s) + colX2(r.e + 1)) / 2;
      const x1 = hasText ? colX2(r.s) + G.INS : cx - G.BH / 2, x2 = hasText ? colX2(r.e + 1) - G.INS : cx + G.BH / 2;
      barX.set(f.id, { x1, x2 });
      over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${ui.txtIn ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
      ioMarks(f, r, i, x1, x2);
      if (!ui.txtIn) over.push(`<text class="lbl" x="${lblAfterOuts(f)}" y="${ym(i) + 3.5}" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>`);
    });
    const elbow = (a, b) => `M${barX.get(a.id)?.x2 ?? colX2(a.e + 1) - G.INS} ${ym(by.get(a.id))} H${colX2(a.e + 1)} V${ym(by.get(b.id))} H${barX.get(b.id)?.x1 ?? colX2(b.s) + G.INS}`;
    const pairs = /* @__PURE__ */ new Map();
    for (const l of dataLinks(p, sc)) {
      const k = `${l.from.id}>${l.to.id}`, e = pairs.get(k);
      if (e) e.names.push(l.name);
      else pairs.set(k, { from: l.from, to: l.to, names: [l.name] });
    }
    for (const { from, to, names } of pairs.values()) out.push(`<path class="dep" d="${elbow(from, to)}"><title>${esc(names.join(", "))}</title></path>`);
    return `<svg class="plan" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano do fluxo ${esc(flow.title)}"><g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
  }
  function build(p, flowId, ui) {
    const l = locate(p, flowId);
    if (!l || l.node.t !== "fn") throw new Error(`Flow ${flowId} does not exist`);
    const scene = layout(l.node, { closed: ui.closed });
    return { scene, table: renderTable(p, scene, ui), plan: renderPlan(p, l.node, scene, ui), w: colW(scene, ui) };
  }

  // novo/sample.ts
  function sampleProject() {
    let p = emptyProject("New project");
    p.agents = structuredClone([...DEFAULT_AGENTS]);
    const run = (c) => {
      const r = apply(p, c);
      p = r.project;
      return r.created ?? "";
    };
    const main = run({ type: "newFlow", title: "main" });
    const log = run({ type: "addChild", id: main, title: "log" });
    run({ type: "assign", id: log, agent: "console" });
    run({ type: "setTask", id: log, task: "log" });
    run({ type: "setArg", id: log, name: "text", value: '"Hello World"' });
    return { project: p, main };
  }
  function samplesProject() {
    let p = emptyProject("Samples");
    p.agents = structuredClone([...DEFAULT_AGENTS]);
    const run = (c) => {
      const r = apply(p, c);
      p = r.project;
      return r.created ?? "";
    };
    addSamples(run);
    return { project: p };
  }
  var SAMPLE_TITLES = ["newId", "formatPrice", "applyCoupon", "clamp", "retryDelay", "basicAuthHeader", "readSession", "snapshotState", "isAdult", "measureAction", "fetchUser"];
  function addSamples(run) {
    const FILE = "samples.ts";
    const fn = (title, ins, outs, steps) => {
      const id = run({ type: "newFlow", title, file: FILE });
      for (const [name, value] of Object.entries(ins)) {
        run({ type: "addInput", id, name });
        run({ type: "setArg", id, name, value });
      }
      for (const name of outs) run({ type: "addOutput", id, name });
      steps((lib3, task, out, args = {}) => {
        const sid = run({ type: "addChild", id, title: task });
        run({ type: "assign", id: sid, agent: lib3 });
        run({ type: "setTask", id: sid, task });
        for (const [name, value] of Object.entries(args)) run({ type: "setArg", id: sid, name, value });
        if (out) run({ type: "renameData", id: sid, to: out });
        return sid;
      });
      return id;
    };
    const ifThen = (id, test) => {
      run({ type: "wrap", id, kind: "if", test });
    };
    fn("newId", {}, ["id"], (s) => {
      s("crypto", "randomUUID", "id");
    });
    fn("formatPrice", { amount: "1999.9" }, [], (s) => {
      s("math", "round", "cents", { value: "amount * 100" });
      s("console", "log", void 0, { text: '`R$ ${(cents / 100).toFixed(2).replace(".", ",")}`' });
    });
    fn("applyCoupon", { price: "250", percent: "15" }, ["total"], (s) => {
      s("math", "round", "total", { value: "price * (100 - percent) / 100" });
      ifThen(s("console", "log", void 0, { text: "`Coupon ${percent}% off: ${price} -> ${total}`" }), "percent > 0");
    });
    fn("clamp", { value: "130", low: "0", high: "100" }, ["clamped"], (s) => {
      s("math", "max", "atLeastLow", { a: "low", b: "value" });
      s("math", "min", "clamped", { a: "high", b: "atLeastLow" });
      s("console", "log", void 0, { text: "`${value} -> ${clamped}`" });
    });
    fn("retryDelay", { attempt: "3" }, ["delay"], (s) => {
      s("math", "pow", "seconds", { base: "2", exponent: "attempt" });
      s("math", "min", "delay", { a: "seconds", b: "30" });
      s("console", "log", void 0, { text: "`Try again in ${delay}s (attempt ${attempt})`" });
    });
    fn("basicAuthHeader", { user: '"ana"', password: '"1234"' }, ["token"], (s) => {
      s("web", "btoa", "token", { text: 'user + ":" + password' });
      s("console", "log", void 0, { text: "`Authorization: Basic ${token}`" });
    });
    fn("readSession", { session: `btoa('{"name":"Ana","role":"admin"}')` }, ["user"], (s) => {
      s("web", "atob", "raw", { text: "session" });
      s("json", "parse", "user", { text: "raw" });
      s("console", "log", void 0, { text: "`Welcome ${user.name} (${user.role})`" });
    });
    fn("snapshotState", { form: "{ cart: [1, 2, 3], total: 30 }" }, ["snapshot"], (s) => {
      s("web", "structuredClone", "snapshot", { value: "form" });
      s("console", "log", void 0, { text: "snapshot" });
    });
    fn("isAdult", { birthYear: "1998" }, ["age"], (s) => {
      s("date", "now", "today");
      s("math", "floor", "age", { value: "(today - new Date(birthYear, 0, 1)) / 31557600000" });
      ifThen(s("console", "log", void 0, { text: "`${age} years old: adult`" }), "age >= 18");
    });
    fn("measureAction", {}, ["ms"], (s) => {
      s("perf", "now", "start");
      s("math", "random", "work");
      s("perf", "now", "end");
      s("math", "round", "ms", { value: "end - start" });
      s("console", "log", void 0, { text: "`Action took ${ms}ms`" });
    });
    fn("fetchUser", { id: "1" }, ["response"], (s) => {
      s("web", "fetch", "response", { url: '"https://jsonplaceholder.typicode.com/users/" + id' });
      s("console", "log", void 0, { text: "`HTTP ${response.status}`" });
    });
  }

  // novo/docs-examples.ts
  var fresh = () => {
    let p = emptyProject("Docs");
    p.agents = structuredClone([...DEFAULT_AGENTS]);
    return { p: () => p, run: (c) => {
      const r = apply(p, c);
      p = r.project;
      return r.created ?? "";
    } };
  };
  var step = (run, parent, title, ins = [], outs = [], agent, extra = {}) => {
    const id = run({ type: "addChild", id: parent, title, ...extra.catch ? { catch: true } : {} });
    for (const n of ins) run({ type: "addInput", id, name: n });
    for (const n of outs) run({ type: "addOutput", id, name: n });
    if (agent) run({ type: "assign", id, agent });
    if (extra.par) run({ type: "setParallel", id, on: true });
    return id;
  };
  var lib2 = (run, parent, agent, task, out, args = {}) => {
    const id = run({ type: "addChild", id: parent, title: task });
    run({ type: "assign", id, agent });
    run({ type: "setTask", id, task });
    for (const [k, v] of Object.entries(args)) run({ type: "setArg", id, name: k, value: v });
    if (out) run({ type: "renameData", id, to: out });
    return id;
  };
  var BUILDERS = {
    /** UC-01: novo fluxo — uma função `main`, source arquivo `main`. */
    "novo-fluxo": () => {
      const { p, run } = fresh();
      const main = run({ type: "newFlow", title: "main" });
      return { project: p(), flow: main };
    },
    /** Sequência: cada passo começa quando o anterior termina; o dado de mesmo nome liga os passos. */
    sequencia: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Fazer pedido" });
      step(run, root, "Receber pedido", [], ["pedido"]);
      step(run, root, "Cobrar cliente", ["pedido"], ["pagamento"]);
      step(run, root, "Enviar produto", ["pedido", "pagamento"], ["envio"]);
      return { project: p(), flow: root };
    },
    /** Paralelo: as duas funções ocupam o mesmo estado. */
    paralelo: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Ativar cliente" });
      step(run, root, "Gerar credenciais", [], ["credenciais"]);
      step(run, root, "Agendar kickoff", [], ["kickoff"], "lia");
      step(run, root, "Criar conta", [], ["conta"], void 0, { par: true });
      return { project: p(), flow: root };
    },
    /** Seleção: if com else. */
    selecao: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Revisar proposta" });
      step(run, root, "Rascunhar proposta", [], ["proposta"], "lia");
      const rev = step(run, root, "Revisar proposta", ["proposta"], ["aprovada"], "ana");
      const send = step(run, root, "Enviar ao cliente", ["proposta"], ["envio"]);
      const w = run({ type: "wrap", id: send, kind: "if", test: "aprovada" });
      void rev;
      run({ type: "addElse", id: w, title: "Pedir nova revisao" });
      return { project: p(), flow: root };
    },
    /** Repetição: for … of. */
    repeticao: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Traduzir proposta" });
      run({ type: "addInput", id: root, name: "idiomas" });
      const t = step(run, root, "Traduzir texto", ["idioma"], ["traducao"], "teo");
      step(run, root, "Publicar traducoes", ["traducao"], [], void 0);
      run({ type: "wrap", id: t, kind: "for", v: "idioma", coll: "idiomas" });
      return { project: p(), flow: root };
    },
    /** try / catch: a função de tratamento é o catch. */
    trycatch: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Cobrar com seguranca" });
      const c = step(run, root, "Cobrar cliente", ["pedido"], ["pagamento"]);
      step(run, root, "Emitir recibo", ["pagamento"], ["recibo"]);
      run({ type: "wrap", id: c, kind: "try" });
      return { project: p(), flow: root };
    },
    /** Paralelo entre uma composição e a função seguinte. */
    "paralelo-composicao": () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Preparar e avisar" });
      const c = step(run, root, "Preparar conta", [], ["conta"]);
      step(run, c, "Criar usuario", [], ["usuario"]);
      step(run, root, "Avisar time", [], ["aviso"], void 0, { par: true });
      return { project: p(), flow: root };
    },
    /** Composição: função com filhas (camadas). */
    composicao: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Fazer onboarding" });
      const a = step(run, root, "Preparar conta", [], ["conta"]);
      step(run, a, "Criar usuario", [], ["usuario"]);
      step(run, a, "Gerar senha", ["usuario"], ["credenciais"]);
      step(run, root, "Enviar boas-vindas", ["credenciais"], []);
      return { project: p(), flow: root };
    },
    /** Exemplo completo do livro / Flow Language: seleção + paralelo + repetição, com IA, pessoa e libs. */
    onboarding: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Fazer onboarding da Acme" });
      step(run, root, "Coletar dados do cliente", [], ["dados_cliente"]);
      step(run, root, "Rascunhar proposta", ["dados_cliente"], ["rascunho"], "lia");
      step(run, root, "Revisar proposta", ["rascunho"], ["proposta_aprovada"], "ana");
      const trad = step(run, root, "Traduzir proposta", ["proposta_aprovada", "idioma"], ["proposta_traduzida"], "teo");
      const ctr = step(run, root, "Gerar contrato", ["proposta_aprovada", "dados_cliente"], ["contrato"]);
      step(run, root, "Registrar auditoria", ["dados_cliente"], [], void 0, { par: true });
      const env = step(run, root, "Enviar ao cliente", ["proposta_traduzida", "contrato"], ["envio_id"]);
      run({ type: "wrap", id: trad, kind: "for", v: "idioma", coll: '["en", "es"]' });
      void ctr;
      void env;
      return { project: p(), flow: root };
    },
    /** Uma função só de libs do navegador (concretas), com valores e um if. */
    libs: () => {
      const { p, run } = fresh();
      const root = run({ type: "newFlow", title: "Aplicar cupom" });
      run({ type: "addInput", id: root, name: "price" });
      run({ type: "setArg", id: root, name: "price", value: "250" });
      run({ type: "addInput", id: root, name: "percent" });
      run({ type: "setArg", id: root, name: "percent", value: "15" });
      lib2(run, root, "math", "round", "total", { value: "price * (100 - percent) / 100" });
      const log = lib2(run, root, "console", "log", void 0, { text: "`Coupon ${percent}% off: ${price} -> ${total}`" });
      run({ type: "wrap", id: log, kind: "if", test: "percent > 0" });
      return { project: p(), flow: root };
    }
  };
  var DOC_EXAMPLE_IDS = Object.keys(BUILDERS);
  function docExample(id) {
    if (id.startsWith("sample:")) {
      const s = samplesProject(), f = s.project.flows.find((x) => x.title === id.slice(7));
      return f ? { project: s.project, flow: f.id } : null;
    }
    return BUILDERS[id]?.() ?? null;
  }

  // novo/app.ts
  function mount(host, store, flow) {
    const ui = { closed: /* @__PURE__ */ new Set(), sel: null, txtIn: true, allData: true, flow, zoom: 1, pan: { x: 8, y: 8 } };
    let fileCodeText = null, fileView = "*", multi = null, tab = "ts", hovT = 0, fitted = false, auto = true, last = null, gen = null;
    const histBtns = `<button type="button" class="ib hist-btn" data-hist="undo" title="Undo (Ctrl+Z)" aria-label="Undo">${icon("undo")}</button><button type="button" class="ib hist-btn" data-hist="redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">${icon("redo")}</button>`;
    host.innerHTML = `
  <div class="app">
    <aside class="explorer" id="explorer" aria-label="File explorer"><div class="ex-head"><span>Explorer</span><button type="button" class="ib" id="agents" title="Sources: register libs, people and AI agents" aria-label="Sources">${icon("users")}</button><button type="button" class="ib" id="newFlow" title="New function" aria-label="New function">${icon("plus")}</button><button type="button" class="ib" id="exCollapse" title="Collapse all" aria-label="Collapse all">${icon("collapse")}</button></div><div class="ex-tree" id="exTree" role="tree"></div></aside>
    <div class="splitter" id="exSplitter" role="separator" aria-orientation="vertical" aria-label="Resize the explorer" tabindex="0" title="Drag to resize \xB7 double-click to reset"><i></i></div>
    <section class="fx" aria-label="Flow">
      <div class="fx-bar">
        <button type="button" class="ib" id="exToggle" title="Show / hide the explorer (Ctrl+B)" aria-pressed="true" aria-label="Explorer">${icon("panel-left")}</button><span class="fx-t" id="flowName">Flow</span><span class="sp"></span><span class="hist-inline"><button type="button" class="ib run" id="exec" title="Run this flow in the browser (Ctrl+Enter)" aria-label="Run">${icon("play")}</button>${histBtns}</span><i class="vsep"></i>
                <button type="button" class="ib" id="zout" title="Zoom out (\u2212)">${icon("minus")}</button><span id="zv" class="zv">100%</span><button type="button" class="ib" id="zin" title="Zoom in (+)">${icon("plus")}</button><button type="button" class="ib" id="fit" title="Fit to screen (0)">${icon("fit")}</button><i class="vsep"></i><button type="button" class="ib" id="txtIn" title="Name inside the bar" aria-pressed="false">${icon("text")}</button><button type="button" class="ib" id="dataAll" title="States: showing all available data (click for only the new ones)" aria-pressed="true">${icon("cube")}</button><button type="button" class="ib" id="expand" title="Expand all">${icon("expand")}</button><button type="button" class="ib" id="collapse" title="Collapse all">${icon("collapse")}</button><button type="button" class="ib" id="codeToggle" title="Show / hide the code (Ctrl+\\)" aria-pressed="true" aria-label="Code panel">${icon("panel-right")}</button>
      </div>
      <div class="fx-scroll" id="scroll"><div class="fx-sizer" id="sizer"><div class="fx-zoom" id="zoom"><div class="gtable" id="table"></div><div class="gplan" id="plan"></div></div></div></div>
      <div class="fx-legend" id="legend">
        <span><i class="lg fa"></i>abstract function</span><span><i class="lg fc"></i>concrete function</span><span><i class="lg da"></i>abstract data</span><span><i class="lg dc"></i>concrete data</span><span><i class="lg cb"></i>cube</span>
        <span><i class="lg dia"></i>selection</span><span><i class="lg lp">\u21BB</i>repetition</span><span><i class="lg tr"></i>try</span><span><i class="lg ca"></i>catch</span><span><i class="lg el"></i>else</span>
      </div>

    </section>
    <div class="splitter" id="splitter" role="separator" aria-orientation="vertical" aria-label="Resize the code panel" tabindex="0" title="Drag to resize \xB7 double-click to reset"><i></i></div>
    <aside class="side">
      <div class="tabs" role="tablist"><button role="tab" data-tab="ts" aria-selected="true">TypeScript</button><button role="tab" data-tab="term" aria-selected="false">Terminal</button><span class="sp"></span></div>
      <section class="pane on" id="p-ts"><div class="fhead"><span class="tsb">TS</span><span id="fname">flow.ts</span><span class="selname" id="selname"></span><span class="meta" id="meta"></span><button type="button" id="dl" title="Download the file">Download</button><button type="button" id="copy">Copy</button></div><div class="code" id="code" tabindex="0" aria-label="Generated TypeScript code"></div></section>
      <section class="pane term" id="p-term"><div class="thead"><span class="tstat" id="tstat">ready</span><span class="sp"></span><button type="button" id="tRun" class="tbtn">${icon("play")}Run</button><button type="button" id="tClear" class="tbtn">${icon("eraser")}Clear</button></div><div class="tbody" id="tbody" role="log" aria-live="polite" tabindex="0" aria-label="Terminal"><div class="tline system">Click Run to execute the flow here in the browser.</div></div></section>
    </aside>
  </div>`;
    const $ = (s) => host.querySelector(s);
    const el = { flowName: $("#flowName"), scroll: $("#scroll"), sizer: $("#sizer"), zoom: $("#zoom"), table: $("#table"), plan: $("#plan"), code: $("#code"), meta: $("#meta"), fname: $("#fname"), selname: $("#selname"), zv: $("#zv"), explorer: $("#exTree") };
    const multiClick = (e) => {
      const t = e.target;
      if (t.closest("[data-act],[data-sel],[data-hover],[data-drag],button,select,input,.ghost,.bar-tools,.fl-tools")) return;
      const id = t.closest("[data-fid]")?.dataset["fid"];
      if (!id || ui.sel === id) return;
      ui.sel = id;
      ui.flow = id;
      render();
    };
    const multiEl = host.ownerDocument.createElement("div");
    multiEl.className = "multi";
    multiEl.hidden = true;
    el.zoom.append(multiEl);
    multiEl.addEventListener("click", multiClick);
    const proj = host.ownerDocument.createElement("div");
    proj.id = "proj";
    proj.className = "proj";
    proj.setAttribute("role", "toolbar");
    proj.setAttribute("aria-label", "Project");
    proj.innerHTML = `<button type="button" class="btn sm" id="open" title="Open an exported project (.json)">${icon("upload")}Open</button><button type="button" class="btn sm" id="save" title="Export the project (.json)">${icon("download")}Export</button><input type="file" id="openFile" accept=".json,application/json" hidden>`;
    host.ownerDocument.querySelector(".topbar")?.append(proj);
    const themes = host.ownerDocument.createElement("div");
    themes.id = "temas";
    host.ownerDocument.querySelector(".topbar")?.append(themes);
    themes.hidden = true;
    const modal = (label, fill) => new Promise((res) => {
      host.querySelector(".dlg")?.remove();
      const dlg = host.ownerDocument.createElement("div");
      dlg.className = "dlg";
      dlg.setAttribute("role", "dialog");
      dlg.setAttribute("aria-label", label);
      const form = host.ownerDocument.createElement("form");
      dlg.append(form);
      const done = (v) => {
        dlg.remove();
        res(v);
      };
      fill(form, done);
      dlg.addEventListener("mousedown", (e) => {
        if (e.target === dlg) done(null);
      });
      host.append(dlg);
      form.querySelector("input")?.focus();
    });
    let actEl = null;
    const onText = (el2, e) => {
      const r = el2.ownerDocument.createRange();
      r.selectNodeContents(el2);
      const b = r.getBoundingClientRect();
      return b.width > 0 && e.clientX >= b.left - 1 && e.clientX <= b.right + 1 && e.clientY >= b.top - 1 && e.clientY <= b.bottom + 1;
    };
    const editInline = (value, label) => new Promise((res) => {
      const el2 = actEl;
      if (!el2) {
        void ask(label, value).then(res);
        return;
      }
      const rc = el2.getBoundingClientRect(), cs = getComputedStyle(el2), k = el2 instanceof SVGElement ? ui.zoom : 1;
      const input = document.createElement("input");
      input.type = "text";
      input.value = value;
      input.spellcheck = false;
      input.setAttribute("aria-label", label);
      const txtColor = el2 instanceof SVGElement && cs.fill && cs.fill !== "none" ? cs.fill : cs.color;
      const w = Math.max(rc.width + 16, 48), h = Math.max(rc.height, 16);
      input.style.cssText = `position:fixed;z-index:60;box-sizing:border-box;left:${rc.left}px;top:${rc.top + rc.height / 2 - h / 2}px;width:${w}px;height:${h}px;margin:0;padding:0;border:0;border-radius:0;background:transparent;color:${txtColor};caret-color:${txtColor};outline:none;box-shadow:none;font-family:${cs.fontFamily};font-size:${(parseFloat(cs.fontSize) || 12) * k}px;font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing};text-align:left`;
      const prevVis = el2.style.visibility;
      el2.style.visibility = "hidden";
      let done = false;
      const fin = (v) => {
        if (done) return;
        done = true;
        input.remove();
        el2.style.visibility = prevVis;
        res(v);
      };
      input.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") fin(input.value.trim() || null);
        else if (e.key === "Escape") fin(null);
      });
      input.addEventListener("blur", () => fin(input.value.trim() || null));
      for (const t of ["pointerdown", "mousedown", "click", "dblclick"]) input.addEventListener(t, (e) => e.stopPropagation());
      document.body.appendChild(input);
      input.focus();
      input.select();
    });
    const ask = (label, value = "") => modal(label, (form, done) => {
      form.innerHTML = `<label>${esc(label)}</label><input type="text" value="${esc(value)}" spellcheck="false" aria-label="${esc(label)}"><div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">OK</button></div>`;
      const input = form.querySelector("input");
      input.select();
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        done(input.value.trim());
      });
      form.querySelector("[data-no]").addEventListener("click", () => done(null));
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape") done(null);
      });
    });
    const innerFns = (n) => {
      let c = 0;
      const go = (list) => {
        for (const x of list) {
          if (x.t === "fn") c++;
          go(kidsOf(x));
        }
      };
      go(kidsOf(n));
      return c;
    };
    const confirmAsk = (label) => modal(label, (form, done) => {
      form.innerHTML = `<label>${esc(label)}</label><div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri danger">Remove</button></div>`;
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        done(true);
      });
      form.querySelector("[data-no]").addEventListener("click", () => done(false));
    }).then((v) => !!v);
    let toastT = 0;
    const toast = (msg) => {
      host.querySelector(".toast")?.remove();
      const t = host.ownerDocument.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      t.textContent = msg;
      host.append(t);
      window.clearTimeout(toastT);
      toastT = window.setTimeout(() => t.remove(), 3200);
    };
    const run = (cmd, select = true) => {
      try {
        const id = store.dispatch(cmd);
        if (select && id && cmd.type !== "newFlow") ui.sel = id;
        if (cmd.type === "newFlow" && id) {
          ui.flow = id;
          fitted = false;
          const nf = locate(P2(), id)?.node;
          if (fileView && fileView !== "*" && nf?.t === "fn" && flowFile(nf) !== fileView) fileView = null;
          render();
        }
        return id;
      } catch (e) {
        toast(e instanceof FlowError ? e.message : String(e));
        return void 0;
      }
    };
    const P2 = () => store.project;
    const canRun = () => !fileView || !!(ui.sel && locate(P2(), ui.sel));
    function render() {
      const p = P2();
      if (!locate(p, ui.flow)) ui.flow = p.flows[0]?.id ?? ui.flow;
      if (fileView && ui.sel) {
        const r = locate(p, ui.sel)?.flow;
        if (r) ui.flow = r.id;
      }
      last = build(p, ui.flow, ui);
      const star = fileView === "*", byFile = /* @__PURE__ */ new Map();
      for (const f of p.flows) byFile.set(flowFile(f), [...byFile.get(flowFile(f)) ?? [], f]);
      const groups = star ? [...byFile] : fileView && (byFile.get(fileView)?.length ?? 0) > 1 ? [[fileView, byFile.get(fileView)]] : [];
      if (fileView && !star && !byFile.has(fileView)) fileView = null;
      if (groups.length) {
        const stack = (fns) => {
          const first = fns.map((f) => build(p, f.id, ui)), minW = Math.max(...first.map((b) => b.w)), tw2 = Math.max(...first.map((b) => tableWidth(b.scene, p)));
          let W2 = 0, H2 = 0;
          const html = fns.map((f) => {
            const b = build(p, f.id, { ...ui, minW }), h = planHeight(b.scene, ui.allData);
            W2 = Math.max(W2, tw2 + planWidth(b.scene, b.w));
            H2 += h + 34;
            return `<div class="blk${ui.sel === f.id ? " on" : ""}" data-fid="${f.id}"><div class="blk-t"><span class="fn-dot ${fnKind(p, f)}"></span>${esc(f.title)}</div><div class="blk-r" style="height:${h}px"><div class="gtable" style="width:${tw2}px;--tw:${tw2}px"><div class="ghead"><span>source</span><span>function</span></div>${b.table}</div><div class="gplan">${b.plan}</div></div></div>`;
          }).join("");
          return { html, W: W2, H: H2 };
        };
        let W = 0, H = 0;
        const GAP = 28;
        multiEl.className = star ? "multi row" : "multi";
        multiEl.innerHTML = groups.map(([file, fns]) => {
          const st = stack(fns);
          if (star) {
            W += st.W + GAP;
            H = Math.max(H, st.H + 34);
            return `<div class="mcol" style="width:${st.W}px"><div class="mcol-t">${icon("file")}${esc(file.replace(/\.[^.]+$/, ""))}</div>${st.html}</div>`;
          }
          W = st.W;
          H = st.H;
          return st.html;
        }).join("");
        if (star) W -= GAP;
        multiEl.hidden = false;
        el.table.innerHTML = "";
        el.plan.innerHTML = "";
        el.table.hidden = el.plan.hidden = true;
        multi = { W, H };
        el.zoom.style.width = W + "px";
        el.zoom.style.height = H + "px";
        applyView();
      } else {
        multi = null;
        multiEl.hidden = true;
        multiEl.innerHTML = "";
        el.table.hidden = el.plan.hidden = false;
        el.table.innerHTML = last.scene.rows.length ? `<div class="ghead"><span>source</span><span>function</span></div>${last.table}` : "";
        el.plan.innerHTML = last.plan;
        const tw0 = tableWidth(last.scene, P2());
        el.table.style.width = tw0 + "px";
        el.table.style.setProperty("--tw", tw0 + "px");
        const W = tw0 + planWidth(last.scene, last.w), H = planHeight(last.scene, ui.allData);
        el.zoom.style.width = W + "px";
        el.zoom.style.height = H + "px";
        applyView();
      }
      const bare = (f) => f.replace(/\.[^.]+$/, ""), fl = locate(p, ui.flow)?.flow;
      el.flowName.textContent = fileView && !canRun() ? fileView === "*" ? "src" : bare(fileView) : fl ? `${bare(flowFile(fl))} \u203A ${fl.title}` : "Flow";
      host.ownerDocument.querySelectorAll(".hist-btn").forEach((b) => {
        b.disabled = b.dataset["hist"] === "undo" ? !store.canUndo : !store.canRedo;
      });
      $("#txtIn").setAttribute("aria-pressed", String(ui.txtIn));
      $("#dataAll").setAttribute("aria-pressed", String(ui.allData !== false));
      if (!fitted || auto) {
        fitted = true;
        fit();
      }
      $("#exec").hidden = !canRun();
      renderCode();
      renderExplorer();
    }
    const exClosed = /* @__PURE__ */ new Set();
    function renderExplorer() {
      const p = P2(), chev = (open) => `<span class="ex-car${open ? "" : " shut"}">${icon("chevron")}</span>`;
      const bare = (f) => f.replace(/\.[^.]+$/, ""), files = /* @__PURE__ */ new Map();
      for (const f of p.flows) {
        const k = flowFile(f);
        files.set(k, [...files.get(k) ?? [], f]);
      }
      const curFile = (() => {
        const r = locate(p, ui.flow)?.flow;
        return r ? flowFile(r) : "";
      })();
      const secOpen = !exClosed.has("sec:files");
      el.explorer.innerHTML = `<div class="ex-sec-h${fileView === "*" && multi ? " sel" : ""}" data-ex="all" title="Open all files side by side"><span data-exfold="sec:files">${chev(secOpen)}</span><span>src</span><button type="button" class="ex-reset" data-exreset title="Reset everything to the initial setup" aria-label="Reset to the initial setup">${icon("reset")}</button><span class="n">${files.size}</span></div>` + (secOpen ? [...files].map(([file, fns]) => {
        const fid = "f:" + file, open = !exClosed.has(fid);
        const body = open ? fns.map((fn) => `<div class="ex-row ex-fn${ui.flow === fn.id && !(fileView && multi) ? " sel cur" : ""}" role="treeitem" style="--lv:2" data-ex="fn" data-flow="${fn.id}" title="Open the flow of ${esc(fn.title)}"><span class="fn-dot ${fnKind(p, fn)}"></span><span class="ex-n">${esc(fn.title)}</span><span class="ex-tools"><button type="button" class="ib danger ex-del" data-exdel="${fn.id}" title="Delete this function" aria-label="Delete ${esc(fn.title)}">${icon("trash")}</button></span></div>`).join("") : "";
        return `<div class="ex-row ex-file${file === curFile ? " cur" : ""}${file === fileView && multi ? " sel" : ""}" role="treeitem" style="--lv:1" data-ex="file" data-file="${esc(file)}" data-flow="${fns[0].id}"><span data-exfold="${esc(fid)}">${chev(open)}</span><span class="ex-fi">${icon("file")}</span><span class="ex-n">${esc(bare(file))}</span><span class="ex-c">${fns.length}</span><span class="ex-tools"><button type="button" class="ib ex-add" data-exadd="${esc(file)}" title="New function in ${esc(file)}" aria-label="New function in ${esc(file)}">${icon("plus")}</button><button type="button" class="ib danger ex-delfile" data-exdelfile="${esc(file)}" title="Remove ${esc(file)}" aria-label="Remove ${esc(file)}">${icon("trash")}</button></span></div>${body}`;
      }).join("") : "");
    }
    async function editExName(row, nameEl) {
      actEl = nameEl;
      if (row.dataset["ex"] === "file") {
        const file = row.dataset["file"], v2 = await editInline(file.replace(/\.[^.]+$/, ""), "File name");
        if (v2 && v2 + ".ts" !== file && v2 !== file) {
          const to = /\.[A-Za-z0-9]+$/.test(v2) ? v2 : v2 + ".ts";
          if (fileView === file) fileView = to;
          run({ type: "renameFile", from: file, to: v2 }, false);
        }
        return;
      }
      const n = locate(P2(), row.dataset["flow"])?.node;
      if (!n || n.t !== "fn") return;
      const v = await editInline(n.title, "Function name");
      if (v && v !== n.title) run({ type: "rename", id: n.id, title: v }, false);
    }
    el.explorer.addEventListener("dblclick", (e) => {
      const t = e.target, nameEl = t.closest(".ex-n"), row = t.closest("[data-ex]");
      if (nameEl && row && row.dataset["ex"] !== "all" && onText(nameEl, e)) void editExName(row, nameEl);
    });
    el.explorer.addEventListener("click", (e) => {
      const t = e.target, add = t.closest("[data-exadd]");
      if (add) {
        {
          const taken = new Set(P2().flows.map((f) => f.title));
          let n = 1, t2 = "new_function";
          while (taken.has(t2)) t2 = `new_function_${++n}`;
          run({ type: "newFlow", title: t2, file: add.dataset["exadd"] });
        }
        return;
      }
      if (t.closest("[data-exreset]")) {
        void confirmAsk("Reset everything to the initial setup? All files and functions you created will be removed.").then((ok) => {
          if (!ok) return;
          exClosed.clear();
          fileView = "*";
          fitted = false;
          reset();
          render();
        });
        return;
      }
      const delFile = t.closest("[data-exdelfile]");
      if (delFile) {
        const file = delFile.dataset["exdelfile"], ids = P2().flows.filter((f) => flowFile(f) === file).map((f) => f.id);
        const total2 = P2().flows.filter((f) => flowFile(f) === file).reduce((n, f) => n + 1 + innerFns(f), 0);
        void (total2 > 1 ? confirmAsk(`Remove the file \u201C${file}\u201D and its ${total2} function(s)?`) : Promise.resolve(true)).then((ok) => {
          if (ok) {
            for (const id of ids) if (run({ type: "removeFlow", id }, false) === void 0 && P2().flows.length <= 1) break;
          }
        });
        return;
      }
      const del = t.closest("[data-exdel]");
      if (del) {
        void delFlow(del.dataset["exdel"]);
        return;
      }
      const fold = t.closest("[data-exfold]");
      if (fold) {
        const k = fold.dataset["exfold"];
        if (exClosed.has(k)) exClosed.delete(k);
        else exClosed.add(k);
        renderExplorer();
        return;
      }
      const row = t.closest("[data-ex]");
      if (!row) return;
      const nameEl = t.closest(".ex-n");
      if (nameEl && row.dataset["ex"] !== "all" && row.classList.contains("cur") && onText(nameEl, e)) {
        void editExName(row, nameEl);
        return;
      }
      if (row.dataset["ex"] === "all") {
        fileView = "*";
        ui.sel = null;
        fitted = false;
        render();
        return;
      }
      ui.flow = row.dataset["flow"];
      ui.sel = null;
      fitted = false;
      fileView = row.dataset["ex"] === "file" ? row.dataset["file"] : null;
      render();
    });
    $("#exCollapse").addEventListener("click", () => {
      for (const f of P2().flows) exClosed.add("f:" + flowFile(f));
      renderExplorer();
    });
    function renderCode() {
      const p = P2();
      gen = generate(p, ui.flow, { runnable: true });
      let fileCode;
      const lines = gen.code.replace(/\n$/, "").split("\n"), r = ui.sel && !(fileView && multi) ? gen.map[ui.sel] : void 0;
      fileCode = fileView && multi ? fileView === "*" ? { code: [...new Set(p.flows.map((f) => flowFile(f)))].map((file) => generateFile(p, p.flows.filter((f) => flowFile(f) === file).map((f) => f.id)).code).join("\n"), fileName: "project.ts" } : generateFile(p, p.flows.filter((f) => flowFile(f) === fileView).map((f) => f.id)) : null;
      fileCodeText = fileCode?.code ?? null;
      if (fileCode) {
        lines.splice(0, lines.length, ...fileCode.code.replace(/\n$/, "").split("\n"));
      }
      const kw = (w) => /^(?:if|else)$/.test(w) ? "tk-if" : /^(?:for|of)$/.test(w) ? "tk-for" : w === "try" ? "tk-try" : w === "catch" ? "tk-catch" : /^(?:const|let|await|async|import|from|export|type|return|function|as)$/.test(w) ? "tk-k" : null;
      const hl = (l) => esc(l).replace(/(\/\/.*$)|(&quot;[^&]*?&quot;)|(\b\d+\b)|(\b[A-Za-z_$][\w$]*\b)(\()?/g, (m, c, s, n2, w, par) => {
        if (c) return `<span class="tk-c">${c}</span>`;
        if (s) return `<span class="tk-s">${s}</span>`;
        if (n2) return `<span class="tk-n">${n2}</span>`;
        const k = kw(w);
        if (k) return `<span class="${k}">${w}</span>${par ?? ""}`;
        if (/^(?:State|Promise|Record|unknown|Fn)$/.test(w)) return `<span class="tk-t">${w}</span>${par ?? ""}`;
        return par ? `<span class="tk-f">${w}</span>(` : `<span class="tk-d">${w}</span>`;
      });
      el.code.innerHTML = lines.map((l, i) => `<div class="ln${r && i + 1 >= r[0] && i + 1 <= r[1] ? " hl" : ""}" data-n="${i + 1}"><span class="g">${i + 1}</span><span class="t">${hl(l) || " "}</span></div>`).join("");
      el.fname.textContent = fileCode ? fileCode.fileName.replace(/\.ts$/, ".mts") : gen.runFile;
      el.meta.textContent = `${lines.length} lines`;
      const n = ui.sel ? locate(p, ui.sel)?.node : void 0;
      el.selname.textContent = n ? n.t === "fn" ? n.title : n.t : "";
    }
    const scrollToSel = () => {
      const r = ui.sel && gen?.map[ui.sel];
      if (!r) return;
      const e = el.code.querySelector(`[data-n="${r[0]}"]`);
      if (e) el.code.scrollTo({ top: Math.max(0, e.offsetTop - 60), behavior: "smooth" });
    };
    function applyView() {
      el.zoom.style.transform = `translate(${ui.pan.x}px, ${ui.pan.y}px) scale(${ui.zoom})`;
      el.zv.textContent = Math.round(ui.zoom * 100) + "%";
    }
    function fit() {
      if (!last) return;
      const W = multi?.W ?? tableWidth(last.scene, P2()) + planWidth(last.scene, last.w), H = multi?.H ?? planHeight(last.scene, ui.allData), cw = el.scroll.clientWidth, ch = el.scroll.clientHeight;
      const narrow = cw < 640 && !document.documentElement.classList.contains("embed"), k = Math.max(narrow ? 0.55 : 0.2, Math.min(1, (cw - 16) / W, (ch - 16) / H));
      ui.zoom = Math.round(k * 100) / 100;
      ui.pan = { x: Math.max(8, (cw - W * ui.zoom) / 2), y: 8 };
      applyView();
    }
    const zoomTo = (k, mx = el.scroll.clientWidth / 2, my = el.scroll.clientHeight / 2) => {
      const old = ui.zoom, next = Math.min(2.5, Math.max(0.2, Math.round(k * 100) / 100));
      if (next === old) return;
      auto = false;
      ui.pan = { x: mx - (mx - ui.pan.x) * (next / old), y: my - (my - ui.pan.y) * (next / old) };
      ui.zoom = next;
      applyView();
    };
    const touches = /* @__PURE__ */ new Map();
    let pinch = null;
    const dist = () => {
      const [a, b] = [...touches.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    el.scroll.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "touch") return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 2) pinch = { d: dist() || 1, k: ui.zoom };
    }, true);
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "touch" || !touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pinch && touches.size === 2) {
        const [a, b] = [...touches.values()], r = el.scroll.getBoundingClientRect();
        zoomTo(pinch.k * dist() / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      }
    });
    const liftTouch = (e) => {
      if (e.pointerType !== "touch") return;
      touches.delete(e.pointerId);
      if (touches.size < 2) pinch = null;
    };
    window.addEventListener("pointerup", liftTouch);
    window.addEventListener("pointercancel", liftTouch);
    el.scroll.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = el.scroll.getBoundingClientRect();
      zoomTo(ui.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 22e-4)), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    el.scroll.addEventListener("mousedown", (e) => {
      if (e.button === 1) e.preventDefault();
    });
    el.scroll.addEventListener("pointerdown", (e) => {
      const middle = e.button === 1;
      if (!middle && (e.button !== 0 || e.target.closest("[data-act],[data-hover],[data-drag],button,select,input,.ghost,.bar-tools,.fl-tools"))) return;
      if (middle) e.preventDefault();
      const x0 = e.clientX, y0 = e.clientY, p0 = { ...ui.pan };
      let moved = false;
      const move = (ev) => {
        if (touches.size > 1) return;
        if (!moved && !middle && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
        moved = true;
        auto = false;
        el.scroll.classList.add("panning");
        ui.pan = { x: p0.x + ev.clientX - x0, y: p0.y + ev.clientY - y0 };
        applyView();
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        el.scroll.classList.remove("panning");
        if (moved) {
          const stop = (ev) => ev.stopPropagation();
          window.addEventListener("click", stop, { capture: true, once: true });
          window.setTimeout(() => window.removeEventListener("click", stop, true), 0);
        }
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
    const KIND_NAME = { maquina: "Browser lib", pessoa: "Person", ia: "AI agent", arquivo: "File" };
    const agentsDialog = () => modal("Sources", (form, done) => {
      const draw = () => {
        form.classList.add("wide");
        form.innerHTML = `<label>Project sources</label><div class="agl">${P2().agents.filter((a) => a.kind === "maquina").map((a) => `<div class="agr"><span class="fav ${a.kind}">${icon(a.kind === "maquina" ? "package" : a.kind === "pessoa" ? "user" : "ia")}</span><b>${esc(a.name)}</b><span class="k">${KIND_NAME[a.kind]}${a.tasks.length ? ` \xB7 ${esc(a.tasks.join(", "))}` : ""}</span><button type="button" class="ib danger" data-rm-agent="${esc(a.id)}" title="Remove ${esc(a.name)}" aria-label="Remove ${esc(a.name)}">${icon("trash")}</button></div>`).join("")}</div>
        <div class="agadd"><select name="kind" aria-label="Type"><option value="maquina">Browser lib</option></select><input name="name" placeholder="name (e.g. Math, Maria, Writer)" aria-label="Name" spellcheck="false"><input name="tasks" placeholder="functions: round(value) -> result; max(a, b) -> result" aria-label="Lib functions with inputs and outputs" spellcheck="false"><button type="submit" class="pri">Add</button></div>
        <div class="row"><button type="button" data-no>Close</button></div>`;
        form.querySelector("[data-no]").addEventListener("click", () => done());
        form.querySelectorAll("[data-rm-agent]").forEach((b) => b.addEventListener("click", () => {
          run({ type: "removeAgent", id: b.dataset["rmAgent"] }, false);
          draw();
        }));
        const kind = form.elements.namedItem("kind"), tasks = form.elements.namedItem("tasks");
        const sync = () => {
          tasks.hidden = kind.value !== "maquina";
        };
        kind.addEventListener("change", sync);
        sync();
        form.elements.namedItem("name").focus();
      };
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const f = new FormData(form);
        if (run({ type: "addAgent", kind: String(f.get("kind")), name: String(f.get("name") ?? ""), tasks: String(f.get("tasks") ?? "") }, false)) draw();
      });
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape") done();
      });
      draw();
    });
    const refNames = (n) => {
      const f = locate(P2(), n.id)?.flow;
      return f ? [...new Set(fnsOf(f).flatMap((x) => x.outs))] : [];
    };
    const typeOpts = (d, states, removable = false) => {
      const isState = d.type === "ref" && states.some((s) => s.name === d.value);
      return ARG_TYPES.map((t) => `<option value="${t.type}"${t.type === d.type && !isState ? " selected" : ""}>${t.label}</option>`).join("") + (states.length ? `<optgroup label="States available in the context">${states.map((s) => `<option value="state:${esc(s.name)}"${isState && d.value === s.name ? " selected" : ""}>${esc(s.name)} \u2014 ${s.kind === "loop" ? "for variable" : `from ${esc(s.from)}`}</option>`).join("")}</optgroup>` : "") + (removable ? `<optgroup label="Data"><option value="__remove">remove this data</option></optgroup>` : "");
    };
    const draftAt = (root, path) => {
      const seg = path.split("/");
      let cur = root[Number(seg[0])], field, parent, idx, i = 1;
      while (i < seg.length) {
        if (seg[i] !== "fields") break;
        parent = cur;
        idx = Number(seg[i + 1]);
        field = cur.fields[idx];
        i += 2;
        if (seg[i] === "draft" && field) {
          cur = field.draft;
          i++;
        }
      }
      return { d: cur, ...field ? { field } : {}, ...parent ? { parent } : {}, ...idx !== void 0 ? { idx } : {} };
    };
    const draftHtml = (d, path, states, depth = 0, removable = false) => {
      const val = d.type === "boolean" ? `<select data-k="value" data-path="${path}" aria-label="Value"><option value="true"${d.value === "true" ? " selected" : ""}>true</option><option value="false"${d.value !== "true" ? " selected" : ""}>false</option></select>` : d.type === "ref" && states.some((x) => x.name === d.value) ? `<span class="statechip" title="Bound to this state">${icon("diamond", "mini")}${esc(d.value)}</span>` : d.type === "ref" ? `<input data-k="value" data-path="${path}" list="refnames" value="${esc(d.value)}" placeholder="data name (e.g. customer.name)" spellcheck="false" aria-label="Data">` : d.type === "object" ? "" : `<input data-k="value" data-path="${path}" value="${esc(d.value)}" placeholder="${d.type === "text" ? "text (e.g. Hello)" : d.type === "number" ? "number (e.g. 42)" : "TypeScript expression"}" spellcheck="false" aria-label="Value">`;
      const kids2 = d.type === "object" ? `<div class="argkids">${d.fields.map((f, i) => `<div class="argf"><input data-k="name" data-path="${path}/fields/${i}" value="${esc(f.name)}" placeholder="field" spellcheck="false" aria-label="Field name"><div class="argcell">${draftHtml(f.draft, `${path}/fields/${i}/draft`, states, depth + 1)}</div><button type="button" class="ib danger" data-rm="${path}/fields/${i}" title="Remove the field ${esc(f.name)}" aria-label="Remove the field ${esc(f.name)}">${icon("trash")}</button></div>`).join("")}<button type="button" class="addkid" data-add="${path}">${icon("plus")}Add child</button></div>` : "";
      const sel = `<select data-k="type" data-path="${path}" aria-label="Type">${typeOpts(d, states, removable)}</select>`;
      if (depth === 0) return `<div class="argd d0"><span class="fl">Type</span>${sel}${val ? `<span class="fl">Value</span>${val}` : ""}</div>${kids2}`;
      return `<div class="argd d${depth}">${sel}${val}</div>${kids2}`;
    };
    const dataEditor = (n, side, opts = {}) => modal(side === "in" ? `Input of ${n.title}` : `Output of ${n.title}`, (form, done) => {
      const lib3 = !!contractOf(P2(), n), editable = !lib3, withValue = side === "in";
      const names = opts.names ? [...opts.names] : [...side === "in" ? n.ins : n.outs];
      if (opts.start && !names.length) {
        const base = side === "in" ? "input" : "output";
        names.push(base);
      }
      const drafts = names.map((nm) => withValue ? inferArg(n.args?.[nm] ?? "") : emptyDraft()), refs = refNames(n), states = statesFor(P2(), n.id);
      form.classList.add("wide");
      const fresh2 = names.map(() => false), orig = [...names];
      const nameEditable = (i) => editable || side === "out" && i === 0;
      const canAdd = () => editable && (!withValue || names.length > 1);
      const title = () => names.length > 1 ? `${side === "in" ? "Input" : "Output"} of ${esc(n.title)} \u2014 object ${esc(cubeName(n, side))}` : `${side === "in" ? "Input" : "Output"} data of ${esc(n.title)}`;
      const draw = () => {
        form.innerHTML = `<label>${title()}</label><p class="hint">${withValue ? "Name, type and value. Left blank, the input stays abstract (it comes from the state)." : "Name of the data this function produces."}${canAdd() ? " Add child adds one more data (it becomes an object)." : ""}</p>
        ${names.map((nm, i) => `<div class="param"><div class="prow">${names.length > 1 || withValue && drafts[i].type === "object" ? `<span class="cubei" title="object (cube)">${icon("cube")}</span>` : ""}${nameEditable(i) ? `<input data-k="pname" data-i="${i}" value="${esc(nm)}" placeholder="name" spellcheck="false" aria-label="Data name">` : `<b class="pn">${esc(nm)}</b>`}${editable && (!withValue || fresh2[i]) ? `<button type="button" class="ib danger" data-del="${i}" title="Remove this data" aria-label="Remove this data">${icon("trash")}</button>` : ""}</div>${withValue ? draftHtml(drafts[i], String(i), states, 0, editable) : ""}</div>`).join("")}
        ${canAdd() ? `<button type="button" class="addkid" data-newrow>${icon("plus")}Add child</button>` : ""}<datalist id="refnames">${refs.map((r) => `<option value="${esc(r)}">`).join("")}</datalist>
        <div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">Save</button></div>`;
        form.querySelector("[data-no]").addEventListener("click", () => done());
      };
      form.addEventListener("change", (e) => {
        const t = e.target, path = t.dataset["path"], k = t.dataset["k"];
        if (!k) return;
        if (k === "pname") {
          names[Number(t.dataset["i"])] = t.value.trim();
          return;
        }
        if (!path) return;
        const hit = draftAt(drafts, path);
        if (k === "name" && hit.field) hit.field.name = t.value;
        else if (k === "value" && hit.d) hit.d.value = t.value;
        else if (k === "type" && hit.d) {
          if (t.value === "__remove") {
            const i = Number(path.split("/")[0]);
            names.splice(i, 1);
            drafts.splice(i, 1);
            fresh2.splice(i, 1);
            orig.splice(i, 1);
            if (!names.length) {
              run({ type: "setData", id: n.id, side, names: [], values: [] }, false);
              done();
              return;
            }
            draw();
            return;
          }
          if (t.value.startsWith("state:")) Object.assign(hit.d, emptyDraft("ref"), { value: t.value.slice(6) });
          else {
            const keep = hit.d.value;
            Object.assign(hit.d, emptyDraft(t.value), t.value === "expr" || t.value === "text" ? { value: keep } : {});
          }
          draw();
        }
      });
      form.addEventListener("click", (e) => {
        const b = e.target.closest("[data-add],[data-rm],[data-del],[data-newrow]");
        if (!b) return;
        if (b.dataset["add"] !== void 0) {
          const o = draftAt(drafts, b.dataset["add"]).d;
          let i = o.fields.length + 1;
          while (o.fields.some((f) => f.name === `field${i}`)) i++;
          o.fields.push({ name: `field${i}`, draft: emptyDraft() });
        } else if (b.dataset["rm"] !== void 0) {
          const r = draftAt(drafts, b.dataset["rm"]);
          r.parent.fields.splice(r.idx, 1);
        } else if (b.dataset["del"] !== void 0) {
          const i = Number(b.dataset["del"]);
          names.splice(i, 1);
          drafts.splice(i, 1);
          fresh2.splice(i, 1);
          orig.splice(i, 1);
        } else {
          let i = names.length + 1;
          while (names.includes(`field${i}`)) i++;
          names.push(`field${i}`);
          drafts.push(emptyDraft());
          fresh2.push(true);
          orig.push("");
        }
        draw();
      });
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape") done();
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        form.querySelectorAll("input[data-k]").forEach((i) => {
          const k = i.dataset["k"];
          if (k === "pname") {
            names[Number(i.dataset["i"])] = i.value.trim();
            return;
          }
          const hit = draftAt(drafts, i.dataset["path"]);
          if (k === "value" && hit.d) hit.d.value = i.value;
          if (k === "name" && hit.field) hit.field.name = i.value;
        });
        try {
          const values = withValue ? drafts.map((d) => buildArg(d)) : [];
          if (!editable && side === "out" && names[0] && orig[0] && names[0] !== orig[0]) store.dispatch({ type: "renameData", id: n.id, to: names[0] });
          if (editable) {
            names.forEach((nm, i) => {
              if (nm && orig[i] && nm !== orig[i]) store.dispatch({ type: "renameIo", id: n.id, side, from: orig[i], to: nm });
              orig[i] = nm;
            });
          }
          if (editable) {
            const keep = names.map((nm, i) => [nm, values[i] ?? ""]).filter(([nm]) => nm);
            run({ type: "setData", id: n.id, side, names: keep.map((k) => k[0]), values: keep.map((k) => k[1]) }, false);
          } else names.forEach((nm, i) => {
            run({ type: "setArg", id: n.id, name: nm, value: values[i] }, false);
          });
          done();
        } catch (err) {
          toast(err instanceof Error ? err.message : String(err));
        }
      });
      draw();
    });
    const forDialog = (id, v0, coll0, kids2) => modal("Repetition", (form, done) => {
      const first = (ns) => {
        for (const x of ns) {
          if (x.t === "fn" && !x.kids.length) return x.id;
          const r = first(kidsOf(x));
          if (r) return r;
        }
        return void 0;
      };
      const fid = first(kids2), states = fid ? statesFor(P2(), fid) : [];
      form.classList.add("wide");
      form.innerHTML = `<label>Repetition (for)</label>
      <div class="param"><span class="pn">Variable</span><input data-k="fv" value="${esc(v0)}" placeholder="item" spellcheck="false" aria-label="Variable"></div>
      <div class="param"><span class="pn">Collection</span><input data-k="fe" list="forcoll" value="${esc(coll0)}" placeholder='["a", "b"]  or  a data name' spellcheck="false" aria-label="Collection"><datalist id="forcoll">${states.map((x) => `<option value="${esc(x.name)}">`).join("")}</datalist></div>
      <div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">Save</button></div>`;
      const fv = form.querySelector("[data-k=fv]"), fe = form.querySelector("[data-k=fe]");
      form.querySelector("[data-no]").addEventListener("click", () => done());
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape") done();
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
          store.dispatch({ type: "setFor", id, v: fv.value.trim(), coll: fe.value.trim() });
          done();
        } catch (err) {
          toast(err instanceof Error ? err.message : String(err));
        }
      });
    });
    const condDialog = (ifId, current, kids2) => modal("Condition", (form, done) => {
      const first = (ns) => {
        for (const x of ns) {
          if (x.t === "fn" && !x.kids.length) return x.id;
          const r = first(x.t === "try" ? [...x.kids, ...x.catchKids] : x.t === "if" ? [...x.kids, ...x.elseKids] : x.kids);
          if (r) return r;
        }
        return void 0;
      };
      const states = (() => {
        const f = first(kids2);
        return f ? statesFor(P2(), f) : [];
      })(), draft = inferCond(current);
      form.classList.add("wide");
      const stateOpts = (sel) => states.length ? `<optgroup label="States available in the context">${states.map((s) => `<option value="state:${esc(s.name)}"${sel === s.name ? " selected" : ""}>${esc(s.name)} \u2014 ${s.kind === "loop" ? "for variable" : `from ${esc(s.from)}`}</option>`).join("")}</optgroup>` : "";
      const preview = () => {
        try {
          return buildCond(draft) || "(empty)";
        } catch (e) {
          return e instanceof Error ? e.message : String(e);
        }
      };
      const draw = () => {
        form.innerHTML = `<label>Condition of the if</label><p class="hint">Pick a state from the context or type a data path, choose how to compare it, and chain more conditions with AND / OR (AND is evaluated before OR).</p>
        <div class="conds">${draft.clauses.map((c, i) => {
          const isState = states.some((s) => s.name === c.left.value), r = c.right, rIsState = r.type === "ref" && states.some((s) => s.name === r.value);
          return `<div class="cond">${i === 0 ? '<span class="cj">IF</span>' : `<select class="cj" data-ci="${i}" data-k="join" aria-label="Join">${JOINERS.map((j) => `<option value="${j.join}"${c.join === j.join ? " selected" : ""}>${j.label}</option>`).join("")}</select>`}
            <select data-ci="${i}" data-k="left" aria-label="Data"><option value="custom"${isState ? "" : " selected"}>data path / expression\u2026</option>${stateOpts(isState ? c.left.value : "")}</select>
            ${isState ? "" : `<input data-ci="${i}" data-k="leftv" value="${esc(c.left.value)}" placeholder="e.g. customer.status" spellcheck="false" aria-label="Data path or expression">`}
            <select data-ci="${i}" data-k="op" aria-label="Operator">${COND_OPS.map((o) => `<option value="${o.op}"${c.op === o.op ? " selected" : ""}>${o.label}</option>`).join("")}</select>
            ${needsRight(c.op) ? `<select data-ci="${i}" data-k="rtype" aria-label="Value type"><option value="text"${r.type === "text" ? " selected" : ""}>text</option><option value="number"${r.type === "number" ? " selected" : ""}>number</option><option value="boolean"${r.type === "boolean" ? " selected" : ""}>boolean</option><option value="expr"${r.type === "expr" || r.type === "ref" && !rIsState ? " selected" : ""}>expression</option>${stateOpts(rIsState ? r.value : "")}</select>${r.type === "boolean" ? `<select data-ci="${i}" data-k="rvalue" aria-label="Value"><option value="true"${r.value === "true" ? " selected" : ""}>true</option><option value="false"${r.value !== "true" ? " selected" : ""}>false</option></select>` : rIsState ? "" : `<input data-ci="${i}" data-k="rvalue" value="${esc(r.value)}" placeholder="${r.type === "number" ? "number (e.g. 3)" : r.type === "text" ? "text (e.g. active)" : "expression"}" spellcheck="false" aria-label="Value">`}` : ""}
            <button type="button" class="ib danger" data-cdel="${i}" title="Remove this condition" aria-label="Remove this condition">${icon("trash")}</button></div>`;
        }).join("")}</div>
        <div class="row"><button type="button" class="addkid" data-cadd="&&">${icon("plus")}Add AND</button><button type="button" class="addkid" data-cadd="||">${icon("plus")}Add OR</button><span class="sp"></span></div>
        <code class="preview" id="cpreview">${esc(preview())}</code>
        <div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">Save</button></div>`;
        form.querySelector("[data-no]").addEventListener("click", () => done());
      };
      const upd = (t) => {
        const i = Number(t.dataset["ci"]), c = draft.clauses[i];
        if (!c) return false;
        const k = t.dataset["k"];
        if (k === "join") c.join = t.value;
        else if (k === "left") {
          if (t.value.startsWith("state:")) {
            c.left = { type: "ref", value: t.value.slice(6), fields: [] };
          } else c.left = { type: "ref", value: "", fields: [] };
          return true;
        } else if (k === "leftv") c.left = { type: "expr", value: t.value, fields: [] };
        else if (k === "op") {
          c.op = t.value;
          return true;
        } else if (k === "rtype") {
          if (t.value.startsWith("state:")) c.right = { type: "ref", value: t.value.slice(6), fields: [] };
          else c.right = { type: t.value, value: t.value === "boolean" ? "true" : c.right.type === "ref" ? "" : c.right.value, fields: [] };
          return true;
        } else if (k === "rvalue") c.right = { ...c.right, value: t.value };
        return false;
      };
      form.addEventListener("input", (e) => {
        const t = e.target;
        if (t.dataset["k"] === "leftv" || t.dataset["k"] === "rvalue") {
          upd(t);
          const pv = form.querySelector("#cpreview");
          if (pv) pv.textContent = preview();
        }
      });
      form.addEventListener("change", (e) => {
        const t = e.target;
        if (!t.dataset["k"]) return;
        if (upd(t)) draw();
        else {
          const pv = form.querySelector("#cpreview");
          if (pv) pv.textContent = preview();
        }
      });
      form.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cadd],[data-cdel]");
        if (!b) return;
        if (b.dataset["cadd"]) draft.clauses.push(emptyClause(b.dataset["cadd"]));
        else {
          draft.clauses.splice(Number(b.dataset["cdel"]), 1);
          if (!draft.clauses.length) draft.clauses.push(emptyClause());
        }
        draw();
      });
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape") done();
      });
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        try {
          const test = buildCond(draft);
          if (!test) {
            toast("Add at least one condition");
            return;
          }
          run({ type: "setIf", id: ifId, test }, false);
          done();
        } catch (err) {
          toast(err instanceof Error ? err.message : String(err));
        }
      });
      draw();
    });
    const kids = (id) => {
      const n = locate(P2(), id)?.node;
      return n && n.t !== "fn" ? n.kids.length : 0;
    };
    const ACT = {
      toggle: (d) => {
        const id = d["id"];
        if (ui.closed.has(id)) ui.closed.delete(id);
        else ui.closed.add(id);
        render();
      },
      addChild: (d) => void run({ type: "addChild", id: d["id"], ...d["catch"] ? { catch: true } : {}, ...d["else"] ? { else: true } : {} }),
      addElse: (d) => void run({ type: "addElse", id: d["id"] }),
      removeElse: (d) => void run({ type: "removeElse", id: d["id"] }, false),
      addSibling: (d) => void run({ type: "addSibling", id: d["id"] }),
      wrap: (d) => void run({ type: "wrap", id: d["id"], kind: d["kind"] }),
      unwrap: (d) => void run({ type: "unwrap", id: d["id"] }, false),
      exitScope: (d) => void run({ type: "exitScope", id: d["id"] }),
      parallel: (d) => void run({ type: "setParallel", id: d["id"], on: d["on"] === "true" }),
      setScope: (d) => void run({ type: "setScope", id: d["id"], count: kids(d["id"]) + Number(d["delta"]) }, false),
      remove: async (d) => {
        const l = locate(P2(), d["id"]);
        if (!l) return;
        const label = l.node.t === "fn" ? l.node.title : l.node.t === "try" ? "try/catch" : l.node.t;
        if (innerFns(l.node) > 0 && !await confirmAsk(`Remove \u201C${label}\u201D and everything inside it?`)) return;
        if (ui.sel === d["id"]) ui.sel = null;
        run({ type: "remove", id: d["id"] }, false);
      },
      rename: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (!n || n.t !== "fn") return;
        ui.sel = n.id;
        const v = await editInline(n.title, "Function name");
        if (v) run({ type: "rename", id: n.id, title: v });
        else render();
      },
      editBlock: async (d) => {
        const id = d["id"], n = locate(P2(), id)?.node;
        if (!n) return;
        if (n.t === "for") await forDialog(n.id, n.v, n.coll, n.kids);
        else if (n.t === "if") await condDialog(n.id, n.test, n.kids);
      },
      editData: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (!n || n.t !== "fn") return;
        const side = d["side"] === "out" ? "out" : "in", list = side === "in" ? n.ins : n.outs;
        if (contractOf(P2(), n)) {
          if (side === "in") await dataEditor(n, "in");
          else if (list.length === 1) await ACT["renameOut"](d);
          else toast("This function\u2019s outputs come from the lib contract");
          return;
        }
        await dataEditor(n, side);
      },
      removeIo: (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (n?.t !== "fn") return;
        run({ type: d["side"] === "out" ? "removeOutput" : "removeInput", id: n.id, name: d["name"] }, false);
      },
      renameOut: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (!n || n.t !== "fn") return;
        const v = await editInline(n.outs[0] ?? "", "Output data name");
        if (v) run({ type: "renameData", id: n.id, to: v }, false);
      },
      // caixa fantasma: entrada abre a caixa só com select e valor (o nome é automático); saída é criada na hora, só tem nome
      addIo: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (n?.t !== "fn") return;
        if (d["kind"] === "in") {
          await dataEditor(n, "in", { start: true });
          return;
        }
        let i = 2, name = "output";
        while (n.outs.includes(name)) name = `output${i++}`;
        run({ type: "setData", id: n.id, side: "out", names: [...n.outs, name] }, false);
      },
      /** Clicar no texto do dado (função comum, um dado só) renomeia. */
      renameData: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (n?.t !== "fn") return;
        const side = d["side"] === "out" ? "out" : "in", cur = d["name"];
        const v = await editInline(cur, side === "in" ? "Input data name" : "Output data name");
        if (v && v !== cur) run({ type: "renameIo", id: n.id, side, from: cur, to: v }, false);
      }
    };
    host.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest(".dlg, select")) return;
      const a = t.closest("[data-act]");
      if (a?.dataset["act"] && ACT[a.dataset["act"]] && !(a.dataset["act"] === "rename" && !onText(a, e))) {
        e.stopPropagation();
        actEl = a;
        void ACT[a.dataset["act"]](a.dataset);
        return;
      }
      const row = t.closest(".grow[data-id], [data-sel]");
      if (row) {
        ui.sel = row.dataset["id"] ?? row.dataset["sel"] ?? null;
        render();
        scrollToSel();
      }
    });
    host.addEventListener("change", (e) => {
      const s = e.target, c = s.dataset["change"], id = s.dataset["id"];
      if (!c || !id) return;
      if (c === "assign" && s.value.startsWith("file:")) {
        const [agent, task] = s.value.split("#");
        if (run({ type: "assign", id, agent }, false) !== void 0 || true) run({ type: "setTask", id, task }, false);
      } else if (c === "assign") run({ type: "assign", id, agent: s.value || null }, false);
      else if (c === "setResp") run({ type: "setResp", id, resp: s.value || null }, false);
      else if (c === "setTask") run({ type: "setTask", id, task: s.value }, false);
    });
    const delFlow = async (id) => {
      const f = locate(P2(), id)?.node;
      if (!f || f.t !== "fn") return;
      if (innerFns(f) > 1 && !await confirmAsk(`Delete the flow \u201C${f.title}\u201D and everything inside it?`)) return;
      run({ type: "removeFlow", id: f.id }, false);
    };
    proj.querySelector("#save").addEventListener("click", () => {
      const a = host.ownerDocument.createElement("a"), url = URL.createObjectURL(new Blob([serialize(P2())], { type: "application/json" }));
      a.href = url;
      a.download = "flow-project.json";
      host.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
    });
    const fileIn = host.ownerDocument.getElementById("openFile");
    proj.querySelector("#open").addEventListener("click", () => fileIn.click());
    fileIn.addEventListener("change", async () => {
      const f = fileIn.files?.[0];
      fileIn.value = "";
      if (!f) return;
      try {
        const p = parseProject(await f.text());
        store.load(p);
        ui.flow = p.flows[0].id;
        ui.sel = null;
        ui.closed.clear();
        auto = true;
        toast(`Project \u201C${p.name}\u201D opened`);
      } catch (e) {
        toast(e instanceof FlowError ? e.message : String(e));
      }
    });
    $("#agents").addEventListener("click", () => void agentsDialog());
    $("#newFlow").addEventListener("click", () => void run({ type: "newFlow" }));
    host.ownerDocument.addEventListener("click", (e) => {
      const b = e.target.closest(".hist-btn");
      if (b) {
        if (b.dataset["hist"] === "undo") store.undo();
        else store.redo();
      }
    });
    $("#zin").addEventListener("click", () => zoomTo(ui.zoom * 1.15));
    $("#zout").addEventListener("click", () => zoomTo(ui.zoom / 1.15));
    $("#fit").addEventListener("click", () => {
      auto = true;
      render();
    });
    $("#txtIn").addEventListener("click", () => {
      ui.txtIn = !ui.txtIn;
      render();
    });
    $("#dataAll").addEventListener("click", () => {
      ui.allData = !ui.allData;
      $("#dataAll").title = ui.allData ? "States: showing all available data (click for only the new ones)" : "States: showing only the new data (click for all available)";
      render();
    });
    $("#expand").addEventListener("click", () => {
      ui.closed.clear();
      render();
    });
    $("#collapse").addEventListener("click", () => {
      const f = locate(P2(), ui.flow)?.node;
      if (f?.t === "fn") {
        const mark = (list) => list.forEach((n) => {
          if (n.t === "fn" && n.kids.length) ui.closed.add(n.id);
          mark(kidsOf(n));
        });
        mark(f.kids);
        if (f.kids.length) ui.closed.add(f.id);
      }
      auto = true;
      render();
    });
    const showTab = (name) => {
      tab = name;
      host.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x.dataset["tab"] === name)));
      host.querySelectorAll(".pane").forEach((pn) => pn.classList.toggle("on", pn.id === `p-${name}`));
    };
    host.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => showTab(b.dataset["tab"])));
    $("#dl").addEventListener("click", () => {
      if (!gen) return;
      const a = host.ownerDocument.createElement("a"), url = URL.createObjectURL(new Blob([fileCodeText ?? gen.code], { type: "text/plain" }));
      a.href = url;
      a.download = gen.runFile;
      host.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
    });
    $("#copy").addEventListener("click", async () => {
      await navigator.clipboard?.writeText(fileCodeText ?? gen?.code ?? "").catch(() => {
      });
      $("#copy").textContent = "Copied";
      setTimeout(() => $("#copy").textContent = "Copy", 1200);
    });
    const reset = () => {
      const s = sampleProject();
      store.load(s.project);
      ui.flow = s.main;
      ui.sel = null;
      ui.closed.clear();
      auto = true;
    };
    host.ownerDocument.addEventListener("keydown", (e) => {
      const tg = e.target;
      if (/input|textarea|select/i.test(tg.tagName)) return;
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        if (e.key === "+" || e.key === "=") {
          zoomTo(ui.zoom * 1.15);
          return;
        }
        if (e.key === "-") {
          zoomTo(ui.zoom / 1.15);
          return;
        }
        if (e.key === "0") {
          auto = true;
          render();
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
      }
    });
    const SWITCH_MS = 110, LEAVE_MS = 180;
    const leaveBar = () => {
      window.clearTimeout(hovT);
      hovT = window.setTimeout(() => el.zoom.querySelectorAll(".bar-tools").forEach((b) => b.remove()), LEAVE_MS);
    };
    el.zoom.addEventListener("mouseover", (e) => {
      const h = e.target.closest("[data-hover],[data-sthover]");
      if (!h) return;
      const plan = h.closest(".gplan") ?? el.plan, isSt = h.dataset["sthover"] !== void 0;
      window.clearTimeout(hovT);
      const id = isSt ? h.dataset["sthover"] : h.dataset["hover"], part = h.dataset["part"] ?? "main", key = isSt ? `${id}|${h.dataset["side"]}|${h.dataset["name"]}|st` : id + part;
      const cur = el.zoom.querySelector(".bar-tools");
      if (cur && cur.parentElement === plan && cur.dataset["key"] === key) return;
      const show = () => {
        el.zoom.querySelectorAll(".bar-tools").forEach((b) => b.remove());
        const bar = host.ownerDocument.createElement("div");
        bar.className = "bar-tools";
        bar.dataset["key"] = key;
        bar.setAttribute("role", "toolbar");
        bar.innerHTML = toolsHtml(isSt ? stateTools(P2(), id, h.dataset["side"] === "out" ? "out" : "in", h.dataset["name"] ?? "") : toolsFor(P2(), id, part));
        const hr = h.getBoundingClientRect(), pr = plan.getBoundingClientRect(), k = ui.zoom;
        bar.style.left = Math.max(4, (hr.left - pr.left) / k) + "px";
        bar.style.top = Math.max(2, (hr.top - pr.top) / k - 30) + "px";
        bar.addEventListener("mouseenter", () => window.clearTimeout(hovT));
        bar.addEventListener("mouseleave", leaveBar);
        plan.append(bar);
      };
      if (cur) hovT = window.setTimeout(show, SWITCH_MS);
      else show();
    });
    el.zoom.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-hover],[data-sthover]")) leaveBar();
    });
    el.zoom.addEventListener("pointerdown", (e) => {
      const hd = e.target.closest("[data-drag]");
      if (!hd) return;
      const id = hd.dataset["drag"], p0 = P2(), loc = locate(p0, id), svg = hd.closest("svg"), plan = hd.closest(".gplan") ?? el.plan;
      if (!loc || !svg) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        hd.setPointerCapture(e.pointerId);
      } catch {
      }
      const built = build(p0, loc.flow.id, ui), scene = built.scene, cw = built.w, gutter = planGutter(scene);
      const guide = host.ownerDocument.createElement("div");
      guide.className = "guide";
      plan.append(guide);
      const at = (ev) => {
        const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / ui.zoom;
        return countForStep(p0, scene, id, Math.floor((x - gutter - G.OX) / cw));
      };
      const place = (n2) => {
        const l = locate(p0, id);
        const items = [...l.node.t === "fn" ? [] : l.node.kids, ...l.list.slice(l.index + 1)];
        const lastItem = items[n2 - 1], sp = lastItem ? scene.span.get(lastItem.id) : void 0;
        guide.style.left = gutter + G.OX + ((sp?.e ?? 0) + 1) * cw + "px";
      };
      let n = at(e);
      place(n);
      const move = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        n = at(ev);
        place(n);
      };
      const up = (ev) => {
        if (ev.pointerId !== e.pointerId) return;
        hd.removeEventListener("pointermove", move);
        hd.removeEventListener("pointerup", up);
        hd.removeEventListener("pointercancel", up);
        try {
          hd.releasePointerCapture(e.pointerId);
        } catch {
        }
        guide.remove();
        if (n !== kids(id)) run({ type: "setScope", id, count: n }, false);
      };
      hd.addEventListener("pointermove", move);
      hd.addEventListener("pointerup", up);
      hd.addEventListener("pointercancel", up);
    });
    const app = host.querySelector(".app"), splitter = $("#splitter"), PREFS_KEY = "flow-novo-ui-v1";
    let prefs = parsePrefs((() => {
      try {
        return localStorage.getItem(PREFS_KEY);
      } catch {
        return null;
      }
    })());
    const total = () => app.clientWidth;
    const applyPrefs = (save = true) => {
      prefs.codeW = clampCodeWidth(prefs.codeW, total() - (exPrefs.open ? exPrefs.w + 12 : 0));
      app.style.setProperty("--codew", prefs.codeW + "px");
      app.classList.toggle("code-off", !prefs.codeOpen);
      $("#codeToggle").setAttribute("aria-pressed", String(prefs.codeOpen));
      splitter.setAttribute("aria-valuenow", String(prefs.codeW));
      splitter.setAttribute("aria-valuemin", "300");
      splitter.hidden = !prefs.codeOpen;
      if (save) try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {
      }
      window.requestAnimationFrame(() => {
        if (auto) fit();
      });
    };
    const EX_KEY = "flow-novo-explorer-v1", EX_MIN = 160, EX_DEFAULT = 232;
    const exPrefs = (() => {
      try {
        const o = JSON.parse(localStorage.getItem(EX_KEY) ?? "null");
        return { w: typeof o?.w === "number" && Number.isFinite(o.w) ? o.w : EX_DEFAULT, open: typeof o?.open === "boolean" ? o.open : true };
      } catch {
        return { w: EX_DEFAULT, open: true };
      }
    })();
    const exSplitter = $("#exSplitter");
    const applyEx = (save = true) => {
      exPrefs.w = Math.round(Math.min(Math.max(exPrefs.w, EX_MIN), Math.max(EX_MIN, total() * 0.4)));
      app.style.setProperty("--exw", exPrefs.w + "px");
      app.classList.toggle("ex-off", !exPrefs.open);
      $("#exToggle").setAttribute("aria-pressed", String(exPrefs.open));
      exSplitter.setAttribute("aria-valuenow", String(exPrefs.w));
      exSplitter.setAttribute("aria-valuemin", String(EX_MIN));
      exSplitter.hidden = !exPrefs.open;
      if (save) try {
        localStorage.setItem(EX_KEY, JSON.stringify(exPrefs));
      } catch {
      }
      window.requestAnimationFrame(() => {
        if (auto) fit();
      });
    };
    const toggleEx = () => {
      exPrefs.open = !exPrefs.open;
      applyEx();
    };
    $("#exToggle").addEventListener("click", toggleEx);
    exSplitter.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      app.classList.add("resizing");
      const move = (ev) => {
        const r = app.getBoundingClientRect();
        exPrefs.w = ev.clientX - r.left - 12 - 6;
        applyEx(false);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        app.classList.remove("resizing");
        applyEx();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
    exSplitter.addEventListener("dblclick", () => {
      exPrefs.w = EX_DEFAULT;
      applyEx();
    });
    exSplitter.addEventListener("keydown", (e) => {
      const step2 = e.shiftKey ? 80 : 24;
      if (e.key === "ArrowLeft") exPrefs.w -= step2;
      else if (e.key === "ArrowRight") exPrefs.w += step2;
      else if (e.key === "Enter") toggleEx();
      else return;
      e.preventDefault();
      applyEx();
    });
    host.ownerDocument.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleEx();
      }
    });
    const toggleCode = () => {
      prefs.codeOpen = !prefs.codeOpen;
      applyPrefs();
    };
    $("#codeToggle").addEventListener("click", toggleCode);
    splitter.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      app.classList.add("resizing");
      const move = (ev) => {
        const r = app.getBoundingClientRect();
        prefs.codeW = r.right - 12 - ev.clientX - 6;
        applyPrefs(false);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        app.classList.remove("resizing");
        applyPrefs();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    });
    splitter.addEventListener("dblclick", () => {
      prefs.codeW = CODE_DEFAULT;
      applyPrefs();
    });
    splitter.addEventListener("keydown", (e) => {
      const step2 = e.shiftKey ? 80 : 24;
      if (e.key === "ArrowLeft") prefs.codeW += step2;
      else if (e.key === "ArrowRight") prefs.codeW -= step2;
      else if (e.key === "Enter") toggleCode();
      else return;
      e.preventDefault();
      applyPrefs();
    });
    host.ownerDocument.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        toggleCode();
      }
    });
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => {
      if (auto && last) fit();
    }).observe(el.scroll);
    window.addEventListener("resize", () => {
      applyPrefs(false);
      applyEx(false);
    });
    applyPrefs(false);
    applyEx(false);
    let running = null;
    const tbody = $("#tbody"), tstat = $("#tstat");
    const addLine = (level, text, t) => {
      const d = host.ownerDocument.createElement("div");
      d.className = `tline ${level}`;
      if (t !== void 0) {
        const ts = host.ownerDocument.createElement("span");
        ts.className = "tt";
        ts.textContent = `${Math.round(t)} ms`;
        d.append(ts);
      }
      const body = host.ownerDocument.createElement(level === "table" || text.includes("\n") ? "pre" : "span");
      body.textContent = text;
      d.append(body);
      tbody.append(d);
      while (tbody.children.length > 2e3) tbody.firstElementChild?.remove();
      tbody.scrollTop = tbody.scrollHeight;
    };
    const setRunning = (on) => {
      $("#exec").innerHTML = icon(on ? "square" : "play");
      $("#exec").title = on ? "Stop the run (Ctrl+Enter)" : "Run this flow in the browser (Ctrl+Enter)";
      $("#exec").setAttribute("aria-label", on ? "Stop" : "Run");
      $("#exec").classList.toggle("on", on);
      $("#tRun").textContent = on ? "Stop" : "Run";
      tstat.textContent = on ? "running\u2026" : tstat.textContent;
      tstat.classList.toggle("busy", on);
    };
    const runFlow = () => {
      if (!canRun()) {
        toast("Select a function to run it");
        return;
      }
      if (running) {
        running.stop();
        return;
      }
      const flow2 = locate(P2(), ui.flow)?.node;
      if (!flow2 || flow2.t !== "fn") return;
      if (!prefs.codeOpen) {
        prefs.codeOpen = true;
        applyPrefs();
      }
      showTab("term");
      tbody.innerHTML = "";
      let code;
      try {
        code = generate(P2(), ui.flow, { js: true }).code;
      } catch (e) {
        addLine("error", String(e));
        return;
      }
      addLine("system", `\u25B6 ${flow2.title}`);
      setRunning(true);
      running = runInWorker(code, (ev) => {
        if (ev.type === "log") {
          addLine(ev.level, ev.text, ev.t);
          return;
        }
        running = null;
        setRunning(false);
        if (ev.type === "done") {
          addLine("system", `\u2713 finished in ${Math.round(ev.ms)} ms`);
          tstat.textContent = "done";
        } else {
          addLine("error", ev.message);
          addLine("system", `\u2717 failed after ${Math.round(ev.ms)} ms`);
          tstat.textContent = "error";
        }
      });
    };
    $("#exec").addEventListener("click", runFlow);
    $("#tRun").addEventListener("click", runFlow);
    $("#tClear").addEventListener("click", () => {
      tbody.innerHTML = "";
      if (!running) tstat.textContent = "ready";
    });
    host.ownerDocument.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        runFlow();
      }
    });
    const tip = host.ownerDocument.createElement("div");
    tip.className = "tip";
    tip.setAttribute("role", "tooltip");
    host.ownerDocument.body.append(tip);
    let tipT = 0;
    const hideTip = () => {
      window.clearTimeout(tipT);
      tip.classList.remove("on");
    };
    host.ownerDocument.addEventListener("mouseover", (e) => {
      const b = e.target.closest?.("button[title], [data-tip]");
      if (!b) return;
      if (b.hasAttribute("title")) {
        b.dataset["tip"] = b.getAttribute("title");
        b.removeAttribute("title");
      }
      const text = b.dataset["tip"];
      if (!text) return;
      window.clearTimeout(tipT);
      tipT = window.setTimeout(() => {
        tip.textContent = text;
        tip.classList.add("on");
        const r = b.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
        tip.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, r.left + r.width / 2 - w / 2)) + "px";
        tip.style.top = (r.top - h - 6 < 4 ? r.bottom + 6 : r.top - h - 6) + "px";
      }, 50);
    });
    for (const t of ["mouseout", "mousedown", "wheel", "keydown"]) host.ownerDocument.addEventListener(t, hideTip, true);
    const off = store.subscribe(render);
    render();
    return { store, ui, render, reset, destroy: () => {
      running?.stop();
      off();
      proj.remove();
      tip.remove();
      host.innerHTML = "";
    } };
  }
  var STORE_KEY = "flow-novo-projeto-v1";
  function startProject() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const p = parseProject(raw);
        const rest = p.flows.filter((f) => !(f.file === "samples.ts" && SAMPLE_TITLES.includes(f.title)));
        if (rest.length && rest.length < p.flows.length) p.flows = rest;
        return { project: p, flow: p.flows[0].id };
      }
    } catch {
    }
    const s = sampleProject();
    return { project: s.project, flow: s.main };
  }
  function boot() {
    const demo = new URLSearchParams(location.search).get("demo"), ex = demo ? docExample(demo) : null;
    if (ex) document.documentElement.classList.add("embed");
    const s = ex ? { project: ex.project, flow: ex.flow } : startProject(), store = new Store(s.project), app = mount(document.getElementById("app"), store, s.flow);
    if (ex) {
      if (new URLSearchParams(location.search).get("txt") === "0") {
        app.ui.txtIn = false;
        app.render();
      }
      window.flowApp = app;
      return app;
    }
    const save = () => {
      try {
        localStorage.setItem(STORE_KEY, serialize(store.project));
      } catch {
      }
    };
    store.subscribe(save);
    window.flowApp = app;
    return app;
  }
  if (typeof document !== "undefined" && document.getElementById("app")) boot();
})();
