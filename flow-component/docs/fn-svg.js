"use strict";
var FlowAst = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // novo/ast/fn-svg.ts
  var fn_svg_exports = {};
  __export(fn_svg_exports, {
    G: () => G,
    fnAstToSvg: () => fnAstToSvg,
    renderFnSvg: () => renderFnSvg
  });

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
  var fileAgent = (p, file) => {
    const fns = p.flows.filter((f) => flowFile(f) === file);
    return fns.length ? { id: `file:${file}`, kind: "arquivo", name: file, tasks: fns.map((f) => f.title), contracts: Object.fromEntries(fns.map((f) => [f.title, { ins: [...f.ins], outs: [...f.outs] }])) } : void 0;
  };
  var LIB_RETURN_TYPE = { "web:fetch": "Response" };
  var OBJ_TYPE_SIGS = {
    Response: ["json() -> value", "text() -> text", "blob() -> blob", "arrayBuffer() -> buffer", "formData() -> formData"]
  };
  var returnTypeOf = (p, f) => f.agent && f.title ? LIB_RETURN_TYPE[`${f.agent}:${f.title}`] ?? null : null;
  function producerOf(p, consumerId, name) {
    const l = locate(p, consumerId);
    if (!l) return null;
    let found = false, hit = null;
    const visit = (nodes) => {
      for (const n of nodes) {
        if (found) return;
        if (n.id === consumerId) {
          found = true;
          return;
        }
        if (n.t === "fn") {
          if (n.kids.length) visit(n.kids);
          else if (!found && n.outs.includes(name)) hit = n;
        } else {
          visit(n.kids);
          if (!found && n.t === "try") visit(n.catchKids);
          if (!found && n.t === "if") visit(n.elseKids);
        }
      }
    };
    visit(l.flow.kids);
    return found ? hit : null;
  }
  function objAgent(p, dataName, consumerId) {
    const producer = consumerId ? producerOf(p, consumerId, dataName) : (() => {
      let hit = null;
      for (const f of p.flows) walk(f.kids, (n) => {
        if (n.t === "fn" && n.outs.includes(dataName) && returnTypeOf(p, n)) hit = n;
      });
      return hit;
    })();
    if (!producer) return void 0;
    const type = returnTypeOf(p, producer);
    if (!type) return void 0;
    const sigs = OBJ_TYPE_SIGS[type];
    if (!sigs?.length) return void 0;
    const contracts = {}, tasks = [];
    for (const sg of sigs) {
      const r = parseSignature(sg);
      tasks.push(r.task);
      contracts[r.task] = r.contract;
    }
    return { id: `obj:${dataName}`, kind: "maquina", name: dataName, tasks, contracts };
  }
  var agentOf = (p, id) => {
    if (!id) return void 0;
    if (id.startsWith("file:")) return fileAgent(p, id.slice(5));
    if (id.startsWith("obj:")) return objAgent(p, id.slice(4));
    return p.agents.find((a) => a.id === id);
  };
  var hasContract = (a) => a?.kind === "maquina" || a?.kind === "arquivo";
  var kidsOf = (n) => n.t === "try" ? [...n.kids, ...n.catchKids] : n.t === "if" ? [...n.kids, ...n.elseKids] : n.kids;
  var altKids = (n) => n.t === "try" ? n.catchKids : n.t === "if" ? n.elseKids : null;
  function walk(list, f) {
    for (const n of list) {
      f(n);
      walk(kidsOf(n), f);
    }
  }
  var renameIdentInExpr = (expr, from, to) => {
    if (!expr || from === to) return expr;
    const strings = [];
    const masked = expr.replace(/(["'`])(?:\\.|(?!\1).)*\1/g, (m) => {
      strings.push(m);
      return `\0${strings.length - 1}\0`;
    });
    const re = new RegExp(`(?<![.\\w$])${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w$])`, "g");
    return masked.replace(re, to).replace(/\0(\d+)\0/g, (_, i) => strings[Number(i)]);
  };
  function renameDatumInFlow(flow, from, to) {
    if (from === to) return;
    const patch = (n) => {
      n.ins = n.ins.map((x) => x === from ? to : x);
      n.outs = n.outs.map((x) => x === from ? to : x);
      if (n.args) {
        const next = {};
        for (const [k, v] of Object.entries(n.args)) next[k === from ? to : k] = renameIdentInExpr(v, from, to);
        n.args = next;
        if (!Object.keys(next).length) delete n.args;
      }
      if (n.agent?.startsWith("obj:")) {
        const rest = n.agent.slice(4), hash = rest.indexOf("#"), data = hash >= 0 ? rest.slice(0, hash) : rest, meth = hash >= 0 ? rest.slice(hash) : "";
        if (data === from) n.agent = `obj:${to}${meth}`;
      }
    };
    patch(flow);
    walk(flow.kids, (n) => {
      if (n.t === "fn") patch(n);
      else if (n.t === "if") n.test = renameIdentInExpr(n.test, from, to);
      else if (n.t === "switch") n.expr = renameIdentInExpr(n.expr, from, to);
      else if (n.t === "for") {
        if (n.v === from) n.v = to;
        n.coll = renameIdentInExpr(n.coll, from, to);
      }
    });
  }
  var LITERAL_IDENTS = /* @__PURE__ */ new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);
  var initsDatum = (f, name) => {
    const e = f.args?.[name]?.trim();
    if (!e) return false;
    if (e.startsWith("from:") || LITERAL_IDENTS.has(e)) return true;
    return !/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/.test(e);
  };
  function originPort(flow, name) {
    const hit = (f) => {
      if (f.ins.includes(name) && initsDatum(f, name)) return { id: f.id, side: "in" };
      if (f.outs.includes(name)) return { id: f.id, side: "out" };
      return null;
    };
    const at = hit(flow);
    if (at) return at;
    let found = null;
    const visit = (nodes) => {
      for (const n of nodes) {
        if (found) return;
        if (n.t === "fn") {
          found = hit(n);
          if (!found && n.kids.length) visit(n.kids);
        } else {
          visit(n.kids);
          if (!found && n.t === "try") visit(n.catchKids);
          if (!found && n.t === "if") visit(n.elseKids);
        }
      }
    };
    visit(flow.kids);
    return found;
  }
  function renamePortLocal(n, side, from, to, clearValue = false) {
    if (from === to) return;
    const key = side === "out" ? "outs" : "ins";
    n[key] = n[key].map((x) => x === from ? to : x);
    if (side === "in" && n.args) {
      if (clearValue) {
        delete n.args[from];
        delete n.args[to];
      } else if (from in n.args) {
        n.args[to] = n.args[from];
        delete n.args[from];
      }
      if (!Object.keys(n.args).length) delete n.args;
    }
  }
  var isCube = (names) => names.length !== 1;
  var cubeName = (f, side) => `${side === "in" ? "input" : "output"}_${f.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "function"}`;
  var slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "flow";
  var flowFile = (f) => f.file ?? `${slug(f.title)}.ts`;
  var nextId = (p) => `n${++p.seq}`;
  var newFn = (p, title = "newFunction") => ({ t: "fn", id: nextId(p), title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false });
  var ident = /^[A-Za-z_][A-Za-z0-9_]*$/;
  var CAMEL_FN = /^[a-z][a-zA-Z0-9]*$/;
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
  var cleanFnTitle = (s, what = "Function name") => {
    const v = String(s ?? "").trim();
    if (!v || v.length > 80) return fail("invalid", `${what} cannot be empty`);
    if (RESERVED.has(v)) return fail("invalid", `${what} cannot be the reserved word \u201C${v}\u201D`);
    if (!CAMEL_FN.test(v)) return fail("invalid", `${what} must be lowerCamelCase (e.g. processOrder)`);
    return v;
  };
  function dataNamesInFlow(flow) {
    const out = /* @__PURE__ */ new Set([...flow.ins, ...flow.outs]);
    walk(flow.kids, (n) => {
      if (n.t === "fn") {
        for (const x of n.ins) out.add(x);
        for (const x of n.outs) out.add(x);
      } else if (n.t === "for") out.add(n.v);
    });
    return out;
  }
  function fnTitlesInFlow(flow, exceptId) {
    const out = /* @__PURE__ */ new Set();
    if (flow.id !== exceptId) out.add(flow.title);
    walk(flow.kids, (n) => {
      if (n.t === "fn" && n.id !== exceptId) out.add(n.title);
    });
    return out;
  }
  var claimAbstractTitle = (p, flow, raw, exceptId) => {
    const name = cleanFnTitle(raw);
    if (dataNamesInFlow(flow).has(name)) return fail("invalid", `\u201C${name}\u201D is already a data name in this flow`);
    const hit = (n) => n.id !== exceptId && n.title === name && !contractOf(p, n);
    if (hit(flow)) return fail("invalid", `Function \u201C${name}\u201D already exists in this flow`);
    let clash = false;
    walk(flow.kids, (n) => {
      if (n.t === "fn" && hit(n)) clash = true;
    });
    if (clash) return fail("invalid", `Function \u201C${name}\u201D already exists in this flow`);
    return name;
  };
  var claimRenameAbstract = (p, flow, raw, exceptId) => {
    const name = cleanFnTitle(raw);
    if (dataNamesInFlow(flow).has(name)) return fail("invalid", `\u201C${name}\u201D is already a data name in this flow`);
    const hit = (n) => n.id !== exceptId && n.title === name;
    if (hit(flow)) return fail("invalid", `Function \u201C${name}\u201D already exists in this flow`);
    let clash = false;
    walk(flow.kids, (n) => {
      if (n.t === "fn" && hit(n)) clash = true;
    });
    if (clash) return fail("invalid", `Function \u201C${name}\u201D already exists in this flow`);
    return name;
  };
  var claimDataInFlow = (flow, raw, what = "Data name") => {
    const name = cleanName(raw, what);
    if (fnTitlesInFlow(flow).has(name)) return fail("invalid", `\u201C${name}\u201D is already a function name in this flow`);
    return name;
  };
  var freshFnTitle = (flow, base = "newFunction") => {
    const taken = fnTitlesInFlow(flow), data = dataNamesInFlow(flow);
    if (!taken.has(base) && !data.has(base) && CAMEL_FN.test(base)) return base;
    let n = 2;
    for (; ; ) {
      const t = `${base}${n}`;
      if (!taken.has(t) && !data.has(t)) return t;
      n++;
    }
  };
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
    return { t: "try", id, kids: [inner], catchKids: [newFn(p, "handleError")] };
  }
  var HANDLERS = {
    /** Novo fluxo (função raiz). */
    newFlow: (p, a) => {
      const file = a["file"] ? cleanText(a["file"], "File", 80) : void 0;
      const title = a["title"] ? cleanFnTitle(a["title"], "Title") : "newFlow";
      if (p.flows.some((x) => x.title === title && flowFile(x) === (file ?? `${slug(title)}.ts`))) return fail("invalid", `Function \u201C${title}\u201D already exists in this file`);
      const f = newFn(p, title);
      if (file) f.file = file;
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
      const from = l.node.title;
      if (contractOf(p, l.node)) {
        const to2 = cleanFnTitle(a["title"], "Name");
        if (from === to2) return;
        if (dataNamesInFlow(l.flow).has(to2)) return fail("invalid", `\u201C${to2}\u201D is already a data name in this flow`);
        l.node.title = to2;
        return;
      }
      const to = claimRenameAbstract(p, l.flow, a["title"], l.node.id);
      if (from === to) return;
      l.node.title = to;
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
      const l = need(p, str(a, "id")), n = l.node, f = newFn(p, a["title"] ? claimAbstractTitle(p, l.flow, a["title"]) : freshFnTitle(l.flow));
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
      const f = newFn(p, a["title"] ? claimAbstractTitle(p, l.flow, a["title"]) : freshFnTitle(l.flow));
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
      if (b.t === "try" && b.catchKids[0]?.t === "fn") b.catchKids[0].title = freshFnTitle(l.flow, "handleError");
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
      const l = need(p, str(a, "id")), n = l.node;
      if (n.t !== "for") return fail("invalid", "Not a for");
      n.v = claimDataInFlow(l.flow, a["v"], "Variable");
      n.coll = cleanText(a["coll"], "Collection");
    },
    setIf: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "if") return fail("invalid", "Not an if");
      n.test = cleanText(a["test"], "Condition");
    },
    /** Cria o else do if (uma função dentro dele, como o try cria o catch). */
    addElse: (p, a) => {
      const l = need(p, str(a, "id")), n = l.node;
      if (n.t !== "if") return fail("invalid", "Only an if has an else");
      if (n.elseKids.length) return fail("invalid", "This if already has an else");
      const f = newFn(p, a["title"] ? claimAbstractTitle(p, l.flow, a["title"]) : freshFnTitle(l.flow));
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
      const l = need(p, str(a, "id")), n = l.node;
      if (n.t !== "fn") return fail("invalid", "Only functions have a source");
      const ag = a["agent"] ? agentOf(p, str(a, "agent")) ?? fail("not_found", `Source ${str(a, "agent")} does not exist`) : void 0;
      n.agent = ag?.id ?? null;
      if (ag?.kind !== "ia") n.resp = null;
      if (hasContract(ag) && !ag.tasks.includes(n.title)) {
        const task = ag.tasks[0] ?? n.title;
        if (dataNamesInFlow(l.flow).has(task)) return fail("invalid", `\u201C${task}\u201D is already a data name in this flow`);
        n.title = task;
      }
      if (hasContract(ag)) applyContract(p, n);
      if (n.args) {
        n.args = Object.fromEntries(Object.entries(n.args).filter(([k]) => n.ins.includes(k)));
        if (!Object.keys(n.args).length) delete n.args;
      }
    },
    setTask: (p, a) => {
      const l = need(p, str(a, "id")), n = l.node;
      if (n.t !== "fn") return fail("invalid", "Only functions have a lib function");
      const ag = agentOf(p, n.agent), t = cleanFnTitle(a["task"], "Function");
      if (hasContract(ag) && !ag.tasks.includes(t)) return fail("invalid", `Function "${t}" does not exist in ${ag.name}`);
      if (dataNamesInFlow(l.flow).has(t)) return fail("invalid", `\u201C${t}\u201D is already a data name in this flow`);
      n.title = t;
      applyContract(p, n);
    },
    /**
     * Renomeia um dado. Pai (origem do nome) → propaga a todos. Filho (só referência) → renomeia
     * este porto e desvincula do pai. Entrada para nome já usado → só aponta (referência; limpa literal).
     * No mesmo contexto não há dois dados distintos com o mesmo nome nem duas funções com o mesmo título.
     */
    renameIo: (p, a) => {
      const l = need(p, str(a, "id")), n = l.node;
      if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
      if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
      const side = str(a, "side") === "out" ? "out" : "in", key = side === "out" ? "outs" : "ins", from = str(a, "from"), to = claimDataInFlow(l.flow, a["to"]);
      if (!n[key].includes(from)) return fail("not_found", `${from} does not exist`);
      if (from !== to && n[key].includes(to)) return fail("invalid", `${to} already exists`);
      if (from === to) return;
      const origin = originPort(l.flow, from), isParent = !!origin && origin.id === n.id && origin.side === side;
      if (!isParent) {
        if (side === "in" && dataNamesInFlow(l.flow).has(to)) {
          renamePortLocal(n, "in", from, to, true);
          return;
        }
        if (side === "out" && dataNamesInFlow(l.flow).has(to) && to !== from) return fail("invalid", `\u201C${to}\u201D is already a data name in this flow`);
        renamePortLocal(n, side, from, to);
        return;
      }
      if (dataNamesInFlow(l.flow).has(to) && to !== from) {
        const other = side === "out" ? n.ins : n.outs;
        if (!other.includes(to)) return fail("invalid", `\u201C${to}\u201D is already a data name in this flow`);
      }
      renameDatumInFlow(l.flow, from, to);
    },
    /** Troca de uma vez todos os dados de um lado (entrada ou saída) de uma função comum: nomes e, nas entradas, os valores. */
    setData: (p, a) => {
      const l = need(p, str(a, "id")), n = l.node;
      if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
      if (contractOf(p, n)) return fail("invalid", `The inputs and outputs of ${n.title} come from the lib contract`);
      const side = str(a, "side") === "out" ? "out" : "in", names = (Array.isArray(a["names"]) ? a["names"] : []).map((x) => claimDataInFlow(l.flow, x)), values = Array.isArray(a["values"]) ? a["values"].map((x) => String(x ?? "").trim()) : [];
      if (new Set(names).size !== names.length) return fail("invalid", "Duplicate data name");
      if (values.some((v) => v.length > 300)) return fail("invalid", "Value too large");
      const prev = side === "out" ? [...n.outs] : [...n.ins];
      for (let i = 0; i < Math.min(prev.length, names.length); i++) {
        const from = prev[i], to = names[i];
        if (from === to) continue;
        if (dataNamesInFlow(l.flow).has(to)) continue;
        const origin = originPort(l.flow, from), isParent = !!origin && origin.id === n.id && origin.side === side;
        if (isParent) renameDatumInFlow(l.flow, from, to);
        else renamePortLocal(n, side, from, to);
      }
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
    /** Nome do dado no flow: pai propaga; filho desvincula; entrada→nome existente só aponta. */
    renameData: (p, a) => {
      const l = need(p, str(a, "id")), n = l.node;
      if (n.t !== "fn") return fail("invalid", "Only functions have inputs and outputs");
      const c = contractOf(p, n);
      if (!c) return fail("invalid", "The data name can only change on lib functions");
      const side = str(a, "side") === "in" ? "in" : "out", to = claimDataInFlow(l.flow, a["to"]);
      if (side === "out") {
        if (c.outs.length !== 1) return fail("invalid", "Renaming only works when the lib returns a single data");
        const from2 = n.outs[0] ?? c.outs[0];
        if (from2 === to) return;
        const origin2 = originPort(l.flow, from2), isParent2 = !!origin2 && origin2.id === n.id && origin2.side === "out";
        if (!isParent2) {
          if (dataNamesInFlow(l.flow).has(to) && to !== from2) return fail("invalid", `\u201C${to}\u201D is already a data name in this flow`);
          renamePortLocal(n, "out", from2, to);
          return;
        }
        if (dataNamesInFlow(l.flow).has(to) && to !== from2 && !n.ins.includes(to)) return fail("invalid", `\u201C${to}\u201D is already a data name in this flow`);
        renameDatumInFlow(l.flow, from2, to);
        return;
      }
      if (c.ins.length !== 1) return fail("invalid", "Renaming only works when the lib takes a single parameter");
      const from = n.ins[0] ?? c.ins[0];
      if (from === to) return;
      const origin = originPort(l.flow, from), isParent = !!origin && origin.id === n.id && origin.side === "in";
      if (!isParent) {
        if (dataNamesInFlow(l.flow).has(to)) {
          renamePortLocal(n, "in", from, to, true);
          return;
        }
        renamePortLocal(n, "in", from, to);
        return;
      }
      renameDatumInFlow(l.flow, from, to);
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
    const l = need(p, str(a, "id"));
    const name = add ? claimDataInFlow(l.flow, a["name"]) : cleanName(a["name"], "Data name");
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

  // novo/layout.ts
  function layout(flow, opts = {}) {
    const closed = opts.closed ?? /* @__PURE__ */ new Set();
    const rows = [], span = /* @__PURE__ */ new Map(), leaves = [];
    let maxDepth = 0;
    const place = (list, depth, start, emit, inAlt) => {
      let step = start, prev = null;
      const push = (r) => {
        const row = { ...r, last: 0 };
        if (emit) {
          rows.push(row);
          maxDepth = Math.max(maxDepth, r.depth);
        }
        return row;
      };
      const placeAlt = (b, alt, after, emitAlt, blockClosed, parallel = false) => {
        const kind = b.t === "try" ? "catch" : "else", altKey = `${b.id}:${kind}`, altClosed = closed.has(altKey);
        const first = alt[0], childStart = first && first.t !== "fn" && !parallel ? after + 1 : after;
        if (blockClosed) return place(alt, depth + 1, childStart, false, true);
        const crow = push({ kind, id: b.id, node: b, depth, s: after, e: after, leaf: false, closed: altClosed });
        const cend = place(alt, depth + 1, childStart, emitAlt && !altClosed, true);
        if (emitAlt) {
          crow.s = after;
          crow.e = Math.max(after, cend - 1);
          span.set(altKey, { s: crow.s, e: crow.e });
          crow.last = rows.length - 1;
        }
        return cend;
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
              if (!inAlt) leaves.push(row);
            }
          } else {
            const s0 = n2.par && prev ? prev.s : step;
            const row = push({ kind: "fn", id: n2.id, node: n2, depth, s: s0, e: s0, leaf: false, closed: isClosed });
            const idx = rows.length - 1, next = place(n2.kids, depth + 1, s0, emit && !isClosed, inAlt);
            const sp = { s: s0, e: Math.max(s0, next - 1) };
            prev = sp;
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
          const b = n2;
          const alt = altKids(b), canClose = b.kids.length > 0 || !!(alt && alt.length), isClosed = canClose && closed.has(b.id);
          const s0 = b.t === "if" && b.par && prev ? prev.s : step;
          const row = push({ kind: "block", id: b.id, node: b, depth, s: s0, e: s0, leaf: !canClose, closed: isClosed });
          const next = place(b.kids, depth + 1, s0, emit && !isClosed, inAlt), sp = { s: s0, e: Math.max(s0, next - 1) };
          prev = sp;
          if (emit) {
            span.set(b.id, sp);
            row.s = sp.s;
            row.e = sp.e;
          }
          let end = next;
          const elsePar = !!(opts.elseParallel && b.t === "if");
          if (alt && alt.length) end = Math.max(end, placeAlt(b, alt, elsePar ? s0 : next, emit, isClosed, elsePar));
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

  // novo/args.ts
  var LITERAL_IDENTS2 = /* @__PURE__ */ new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);
  var isDataRef = (e) => {
    const v = e.trim();
    if (!v || LITERAL_IDENTS2.has(v) || v.startsWith("from:")) return false;
    return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/.test(v);
  };

  // novo/view.ts
  var dataText = (names, max = 24) => {
    const t = names.join(", ");
    return t.length > max ? `${t.slice(0, max - 1)}\u2026` : t;
  };
  var stateLabel = (name, value, max = 26) => value != null && value !== "" ? dataText([`${name} = ${value}`], max) : dataText([name], max);
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
  var initsName = (f, n) => {
    const e = f.args?.[n]?.trim();
    return e && !isDataRef(e) ? e : void 0;
  };
  function cubeInfoByName(sc) {
    const m = /* @__PURE__ */ new Map();
    for (const r of sc.rows) {
      if (r.kind !== "fn") continue;
      const f = r.node;
      if (f.outs.length > 1) m.set(cubeName(f, "out"), { fields: [...f.outs] });
      if (f.ins.length > 1) m.set(cubeName(f, "in"), { fields: [...f.ins] });
      for (const i of f.ins) {
        const e = initsName(f, i);
        if (!e) continue;
        const pairs = objectPairs(e);
        if (!pairs || m.has(i)) continue;
        m.set(i, { fields: pairs.map((p) => p.name), value: e, fieldValues: Object.fromEntries(pairs.filter((p) => p.value != null).map((p) => [p.name, p.value])) });
      }
    }
    return m;
  }
  var inheritCube = (it, cubes) => {
    const c = cubes.get(it.name);
    if (!c) return it;
    return { ...it, cube: true, fields: c.fields, ...c.value != null && it.value == null ? { value: c.value } : {}, ...c.fieldValues && !it.fieldValues ? { fieldValues: c.fieldValues } : {} };
  };
  function statesByStep(sc, all = false, _p) {
    const cubes = cubeInfoByName(sc);
    const m = /* @__PURE__ */ new Map(), add = (col, it) => {
      const list = m.get(col) ?? [];
      if (list.some((x) => x.name === it.name)) return;
      list.push(inheritCube(it, cubes));
      m.set(col, list);
    };
    for (const r of sc.rows) {
      if (r.kind !== "fn") continue;
      const f = r.node;
      for (const i of f.ins) {
        const e = initsName(f, i);
        if (!e) continue;
        const pairs = objectPairs(e), fields = pairs?.map((p) => p.name) ?? null;
        const fieldValues = pairs ? Object.fromEntries(pairs.filter((p) => p.value != null).map((p) => [p.name, p.value])) : void 0;
        add(r.s, { name: i, cube: !!fields, fields: fields ?? [i], value: e, fieldValues, owner: f.id, side: "in" });
      }
      if (f.outs.length) add(r.e + 1, { name: isCube(f.outs) ? cubeName(f, "out") : f.outs[0], cube: isCube(f.outs), fields: f.outs, owner: f.id, side: "out" });
    }
    const made = /* @__PURE__ */ new Set();
    for (const r of sc.rows) if (r.kind === "fn") {
      const f = r.node;
      f.outs.forEach((o) => made.add(o));
      for (const i of f.ins) if (initsName(f, i)) made.add(i);
    }
    const loopVars = /* @__PURE__ */ new Set();
    for (const r of sc.rows) if (r.kind === "block" && r.node.t === "for") loopVars.add(r.node.v);
    const ext = /* @__PURE__ */ new Map();
    for (const r of sc.rows) if (r.kind === "fn") {
      for (const n of r.node.ins) if (!r.node.args?.[n]?.trim() && !ext.has(n)) ext.set(n, { col: r.s, owner: r.node.id });
      else if (ext.has(n) && r.s < ext.get(n).col) ext.set(n, { col: r.s, owner: ext.get(n).owner });
    }
    for (const [n, e] of ext) if (!made.has(n) && !loopVars.has(n)) add(e.col, { name: n, cube: false, fields: [n], abs: true, owner: e.owner, side: "in" });
    if (!all) return m;
    const consumerAt = (col, name) => {
      for (const r of sc.rows) {
        if (r.kind !== "fn" || !r.leaf || r.s !== col) continue;
        const f = r.node;
        if (f.ins.includes(name) && !initsName(f, name)) return { id: f.id, side: "in" };
      }
      return null;
    };
    const cols = [...m.keys()].sort((x, y) => x - y), out = /* @__PURE__ */ new Map();
    let acc = [];
    for (let c = cols[0] ?? 0; c <= sc.nSteps; c++) {
      const fresh = (m.get(c) ?? []).map((it) => inheritCube(it, cubes)), names = new Set(fresh.map((i) => i.name));
      acc = [...acc.filter((i) => !names.has(i.name)).map((i) => ({ ...inheritCube(i, cubes), old: true })), ...fresh].map((it) => {
        const cons = consumerAt(c, it.name);
        return cons ? { ...it, owner: cons.id, side: cons.side } : it;
      });
      if (acc.length) out.set(c, acc);
    }
    return out;
  }
  var STATE_ROW = 15;
  var TABLE_CHROME = 18 + 120 + 14;

  // novo/ast/fn-svg.ts
  var G = { RH: 34, HEAD: 52, OX: 120, W: 160, INS: 40, BH: 22, IND: 14, GAP: 16, WS: 100 };
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var tw = (t, px = 6.1) => Math.ceil(t.length * px);
  var rowY = (i) => G.HEAD + i * G.RH;
  var planGutter = (sc) => (sc.maxDepth + 1) * G.IND;
  function fnRows(sc) {
    return sc.rows;
  }
  var PAD = 12;
  function colW(sc, opts) {
    const leaves = fnRows(sc).filter((r) => r.leaf && r.kind === "fn");
    const txt = opts.txtIn !== false;
    const fromTitle = txt && leaves.length ? Math.max(...leaves.map((l) => tw(l.node.title, 6.2) + 2 * PAD + 2 * G.INS)) : G.WS;
    return Math.max(opts.minW ?? 0, txt ? Math.max(G.W, fromTitle) : G.WS);
  }
  var KINDS = /* @__PURE__ */ new Set(["fn", "if", "for", "try", "switch"]);
  function assertKnown(n) {
    if (!KINDS.has(n.t)) throw new Error(`fn-svg: n\xF3 desconhecido t:"${n.t}"`);
    for (const k of n.kids) assertKnown(k);
    if (n.t === "if") for (const k of n.elseKids) assertKnown(k);
    if (n.t === "try") for (const k of n.catchKids) assertKnown(k);
  }
  var blockCls = (n) => n.t === "if" ? n.caseVal !== void 0 ? "sw" : "if" : n.t === "for" ? "lp" : n.t === "switch" ? "sw" : "tr";
  var blockText = (n) => {
    if (n.t === "if") return n.caseVal !== void 0 ? `case ${n.caseVal}` : `if (${n.test})`;
    if (n.t === "switch") return `switch (${n.expr})`;
    if (n.t === "for") {
      if (n.loop === "while") return `while (${n.coll})`;
      if (n.loop === "do-while") return `do-while (${n.coll})`;
      return `for (${n.v} of ${n.coll})`;
    }
    return `try \xB7 catch \u2193 ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "handler"}`;
  };
  function renderFnSvg(flow, opts = {}) {
    assertKnown(flow);
    const L = opts.lang === "en" ? { machine: "machine", ai: "AI", person: "person", abstract: "abstract", source: "SOURCE", func: "FUNCTION", catchTxt: "catch \xB7 if the try fails", elseTxt: "else \xB7 otherwise", sol: "solid", abs: "abstract", eternal: "function (eternal)" } : { machine: "m\xE1quina", ai: "IA", person: "pessoa", abstract: "abstrato", source: "SOURCE", func: "FUN\xC7\xC3O", catchTxt: "catch \xB7 se o try falhar", elseTxt: "else \xB7 sen\xE3o", sol: "s\xF3lida", abs: "abstrata", eternal: "fun\xE7\xE3o (eterna)" };
    const scene = layout(flow, { ...opts.closed ? { closed: opts.closed } : {}, ...opts.elseParallel ? { elseParallel: true } : {} });
    const hide = opts.hideRoot === true && flow.kids.length > 0;
    const off = hide ? 1 : 0;
    const rows = fnRows(scene).slice(off);
    const cw = colW(scene, opts);
    const gutter = planGutter(scene);
    const rootFile = flowFile(flow).replace(/\.[^.]+$/, "");
    const SRC = {
      maquina: { name: L.machine, cls: "maq" },
      ia: { name: L.ai, cls: "ia" },
      pessoa: { name: L.person, cls: "pes" }
    };
    const source = (f, depth, leaf) => {
      if (depth === 0 || !leaf) return { name: rootFile, cls: "arq" };
      if (!f.agent) return { name: L.abstract, cls: "abs" };
      if (f.agent === "arquivo") return { name: rootFile, cls: "arq" };
      if (f.agent.startsWith("obj:")) return { name: f.agent.slice(4), cls: "obj" };
      return SRC[f.agent] ?? { name: f.agent, cls: "maq" };
    };
    const labelOf = (r) => r.kind !== "fn" ? r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : blockText(r.node) : r.node.title;
    const srcW = opts.table ? Math.max(40, ...rows.filter((r) => r.kind === "fn").map((r) => tw(source(r.node, r.depth, r.leaf).name, 6.1) + 54)) : 0;
    const funcX = opts.table ? srcW + 28 : 0;
    const funcW = opts.table ? Math.max(40, ...rows.map((r) => r.depth * 12 + tw(labelOf(r), 6.1))) : 0;
    const TW = opts.table ? Math.ceil(funcX + funcW + 36) : 0;
    const colX = (s) => TW + gutter + G.OX + s * cw;
    const W = colX(scene.nSteps) + 160;
    const base = opts.states !== false ? statesByStep(scene, false) : /* @__PURE__ */ new Map();
    for (const list of base.values()) list.forEach((it, n) => {
      const v = it.value?.trim();
      if (!it.cube && v && v.startsWith("[") && v.endsWith("]") && it.owner) list[n] = { ...localItem(it.name, v, it.owner), side: it.side ?? "in", ...it.old ? { old: true } : {} };
    });
    if (opts.states !== false) for (const r of rows) {
      if (r.kind !== "fn") continue;
      const f = r.node;
      const list = base.get(r.s) ?? [];
      const locals = Object.entries(f.args ?? {}).filter(([k, v]) => !f.ins.includes(k) && !f.outs.includes(k) && v.trim() && !list.some((x) => x.name === k)).map(([k, v]) => localItem(k, v.trim(), f.id));
      if (!locals.length) continue;
      const at = list.findIndex((x) => x.side === "in");
      list.splice(at < 0 ? list.length : at, 0, ...locals);
      base.set(r.s, list);
    }
    for (const r of rows) {
      if (r.kind !== "fn") continue;
      const f = r.node;
      for (const o of f.outs) {
        const v = f.args?.[o]?.trim();
        const list = base.get(r.e + 1), at = v && list ? list.findIndex((x) => x.name === o) : -1;
        if (!v || !list || at < 0) continue;
        if (/^[{[]/.test(v)) list[at] = { ...localItem(o, v, f.id), side: "out" };
        else list[at].value = v;
      }
    }
    const states = /* @__PURE__ */ new Map();
    if (opts.allData === false) base.forEach((v, k) => states.set(k, v));
    else {
      let acc = [];
      for (let c = 0; c <= scene.nSteps; c++) {
        const fresh = base.get(c) ?? [], names = new Set(fresh.map((x) => x.name));
        acc = [...acc.filter((x) => !names.has(x.name)).map((x) => ({ ...x, old: true })), ...fresh];
        if (acc.length) states.set(c, acc);
      }
    }
    const kindOf = (f, depth) => {
      if (depth === 0) return "conc";
      if (f.kids.length) return "conc";
      if (!f.agent) return "nag";
      return f.agent === "ia" || f.agent === "pessoa" ? "abs" : "conc";
    };
    const fnKinds = /* @__PURE__ */ new Map();
    if (opts.states !== false && opts.fnStates !== false) {
      for (const r of rows) if (r.kind === "fn") {
        const f = r.node, k = kindOf(f, r.depth);
        if (!fnKinds.has(f.title) || k === "conc") fnKinds.set(f.title, k);
      }
    }
    const fnNames = [...fnKinds.keys()];
    const stateCols = fnNames.length ? Array.from({ length: scene.nSteps + 1 }, (_, c) => c) : [...states.keys()];
    const maxSt = Math.max(0, ...stateCols.map((c) => fnNames.length + stateRows(states.get(c) ?? [])));
    const H = maxSt > 0 ? rowY(rows.length) + 66 + maxSt * STATE_ROW + 28 : rowY(rows.length) + 80;
    const ym = (i) => rowY(i) + G.RH / 2;
    const txtIn = opts.txtIn !== false;
    const sel = opts.sel ?? null;
    const out = [];
    const bands = [];
    const over = [];
    const CHIP = 8;
    const top = G.HEAD - 18;
    const bot = rowY(rows.length) + 32;
    const chip = (s, y) => `<g class="chip"><rect x="${colX(s) - 12}" y="${y - CHIP}" width="24" height="16" rx="3"/><text x="${colX(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g>`;
    for (let s = 0; s <= scene.nSteps; s++) {
      if (opts.grid !== false) out.push(`<line class="vg" x1="${colX(s)}" y1="${top + CHIP}" x2="${colX(s)}" y2="${bot - CHIP}"/>`);
      if (opts.chips !== false) out.push(chip(s, top), chip(s, bot));
    }
    if (opts.grid !== false) rows.forEach((_, i) => out.push(`<line class="hg" x1="${opts.table ? 0 : gutter}" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
    if (opts.table) {
      out.push(`<text class="th" x="16" y="${top + 3}">${L.source}</text><text class="th" x="${funcX}" y="${top + 3}">${L.func}</text>`);
      rows.forEach((r, i) => {
        const y = ym(i);
        if (r.kind !== "fn") {
          const n = r.node;
          const txt = r.kind === "catch" ? "catch" : r.kind === "else" ? "else" : blockText(n);
          out.push(`<text class="tb mut" x="${funcX + r.depth * 12}" y="${y + 3.5}">${esc(txt)}</text>`);
          return;
        }
        const f = r.node, src = source(f, r.depth, r.leaf);
        out.push(`<circle class="so ${src.cls}" cx="22" cy="${y}" r="4.5"/><text class="tb" x="34" y="${y + 3.5}">${esc(src.name)}</text>`);
        out.push(`<text class="tb" x="${funcX + r.depth * 12}" y="${y + 3.5}">${esc(f.title)}</text>`);
      });
      out.push(`<line class="vg" x1="${funcX - 22}" y1="${top + CHIP}" x2="${funcX - 22}" y2="${rowY(rows.length)}"/>`);
    }
    for (const col of stateCols) {
      const items = states.get(col) ?? [];
      let row = 0;
      for (const nm of fnNames) {
        const y = bot + 34 + row++ * STATE_ROW;
        out.push(`<g class="stt fnst${col > stateCols[0] ? " old" : ""}"><circle class="sfn${fnKinds.get(nm) === "conc" ? "" : " a"}" cx="${colX(col)}" cy="${y}" r="4.5"/><text class="dn st" x="${colX(col) + 9}" y="${y + 3.2}">${esc(dataText([nm], 26))}</text><title>${esc(nm)} \xB7 ${L.eternal} \xB7 ${fnKinds.get(nm) === "conc" ? L.sol : L.abs}</title></g>`);
      }
      for (const it of items) {
        const y = bot + 34 + row++ * STATE_ROW;
        const isFn = !it.cube && /^function\b/.test(it.value ?? "");
        out.push(`<g class="stt${it.old ? " old" : ""}">${isFn ? `<circle class="sfn" cx="${colX(col)}" cy="${y}" r="4.5"/>` : it.cube ? `<path class="scube" transform="translate(${colX(col) - 4.5} ${y - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/>` : `<rect class="sdot${it.abs ? " a" : ""}" x="${colX(col) - 4}" y="${y - 4}" width="8" height="8"/>`}<text class="dn st" x="${colX(col) + 9}" y="${y + 3.2}">${esc(it.cube || isFn ? dataText([it.name], 26) : stateLabel(it.name, it.value, 26))}</text><title>${esc(it.value ?? it.fields.join(", "))}</title></g>`);
        if (it.cube) for (const fld of it.fields) {
          const fy = bot + 34 + row++ * STATE_ROW, fv = it.fieldValues?.[fld];
          out.push(`<g class="stt sub${it.old ? " old" : ""}"><rect class="sdot sm" x="${colX(col) + 8}" y="${fy - 2.5}" width="5" height="5"/><text class="dn st" x="${colX(col) + 18}" y="${fy + 3.2}">${esc(stateLabel(fld, fv, 24))}</text><title>${esc(fv != null ? `${fld} = ${fv}` : fld)}</title></g>`);
        }
      }
    }
    const rail = (depth, y0, h, cls = "co") => {
      if (opts.rails !== true || depth < 0 || h <= 0) return;
      bands.push(`<line class="bande ${cls}" x1="${TW + depth * G.IND + 0.5}" y1="${y0}" x2="${TW + depth * G.IND + 0.5}" y2="${y0 + h}"/>`);
    };
    const byId = new Map(rows.map((r, i) => [r.id, i]));
    rows.forEach((r, i) => {
      const cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : r.kind === "block" ? blockCls(r.node) : "co";
      if (!r.leaf && r.last - off > i) rail(r.depth, rowY(i + 1), (r.last - off - i) * G.RH, cls);
    });
    if (off > 0 && opts.rootRail === true) {
      const root = fnRows(scene)[0];
      if (root && !root.leaf) rail(root.depth, rowY(0), rows.length * G.RH, "co");
    }
    const ioMarks = (f, r, i, x1, x2) => {
      const prod = /* @__PURE__ */ new Set();
      for (const q of rows) if (q.kind === "fn") {
        q.node.outs.forEach((o) => prod.add(o));
        for (const n of q.node.ins) if (q.node.args?.[n]?.trim()) prod.add(n);
      }
      const mark = (x, list, side) => {
        if (!list.length) return "";
        const cube = list.length !== 1 || /^\s*\{/.test(f.args?.[list[0]] ?? "");
        const tip = list.join(", ");
        if (!cube && /^function\b/.test(f.args?.[list[0]] ?? "")) return `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><circle class="dotf" cx="${x}" cy="${ym(i)}" r="4.5"/><title>${esc(tip)}</title></g>`;
        return cube ? `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><path class="cube" transform="translate(${x - 5} ${ym(i) - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/><title>${esc(tip)}</title></g>` : `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><rect class="dot${side === "in" && !f.args?.[list[0]]?.trim() && !prod.has(list[0]) ? " a" : ""}" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><title>${esc(tip)}</title></g>`;
      };
      if (f.ins.length) {
        over.push(`<line class="dlk" x1="${colX(r.s) + 4}" y1="${ym(i)}" x2="${x1}" y2="${ym(i)}"/>`);
        over.push(mark(colX(r.s), f.ins, "in"));
        over.push(`<text class="dn in" x="${colX(r.s) - G.GAP}" y="${ym(i) + 3.5}" text-anchor="end">${esc(f.ins.length > 1 ? f.ins.join(",") : f.ins[0])}</text>`);
      }
      if (f.outs.length) {
        over.push(`<line class="dlk" x1="${x2}" y1="${ym(i)}" x2="${colX(r.e + 1) - 4}" y2="${ym(i)}"/>`);
        over.push(mark(colX(r.e + 1), f.outs, "out"));
        over.push(`<text class="dn out" x="${colX(r.e + 1) + G.GAP}" y="${ym(i) + 3.5}" text-anchor="start">${esc(f.outs.length > 1 ? f.outs.join(",") : f.outs[0])}</text>`);
      }
    };
    rows.forEach((r, i) => {
      if (r.kind !== "fn") {
        const n = r.node;
        const cls = r.kind === "catch" ? "ca" : r.kind === "else" ? "el" : blockCls(n);
        const txt = r.kind === "catch" ? L.catchTxt : r.kind === "else" ? L.elseTxt : blockText(n);
        const cx2 = colX(r.s), cy = ym(i), px = cx2 + 11;
        const w = Math.max(tw(txt) + 12, colX(r.e + 1) - px - 6);
        if (cls === "if") over.push(`<path class="fif" d="M${cx2} ${cy - 7} L${cx2 + 6.5} ${cy + 5} H${cx2 - 6.5} Z"/>`);
        if (cls === "el") over.push(`<path class="fel" d="M${cx2} ${cy + 7} L${cx2 + 6.5} ${cy - 5} H${cx2 - 6.5} Z"/>`);
        if (cls === "lp") over.push(`<text class="flp" x="${cx2}" y="${cy + 3.5}" text-anchor="middle">\u21BB</text>`);
        if (cls === "sw") over.push(`<rect class="fsw" x="${cx2 - 5}" y="${cy - 5}" width="10" height="10" rx="1.5"/>`);
        if (cls === "tr") over.push(`<path class="ftr" d="M${cx2} ${cy - 7}c1.8 0 3.5.9 4.6 2.1v4.2c0 2.8-2 4.4-4.6 5.4-2.6-1-4.6-2.6-4.6-5.4V${cy - 4.9}C${cx2 - 3.5} ${cy - 6.1} ${cx2 - 1.8} ${cy - 7} ${cx2} ${cy - 7}z"/>`);
        if (cls === "ca") over.push(`<path class="fca" d="M${cx2 - 5} ${cy - 5} L${cx2 + 5} ${cy + 5} M${cx2 + 5} ${cy - 5} L${cx2 - 5} ${cy + 5}"/>`);
        const brow = r.kind === "else" ? rows.find((x) => x.kind === "block" && x.node === r.node && x.s === r.s) : void 0;
        let px2 = px, wPill = w;
        if (brow) {
          const ifLeft = colX(brow.s) + 11;
          const ifRight = ifLeft + Math.max(tw(blockText(brow.node)) + 12, colX(brow.e + 1) - ifLeft - 6);
          px2 = ifLeft;
          wPill = Math.max(w, ifRight - ifLeft);
        }
        over.push(`<g class="pill ${cls}"><rect x="${px2}" y="${cy - 8}" width="${wPill}" height="16"/><text x="${px2 + 6}" y="${cy + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
        return;
      }
      const f = r.node;
      const selC = sel === f.id ? " sel" : "";
      if (!r.leaf) {
        const inset = 21;
        const x12 = colX(r.s) + inset;
        const x22 = colX(r.e + 1) - inset;
        over.push(`<g data-id="${esc(f.id)}"><path class="sum${selC}" d="M${x12} ${ym(i) - 3.5}H${x22}V${ym(i) + 7.5}L${x22 - 5} ${ym(i) + 3.5}H${x12 + 5}L${x12} ${ym(i) + 7.5}Z"/><title>${esc(f.title)} \xB7 composition</title></g>`);
        ioMarks(f, r, i, x12, x22);
        over.push(`<text class="lbl" x="${(x12 + x22) / 2}" y="${ym(i) - 10}" text-anchor="middle">${esc(f.title)}</text>`);
        return;
      }
      const k = kindOf(f, r.depth);
      const hasText = txtIn && f.title.trim() !== "";
      const cx = (colX(r.s) + colX(r.e + 1)) / 2;
      const x1 = hasText ? colX(r.s) + G.INS : cx - G.BH / 2;
      const x2 = hasText ? colX(r.e + 1) - G.INS : cx + G.BH / 2;
      over.push(`<g data-id="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${hasText ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle">${esc(f.title)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
      ioMarks(f, r, i, x1, x2);
      if (!hasText) over.push(`<text class="lbl" x="${colX(r.e + 1) + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
      if (hasText && opts.fnIcon) over.push(`<circle class="fic" cx="${x1 + 11}" cy="${ym(i)}" r="4"/>`);
      if (opts.agentLabels === true && f.agent && f.agent !== "arquivo") over.push(`<text class="ag" x="${x1}" y="${ym(i) - G.BH / 2 - 3}" >${esc(f.agent)}</text>`);
      if (opts.parMark === true && f.par) over.push(`<text class="par" x="${x2 + 6}" y="${ym(i) + 3.5}">\u2225</text>`);
      void byId;
    });
    const style = `<style>
.vg,.hg,.axis{stroke:var(--line,#e7e3db);stroke-width:1}
.chip rect{fill:var(--paper-2,#f4f1ea);stroke:var(--line,#e7e3db)}
.chip text{font:600 9px ui-monospace,Menlo,monospace;fill:var(--ink,#14120f)}
.bande.co{stroke:var(--fn,#dc2626);stroke-width:2}
.fn{fill:var(--fn,#dc2626)}.fn.abs,.fn.nag{fill:transparent;stroke:var(--fn,#dc2626);stroke-width:1.5}
.fn.sel,.sum.sel{stroke:var(--ink,#14120f);stroke-width:2.5}
.fbt{font:600 10px ui-monospace,Menlo,monospace;fill:#fff}.fbt.abs,.fbt.nag{fill:#fff}
.sum{fill:var(--fn,#dc2626)}
.lbl,.dn{font:500 10px ui-monospace,Menlo,monospace;fill:var(--ink,#14120f)}
.dlk{stroke:#9a9a9a;stroke-width:1}
.dot{fill:var(--dado,#2563eb);stroke:var(--dado,#2563eb)}.dot.a{fill:var(--paper,#fff);stroke-width:1.5}.cube{fill:var(--dado,#2563eb);stroke:var(--ink,#14120f);stroke-width:.6}
.bande.if,.bande.el,.bande.sw{stroke:#d97706;stroke-width:2}.bande.lp{stroke:#7c3aed;stroke-width:2}.bande.tr{stroke:#16a34a;stroke-width:2}.bande.ca{stroke:#dc2626;stroke-width:2}
.fif,.fel{fill:var(--paper,#fff);stroke:#d97706;stroke-width:1.5}.fsw{fill:var(--paper,#fff);stroke:#d97706;stroke-width:1.5}.fca{fill:none;stroke:#dc2626;stroke-width:1.6;stroke-linecap:round}.flp{fill:#7c3aed;font:700 11px ui-monospace,Menlo,monospace}.ftr{fill:var(--paper,#fff);stroke:#16a34a;stroke-width:1.4}
.pill text{font:600 9px ui-monospace,Menlo,monospace}
.pill.if rect{fill:color-mix(in srgb,#d97706 20%,var(--paper,#fff))}.pill.if text{fill:#d97706}.pill.el rect{fill:color-mix(in srgb,#d97706 12%,var(--paper,#fff))}.pill.el text{fill:#d97706}
.pill.sw rect{fill:color-mix(in srgb,#d97706 20%,var(--paper,#fff))}.pill.sw text{fill:#d97706}
.pill.lp rect{fill:color-mix(in srgb,#8b5cf6 20%,var(--paper,#fff))}.pill.lp text{fill:#8b5cf6}.pill.tr rect{fill:color-mix(in srgb,#22c55e 20%,var(--paper,#fff))}.pill.tr text{fill:#22c55e}.pill.ca rect{fill:color-mix(in srgb,#ef4444 20%,var(--paper,#fff))}.pill.ca text{fill:#ef4444}
.ag{font:600 8px ui-monospace,Menlo,monospace;fill:#9a9a9a;text-transform:uppercase;letter-spacing:.04em}
.dotf{fill:var(--fn,#dc2626);stroke:var(--fn,#dc2626);stroke-width:1.5}
.sfn{fill:var(--fn,#dc2626);stroke:var(--fn,#dc2626);stroke-width:1.5}.sfn.a{fill:var(--paper,#fff)}
.sdot{fill:var(--dado,#2563eb);stroke:var(--dado,#2563eb);stroke-width:1.3}.sdot.a{fill:var(--paper,#fff)}.scube{fill:var(--dado,#2563eb);stroke:var(--paper,#fff);stroke-width:.9;stroke-linejoin:round}.stt{opacity:1}.stt.old{opacity:.38}.dn.st{fill:var(--body,#44423d)}.stt:not(.old) .dn.st{fill:var(--ink,#14120f);font-weight:600}
.fic{fill:#fff;opacity:.9;pointer-events:none}
.th{font:700 8px ui-monospace,Menlo,monospace;letter-spacing:.08em;fill:var(--body,#44423d)}.tb{font:500 10px ui-monospace,Menlo,monospace;fill:var(--ink,#14120f)}.tb.mut{fill:var(--body,#44423d)}
.so{stroke-width:1.5}.so.arq{fill:var(--body,#44423d);stroke:var(--body,#44423d)}.so.maq{fill:#22c55e;stroke:#22c55e}.so.obj{fill:#f59e0b;stroke:#f59e0b}.so.ia{fill:var(--paper,#fff);stroke:#a855f7}.so.pes{fill:var(--paper,#fff);stroke:#3b82f6}.so.abs{fill:var(--paper,#fff);stroke:var(--body,#44423d);stroke-dasharray:2 2}
.par{font:600 11px ui-monospace,Menlo,monospace;fill:var(--body,#44423d)}
</style>`;
    const svg = `<svg class="plan fn-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano ${esc(flow.title)}">${style}<g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
    return { svg, scene, width: W, height: H };
  }
  function localItem(name, value, owner) {
    const pairs = objectPairs(value);
    if (pairs) {
      const fieldValues = Object.fromEntries(pairs.filter((p) => p.value != null).map((p) => [p.name, p.value]));
      return { name, cube: true, fields: pairs.map((p) => p.name), value, fieldValues, owner, side: "in" };
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      const parts = [];
      let depth = 0, cur = "";
      for (const ch of value.slice(1, -1)) {
        if ("{[(".includes(ch)) depth++;
        else if ("}])".includes(ch)) depth--;
        if (ch === "," && depth === 0) {
          parts.push(cur);
          cur = "";
        } else cur += ch;
      }
      parts.push(cur);
      const vals = parts.map((x) => x.trim()).filter(Boolean);
      return { name, cube: true, fields: vals.map((_, i) => `[${i}]`), value, fieldValues: Object.fromEntries(vals.map((v, i) => [`[${i}]`, v])), owner, side: "in" };
    }
    return { name, cube: false, fields: [name], value, owner, side: "in" };
  }
  var fnAstToSvg = (flow, opts) => renderFnSvg(flow, opts).svg;
  return __toCommonJS(fn_svg_exports);
})();
