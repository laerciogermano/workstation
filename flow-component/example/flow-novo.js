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
  var agentOf = (p, id) => id ? p.agents.find((a) => a.id === id) : void 0;
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
  var flowFile = (f) => `${slug(f.title)}.ts`;
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
    return a?.kind === "maquina" ? a.contracts?.[f.title] ?? null : null;
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
      if (ag?.kind === "maquina" && !ag.tasks.includes(n.title)) n.title = ag.tasks[0] ?? n.title;
      if (ag?.kind === "maquina") applyContract(p, n);
      if (n.args) {
        n.args = Object.fromEntries(Object.entries(n.args).filter(([k]) => n.ins.includes(k)));
        if (!Object.keys(n.args).length) delete n.args;
      }
    },
    setTask: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "Only functions have a lib function");
      const ag = agentOf(p, n.agent), t = cleanText(a["task"], "Function", 80);
      if (ag?.kind === "maquina" && !ag.tasks.includes(t)) return fail("invalid", `Function "${t}" does not exist in ${ag.name}`);
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
        if (agent && !agents.some((a) => a.id === agent)) return fail("invalid", `Function ${n.id} uses a source that does not exist`);
        if (resp && !agents.some((a) => a.id === resp)) return fail("invalid", `Function ${n.id} uses a person that does not exist`);
        const args = n.args && typeof n.args === "object" ? Object.fromEntries(Object.entries(n.args).map(([k, v]) => [k, String(v)])) : void 0;
        return { t: "fn", id: n.id, title: n.title, agent, resp, ins: strs(n.ins ?? [], "ins"), outs: strs(n.outs ?? [], "outs"), kids: list(n.kids ?? []), par: !!n.par, ...args && Object.keys(args).length ? { args } : {} };
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
      if (a?.kind === "maquina") {
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
    const fns = flow.kids.length ? fnsOf(flow) : [flow];
    const used = /* @__PURE__ */ new Map(), names = /* @__PURE__ */ new Map();
    const dataNames = /* @__PURE__ */ new Set([...fns.flatMap((f) => [...f.ins, ...f.outs])]);
    walk(flow.kids, (n) => {
      if (n.t === "for") dataNames.add(n.v);
    });
    for (const f of fns) {
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
      const a = agentOf(p, f.agent);
      return a?.kind === "maquina" ? "lib" : a?.kind === "pessoa" ? "pessoa" : "abs";
    };
    const isModule = (n) => /[:/@]/.test(n);
    const libVar = (n) => isModule(n) ? n.replace(/[^A-Za-z0-9_]/g, "_") : n;
    const produced = [...new Set(fns.flatMap((f) => f.outs))];
    const needed = [...new Set(fns.flatMap((f) => f.ins.filter((i) => !f.args?.[i]?.trim() && !contractOf(p, f)?.optional?.includes(i))))].filter((i) => !produced.includes(i));
    const abstract = fns.filter((f) => kindOf(f) === "abs").map(nameOf);
    const libFns = fns.filter((f) => kindOf(f) === "lib"), callables = fns.filter((f) => kindOf(f) !== "pessoa").map(nameOf);
    const libs = [...new Set(fns.filter((f) => kindOf(f) === "lib").map((f) => agentOf(p, f.agent).name))].filter(isModule);
    const hasHumans = fns.some((f) => kindOf(f) === "pessoa");
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
      for (const i of f.ins) if (produced.includes(i) || scope.includes(i)) entries.set(i, i);
      for (const i of f.ins) {
        const expr = f.args?.[i]?.trim();
        if (expr) entries.set(i, expr);
      }
      const args = `{ ...state${[...entries].map(([k, v]) => k === v ? `, ${k}` : `, ${k}: ${v}`).join("")}${err ? ", error" : ""} }`;
      const a = agentOf(p, f.agent);
      return kindOf(f) === "pessoa" ? `humans.ask(${JSON.stringify(a.name)}, ${JSON.stringify(f.title)}, ${opts.runnable ? `data(${args})` : args})` : `${nameOf(f)}(${args})`;
    };
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
    const list = (nodes, ind, scope, err) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i], a = lines.length + 1;
        if (n.t === "fn" && n.kids.length === 0) {
          const group = [n];
          while (nodes[i + 1]?.t === "fn" && nodes[i + 1].par && nodes[i + 1].kids.length === 0) group.push(nodes[++i]);
          if (group.length === 1) {
            emit(`${ind}${assign(n, callOf(n, scope, err))}`);
            mark(n.id, a);
            continue;
          }
          emit(`${ind}const par${a} = await Promise.all([  // parallel`);
          group.forEach((g) => emit(`${ind}  ${callOf(g, scope, err)},`));
          emit(`${ind}]);`);
          group.forEach((g, k) => {
            if (g.outs.length) emit(kindOf(g) === "lib" && contractOf(p, g) && g.outs.length === 1 ? `${ind}${g.outs[0]} = par${a}[${k}];` : `${ind}({ ${g.outs.join(", ")} } = par${a}[${k}]${ty(" as State")});`);
          });
          group.forEach((g) => {
            map[g.id] = [a, lines.length];
          });
        } else if (n.t === "fn") {
          list(n.kids, ind, scope, err);
          map[n.id] = [map[n.kids[0].id]?.[0] ?? a, lines.length];
        } else if (n.t === "if") {
          emit(`${ind}if (${n.test}) {`);
          list(n.kids, ind + "  ", scope, err);
          if (n.elseKids.length) {
            emit(`${ind}} else {`);
            list(n.elseKids, ind + "  ", scope, err);
          }
          emit(`${ind}}`);
          mark(n.id, a);
        } else if (n.t === "for") {
          emit(`${ind}for (const ${n.v} of ${n.coll}) {`);
          list(n.kids, ind + "  ", [...scope, n.v], err);
          emit(`${ind}}`);
          mark(n.id, a);
        } else {
          emit(`${ind}try {`);
          list(n.kids, ind + "  ", scope, err);
          emit(`${ind}} catch (error) {`);
          list(n.catchKids, ind + "  ", scope, true);
          emit(`${ind}  return { ...state, error };`);
          emit(`${ind}}`);
          mark(n.id, a);
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
        } else scan(n.kids, scope);
      }
    };
    scan(flow.kids, []);
    const fromState = [...fromStateSet].filter((n) => !callables.includes(n) && n !== "humans");
    emit(`// Generated by Flow \xB7 flow ${JSON.stringify(flow.title)}`);
    for (const l of libs) emit(opts.js ? `const ${libVar(l)} = await import(${JSON.stringify(l)});   // module: only works if the browser can load it` : `import * as ${libVar(l)} from ${JSON.stringify(l)};`);
    if (lines.length > 1) emit("");
    if (ts) {
      emit("type State = Record<string, unknown>;");
      if (callables.length) emit("type Fn = (state: State) => Promise<State>;");
      if (hasHumans) emit("type Humans = { ask: (who: string, what: string, args: State) => Promise<State> };");
    }
    emit("");
    emit(`/** ${flow.title} \xB7 ${flowFile(flow)} */`);
    emit(`${ty("export ")}async function ${camel(flow.title)}(state${ty(": State")})${ty(": Promise<State>")} {`);
    const startBody = lines.length + 1;
    if (needed.length) emit(`  // expected inputs (from another layer): ${needed.join(", ")}`);
    if (hasHumans) emit(`  const { humans } = state${ty(" as { humans: Humans }")};  // people: come from the state`);
    if (callables.length) emit(`  const { ${callables.join(", ")} } = state${ty(` as Record<${callables.map((n) => JSON.stringify(n)).join(" | ")}, Fn>`)};  // functions: come from the state (lib ones are the wrappers exported below)`);
    if (fromState.length) emit(`  const { ${fromState.join(", ")} } = state${ty(" as Record<string, any>")};  // data read in conditions and loops`);
    if (produced.length) emit(`  let ${produced.map((o) => `${o}${ty(`: ${inExpr.has(o) ? "any" : "unknown"}`)}`).join(", ")};`);
    if (flow.kids.length) list(flow.kids, "  ", [], false);
    else {
      const a = lines.length + 1;
      emit(`  ${assign(flow, callOf(flow, [], false))}`);
      mark(flow.id, a);
    }
    emit(produced.length ? `  return { ${produced.join(", ")} };` : "  return state;");
    emit("}");
    map[flow.id] = [startBody, lines.length - 1];
    emit("");
    if (libFns.length) {
      emit("/** Lib function wrappers: turn the flow input (state) into the lib input, and the lib output back into the flow format. Pass them in the state. */");
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
    if (opts.runnable) {
      emit(opts.js ? "// \u2500\u2500 runs in the browser" : `// \u2500\u2500 local run: ${runCommand}  (Node \u2265 22.6; the flag is optional on 23.6+)`);
      if (abstract.length) {
        emit(`const stubs${ty(": Record<string, Fn>")} = {  // simulators of the abstract functions (in the real system they come from the state)`);
        for (const f of fns.filter((x) => kindOf(x) === "abs")) emit(`  ${nameOf(f)}: async state => { console.log("[abstract] ${nameOf(f)}", data(state)); return {${f.outs.length ? " " : ""}${f.outs.map((o) => `${o}: ${JSON.stringify(`${o} (simulated)`)}`).join(", ")}${f.outs.length ? " " : ""}}; },`);
        emit("};");
      }
      if (abstract.length || hasHumans || produced.length) emit(`function data(state${ty(": State")})${ty(": State")} { return Object.fromEntries(Object.entries(state).filter(([, v]) => typeof v !== "function")); }`);
      if (hasHumans) emit(`const humans${ty(": Humans")} = { ask: async (who, what, args) => { console.log(\`[person] \${who}: \${what}\`, data(args)); return {}; } };`);
      const given = [...libFns.length ? ["...wrappers"] : [], ...abstract.length ? ["...stubs"] : [], ...hasHumans ? ["humans"] : [], ...needed.map((n) => `${n}: ${JSON.stringify(`${n} (simulated)`)}`)];
      if (produced.length) {
        emit(`const result = await ${fnName}({ ${given.join(", ")} });`);
        emit('console.log("result:", data(result));');
      } else emit(`await ${fnName}({ ${given.join(", ")} });`);
    } else emit(`// run: await ${fnName}({ ${[...libFns.length ? ["...wrappers"] : [], ...needed].join(", ")}${libFns.length || needed.length ? " " : ""}});`);
    void isComposite;
    void walk;
    return { code: lines.join("\n") + "\n", map, fileName: flowFile(flow), name: fnName, runFile, runCommand };
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
    play: ["M6 4v16l14-8z"],
    square: ["rect:6,6,12,12,1"],
    terminal: ["m4 17 6-6-6-6", "M12 19h8"],
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
  var KIND_ICON = { maquina: "package", pessoa: "user", ia: "ia" };

  // novo/scope.ts
  function countForStep(p, scene, blockId, step) {
    const l = locate(p, blockId);
    if (!l || l.node.t === "fn") return 1;
    const items = [...l.node.kids, ...l.list.slice(l.index + 1)];
    let n = 0;
    for (const it of items) {
      const sp = scene.span.get(it.id);
      if (sp && sp.e > step) break;
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
      let step = start, prev = null;
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
            const s = n2.par && prev ? prev.s : step, sp = { s, e: s };
            step = Math.max(step, s + 1);
            prev = sp;
            if (emit) span.set(n2.id, sp);
            const row = push({ kind: "fn", id: n2.id, node: n2, depth, s, e: s, leaf: true, closed: false });
            if (emit) {
              row.last = rows.length - 1;
              if (!inCatch) leaves.push(row);
            }
          } else {
            const row = push({ kind: "fn", id: n2.id, node: n2, depth, s: step, e: step, leaf: false, closed: isClosed });
            const idx = rows.length - 1, next = place(n2.kids, depth + 1, step, emit && !isClosed, inCatch);
            const sp = { s: step, e: Math.max(step, next - 1) };
            prev = null;
            if (emit) {
              span.set(n2.id, sp);
              row.s = sp.s;
              row.e = sp.e;
              row.last = rows.length - 1;
              void idx;
            }
            step = Math.max(step, next);
          }
        } else {
          prev = null;
          const b = n2;
          const row = push({ kind: "block", id: b.id, node: b, depth, s: step, e: step, leaf: false, closed: false });
          const next = place(b.kids, depth + 1, step, emit, inCatch), sp = { s: step, e: Math.max(step, next - 1) };
          if (emit) {
            span.set(b.id, sp);
            row.s = sp.s;
            row.e = sp.e;
          }
          let end = next;
          const alt = altKids(b);
          if (alt && alt.length) {
            const kind = b.t === "try" ? "catch" : "else", count = place(alt, depth + 1, 0, false, true), cs = Math.max(step, next - count);
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
          step = Math.max(step, end);
        }
      }
      return step;
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
  var G = { RH: 34, HEAD: 52, OX: 230, W: 160, INS: 28, BH: 22, IND: 14, GAP: 16 };
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var tw = (t, px = 6.1) => Math.ceil(t.length * px);
  var valueOf = (f, n) => f.args?.[n]?.trim() || "";
  function inputLabel(p, f) {
    const lib2 = !!contractOf(p, f), one = (n) => lib2 ? `${n} = ${valueOf(f, n) || "?"}` : valueOf(f, n) ? `${n} = ${valueOf(f, n)}` : n;
    return isCube(f.ins) ? lib2 || f.ins.some((n) => valueOf(f, n)) ? `${cubeName(f, "in")} { ${f.ins.map(one).join(", ")} }` : cubeName(f, "in") : one(f.ins[0] ?? "");
  }
  var inputTip = (p, f) => {
    const lib2 = !!contractOf(p, f);
    return f.ins.map((n) => lib2 ? `${n} = ${valueOf(f, n) || "(not filled in yet)"}` : valueOf(f, n) ? `${n} = ${valueOf(f, n)}` : n).join("\n");
  };
  var dataText = (names, max = 24) => {
    const t = names.join(", ");
    return t.length > max ? `${t.slice(0, max - 1)}\u2026` : t;
  };
  var colX = (s, w = G.W) => G.OX + s * w;
  var rowY = (i) => G.HEAD + i * G.RH;
  var planWidth = (sc, w = G.W) => colX(sc.nSteps, w) + 160;
  var PAD = 12;
  var colW = (sc, ui) => ui.txtIn ? Math.max(G.W, ...sc.leaves.map((l) => tw(l.node.title, 6.2) + 2 * PAD + 2 * G.INS)) : G.W;
  function statesByStep(sc) {
    const m = /* @__PURE__ */ new Map();
    for (const r of sc.rows) {
      if (r.kind !== "fn" || !r.leaf) continue;
      const f = r.node;
      if (!f.outs.length) continue;
      const col = r.e + 1, list = m.get(col) ?? [];
      list.push({ name: isCube(f.outs) ? cubeName(f, "out") : f.outs[0], cube: isCube(f.outs), fields: f.outs });
      m.set(col, list);
    }
    return m;
  }
  var STATE_ROW = 15;
  var planHeight = (sc) => rowY(sc.rows.length) + 64 + Math.max(0, ...[...statesByStep(sc).values()].map((l) => l.length)) * STATE_ROW;
  var tableWidth = (sc) => 440 + sc.maxDepth * G.IND * 2;
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
    out.push(part === "else" ? t("removeElse", "trash", "Remove else", { danger: true }) : t("unwrap", "trash", `Remove ${n.t === "try" ? "try/catch" : n.t === "for" ? "repetition (for)" : "selection (if)"}`, { danger: true }));
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
    const a = agentOf(p, f.agent);
    return !a ? "nag" : a.kind === "maquina" ? "conc" : "abs";
  };
  var circle = (cls, ic, title) => `<span class="fav ${cls}" title="${esc(title)}">${ic ? icon(ic) : ""}</span>`;
  function agentSelect(p, f, kind) {
    const cur = agentOf(p, kind === "agent" ? f.agent : f.resp), want = (a) => kind === "resp" ? a.kind === "pessoa" : true;
    const groups = ["maquina", "pessoa", "ia"].map((k) => {
      const list = p.agents.filter((a) => a.kind === k && want(a));
      return list.length ? `<optgroup label="${{ maquina: "Browser libs", pessoa: "People", ia: "AI agents" }[k]}">${list.map((a) => `<option value="${a.id}"${cur?.id === a.id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    return `<select data-change="${kind === "agent" ? "assign" : "setResp"}" data-id="${esc(f.id)}" aria-label="Source of ${esc(f.title)}"><option value="">${cur ? "No source" : "Choose source"}</option>${groups}</select>`;
  }
  function respCell(p, r) {
    const f = r.node;
    if (isRoot(p, f.id)) return `<span class="c-ag" title="Source: the file of this flow">${circle("arquivo", "file", "File")}<span class="rp-n">${esc(flowFile(f))}</span></span>`;
    if (!r.leaf) return `<span class="c-ag muted">\u2014</span>`;
    const a = agentOf(p, f.agent);
    if (a?.kind === "ia") {
      const pe = agentOf(p, f.resp);
      return `<span class="c-ag resp-pick">${pe ? circle("pessoa", "user", `Person: ${pe.name}`) + `<span class="rp-n">${esc(pe.name)}</span>` : circle("none", "plus", "Choose the person in charge") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "resp")}</span>`;
    }
    return `<span class="c-ag resp-pick">${a ? circle(a.kind, KIND_ICON[a.kind], `${a.name}`) + `<span class="rp-n">${esc(a.name)}</span>` : circle("none", "plus", "Choose source") + `<span class="rp-n abs">abstract</span>`}${agentSelect(p, f, "agent")}</span>`;
  }
  function taskCell(p, r) {
    const f = r.node, a = agentOf(p, f.agent), pad = 10 + r.depth * G.IND * 2;
    const lead = r.leaf ? `<span class="fn-dot ${fnKind(p, f)}" title="Function"></span>` : `<span class="car${r.closed ? " shut" : ""}" data-act="toggle" data-id="${esc(f.id)}" title="Open / close children">${icon("chevron")}</span><span class="gi">${icon("network")}</span>`;
    const name = a?.kind === "maquina" && r.leaf ? `<select class="task-pick" data-change="setTask" data-id="${esc(f.id)}" aria-label="Function of ${esc(a.name)}">${a.tasks.map((t) => `<option${t === f.title ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>` : `<b data-act="rename" data-id="${esc(f.id)}" title="Click to rename">${esc(f.title || "unnamed")}</b>`;
    const iaTag = a?.kind === "ia" ? `<span class="agent-tag resp-pick">${icon("ia")}<span>${esc(a.name)}</span>${agentSelect(p, f, "agent")}</span>` : "";
    return `<span class="nm" style="padding-left:${pad}px">${lead}${name}${iaTag}${f.par ? '<span class="par-tag" title="Runs together with the previous one">\u2225</span>' : ""}</span>`;
  }
  function renderTable(p, sc, ui) {
    return sc.rows.map((r, i) => {
      const sel = ui.sel === r.id ? " sel" : "", base = `data-i="${i}" data-id="${esc(r.id)}"`;
      if (r.kind === "block" || r.kind === "catch" || r.kind === "else") {
        const n = r.node, part = r.kind === "block" ? "main" : r.kind, pad = 10 + r.depth * G.IND * 2;
        const tag = r.kind === "catch" ? `<span class="trd c">catch</span><b class="mono">if the try fails</b>` : r.kind === "else" ? `<span class="trd e">else</span><b class="mono">otherwise</b>` : n.t === "if" ? `${icon("diamond", "mini")}<b class="mono">${esc(blockLabel(p, n))}</b>` : n.t === "for" ? `<span class="lpd">\u21BB</span><b class="mono">${esc(blockLabel(p, n))}</b>` : `<span class="trd">try</span><b class="mono">catch \u2193 ${esc(n.t === "try" && n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler")}</b>`;
        return `<div class="grow ifrow ${part === "main" ? n.t + "row" : part + "row"}${sel}" ${base} data-part="${part}"><span class="c-ag"></span><span class="nm" style="padding-left:${pad}px">${tag}</span><span class="fl-tools">${toolsHtml(toolsFor(p, r.id, part))}</span></div>`;
      }
      return `<div class="grow${sel}" ${base}>${respCell(p, r)}${taskCell(p, r)}<span class="fl-tools">${toolsHtml(toolsFor(p, r.id))}</span></div>`;
    }).join("");
  }
  function renderPlan(p, flow, sc, ui) {
    const cw = colW(sc, ui), W = planWidth(sc, cw), H = planHeight(sc), by = /* @__PURE__ */ new Map();
    const colX2 = (n) => G.OX + n * cw;
    sc.rows.forEach((r, i) => {
      if (r.kind === "fn" || r.kind === "block") by.set(r.id, i);
    });
    const ym = (i) => rowY(i) + G.RH / 2;
    const out = [], bands = [], over = [];
    for (let s = 0; s <= sc.nSteps; s++) out.push(`<line class="vg" x1="${colX2(s)}" y1="${G.HEAD - 8}" x2="${colX2(s)}" y2="${rowY(sc.rows.length) + 4}"/>`);
    sc.rows.forEach((_, i) => out.push(`<line class="hg" x1="0" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
    const chip = (s, y) => `<g class="chip"><rect x="${colX2(s) - 12}" y="${y - 8}" width="24" height="16" rx="3"/><text x="${colX2(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g><path class="dia" d="M${colX2(s)} ${y + 12} l4 4 l-4 4 l-4 -4z"/>`;
    const top = G.HEAD - 18, bot = rowY(sc.rows.length) + 18;
    out.push(`<text class="ttl" x="${W / 2}" y="16" text-anchor="middle">${esc(flow.title)}</text>`);
    for (let s = 0; s <= sc.nSteps; s++) out.push(chip(s, top), chip(s, bot));
    for (const [col, items] of statesByStep(sc)) items.forEach((it, k) => {
      const y = bot + 34 + k * STATE_ROW;
      out.push(`<g class="stt"><${it.cube ? `path class="scube" transform="translate(${colX2(col) - 4.5} ${y - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"` : `rect class="sdot" x="${colX2(col) - 4}" y="${y - 4}" width="8" height="8"`}/><text class="dn st" x="${colX2(col) + 9}" y="${y + 3.2}">${esc(dataText([it.name], 26))}</text><title>${esc(it.fields.join(", "))}</title></g>`);
    });
    out.push(`<line class="axis" x1="${colX2(0)}" y1="${rowY(sc.rows.length) + 4}" x2="${colX2(sc.nSteps)}" y2="${rowY(sc.rows.length) + 4}"/>`);
    sc.rows.forEach((r, i) => {
      if (r.kind !== "block" && r.kind !== "catch" && r.kind !== "else") return;
      const n = r.node, x0 = r.depth * G.IND, cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : n.t === "if" ? "if" : n.t === "for" ? "lp" : "tr";
      bands.push(`<rect class="band ${cls}" x="${x0}" y="${rowY(i)}" width="${W - x0}" height="${(r.last - i + 1) * G.RH}"/><line class="bandl ${cls}" x1="${x0 + 1}" y1="${rowY(i)}" x2="${x0 + 1}" y2="${rowY(r.last + 1)}"/>`);
      const diamond = r.kind === "block" && n.t === "if", px = colX2(r.s) + (diamond ? 11 : 4);
      const txt = r.kind === "catch" ? "catch \xB7 if the try fails" : r.kind === "else" ? "else" : n.t === "for" ? `\u21BB ${blockLabel(p, n)}` : n.t === "try" ? `try \xB7 catch \u2193 ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}` : blockLabel(p, n);
      const w = Math.max(tw(txt) + 12, colX2(r.e + 1) - px - 6), edit = r.kind === "block" && (n.t === "if" || n.t === "for");
      if (diamond) over.push(`<path class="fif" d="M${colX2(r.s)} ${ym(i) - 6} l6 6 l-6 6 l-6 -6z"/>`);
      over.push(`<g class="pill ${cls}" data-hover="${esc(r.id)}" data-part="${r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : "main"}" ${edit ? `data-act="editBlock" data-id="${esc(r.id)}"` : ""}><rect x="${px}" y="${ym(i) - 8}" width="${w}" height="16"/><text x="${px + 6}" y="${ym(i) + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
      if (r.kind === "block") over.push(`<rect class="handle" data-drag="${esc(r.id)}" x="${px + w - 7}" y="${ym(i) - 8}" width="7" height="16"><title>Drag to grow or shrink the block</title></rect>`);
    });
    const produced = /* @__PURE__ */ new Set();
    sc.leaves.forEach((l) => l.node.outs.forEach((o) => produced.add(o)));
    sc.rows.forEach((r, i) => {
      if (r.kind !== "fn") return;
      const f = r.node, selC = ui.sel === f.id ? " sel" : "";
      if (!r.leaf) {
        const x12 = colX2(r.s) + 8, x22 = colX2(r.e + 1) - 8;
        over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="sum${selC}" x="${x12}" y="${ym(i) - 3.5}" width="${x22 - x12}" height="7" rx="3.5"/><title>${esc(f.title)} \xB7 composition = layer</title></g><text class="lbl" x="${x22 + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
        return;
      }
      const k = fnKind(p, f), x1 = colX2(r.s) + G.INS, x2 = colX2(r.e + 1) - G.INS;
      const shown = f.title;
      over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${ui.txtIn ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
      const outsTxt = dataText([isCube(f.outs) ? cubeName(f, "out") : f.outs[0] ?? ""]);
      if (!ui.txtIn) over.push(`<text class="lbl" x="${colX2(r.e + 1) + 10 + (f.outs.length ? G.GAP - 10 + tw(outsTxt, 5.6) + 22 : 0)}" y="${ym(i) + 3.5}" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>`);
      const lib2 = !!contractOf(p, f), inAbs = f.ins.some((n) => !(produced.has(n) || f.args?.[n]?.trim() || contractOf(p, f)?.optional?.includes(n)));
      const mark = (x, list, kind, abs, tip) => !list.length ? "" : isCube(list) ? `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><path class="cube${abs ? " a" : ""}" transform="translate(${x - 5} ${ym(i) - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/><title>${esc(`${cubeName(f, kind)}: ${list.join(", ")}`)} \xB7 ${tip}</title></g>` : `<g class="dm" data-act="editData" data-id="${esc(f.id)}" data-side="${kind}"><rect class="${abs ? "dot a" : "dot"}" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><title>${esc(list[0])} \xB7 ${tip}</title></g>`;
      over.push(mark(colX2(r.s), f.ins, "in", inAbs, inAbs ? "abstract input (state / another layer)" : "concrete input (same layer)"), mark(colX2(r.e + 1), f.outs, "out", false, "output"));
      const insLabel = inputLabel(p, f), insTip = inputTip(p, f), outsLabel = isCube(f.outs) ? cubeName(f, "out") : f.outs[0] ?? "";
      if (f.ins.length) over.push(`<text class="dn in"${!lib2 && f.ins.length === 1 ? ` data-act="renameData" data-id="${esc(f.id)}" data-side="in" data-name="${esc(f.ins[0])}"` : ""} x="${colX2(r.s) - G.GAP}" y="${ym(i) + 3.5}" text-anchor="end">${esc(dataText([insLabel], 40))}<title>${esc(insTip)}</title></text>`);
      if (f.outs.length) over.push(`<text class="dn out"${f.outs.length === 1 ? ` data-act="${lib2 ? "renameOut" : "renameData"}" data-id="${esc(f.id)}" data-side="out" data-name="${esc(f.outs[0])}"` : ""} x="${colX2(r.e + 1) + G.GAP}" y="${ym(i) + 3.5}" text-anchor="start">${esc(dataText([outsLabel]))}<title>${esc(f.outs.join(", "))}</title></text>`);
      const ghost = (x, kind, tip) => `<g class="ghost" data-act="addIo" data-id="${esc(f.id)}" data-kind="${kind}"><circle class="hit" cx="${x}" cy="${ym(i)}" r="11"/><rect class="gh" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><path class="gp" d="M${x - 2} ${ym(i)} h4 M${x} ${ym(i) - 2} v4"/><title>${tip}</title></g>`;
      if (!lib2 && !f.ins.length) over.push(ghost(colX2(r.s), "in", "Add input"));
      if (!lib2 && !f.outs.length) over.push(ghost(colX2(r.e + 1), "out", "Add output"));
    });
    const elbow = (a, b) => `M${colX2(a.e + 1) - G.INS} ${ym(by.get(a.id))} H${colX2(a.e + 1)} V${ym(by.get(b.id))} H${colX2(b.s) + G.INS}`;
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
    const onb = run({ type: "newFlow", title: "onboarding" });
    const kid = (t) => run({ type: "addChild", id: onb, title: t });
    const get = kid("get"), redigir = kid("draft_proposal"), revisar = kid("review_proposal"), translate = kid("translate"), gerar = kid("generate_contract"), post = kid("post"), get2 = kid("get");
    for (const [id, agent] of [[redigir, "lia"], [revisar, "davi"], [translate, "teo"], [gerar, "lia"]]) run({ type: "assign", id, agent });
    run({ type: "assign", id: get, agent: "web" });
    run({ type: "setTask", id: get, task: "fetch" });
    run({ type: "setArg", id: get, name: "url", value: '"https://api.example.com/customers/42"' });
    run({ type: "renameData", id: get, to: "customer_data" });
    run({ type: "assign", id: post, agent: "web" });
    run({ type: "setTask", id: post, task: "fetch" });
    run({ type: "setArg", id: post, name: "url", value: '"https://api.example.com/shipments"' });
    run({ type: "setArg", id: post, name: "options", value: '{ method: "POST", body: JSON.stringify({ proposals, contract_package }) }' });
    run({ type: "renameData", id: post, to: "shipment_id" });
    run({ type: "assign", id: get2, agent: "web" });
    run({ type: "setTask", id: get2, task: "fetch" });
    run({ type: "setArg", id: get2, name: "url", value: "`https://api.example.com/shipments/${shipment_id}`" });
    run({ type: "renameData", id: get2, to: "crm_record" });
    const io2 = (id, ins, outs) => {
      ins.forEach((name) => run({ type: "addInput", id, name }));
      outs.forEach((name) => run({ type: "addOutput", id, name }));
    };
    io2(redigir, ["customer_data"], ["draft"]);
    io2(revisar, ["draft"], ["proposal_approved"]);
    io2(translate, ["proposal_approved"], ["proposals"]);
    io2(gerar, ["proposal_approved", "customer_data"], ["contract_package"]);
    run({ type: "setParallel", id: gerar, on: true });
    const ifId = run({ type: "wrap", id: translate, kind: "if", test: "proposal_approved" });
    const rej = run({ type: "addElse", id: ifId, title: "reject_proposal" });
    run({ type: "assign", id: rej, agent: "lia" });
    run({ type: "addInput", id: rej, name: "proposal_approved" });
    run({ type: "setScope", id: ifId, count: 2 });
    const forA = run({ type: "wrap", id: translate, kind: "for", v: "language", coll: '["en", "es"]' });
    run({ type: "setScope", id: forA, count: 2 });
    run({ type: "setScope", id: ifId, count: 2 });
    run({ type: "wrap", id: post, kind: "for", v: "language", coll: '["en", "es"]' });
    return { project: p, main, onboarding: onb };
  }

  // novo/app.ts
  function mount(host, store, flow) {
    const ui = { closed: /* @__PURE__ */ new Set(), sel: null, txtIn: true, flow, zoom: 1, pan: { x: 8, y: 8 } };
    let tab = "ts", hovT = 0, fitted = false, auto = true, last = null, gen = null;
    const histBtns = `<button type="button" class="ib hist-btn" data-hist="undo" title="Undo (Ctrl+Z)" aria-label="Undo">${icon("undo")}</button><button type="button" class="ib hist-btn" data-hist="redo" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">${icon("redo")}</button>`;
    host.innerHTML = `
  <div class="app">
    <section class="fx" aria-label="Flow">
      <div class="fx-bar">
        <span class="fx-t">Flow</span><select id="flowSel" aria-label="Flow"></select>
        <button type="button" id="newFlow" class="btn">${icon("plus")}New flow</button><button type="button" class="ib danger" id="delFlow" title="Delete this flow" aria-label="Delete this flow">${icon("trash")}</button><span class="sp"></span><span class="hist-inline"><button type="button" class="ib run" id="exec" title="Run this flow in the browser (Ctrl+Enter)" aria-label="Run">${icon("play")}</button>${histBtns}</span><i class="vsep"></i>
                <button type="button" class="ib" id="zout" title="Zoom out (\u2212)">${icon("minus")}</button><span id="zv" class="zv">100%</span><button type="button" class="ib" id="zin" title="Zoom in (+)">${icon("plus")}</button><button type="button" class="ib" id="fit" title="Fit to screen (0)">${icon("fit")}</button><i class="vsep"></i><button type="button" class="ib" id="txtIn" title="Name inside the bar" aria-pressed="false">${icon("text")}</button><button type="button" class="ib" id="expand" title="Expand all">${icon("expand")}</button><button type="button" class="ib" id="collapse" title="Collapse all">${icon("collapse")}</button><button type="button" class="ib" id="codeToggle" title="Show / hide the code (Ctrl+\\)" aria-pressed="true" aria-label="Code panel">${icon("panel-right")}</button>
      </div>
      <div class="fx-scroll" id="scroll"><div class="fx-sizer" id="sizer"><div class="fx-zoom" id="zoom"><div class="gtable" id="table"></div><div class="gplan" id="plan"></div></div></div></div>
      <div class="fx-legend" id="legend">
        <span><i class="lg fc"></i>concrete function (browser lib)</span><span><i class="lg fa"></i>abstract function (AI \xB7 state)</span><span><i class="lg da"></i>abstract data (state)</span><span><i class="lg dc"></i>concrete data</span><span><i class="lg cb"></i>cube (more than one data)</span>
        <span><i class="lg dia"></i>selection (if)</span><span><i class="lg lp">\u21BB</i>repetition (for)</span><span><i class="lg tr"></i>try</span><span><i class="lg ca"></i>catch</span><span><i class="lg el"></i>else</span>
      </div>

    </section>
    <div class="splitter" id="splitter" role="separator" aria-orientation="vertical" aria-label="Resize the code panel" tabindex="0" title="Drag to resize \xB7 double-click to reset"><i></i></div>
    <aside class="side">
      <div class="tabs" role="tablist"><button role="tab" data-tab="ts" aria-selected="true">TypeScript</button><button role="tab" data-tab="term" aria-selected="false">Terminal</button><span class="sp"></span><span class="meta" id="meta"></span></div>
      <section class="pane on" id="p-ts"><div class="fhead"><span class="tsb">TS</span><span id="fname">flow.ts</span><span class="selname" id="selname"></span><button type="button" id="dl" title="Download the file">Download</button><button type="button" id="copy">Copy</button></div><div class="runhint" id="runhint"><code id="runcmd"></code><button type="button" id="cmdcopy">Copy command</button></div><div class="code" id="code" tabindex="0" aria-label="Generated TypeScript code"></div></section>
      <section class="pane term" id="p-term"><div class="thead"><span class="tstat" id="tstat">ready</span><span class="sp"></span><button type="button" id="tRun">Run</button><button type="button" id="tClear">Clear</button></div><div class="tbody" id="tbody" role="log" aria-live="polite" tabindex="0" aria-label="Terminal"><div class="tline system">Click Run to execute the flow here in the browser.</div></div></section>
    </aside>
  </div>`;
    const $ = (s) => host.querySelector(s);
    const el = { sel: $("#flowSel"), scroll: $("#scroll"), sizer: $("#sizer"), zoom: $("#zoom"), table: $("#table"), plan: $("#plan"), code: $("#code"), meta: $("#meta"), fname: $("#fname"), selname: $("#selname"), zv: $("#zv") };
    const proj = host.ownerDocument.createElement("div");
    proj.id = "proj";
    proj.className = "proj";
    proj.setAttribute("role", "toolbar");
    proj.setAttribute("aria-label", "Project");
    proj.innerHTML = `<button type="button" class="btn sm" id="agents" title="Register libs, people and AI agents">${icon("users")}Sources</button><button type="button" class="btn sm" id="open" title="Open a saved project (.json)">${icon("upload")}Open</button><button type="button" class="btn sm" id="save" title="Save the project (.json)">${icon("download")}Save</button><input type="file" id="openFile" accept=".json,application/json" hidden>`;
    host.ownerDocument.querySelector(".topbar")?.append(proj);
    const themes = host.ownerDocument.createElement("div");
    themes.id = "temas";
    host.ownerDocument.querySelector(".topbar")?.append(themes);
    if (typeof mountTemas === "function") mountTemas(themes);
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
        }
        return id;
      } catch (e) {
        toast(e instanceof FlowError ? e.message : String(e));
        return void 0;
      }
    };
    const P2 = () => store.project;
    function render() {
      const p = P2();
      if (!locate(p, ui.flow)) ui.flow = p.flows[0]?.id ?? ui.flow;
      last = build(p, ui.flow, ui);
      el.table.innerHTML = last.scene.rows.length ? `<div class="ghead"><span>source</span><span>function</span></div>${last.table}` : "";
      el.plan.innerHTML = last.plan;
      const tw0 = tableWidth(last.scene);
      el.table.style.width = tw0 + "px";
      el.table.style.setProperty("--tw", tw0 + "px");
      const W = tw0 + planWidth(last.scene, last.w), H = planHeight(last.scene);
      el.zoom.style.width = W + "px";
      el.zoom.style.height = H + "px";
      applyView();
      el.sel.innerHTML = p.flows.map((f) => `<option value="${f.id}"${f.id === ui.flow ? " selected" : ""}>${esc(f.title)}</option>`).join("");
      host.ownerDocument.querySelectorAll(".hist-btn").forEach((b) => {
        b.disabled = b.dataset["hist"] === "undo" ? !store.canUndo : !store.canRedo;
      });
      $("#txtIn").setAttribute("aria-pressed", String(ui.txtIn));
      if (!fitted || auto) {
        fitted = true;
        fit();
      }
      renderCode();
    }
    function renderCode() {
      const p = P2();
      gen = generate(p, ui.flow, { runnable: true });
      const lines = gen.code.replace(/\n$/, "").split("\n"), r = ui.sel ? gen.map[ui.sel] : void 0;
      const hl = (l) => esc(l).replace(/(\/\/.*$)|(&quot;[^&]*?&quot;)|(\b\d+\b)|(\b[A-Za-z_$][\w$]*\b)(\()?/g, (m, c, s, n2, w, par) => c ? `<span class="tk-c">${c}</span>` : s ? `<span class="tk-s">${s}</span>` : n2 ? `<span class="tk-n">${n2}</span>` : /^(?:const|let|await|async|import|from|export|type|return|if|else|for|of|try|catch|function|as)$/.test(w) ? `<span class="tk-k">${w}</span>${par ?? ""}` : /^(?:State|Promise|Record|unknown|Fn)$/.test(w) ? `<span class="tk-t">${w}</span>${par ?? ""}` : par ? `<span class="tk-f">${w}</span>(` : m);
      el.code.innerHTML = lines.map((l, i) => `<div class="ln${r && i + 1 >= r[0] && i + 1 <= r[1] ? " hl" : ""}" data-n="${i + 1}"><span class="g">${i + 1}</span><span class="t">${hl(l) || " "}</span></div>`).join("");
      el.fname.textContent = gen.runFile;
      $("#runcmd").textContent = gen.runCommand;
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
      const W = tableWidth(last.scene) + planWidth(last.scene, last.w), H = planHeight(last.scene), cw = el.scroll.clientWidth, ch = el.scroll.clientHeight;
      const k = Math.max(0.2, Math.min(1, (cw - 16) / W, (ch - 16) / H));
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
    const KIND_NAME = { maquina: "Browser lib", pessoa: "Person", ia: "AI agent" };
    const agentsDialog = () => modal("Sources", (form, done) => {
      const draw = () => {
        form.classList.add("wide");
        form.innerHTML = `<label>Project sources</label><div class="agl">${P2().agents.map((a) => `<div class="agr"><span class="fav ${a.kind}">${icon(a.kind === "maquina" ? "package" : a.kind === "pessoa" ? "user" : "ia")}</span><b>${esc(a.name)}</b><span class="k">${KIND_NAME[a.kind]}${a.tasks.length ? ` \xB7 ${esc(a.tasks.join(", "))}` : ""}</span><button type="button" class="ib danger" data-rm-agent="${esc(a.id)}" title="Remove ${esc(a.name)}" aria-label="Remove ${esc(a.name)}">${icon("trash")}</button></div>`).join("")}</div>
        <div class="agadd"><select name="kind" aria-label="Type"><option value="maquina">Browser lib</option><option value="pessoa">Person</option><option value="ia">AI agent</option></select><input name="name" placeholder="name (e.g. Math, Maria, Writer)" aria-label="Name" spellcheck="false"><input name="tasks" placeholder="functions: round(value) -> result; max(a, b) -> result" aria-label="Lib functions with inputs and outputs" spellcheck="false"><button type="submit" class="pri">Add</button></div>
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
      return `<div class="argd d${depth}"><select data-k="type" data-path="${path}" aria-label="Type">${typeOpts(d, states, removable)}</select>${val}</div>${kids2}`;
    };
    const dataEditor = (n, side, opts = {}) => modal(side === "in" ? `Input of ${n.title}` : `Output of ${n.title}`, (form, done) => {
      const lib2 = !!contractOf(P2(), n), editable = !lib2, withValue = side === "in";
      const names = opts.names ? [...opts.names] : [...side === "in" ? n.ins : n.outs];
      if (opts.start && !names.length) {
        const base = side === "in" ? "input" : "output";
        names.push(base);
      }
      const drafts = names.map((nm) => withValue ? inferArg(n.args?.[nm] ?? "") : emptyDraft()), refs = refNames(n), states = statesFor(P2(), n.id);
      form.classList.add("wide");
      const fresh = names.map(() => false);
      const nameEditable = (i) => editable && (!withValue || !!fresh[i]);
      const canAdd = () => editable && (!withValue || names.length > 1);
      const title = () => names.length > 1 ? `${side === "in" ? "Input" : "Output"} of ${esc(n.title)} \u2014 object ${esc(cubeName(n, side))}` : `${side === "in" ? "Input" : "Output"} data of ${esc(n.title)}`;
      const draw = () => {
        form.innerHTML = `<label>${title()}</label><p class="hint">${withValue ? "Name, type and value. Left blank, the input stays abstract (it comes from the state)." : "Name of the data this function produces."}${canAdd() ? " Add child adds one more data (it becomes an object)." : ""}</p>
        ${names.map((nm, i) => `<div class="param"><div class="prow">${nameEditable(i) ? `<input data-k="pname" data-i="${i}" value="${esc(nm)}" placeholder="name" spellcheck="false" aria-label="Data name">` : `<b class="pn">${esc(nm)}</b>`}${nameEditable(i) ? `<button type="button" class="ib danger" data-del="${i}" title="Remove this data" aria-label="Remove this data">${icon("trash")}</button>` : ""}</div>${withValue ? draftHtml(drafts[i], String(i), states, 0, editable) : ""}</div>`).join("")}
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
            fresh.splice(i, 1);
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
          fresh.splice(i, 1);
        } else {
          let i = names.length + 1;
          while (names.includes(`field${i}`)) i++;
          names.push(`field${i}`);
          drafts.push(emptyDraft());
          fresh.push(true);
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
        if (l && l.node.kids.length && !await confirmAsk(`Remove \u201C${l.node.t === "fn" ? l.node.title : l.node.t}\u201D and everything inside it?`)) return;
        if (ui.sel === d["id"]) ui.sel = null;
        run({ type: "remove", id: d["id"] }, false);
      },
      rename: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (!n || n.t !== "fn") return;
        ui.sel = n.id;
        const v = await ask("New function name:", n.title);
        if (v) run({ type: "rename", id: n.id, title: v });
        else render();
      },
      editBlock: async (d) => {
        const id = d["id"], n = locate(P2(), id)?.node;
        if (!n) return;
        if (n.t === "for") {
          const v = await ask("for variable (each item):", n.v);
          if (!v) return;
          const c = await ask("Collection to loop over:", n.coll);
          if (c) run({ type: "setFor", id, v, coll: c }, false);
        } else if (n.t === "if") await condDialog(n.id, n.test, n.kids);
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
      renameOut: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (!n || n.t !== "fn") return;
        const v = await ask("Name of the data this function returns:", n.outs[0] ?? "");
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
        const v = await ask(side === "in" ? "Input data name:" : "Output data name:", cur);
        if (v && v !== cur) run({ type: "renameIo", id: n.id, side, from: cur, to: v }, false);
      }
    };
    host.addEventListener("click", (e) => {
      const t = e.target;
      if (t.closest(".dlg, select")) return;
      const a = t.closest("[data-act]");
      if (a?.dataset["act"] && ACT[a.dataset["act"]]) {
        e.stopPropagation();
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
      if (c === "assign") run({ type: "assign", id, agent: s.value || null }, false);
      else if (c === "setResp") run({ type: "setResp", id, resp: s.value || null }, false);
      else if (c === "setTask") run({ type: "setTask", id, task: s.value }, false);
    });
    el.sel.addEventListener("change", () => {
      ui.flow = el.sel.value;
      ui.sel = null;
      fitted = false;
      render();
    });
    $("#delFlow").addEventListener("click", async () => {
      const f = locate(P2(), ui.flow)?.node;
      if (!f || f.t !== "fn") return;
      if (!await confirmAsk(`Delete the flow \u201C${f.title}\u201D and everything inside it?`)) return;
      run({ type: "removeFlow", id: f.id }, false);
    });
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
    proj.querySelector("#agents").addEventListener("click", () => void agentsDialog());
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
    $("#expand").addEventListener("click", () => {
      ui.closed.clear();
      render();
    });
    $("#collapse").addEventListener("click", () => {
      const f = locate(P2(), ui.flow)?.node;
      if (f?.t === "fn") f.kids.forEach(function mark(n) {
        if (n.t === "fn" && n.kids.length) ui.closed.add(n.id);
      });
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
      const a = host.ownerDocument.createElement("a"), url = URL.createObjectURL(new Blob([gen.code], { type: "text/plain" }));
      a.href = url;
      a.download = gen.runFile;
      host.append(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1e3);
    });
    $("#cmdcopy").addEventListener("click", async () => {
      await navigator.clipboard?.writeText(gen?.runCommand ?? "").catch(() => {
      });
      $("#cmdcopy").textContent = "Copied";
      setTimeout(() => $("#cmdcopy").textContent = "Copy command", 1200);
    });
    $("#copy").addEventListener("click", async () => {
      await navigator.clipboard?.writeText(gen?.code ?? "").catch(() => {
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
      hovT = window.setTimeout(() => el.plan.querySelector(".bar-tools")?.remove(), LEAVE_MS);
    };
    el.plan.addEventListener("mouseover", (e) => {
      const h = e.target.closest("[data-hover]");
      if (!h) return;
      window.clearTimeout(hovT);
      const id = h.dataset["hover"], part = h.dataset["part"] ?? "main", key = id + part;
      const cur = el.plan.querySelector(".bar-tools");
      if (cur?.dataset["key"] === key) return;
      const show = () => {
        el.plan.querySelector(".bar-tools")?.remove();
        const bar = host.ownerDocument.createElement("div");
        bar.className = "bar-tools";
        bar.dataset["key"] = key;
        bar.setAttribute("role", "toolbar");
        bar.innerHTML = toolsHtml(toolsFor(P2(), id, part));
        const hr = h.getBoundingClientRect(), pr = el.plan.getBoundingClientRect(), k = ui.zoom;
        bar.style.left = Math.max(4, (hr.left - pr.left) / k) + "px";
        bar.style.top = Math.max(2, (hr.top - pr.top) / k - 30) + "px";
        bar.addEventListener("mouseenter", () => window.clearTimeout(hovT));
        bar.addEventListener("mouseleave", leaveBar);
        el.plan.append(bar);
      };
      if (cur) hovT = window.setTimeout(show, SWITCH_MS);
      else show();
    });
    el.plan.addEventListener("mouseout", (e) => {
      if (e.target.closest("[data-hover]")) leaveBar();
    });
    el.plan.addEventListener("pointerdown", (e) => {
      const hd = e.target.closest("[data-drag]");
      if (!hd || !last) return;
      e.preventDefault();
      e.stopPropagation();
      const id = hd.dataset["drag"], svg = el.plan.querySelector("svg"), p0 = P2();
      const guide = host.ownerDocument.createElement("div");
      guide.className = "guide";
      el.plan.append(guide);
      const at = (ev) => {
        const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) / ui.zoom;
        return countForStep(p0, last.scene, id, Math.floor((x - G.OX) / last.w));
      };
      const place = (n2) => {
        const l = locate(p0, id), items = [...l.node.kids, ...l.list.slice(l.index + 1)], last2 = items[n2 - 1], sp = last2 ? last.scene.span.get(last2.id) : void 0;
        guide.style.left = G.OX + ((sp?.e ?? 0) + 1) * last.w + "px";
      };
      let n = at(e);
      place(n);
      const move = (ev) => {
        n = at(ev);
        place(n);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        guide.remove();
        const cur = kids(id);
        if (n !== cur) run({ type: "setScope", id, count: n }, false);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
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
      prefs.codeW = clampCodeWidth(prefs.codeW, total());
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
      const step = e.shiftKey ? 80 : 24;
      if (e.key === "ArrowLeft") prefs.codeW += step;
      else if (e.key === "ArrowRight") prefs.codeW -= step;
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
    window.addEventListener("resize", () => applyPrefs(false));
    applyPrefs(false);
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
      if (running) {
        running.stop();
        return;
      }
      const flow2 = locate(P2(), ui.flow)?.node;
      if (!flow2 || flow2.t !== "fn") return;
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
        return { project: p, flow: p.flows[0].id };
      }
    } catch {
    }
    const s = sampleProject();
    return { project: s.project, flow: s.main };
  }
  function boot() {
    const s = startProject(), store = new Store(s.project), app = mount(document.getElementById("app"), store, s.flow);
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
