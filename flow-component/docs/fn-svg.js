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
      const placeAlt = (b, alt, after, emitAlt, blockClosed) => {
        const kind = b.t === "try" ? "catch" : "else", altKey = `${b.id}:${kind}`, altClosed = closed.has(altKey);
        if (blockClosed) return place(alt, depth + 1, after, false, true);
        const crow = push({ kind, id: b.id, node: b, depth, s: after, e: after, leaf: false, closed: altClosed });
        const cend = place(alt, depth + 1, after, emitAlt && !altClosed, true);
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
          prev = null;
          const b = n2;
          const alt = altKids(b), canClose = b.kids.length > 0 || !!(alt && alt.length), isClosed = canClose && closed.has(b.id);
          const row = push({ kind: "block", id: b.id, node: b, depth, s: step, e: step, leaf: !canClose, closed: isClosed });
          const next = place(b.kids, depth + 1, step, emit && !isClosed, inAlt), sp = { s: step, e: Math.max(step, next - 1) };
          if (emit) {
            span.set(b.id, sp);
            row.s = sp.s;
            row.e = sp.e;
          }
          let end = next;
          if (alt && alt.length) end = placeAlt(b, alt, next, emit, isClosed);
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

  // novo/ast/fn-svg.ts
  var G = { RH: 34, HEAD: 52, OX: 120, W: 160, INS: 40, BH: 22, IND: 14, GAP: 16, WS: 100 };
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var tw = (t, px = 6.1) => Math.ceil(t.length * px);
  var rowY = (i) => G.HEAD + i * G.RH;
  var planGutter = (sc) => (sc.maxDepth + 1) * G.IND;
  function fnRows(sc) {
    return sc.rows.filter((r) => r.kind === "fn");
  }
  var PAD = 12;
  function colW(sc, opts) {
    const leaves = fnRows(sc).filter((r) => r.leaf);
    const txt = opts.txtIn !== false;
    const fromTitle = txt && leaves.length ? Math.max(...leaves.map((l) => tw(l.node.title, 6.2) + 2 * PAD + 2 * G.INS)) : G.WS;
    return Math.max(opts.minW ?? 0, txt ? Math.max(G.W, fromTitle) : G.WS);
  }
  function assertFnsOnly(n) {
    if (n.t !== "fn") throw new Error(`fn-svg: esperado t:"fn", recebeu t:"${n.t}"`);
    for (const k of n.kids) assertFnsOnly(k);
  }
  function renderFnSvg(flow, opts = {}) {
    assertFnsOnly(flow);
    const scene = layout(flow, { closed: opts.closed });
    const rows = fnRows(scene);
    const cw = colW(scene, opts);
    const gutter = planGutter(scene);
    const colX = (s) => gutter + G.OX + s * cw;
    const W = colX(scene.nSteps) + 160;
    const H = rowY(rows.length) + 80;
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
      out.push(`<line class="vg" x1="${colX(s)}" y1="${top + CHIP}" x2="${colX(s)}" y2="${bot - CHIP}"/>`);
      out.push(chip(s, top), chip(s, bot));
    }
    rows.forEach((_, i) => out.push(`<line class="hg" x1="${gutter}" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
    out.push(`<line class="axis" x1="${colX(0)}" y1="${rowY(rows.length) + 4}" x2="${colX(scene.nSteps)}" y2="${rowY(rows.length) + 4}"/>`);
    const rail = (depth, y0, h) => {
      if (depth < 0 || h <= 0) return;
      bands.push(`<line class="bande co" x1="${depth * G.IND + 0.5}" y1="${y0}" x2="${depth * G.IND + 0.5}" y2="${y0 + h}"/>`);
    };
    const byId = new Map(rows.map((r, i) => [r.id, i]));
    rows.forEach((r, i) => {
      if (r.leaf) rail(r.depth, rowY(i), G.RH);
      else if (r.last > 0) {
        const childIs = rows.map((x, j) => x.id !== r.id && scene.span.get(x.id) && x.depth > r.depth ? j : -1).filter((j) => j > i);
        const lastVis = childIs.length ? Math.max(...childIs) : i;
        if (lastVis > i) rail(r.depth, rowY(i + 1), (lastVis - i) * G.RH);
      }
    });
    const kindOf = (f) => {
      if (f.kids.length) return "conc";
      if (!f.agent) return "nag";
      return "conc";
    };
    const ioMarks = (f, r, i, x1, x2) => {
      const mark = (x, list, side) => {
        if (!list.length) return "";
        const cube = list.length !== 1;
        const tip = list.join(", ");
        return cube ? `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><path class="cube" transform="translate(${x - 5} ${ym(i) - 5.5})" d="M5 .5 L9.5 3 L9.5 8 L5 10.5 L.5 8 L.5 3 Z M.5 3 L5 5.5 L9.5 3 M5 5.5 V10.5"/><title>${esc(tip)}</title></g>` : `<g class="dm" data-id="${esc(f.id)}" data-side="${side}"><rect class="dot" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><title>${esc(tip)}</title></g>`;
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
      const f = r.node;
      const selC = sel === f.id ? " sel" : "";
      if (!r.leaf) {
        const inset = 21;
        const x12 = colX(r.s) + inset;
        const x22 = colX(r.e + 1) - inset;
        over.push(`<g data-id="${esc(f.id)}"><path class="sum${selC}" d="M${x12} ${ym(i) - 3.5}H${x22}V${ym(i) + 7.5}L${x22 - 5} ${ym(i) + 3.5}H${x12 + 5}L${x12} ${ym(i) + 7.5}Z"/><title>${esc(f.title)} \xB7 composition</title></g>`);
        ioMarks(f, r, i, x12, x22);
        if (i === 0) over.push(`<text class="lbl" x="${(x12 + x22) / 2}" y="${ym(i) - 22}" text-anchor="middle">${esc(f.title)}</text>`);
        else over.push(`<text class="lbl" x="${colX(r.e + 1) + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
        return;
      }
      const k = kindOf(f);
      const hasText = txtIn && f.title.trim() !== "";
      const cx = (colX(r.s) + colX(r.e + 1)) / 2;
      const x1 = hasText ? colX(r.s) + G.INS : cx - G.BH / 2;
      const x2 = hasText ? colX(r.e + 1) - G.INS : cx + G.BH / 2;
      over.push(`<g data-id="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${hasText ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle">${esc(f.title)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
      ioMarks(f, r, i, x1, x2);
      if (!hasText) over.push(`<text class="lbl" x="${colX(r.e + 1) + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
      if (f.par) over.push(`<text class="par" x="${x2 + 6}" y="${ym(i) + 3.5}">\u2225</text>`);
      void byId;
    });
    const style = `<style>
.vg,.hg,.axis{stroke:#e7e3db;stroke-width:1}
.chip rect{fill:#f4f1ea;stroke:#e7e3db}
.chip text{font:600 9px ui-monospace,Menlo,monospace;fill:#14120f}
.bande.co{stroke:#2563eb;stroke-width:2}
.fn{fill:#2563eb}.fn.abs{fill:#dbeafe;stroke:#2563eb;stroke-width:1.5}.fn.nag{fill:transparent;stroke:#2563eb;stroke-width:1.5}
.fn.sel,.sum.sel{stroke:#14120f;stroke-width:2.5}
.fbt{font:600 10px ui-monospace,Menlo,monospace;fill:#fff}.fbt.abs,.fbt.nag{fill:#2563eb}
.sum{fill:#2563eb}
.lbl,.dn{font:500 10px ui-monospace,Menlo,monospace;fill:#14120f}
.dlk{stroke:#9a9a9a;stroke-width:1}
.dot{fill:#dc2626;stroke:#dc2626}.cube{fill:#dc2626;stroke:#14120f;stroke-width:.6}
.par{font:600 11px ui-monospace,Menlo,monospace;fill:#44423d}
</style>`;
    const svg = `<svg class="plan fn-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano ${esc(flow.title)}">${style}<g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
    return { svg, scene, width: W, height: H };
  }
  var fnAstToSvg = (flow, opts) => renderFnSvg(flow, opts).svg;
  return __toCommonJS(fn_svg_exports);
})();
