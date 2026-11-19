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
        const sub = n.t === "try" ? visit(n.kids, n, "kids", flow) ?? visit(n.catchKids, n, "catch", flow) : visit(n.kids, n, "kids", flow);
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
  var need = (p, id) => locate(p, id) ?? fail("not_found", `Elemento ${id} n\xE3o existe`);
  var isRoot = (p, id) => p.flows.some((f) => f.id === id);
  var agentOf = (p, id) => id ? p.agents.find((a) => a.id === id) : void 0;
  var isComposite = (n) => n.kids.length > 0;
  var insideBlock = (p, id) => {
    const l = locate(p, id);
    return !!l && !!l.parent && l.parent.t !== "fn";
  };
  var kidsOf = (n) => n.t === "try" ? [...n.kids, ...n.catchKids] : n.kids;
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
  var slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "fluxo";
  var flowFile = (f) => `${slug(f.title)}.ts`;
  var nextId = (p) => `n${++p.seq}`;
  var newFn = (p, title = "Fazer nova fun\xE7\xE3o") => ({ t: "fn", id: nextId(p), title, agent: null, resp: null, ins: [], outs: [], kids: [], par: false });
  var ident = /^[A-Za-z_][A-Za-z0-9_]*$/;
  var cleanName = (s, what) => {
    const v = String(s ?? "").trim();
    return ident.test(v) ? v : fail("invalid", `${what} inv\xE1lido: use letras, n\xFAmeros e _ (ex.: dados_cliente)`);
  };
  var cleanText = (s, what, max = 120) => {
    const v = String(s ?? "").trim();
    return v && v.length <= max ? v : fail("invalid", `${what} n\xE3o pode ser vazio`);
  };
  function emptyProject(name = "Novo projeto") {
    return { name, flows: [], agents: [], seq: 0 };
  }
  var DEFAULT_AGENTS = [
    { id: "http", kind: "maquina", name: "node:http", tasks: ["get", "post", "request", "createServer", "put", "patch", "delete", "head"] },
    { id: "fs", kind: "maquina", name: "node:fs", tasks: ["readFile", "writeFile", "readdir", "mkdir", "rm", "stat"] },
    { id: "lia", kind: "ia", name: "Lia", tasks: [] },
    { id: "teo", kind: "ia", name: "Teo", tasks: [] },
    { id: "davi", kind: "ia", name: "Davi", tasks: [] },
    { id: "ana", kind: "pessoa", name: "Ana Souza", tasks: [] },
    { id: "bruno", kind: "pessoa", name: "Bruno Lima", tasks: [] }
  ];
  var str = (a, k) => String(a[k] ?? "");
  function prune(list) {
    for (let i = list.length - 1; i >= 0; i--) {
      const n = list[i];
      if (n.t !== "fn") {
        prune(n.kids);
        if (n.t === "try") prune(n.catchKids);
      } else prune(n.kids);
      if (n.t !== "fn" && n.kids.length === 0) list.splice(i, 1);
    }
  }
  var fixRefs = (p) => {
    const alive = /* @__PURE__ */ new Set();
    for (const f of p.flows) {
      alive.add(f.id);
      walk(f.kids, (n) => alive.add(n.id));
    }
    for (const f of p.flows) walk(f.kids, (n) => {
      if (n.t === "if" && n.elseTo && !alive.has(n.elseTo)) n.elseTo = null;
    });
  };
  function blockOf(kind, p, a, inner) {
    const id = nextId(p);
    if (kind === "if") return { t: "if", id, test: a["test"] ? cleanText(a["test"], "Condi\xE7\xE3o") : "condicao", elseTo: null, kids: [inner] };
    if (kind === "for") return { t: "for", id, v: a["v"] ? cleanName(a["v"], "Vari\xE1vel") : "item", coll: a["coll"] ? cleanText(a["coll"], "Cole\xE7\xE3o") : "itens", kids: [inner] };
    return { t: "try", id, kids: [inner], catchKids: [newFn(p, "Tratar erro")] };
  }
  var HANDLERS = {
    /** Novo fluxo (função raiz). */
    newFlow: (p, a) => {
      const f = newFn(p, a["title"] ? cleanText(a["title"], "T\xEDtulo", 80) : "Fazer novo fluxo");
      p.flows.push(f);
      return f.id;
    },
    rename: (p, a) => {
      const l = need(p, str(a, "id"));
      if (l.node.t !== "fn") return fail("invalid", "S\xF3 fun\xE7\xF5es t\xEAm nome");
      l.node.title = cleanText(a["title"], "Nome", 80);
    },
    /** Filho: função → no fim da lista dela; bloco → na PRIMEIRA posição (o lugar do cabeçalho); `catch` → primeira posição do catch. */
    addChild: (p, a) => {
      const l = need(p, str(a, "id")), n = l.node, f = newFn(p, a["title"] ? cleanText(a["title"], "Nome", 80) : void 0);
      if (n.t === "fn") n.kids.push(f);
      else if (n.t === "try" && a["catch"]) n.catchKids.unshift(f);
      else n.kids.unshift(f);
      return f.id;
    },
    /** Irmão: entra na lista de quem o recebe (dentro do bloco, se for o caso). Num bloco = irmão à direita, fora dele. */
    addSibling: (p, a) => {
      const l = need(p, str(a, "id"));
      if (isRoot(p, l.node.id)) return fail("root", "A raiz do fluxo n\xE3o ganha irm\xE3o");
      const f = newFn(p, a["title"] ? cleanText(a["title"], "Nome", 80) : void 0);
      l.list.splice(l.index + (a["before"] ? 0 : 1), 0, f);
      return f.id;
    },
    remove: (p, a) => {
      const l = need(p, str(a, "id"));
      if (isRoot(p, l.node.id)) return fail("root", "A raiz do fluxo n\xE3o pode ser removida");
      l.list.splice(l.index, 1);
      for (const f of p.flows) prune(f.kids);
      fixRefs(p);
    },
    /** Cerca a função (ou o bloco) com um if / for / try. A raiz não aceita. */
    wrap: (p, a) => {
      const l = need(p, str(a, "id")), kind = str(a, "kind");
      if (!["if", "for", "try"].includes(kind)) return fail("invalid", `Bloco desconhecido: ${kind}`);
      if (isRoot(p, l.node.id)) return fail("root", `O fluxo raiz n\xE3o aceita ${kind}`);
      const b = blockOf(kind, p, a, l.node);
      l.list.splice(l.index, 1, b);
      return b.id;
    },
    /** Remove o bloco e devolve os filhos à lista de fora (no try, o catch some). */
    unwrap: (p, a) => {
      const l = need(p, str(a, "id"));
      if (l.node.t === "fn") return fail("invalid", "S\xF3 blocos podem ser desfeitos");
      l.list.splice(l.index, 1, ...l.node.kids);
      fixRefs(p);
    },
    /** Sair do escopo: o item e os seguintes saem do bloco e ficam logo depois dele. */
    exitScope: (p, a) => {
      const l = need(p, str(a, "id"));
      if (!l.parent || l.parent.t === "fn") return fail("invalid", "Esta fun\xE7\xE3o n\xE3o est\xE1 dentro de um bloco");
      const block = l.parent, outer = need(p, block.id), moved = l.list.splice(l.index);
      outer.list.splice(outer.index + 1, 0, ...moved);
      for (const f of p.flows) prune(f.kids);
      fixRefs(p);
    },
    /** Tamanho do bloco: aumentar adota os irmãos seguintes; diminuir devolve os últimos para fora. */
    setScope: (p, a) => {
      const l = need(p, str(a, "id")), b = l.node;
      if (b.t === "fn") return fail("invalid", "S\xF3 blocos t\xEAm escopo");
      const target = Math.max(1, Math.floor(Number(a["count"])) || 1);
      if (target > b.kids.length) b.kids.push(...l.list.splice(l.index + 1, target - b.kids.length));
      else if (target < b.kids.length) l.list.splice(l.index + 1, 0, ...b.kids.splice(target));
    },
    setFor: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "for") return fail("invalid", "N\xE3o \xE9 um for");
      n.v = cleanName(a["v"], "Vari\xE1vel");
      n.coll = cleanText(a["coll"], "Cole\xE7\xE3o");
    },
    setIf: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "if") return fail("invalid", "N\xE3o \xE9 um if");
      n.test = cleanText(a["test"], "Condi\xE7\xE3o");
      const to = a["elseTo"] ? need(p, str(a, "elseTo")).node : null;
      if (to && to.t !== "fn") return fail("invalid", "O sen\xE3o volta para uma fun\xE7\xE3o");
      n.elseTo = to ? to.id : null;
    },
    addInput: (p, a) => io(p, a, "ins", true),
    removeInput: (p, a) => io(p, a, "ins", false),
    addOutput: (p, a) => io(p, a, "outs", true),
    removeOutput: (p, a) => io(p, a, "outs", false),
    /** Responsável: lib (concreta), pessoa ou IA (abstrata). Concreta força uma task do catálogo. */
    assign: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "S\xF3 fun\xE7\xF5es t\xEAm respons\xE1vel");
      const ag = a["agent"] ? agentOf(p, str(a, "agent")) ?? fail("not_found", `Respons\xE1vel ${str(a, "agent")} n\xE3o existe`) : void 0;
      n.agent = ag?.id ?? null;
      if (ag?.kind !== "ia") n.resp = null;
      if (ag?.kind === "maquina" && !ag.tasks.includes(n.title)) n.title = ag.tasks[0] ?? n.title;
    },
    setTask: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "S\xF3 fun\xE7\xF5es t\xEAm task");
      const ag = agentOf(p, n.agent), t = cleanText(a["task"], "Task", 80);
      if (ag?.kind === "maquina" && !ag.tasks.includes(t)) return fail("invalid", `Task "${t}" n\xE3o existe em ${ag.name}`);
      n.title = t;
    },
    /** Pessoa responsável por uma função de IA. */
    setResp: (p, a) => {
      const n = need(p, str(a, "id")).node;
      if (n.t !== "fn") return fail("invalid", "S\xF3 fun\xE7\xF5es t\xEAm respons\xE1vel");
      const ag = a["resp"] ? agentOf(p, str(a, "resp")) : void 0;
      if (a["resp"] && ag?.kind !== "pessoa") return fail("invalid", "O respons\xE1vel da IA \xE9 uma pessoa");
      n.resp = ag?.id ?? null;
    },
    /** Executa junto da função anterior (mesmo passo). */
    setParallel: (p, a) => {
      const l = need(p, str(a, "id"));
      if (l.node.t !== "fn") return fail("invalid", "S\xF3 fun\xE7\xF5es rodam em paralelo");
      if (a["on"] && !(l.list[l.index - 1]?.t === "fn")) return fail("invalid", "N\xE3o h\xE1 fun\xE7\xE3o anterior para rodar junto");
      l.node.par = !!a["on"];
    }
  };
  function io(p, a, key, add) {
    const n = need(p, str(a, "id")).node;
    if (n.t !== "fn") return fail("invalid", "S\xF3 fun\xE7\xF5es t\xEAm entradas e sa\xEDdas");
    const name = cleanName(a["name"], "Nome do dado");
    if (add) {
      if (!n[key].includes(name)) n[key].push(name);
    } else n[key] = n[key].filter((x) => x !== name);
  }
  var COMMAND_NAMES = Object.keys(HANDLERS);
  function apply(p, cmd) {
    const h = HANDLERS[cmd.type];
    if (!h) throw new FlowError("invalid", `Comando desconhecido: ${String(cmd.type)}`);
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

  // novo/codegen.ts
  var camel = (s) => {
    const w = s.normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^A-Za-z0-9]+/).filter(Boolean);
    const j = w.map((x, i) => i === 0 ? x.charAt(0).toLowerCase() + x.slice(1) : x.charAt(0).toUpperCase() + x.slice(1)).join("");
    return /^[0-9]/.test(j) ? `_${j}` : j || "fluxo";
  };
  function generate(p, rootId) {
    const loc = locate(p, rootId), flow = loc?.node.t === "fn" ? loc.node : null;
    if (!flow) throw new Error(`Fluxo ${rootId} n\xE3o existe`);
    const fns = flow.kids.length ? fnsOf(flow) : [flow];
    const used = /* @__PURE__ */ new Map(), names = /* @__PURE__ */ new Map();
    for (const f of fns) {
      const base = camel(f.title), n = (used.get(base) ?? 0) + 1;
      used.set(base, n);
      names.set(f.id, n === 1 ? base : `${base}${n}`);
    }
    const nameOf = (f) => names.get(f.id) ?? camel(f.title);
    const kindOf = (f) => {
      const a = agentOf(p, f.agent);
      return a?.kind === "maquina" ? "lib" : a?.kind === "pessoa" ? "pessoa" : "abs";
    };
    const libVar = (n) => n.replace(/[^A-Za-z0-9_]/g, "_");
    const produced = [...new Set(fns.flatMap((f) => f.outs))];
    const needed = [...new Set(fns.flatMap((f) => f.ins))].filter((i) => !produced.includes(i));
    const abstract = fns.filter((f) => kindOf(f) === "abs").map(nameOf);
    const libs = [...new Set(fns.filter((f) => kindOf(f) === "lib").map((f) => agentOf(p, f.agent).name))];
    const hasHumans = fns.some((f) => kindOf(f) === "pessoa");
    const lines = [], map = {};
    const emit = (s) => {
      lines.push(s);
    };
    const mark = (id, a) => {
      map[id] = [a, lines.length];
    };
    const callOf = (f, scope, err) => {
      const ins = f.ins.filter((i) => produced.includes(i) || scope.includes(i));
      const args = `{ ...state${[.../* @__PURE__ */ new Set([...scope.filter((v) => !ins.includes(v)), ...ins])].map((v) => `, ${v}`).join("")}${err ? ", error" : ""} }`;
      const k = kindOf(f), a = agentOf(p, f.agent);
      return k === "lib" ? `${libVar(a.name)}.${f.title}(${args})` : k === "pessoa" ? `humans.ask(${JSON.stringify(a.name)}, ${JSON.stringify(f.title)}, ${args})` : `${nameOf(f)}(${args})`;
    };
    const assign = (f, expr) => f.outs.length ? `({ ${f.outs.join(", ")} } = await ${expr});` : `await ${expr};`;
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
          emit(`${ind}const par${a} = await Promise.all([  // paralelo`);
          group.forEach((g) => emit(`${ind}  ${callOf(g, scope, err)},`));
          emit(`${ind}]);`);
          group.forEach((g, k) => {
            if (g.outs.length) emit(`${ind}({ ${g.outs.join(", ")} } = par${a}[${k}] as State);`);
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
          const back = n.elseTo ? fnsOf(flow).find((f) => f.id === n.elseTo) ?? (flow.id === n.elseTo ? flow : void 0) : void 0;
          if (back) {
            emit(`${ind}} else {`);
            emit(`${ind}  return ${callOf(back, scope, err)};  // sen\xE3o \u2192 ${back.title}`);
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
    emit(`// Gerado por Flow \xB7 fluxo ${JSON.stringify(flow.title)}`);
    for (const l of libs) emit(`import * as ${libVar(l)} from ${JSON.stringify(l)};`);
    if (hasHumans) emit('import { humans } from "@flow/runtime";');
    if (lines.length > 1) emit("");
    emit("type State = Record<string, unknown>;");
    if (abstract.length) emit("type Fn = (state: State) => Promise<State>;");
    emit("");
    emit(`/** ${flow.title} \xB7 ${flowFile(flow)} */`);
    emit(`export async function ${camel(flow.title)}(state: State): Promise<State> {`);
    const startBody = lines.length + 1;
    if (needed.length) emit(`  // entradas esperadas (de outra camada): ${needed.join(", ")}`);
    if (abstract.length) emit(`  const { ${abstract.join(", ")} } = state as Record<string, Fn>;  // fun\xE7\xF5es abstratas: v\xEAm do state`);
    if (produced.length) emit(`  let ${produced.map((o) => `${o}: unknown`).join(", ")};`);
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
    emit(`// execu\xE7\xE3o: await ${camel(flow.title)}({ ${needed.join(", ")}${needed.length ? " " : ""}});`);
    void isComposite;
    void walk;
    return { code: lines.join("\n") + "\n", map, fileName: flowFile(flow), name: camel(flow.title) };
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
            if (n2.ins.length || n2.outs.length) {
              const io2 = push({ kind: "io", id: n2.id, node: n2, depth, s, e: s, leaf: false, closed: false, ins: n2.ins, outs: n2.outs });
              if (emit) {
                io2.last = rows.length - 1;
                row.last = rows.length - 1;
              }
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
          if (b.t === "try") {
            const count = place(b.catchKids, depth + 1, 0, false, true), cs = Math.max(step, next - count);
            const crow = push({ kind: "catch", id: b.id, node: b, depth, s: cs, e: cs, leaf: false, closed: false });
            const cend = place(b.catchKids, depth + 1, cs, emit, true);
            if (emit) {
              crow.s = cs;
              crow.e = Math.max(cs, cend - 1);
              span.set(`${b.id}:catch`, { s: crow.s, e: crow.e });
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
      if (flow.ins.length || flow.outs.length) rows.push({ kind: "io", id: flow.id, node: flow, depth: 0, s: 0, e: 0, last: 1, leaf: false, closed: false, ins: flow.ins, outs: flow.outs });
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
  function links(scene) {
    const out = [];
    scene.leaves.forEach((b, i) => {
      for (const a of scene.leaves.slice(0, i)) if (a.e === b.s - 1) out.push([a, b]);
    });
    return out;
  }

  // novo/view.ts
  var G = { RH: 34, HEAD: 52, OX: 40, W: 130, INS: 28, BH: 22, IND: 14 };
  var esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  var tw = (t, px = 6.1) => Math.ceil(t.length * px);
  var colX = (s) => G.OX + s * G.W;
  var rowY = (i) => G.HEAD + i * G.RH;
  var planWidth = (sc) => colX(sc.nSteps) + 160;
  var planHeight = (sc) => rowY(sc.rows.length) + 64;
  var tableWidth = (sc) => 520 + sc.maxDepth * G.IND * 2;
  function toolsFor(p, id, part = "main") {
    const l = locate(p, id);
    if (!l) return [];
    const n = l.node, root = isRoot(p, id), t = (act, ic, title, extra = {}) => ({ act, id, icon: ic, title, ...extra });
    if (n.t === "fn") {
      const out2 = [];
      if (n.kids.length) out2.push(t("toggle", "chevron", "Abrir / fechar filhos"));
      out2.push(t("addChild", "sibling", "Adicionar filho (dentro desta fun\xE7\xE3o)"));
      if (!root) {
        out2.push(t("addSibling", "child", "Adicionar irm\xE3o (ao lado, no mesmo bloco)"), t("wrap", "diamond", "Adicionar sele\xE7\xE3o (if)", { data: { kind: "if" } }), t("wrap", "repeat", "Adicionar repeti\xE7\xE3o (for)", { data: { kind: "for" } }), t("wrap", "shield", "Adicionar try/catch", { data: { kind: "try" } }));
        if (l.list[l.index - 1]?.t === "fn") out2.push(t("parallel", "parallel", n.par ? "Rodar em sequ\xEAncia" : "Rodar junto da anterior", { data: { on: String(!n.par) } }));
        if (insideBlock(p, id)) out2.push(t("exitScope", "log-out", "Sair do bloco (esta e as seguintes)"));
        out2.push(t("remove", "trash", "Remover", { danger: true }));
      }
      return out2;
    }
    const where = n.t === "for" ? "for" : n.t === "if" ? "if" : part === "catch" ? "catch" : "try";
    const out = [t("addChild", "sibling", `Adicionar filho (dentro do ${where})`, part === "catch" ? { data: { catch: "1" } } : {})];
    if (part === "main") out.push(t("wrap", "diamond", "Adicionar condi\xE7\xE3o (if) neste bloco", { data: { kind: "if" } }));
    out.push(t("addSibling", "child", "Adicionar irm\xE3o \xE0 direita (fora do bloco)"));
    if (part === "main") out.push(t("setScope", "grow", "Incluir a pr\xF3xima no bloco", { data: { delta: "1" } }), t("setScope", "shrink", "Tirar a \xFAltima do bloco", { data: { delta: "-1" } }));
    out.push(t("unwrap", n.t === "for" ? "repeat" : n.t === "if" ? "diamond" : "shield", `Remover ${n.t === "try" ? "try/catch" : n.t === "for" ? "repeti\xE7\xE3o (for)" : "sele\xE7\xE3o (if)"}`, { danger: true }));
    return out;
  }
  var toolsHtml = (tools) => tools.map((x) => `<button type="button" class="ib${x.danger ? " danger" : ""}" data-act="${x.act}" data-id="${esc(x.id)}" ${Object.entries(x.data ?? {}).map(([k, v]) => `data-${k}="${esc(v)}"`).join(" ")} title="${esc(x.title)}" aria-label="${esc(x.title)}">${icon(x.icon)}</button>`).join("");
  var blockLabel = (p, n) => {
    if (n.t === "if") {
      const to = n.elseTo ? locate(p, n.elseTo)?.node : null;
      return `if (${n.test})${to && to.t === "fn" ? ` \xB7 sen\xE3o \u2192 ${to.title}` : ""}`;
    }
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
      return list.length ? `<optgroup label="${{ maquina: "Libs Node.js", pessoa: "Pessoas", ia: "Agentes de IA" }[k]}">${list.map((a) => `<option value="${a.id}"${cur?.id === a.id ? " selected" : ""}>${esc(a.name)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    return `<select data-change="${kind === "agent" ? "assign" : "setResp"}" data-id="${esc(f.id)}" aria-label="Respons\xE1vel de ${esc(f.title)}"><option value="">${cur ? "Sem respons\xE1vel" : "Escolher respons\xE1vel"}</option>${groups}</select>`;
  }
  function respCell(p, r) {
    const f = r.node;
    if (isRoot(p, f.id)) return `<span class="c-ag" title="Respons\xE1vel: o arquivo deste fluxo">${circle("arquivo", "file", "Arquivo")}<span class="rp-n">${esc(flowFile(f))}</span></span>`;
    if (!r.leaf) return `<span class="c-ag muted">\u2014</span>`;
    const a = agentOf(p, f.agent);
    if (a?.kind === "ia") {
      const pe = agentOf(p, f.resp);
      return `<span class="c-ag resp-pick">${pe ? circle("pessoa", "user", `Pessoa: ${pe.name}`) + `<span class="rp-n">${esc(pe.name)}</span>` : circle("none", "plus", "Escolher a pessoa respons\xE1vel")}${agentSelect(p, f, "resp")}</span>`;
    }
    return `<span class="c-ag resp-pick">${a ? circle(a.kind, KIND_ICON[a.kind], `${a.name}`) + `<span class="rp-n">${esc(a.name)}</span>` : circle("none", "plus", "Escolher respons\xE1vel")}${agentSelect(p, f, "agent")}</span>`;
  }
  function taskCell(p, r) {
    const f = r.node, a = agentOf(p, f.agent), pad = 10 + r.depth * G.IND * 2;
    const lead = r.leaf ? `<span class="fn-dot ${fnKind(p, f)}" title="Fun\xE7\xE3o"></span>` : `<span class="car${r.closed ? " shut" : ""}" data-act="toggle" data-id="${esc(f.id)}" title="Abrir / fechar filhos">${icon("chevron")}</span><span class="gi">${icon("network")}</span>`;
    const name = a?.kind === "maquina" && r.leaf ? `<select class="task-pick" data-change="setTask" data-id="${esc(f.id)}" aria-label="Task de ${esc(a.name)}">${a.tasks.map((t) => `<option${t === f.title ? " selected" : ""}>${esc(t)}</option>`).join("")}</select>` : `<b data-act="rename" data-id="${esc(f.id)}" title="Clique para renomear">${esc(f.title || "sem task")}</b>`;
    const iaTag = a?.kind === "ia" ? `<span class="agent-tag resp-pick">${icon("ia")}<span>${esc(a.name)}</span>${agentSelect(p, f, "agent")}</span>` : "";
    return `<span class="nm" style="padding-left:${pad}px">${lead}${name}${iaTag}${f.par ? '<span class="par-tag" title="Roda junto da anterior">\u2225</span>' : ""}</span>`;
  }
  function ioCell(r) {
    const names = (list, kind, id) => list.map((n) => `<span class="io-d"><i class="sq ${kind}"></i>${esc(n)}<button type="button" class="x" data-act="rmIo" data-id="${esc(id)}" data-kind="${kind}" data-name="${esc(n)}" title="Remover ${kind === "in" ? "entrada" : "sa\xEDda"} ${esc(n)}" aria-label="Remover ${esc(n)}">\xD7</button></span>`).join("");
    const ins = r.ins ?? [], outs = r.outs ?? [], pad = 24 + r.depth * G.IND * 2;
    const label = ins.length && outs.length ? "entrada \xB7 sa\xEDda" : ins.length ? "entrada" : "sa\xEDda";
    return `<span class="nm" style="padding-left:${pad}px"><span class="io-k">${label}</span>${names(ins, "in", r.id)}${ins.length && outs.length ? '<span class="io-sep">\u2192</span>' : ""}${names(outs, "out", r.id)}</span>`;
  }
  function renderTable(p, sc, ui) {
    return sc.rows.map((r, i) => {
      const sel = ui.sel === r.id && r.kind !== "io" ? " sel" : "", base = `data-i="${i}" data-id="${esc(r.id)}"`;
      if (r.kind === "io") return `<div class="grow iorow" ${base}><span class="c-ag"></span>${ioCell(r)}</div>`;
      if (r.kind === "block" || r.kind === "catch") {
        const n = r.node, isCatch = r.kind === "catch", pad = 10 + r.depth * G.IND * 2;
        const tag = isCatch ? `<span class="trd c">catch</span><b class="mono">se o try falhar</b>` : n.t === "if" ? `${icon("diamond", "mini")}<b class="mono">${esc(blockLabel(p, n))}</b>` : n.t === "for" ? `<span class="lpd">\u21BB</span><b class="mono">${esc(blockLabel(p, n))}</b>` : `<span class="trd">try</span><b class="mono">catch \u2193 ${esc(n.t === "try" && n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "tratamento")}</b>`;
        return `<div class="grow ifrow ${isCatch ? "catchrow" : n.t + "row"}${sel}" ${base} data-part="${isCatch ? "catch" : "main"}"><span class="c-ag"></span><span class="nm" style="padding-left:${pad}px">${tag}</span><span class="fl-tools">${toolsHtml(toolsFor(p, r.id, isCatch ? "catch" : "main"))}</span></div>`;
      }
      return `<div class="grow${sel}" ${base}>${respCell(p, r)}${taskCell(p, r)}<span class="fl-tools">${toolsHtml(toolsFor(p, r.id))}</span></div>`;
    }).join("");
  }
  function renderPlan(p, flow, sc, ui) {
    const W = planWidth(sc), H = planHeight(sc), by = /* @__PURE__ */ new Map();
    sc.rows.forEach((r, i) => {
      if (r.kind === "fn" || r.kind === "block") by.set(r.id, i);
    });
    const ym = (i) => rowY(i) + G.RH / 2;
    const out = [], bands = [], over = [];
    for (let s = 0; s <= sc.nSteps; s++) out.push(`<line class="vg" x1="${colX(s)}" y1="${G.HEAD - 8}" x2="${colX(s)}" y2="${rowY(sc.rows.length) + 4}"/>`);
    sc.rows.forEach((_, i) => out.push(`<line class="hg" x1="0" y1="${rowY(i + 1)}" x2="${W}" y2="${rowY(i + 1)}"/>`));
    const chip = (s, y) => `<g class="chip"><rect x="${colX(s) - 12}" y="${y - 8}" width="24" height="16" rx="3"/><text x="${colX(s)}" y="${y + 3.5}" text-anchor="middle">s${s}</text></g><path class="dia" d="M${colX(s)} ${y + 12} l4 4 l-4 4 l-4 -4z"/>`;
    const top = G.HEAD - 18, bot = rowY(sc.rows.length) + 18;
    out.push(`<text class="ttl" x="${W / 2}" y="16" text-anchor="middle">${esc(p.name)} \xB7 ${esc(flow.title)}</text>`);
    for (let s = 0; s <= sc.nSteps; s++) out.push(chip(s, top), chip(s, bot));
    out.push(`<line class="axis" x1="${colX(0)}" y1="${rowY(sc.rows.length) + 4}" x2="${colX(sc.nSteps)}" y2="${rowY(sc.rows.length) + 4}"/>`);
    sc.rows.forEach((r, i) => {
      if (r.kind !== "block" && r.kind !== "catch") return;
      const n = r.node, x0 = r.depth * G.IND, cls = r.kind === "catch" ? "ca" : n.t === "if" ? "if" : n.t === "for" ? "lp" : "tr";
      bands.push(`<rect class="band ${cls}" x="${x0}" y="${rowY(i)}" width="${W - x0}" height="${(r.last - i + 1) * G.RH}"/><line class="bandl ${cls}" x1="${x0 + 1}" y1="${rowY(i)}" x2="${x0 + 1}" y2="${rowY(r.last + 1)}"/>`);
      const diamond = r.kind === "block" && n.t === "if", px = colX(r.s) + (diamond ? 11 : 4);
      const txt = r.kind === "catch" ? "catch \xB7 se o try falhar" : n.t === "for" ? `\u21BB ${blockLabel(p, n)}` : n.t === "try" ? `try \xB7 catch \u2193 ${n.catchKids[0]?.t === "fn" ? n.catchKids[0].title : "tratamento"}` : blockLabel(p, n);
      const w = Math.max(tw(txt) + 12, colX(r.e + 1) - px - 6), edit = r.kind === "block" && (n.t === "if" || n.t === "for");
      if (diamond) over.push(`<path class="fif" d="M${colX(r.s)} ${ym(i) - 6} l6 6 l-6 6 l-6 -6z"/>`);
      over.push(`<g class="pill ${cls}" data-hover="${esc(r.id)}" data-part="${r.kind === "catch" ? "catch" : "main"}" ${edit ? `data-act="editBlock" data-id="${esc(r.id)}"` : ""}><rect x="${px}" y="${ym(i) - 8}" width="${w}" height="16"/><text x="${px + 6}" y="${ym(i) + 3.5}">${esc(txt)}</text><title>${esc(txt)}</title></g>`);
      if (r.kind === "block") over.push(`<rect class="handle" data-drag="${esc(r.id)}" x="${px + w - 7}" y="${ym(i) - 8}" width="7" height="16"><title>Arraste para aumentar ou diminuir o bloco</title></rect>`);
    });
    const produced = /* @__PURE__ */ new Set();
    sc.leaves.forEach((l) => l.node.outs.forEach((o) => produced.add(o)));
    const ioRow = /* @__PURE__ */ new Map();
    sc.rows.forEach((r, i) => {
      if (r.kind === "io") ioRow.set(r.id, i);
    });
    const outY = (r) => ym(ioRow.get(r.id) ?? by.get(r.id) ?? 0);
    sc.rows.forEach((r, i) => {
      if (r.kind !== "fn") return;
      const f = r.node, selC = ui.sel === f.id ? " sel" : "";
      if (!r.leaf) {
        const x12 = colX(r.s) + 8, x22 = colX(r.e + 1) - 8;
        over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="sum${selC}" x="${x12}" y="${ym(i) - 3.5}" width="${x22 - x12}" height="7" rx="3.5"/><title>${esc(f.title)} \xB7 composi\xE7\xE3o = camada</title></g><text class="lbl" x="${x22 + 10}" y="${ym(i) + 3.5}">${esc(f.title)}</text>`);
        return;
      }
      const k = fnKind(p, f), x1 = colX(r.s) + G.INS, x2 = colX(r.e + 1) - G.INS;
      const shown = f.title;
      over.push(`<g data-hover="${esc(f.id)}" data-sel="${esc(f.id)}"><rect class="fn ${k}${selC}" x="${x1}" y="${ym(i) - G.BH / 2}" width="${x2 - x1}" height="${G.BH}" rx="${G.BH / 2}"/>${ui.txtIn ? `<text class="fbt ${k}" x="${(x1 + x2) / 2}" y="${ym(i) + 3.5}" text-anchor="middle" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>` : ""}<title>${esc(f.title)}</title></g>`);
      if (!ui.txtIn) over.push(`<text class="lbl" x="${colX(r.e + 1) + 10}" y="${ym(i) + 3.5}" data-act="rename" data-id="${esc(f.id)}">${esc(shown)}</text>`);
      const io2 = ioRow.get(f.id);
      if (io2 != null) {
        f.ins.forEach((n, j) => over.push(`<g class="dm"><rect class="${produced.has(n) ? "dot" : "dot a"}" x="${colX(r.s) - 4 + j * 0}" y="${ym(io2) - 4}" width="8" height="8"/><title>${esc(n)} \xB7 ${produced.has(n) ? "entrada concreta (mesma camada)" : "entrada abstrata (state / outra camada)"}</title></g>`));
        if (f.ins.length) over.push(`<text class="dn" x="${colX(r.s) + 9}" y="${ym(io2) + 3.5}">${esc(f.ins.join(", "))}</text>`);
        if (f.outs.length) {
          over.push(`<g class="dm"><rect class="dot" x="${colX(r.e + 1) - 4}" y="${ym(io2) - 4}" width="8" height="8"/><title>${esc(f.outs.join(", "))} \xB7 sa\xEDda</title></g><text class="dn" x="${colX(r.e + 1) + 9}" y="${ym(io2) + 3.5}">${esc(f.outs.join(", "))}</text>`);
        }
      }
      const ghost = (x, kind, tip) => `<g class="ghost" data-act="addIo" data-id="${esc(f.id)}" data-kind="${kind}"><circle class="hit" cx="${x}" cy="${ym(i)}" r="11"/><rect class="gh" x="${x - 4}" y="${ym(i) - 4}" width="8" height="8"/><path class="gp" d="M${x - 2} ${ym(i)} h4 M${x} ${ym(i) - 2} v4"/><title>${tip}</title></g>`;
      if (!f.ins.length) over.push(ghost(colX(r.s), "in", "Adicionar entrada"));
      if (!f.outs.length) over.push(ghost(colX(r.e + 1), "out", "Adicionar sa\xEDda"));
    });
    for (const [a, b] of links(sc)) {
      const ia = by.get(a.id), ib = by.get(b.id), xo = colX(a.e + 1);
      out.push(`<path class="dep" d="M${colX(a.e + 1) - G.INS} ${ym(ia)} H${xo} V${ym(ib)} H${colX(b.s) + G.INS}"/>`);
      void outY;
    }
    return `<svg class="plan" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Plano do fluxo ${esc(flow.title)}"><g class="bands">${bands.join("")}</g>${out.join("")}${over.join("")}</svg>`;
  }
  function build(p, flowId, ui) {
    const l = locate(p, flowId);
    if (!l || l.node.t !== "fn") throw new Error(`Fluxo ${flowId} n\xE3o existe`);
    const scene = layout(l.node, { closed: ui.closed });
    return { scene, table: renderTable(p, scene, ui), plan: renderPlan(p, l.node, scene, ui) };
  }

  // novo/sample.ts
  function sampleProject() {
    let p = emptyProject("Novo projeto");
    p.agents = structuredClone([...DEFAULT_AGENTS]);
    const run = (c) => {
      const r = apply(p, c);
      p = r.project;
      return r.created ?? "";
    };
    const main = run({ type: "newFlow", title: "main" });
    const onb = run({ type: "newFlow", title: "fazer_onboarding" });
    const kid = (t) => run({ type: "addChild", id: onb, title: t });
    const get = kid("get"), redigir = kid("redigir_proposta"), revisar = kid("revisar_proposta"), traduzir = kid("traduzir"), gerar = kid("gerar_contrato"), post = kid("post"), get2 = kid("get");
    for (const [id, agent] of [[get, "http"], [redigir, "lia"], [revisar, "davi"], [traduzir, "teo"], [gerar, "lia"], [post, "http"], [get2, "http"]]) run({ type: "assign", id, agent });
    run({ type: "setTask", id: get, task: "get" });
    run({ type: "setTask", id: post, task: "post" });
    run({ type: "setTask", id: get2, task: "get" });
    const io2 = (id, ins, outs) => {
      ins.forEach((name) => run({ type: "addInput", id, name }));
      outs.forEach((name) => run({ type: "addOutput", id, name }));
    };
    io2(get, [], ["dados_cliente"]);
    io2(redigir, ["dados_cliente"], ["rascunho"]);
    io2(revisar, ["rascunho"], ["proposta_aprovada"]);
    io2(traduzir, ["proposta_aprovada"], ["propostas"]);
    io2(gerar, ["proposta_aprovada", "dados_cliente"], ["pacote_contrato"]);
    io2(post, ["propostas", "pacote_contrato"], ["envio_id"]);
    io2(get2, ["envio_id"], ["crm_registro"]);
    run({ type: "setParallel", id: gerar, on: true });
    const ifId = run({ type: "wrap", id: traduzir, kind: "if", test: "proposta_aprovada" });
    run({ type: "setIf", id: ifId, test: "proposta_aprovada", elseTo: redigir });
    run({ type: "setScope", id: ifId, count: 2 });
    const forA = run({ type: "wrap", id: traduzir, kind: "for", v: "idioma", coll: '["en", "es"]' });
    run({ type: "setScope", id: forA, count: 2 });
    run({ type: "setScope", id: ifId, count: 2 });
    run({ type: "wrap", id: post, kind: "for", v: "idioma", coll: '["en", "es"]' });
    return { project: p, main, onboarding: onb };
  }

  // novo/app.ts
  var EXAMPLES = {
    newFlow: () => ({ title: "novo_fluxo" }),
    rename: (id) => ({ id, title: "novo_nome" }),
    addChild: (id) => ({ id }),
    addSibling: (id) => ({ id }),
    remove: (id) => ({ id }),
    wrap: (id) => ({ id, kind: "if", test: "condicao" }),
    unwrap: (id) => ({ id }),
    exitScope: (id) => ({ id }),
    setScope: (id) => ({ id, count: 2 }),
    setFor: (id) => ({ id, v: "item", coll: "itens" }),
    setIf: (id) => ({ id, test: "condicao", elseTo: null }),
    addInput: (id) => ({ id, name: "entrada" }),
    removeInput: (id) => ({ id, name: "entrada" }),
    addOutput: (id) => ({ id, name: "saida" }),
    removeOutput: (id) => ({ id, name: "saida" }),
    assign: (id) => ({ id, agent: "lia" }),
    setTask: (id) => ({ id, task: "get" }),
    setResp: (id) => ({ id, resp: "ana" }),
    setParallel: (id) => ({ id, on: true })
  };
  function mount(host, store, flow) {
    const ui = { closed: /* @__PURE__ */ new Set(), sel: null, txtIn: false, flow, zoom: 1 };
    let tab = "ts", hovT = 0, fitted = false, last = null, gen = null;
    host.innerHTML = `
  <div class="app">
    <section class="fx" aria-label="Flow">
      <div class="fx-bar">
        <span class="fx-t">Flow</span><select id="flowSel" aria-label="Fluxo"></select>
        <button type="button" id="newFlow" class="btn">${icon("plus")}Nova fun\xE7\xE3o</button><span class="sp"></span>
        <button type="button" class="ib" id="undo" title="Desfazer (\u2318Z)">${icon("undo")}</button><button type="button" class="ib" id="redo" title="Refazer (\u21E7\u2318Z)">${icon("redo")}</button><i class="vsep"></i>
        <button type="button" class="ib" id="zout" title="Menos zoom (\u2212)">${icon("minus")}</button><span id="zv" class="zv">100%</span><button type="button" class="ib" id="zin" title="Mais zoom (+)">${icon("plus")}</button><button type="button" class="ib" id="fit" title="Ajustar \xE0 tela (0)">${icon("fit")}</button><i class="vsep"></i><button type="button" class="ib" id="txtIn" title="Nome dentro da barra" aria-pressed="false">${icon("text")}</button><button type="button" class="ib" id="expand" title="Abrir tudo">${icon("expand")}</button><button type="button" class="ib" id="collapse" title="Fechar tudo">${icon("collapse")}</button>
      </div>
      <div class="fx-scroll" id="scroll"><div class="fx-sizer" id="sizer"><div class="fx-zoom" id="zoom"><div class="gtable" id="table"></div><div class="gplan" id="plan"></div></div></div></div>
      <div class="fx-hint">roda do mouse = zoom \xB7 arrastar o fundo = mover \xB7 + \u2212 0</div>
      <div class="fx-legend" id="legend">
        <span><i class="lg fc"></i>fun\xE7\xE3o concreta (lib node:*)</span><span><i class="lg fa"></i>fun\xE7\xE3o abstrata (IA \xB7 state)</span><span><i class="lg da"></i>dado abstrato (state)</span><span><i class="lg dc"></i>dado concreto</span>
        <span><i class="lg dia"></i>sele\xE7\xE3o (if)</span><span><i class="lg lp">\u21BB</i>repeti\xE7\xE3o (for)</span><span><i class="lg tr"></i>try</span><span><i class="lg ca"></i>catch</span>
      </div>

    </section>
    <aside class="side">
      <div class="tabs" role="tablist"><button role="tab" data-tab="ts" aria-selected="true">TypeScript</button><button role="tab" data-tab="cmd" aria-selected="false">Chamar comando</button><span class="sp"></span><span class="meta" id="meta"></span></div>
      <section class="pane on" id="p-ts"><div class="fhead"><span class="tsb">TS</span><span id="fname">fluxo.ts</span><span class="selname" id="selname"></span><button type="button" id="copy">Copiar</button></div><div class="code" id="code" tabindex="0" aria-label="C\xF3digo TypeScript gerado"></div></section>
      <section class="pane cmd" id="p-cmd"><label for="cmdSel">Comando</label><select id="cmdSel"></select><label for="payload">Payload (JSON)</label><textarea id="payload" spellcheck="false"></textarea>
        <div class="row"><button type="button" id="run" class="pri">Executar</button><button type="button" id="reset">Reiniciar</button></div><div id="res"></div></section>
    </aside>
  </div>`;
    const $ = (s) => host.querySelector(s);
    const el = { sel: $("#flowSel"), scroll: $("#scroll"), sizer: $("#sizer"), zoom: $("#zoom"), table: $("#table"), plan: $("#plan"), code: $("#code"), meta: $("#meta"), fname: $("#fname"), selname: $("#selname"), cmdSel: $("#cmdSel"), payload: $("#payload"), res: $("#res"), zv: $("#zv") };
    el.cmdSel.innerHTML = COMMAND_NAMES.map((c) => `<option>${c}</option>`).join("");
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
      form.innerHTML = `<label>${esc(label)}</label><input type="text" value="${esc(value)}" spellcheck="false" aria-label="${esc(label)}"><div class="row"><button type="button" data-no>Cancelar</button><button type="submit" class="pri">OK</button></div>`;
      const input = form.querySelector("input");
      input.select();
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        done(input.value.trim() || null);
      });
      form.querySelector("[data-no]").addEventListener("click", () => done(null));
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape") done(null);
      });
    });
    const confirmAsk = (label) => modal(label, (form, done) => {
      form.innerHTML = `<label>${esc(label)}</label><div class="row"><button type="button" data-no>Cancelar</button><button type="submit" class="pri danger">Remover</button></div>`;
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
      el.table.innerHTML = last.scene.rows.length ? `<div class="ghead"><span>Respons\xE1vel</span><span>Task</span></div>${last.table}` : "";
      el.plan.innerHTML = last.plan;
      const tw0 = tableWidth(last.scene);
      el.table.style.width = tw0 + "px";
      el.table.style.setProperty("--tw", tw0 + "px");
      const W = tw0 + planWidth(last.scene), H = planHeight(last.scene);
      el.zoom.style.width = W + "px";
      el.zoom.style.height = H + "px";
      el.zoom.style.transform = `scale(${ui.zoom})`;
      el.sizer.style.width = W * ui.zoom + "px";
      el.sizer.style.height = H * ui.zoom + "px";
      el.zv.textContent = Math.round(ui.zoom * 100) + "%";
      el.sel.innerHTML = p.flows.map((f) => `<option value="${f.id}"${f.id === ui.flow ? " selected" : ""}>${esc(f.title)}</option>`).join("");
      $("#undo").disabled = !store.canUndo;
      $("#redo").disabled = !store.canRedo;
      $("#txtIn").setAttribute("aria-pressed", String(ui.txtIn));
      if (!fitted) {
        fitted = true;
        fit();
      }
      renderCode();
    }
    function renderCode() {
      const p = P2();
      gen = generate(p, ui.flow);
      const lines = gen.code.replace(/\n$/, "").split("\n"), r = ui.sel ? gen.map[ui.sel] : void 0;
      const hl = (l) => esc(l).replace(/(\/\/.*$)|(&quot;[^&]*?&quot;)|(\b\d+\b)|(\b[A-Za-z_$][\w$]*\b)(\()?/g, (m, c, s, n2, w, par) => c ? `<span class="tk-c">${c}</span>` : s ? `<span class="tk-s">${s}</span>` : n2 ? `<span class="tk-n">${n2}</span>` : /^(?:const|let|await|async|import|from|export|type|return|if|else|for|of|try|catch|function|as)$/.test(w) ? `<span class="tk-k">${w}</span>${par ?? ""}` : /^(?:State|Promise|Record|unknown|Fn)$/.test(w) ? `<span class="tk-t">${w}</span>${par ?? ""}` : par ? `<span class="tk-f">${w}</span>(` : m);
      el.code.innerHTML = lines.map((l, i) => `<div class="ln${r && i + 1 >= r[0] && i + 1 <= r[1] ? " hl" : ""}" data-n="${i + 1}"><span class="g">${i + 1}</span><span class="t">${hl(l) || " "}</span></div>`).join("");
      el.fname.textContent = gen.fileName;
      el.meta.textContent = `${lines.length} linhas`;
      const n = ui.sel ? locate(p, ui.sel)?.node : void 0;
      el.selname.textContent = n ? n.t === "fn" ? n.title : n.t : "";
    }
    const scrollToSel = () => {
      const r = ui.sel && gen?.map[ui.sel];
      if (!r) return;
      const e = el.code.querySelector(`[data-n="${r[0]}"]`);
      if (e) el.code.scrollTo({ top: Math.max(0, e.offsetTop - 60), behavior: "smooth" });
    };
    function fit() {
      if (!last) return;
      const W = tableWidth(last.scene) + planWidth(last.scene), k = Math.max(0.3, Math.min(1, (el.scroll.clientWidth - 8) / W));
      ui.zoom = Math.round(k * 100) / 100;
      el.zoom.style.transform = `scale(${ui.zoom})`;
      el.sizer.style.width = W * ui.zoom + "px";
      el.sizer.style.height = planHeight(last.scene) * ui.zoom + "px";
      el.zv.textContent = Math.round(ui.zoom * 100) + "%";
    }
    const zoomTo = (k, mx = el.scroll.clientWidth / 2, my = el.scroll.clientHeight / 2) => {
      const old = ui.zoom, next = Math.min(2.5, Math.max(0.2, Math.round(k * 100) / 100));
      if (next === old) return;
      const cx = (el.scroll.scrollLeft + mx) / old, cy = (el.scroll.scrollTop + my) / old;
      ui.zoom = next;
      render();
      el.scroll.scrollLeft = cx * next - mx;
      el.scroll.scrollTop = cy * next - my;
    };
    el.scroll.addEventListener("wheel", (e) => {
      e.preventDefault();
      const r = el.scroll.getBoundingClientRect();
      zoomTo(ui.zoom * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 22e-4)), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    el.scroll.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("[data-act],[data-hover],[data-drag],[data-sel],button,select,input,.ghost,.bar-tools,.fl-tools,.grow")) return;
      const x0 = e.clientX, y0 = e.clientY, sl = el.scroll.scrollLeft, st = el.scroll.scrollTop;
      let moved = false;
      const move = (ev) => {
        if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
        moved = true;
        el.scroll.classList.add("panning");
        el.scroll.scrollLeft = sl - (ev.clientX - x0);
        el.scroll.scrollTop = st - (ev.clientY - y0);
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        el.scroll.classList.remove("panning");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
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
      addChild: (d) => void run({ type: "addChild", id: d["id"], ...d["catch"] ? { catch: true } : {} }),
      addSibling: (d) => void run({ type: "addSibling", id: d["id"] }),
      wrap: (d) => void run({ type: "wrap", id: d["id"], kind: d["kind"] }),
      unwrap: (d) => void run({ type: "unwrap", id: d["id"] }, false),
      exitScope: (d) => void run({ type: "exitScope", id: d["id"] }),
      parallel: (d) => void run({ type: "setParallel", id: d["id"], on: d["on"] === "true" }),
      setScope: (d) => void run({ type: "setScope", id: d["id"], count: kids(d["id"]) + Number(d["delta"]) }, false),
      remove: async (d) => {
        const l = locate(P2(), d["id"]);
        if (l && l.node.kids.length && !await confirmAsk(`Remover \u201C${l.node.t === "fn" ? l.node.title : l.node.t}\u201D e tudo dentro dela?`)) return;
        if (ui.sel === d["id"]) ui.sel = null;
        run({ type: "remove", id: d["id"] }, false);
      },
      rename: async (d) => {
        const n = locate(P2(), d["id"])?.node;
        if (!n || n.t !== "fn") return;
        ui.sel = n.id;
        const v = await ask("Novo nome da task:", n.title);
        if (v) run({ type: "rename", id: n.id, title: v });
        else render();
      },
      editBlock: async (d) => {
        const id = d["id"], n = locate(P2(), id)?.node;
        if (!n) return;
        if (n.t === "for") {
          const v = await ask("Vari\xE1vel do for (cada item):", n.v);
          if (!v) return;
          const c = await ask("Cole\xE7\xE3o percorrida:", n.coll);
          if (c) run({ type: "setFor", id, v, coll: c }, false);
        } else if (n.t === "if") {
          const test = await ask("Condi\xE7\xE3o do if (dado testado, ex.: estoque_ok):", n.test);
          if (!test) return;
          const names = locate(P2(), id).flow.kids.length ? [] : [], fns = [];
          void names;
          const walkF = (list) => {
            for (const x of list) {
              if (x.t === "fn") fns.push({ id: x.id, title: x.title });
              if (x.t === "try") {
                walkF(x.kids);
                walkF(x.catchKids);
              } else walkF(x.kids);
            }
          };
          walkF(locate(P2(), id).flow.kids);
          const cur = fns.find((f) => f.id === n.elseTo)?.title ?? "";
          const to = await ask(`Sen\xE3o, voltar para qual fun\xE7\xE3o? (${fns.map((f) => f.title).join(", ")}) \u2014 vazio = nenhuma`, cur);
          run({ type: "setIf", id, test, elseTo: fns.find((f) => f.title.toLowerCase() === (to ?? "").toLowerCase())?.id ?? null }, false);
        }
      },
      addIo: async (d) => {
        const v = await ask(d["kind"] === "in" ? "Nome da nova entrada:" : "Nome da nova sa\xEDda:");
        if (v) run({ type: d["kind"] === "in" ? "addInput" : "addOutput", id: d["id"], name: v }, false);
      },
      rmIo: (d) => void run({ type: d["kind"] === "in" ? "removeInput" : "removeOutput", id: d["id"], name: d["name"] }, false)
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
    $("#newFlow").addEventListener("click", () => void run({ type: "newFlow" }));
    $("#undo").addEventListener("click", () => store.undo());
    $("#redo").addEventListener("click", () => store.redo());
    $("#zin").addEventListener("click", () => zoomTo(ui.zoom * 1.15));
    $("#zout").addEventListener("click", () => zoomTo(ui.zoom / 1.15));
    $("#fit").addEventListener("click", () => {
      fitted = false;
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
    host.querySelectorAll("[data-tab]").forEach((b) => b.addEventListener("click", () => {
      tab = b.dataset["tab"];
      host.querySelectorAll("[data-tab]").forEach((x) => x.setAttribute("aria-selected", String(x === b)));
      $("#p-ts").classList.toggle("on", tab === "ts");
      $("#p-cmd").classList.toggle("on", tab === "cmd");
    }));
    $("#copy").addEventListener("click", async () => {
      await navigator.clipboard?.writeText(gen?.code ?? "").catch(() => {
      });
      $("#copy").textContent = "Copiado";
      setTimeout(() => $("#copy").textContent = "Copiar", 1200);
    });
    const fillPayload = () => {
      const ex = EXAMPLES[el.cmdSel.value];
      el.payload.value = JSON.stringify(ex ? ex(ui.sel ?? ui.flow) : {}, null, 2);
    };
    el.cmdSel.addEventListener("change", fillPayload);
    fillPayload();
    $("#run").addEventListener("click", () => {
      try {
        const id = store.dispatch({ type: el.cmdSel.value, ...JSON.parse(el.payload.value || "{}") });
        el.res.innerHTML = `<span class="ok">ok</span><pre class="res">${esc(JSON.stringify({ created: id ?? null }, null, 2))}</pre>`;
      } catch (err) {
        el.res.innerHTML = `<span class="er">erro</span><pre class="res">${esc(err instanceof Error ? err.message : String(err))}</pre>`;
      }
    });
    $("#reset").addEventListener("click", () => {
      const s = sampleProject();
      store.project = s.project;
      ui.flow = s.main;
      ui.sel = null;
      ui.closed.clear();
      fitted = false;
      render();
    });
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
          fitted = false;
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
    const leaveBar = () => {
      window.clearTimeout(hovT);
      hovT = window.setTimeout(() => el.plan.querySelector(".bar-tools")?.remove(), 450);
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
      if (cur) hovT = window.setTimeout(show, 350);
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
        return countForStep(p0, last.scene, id, Math.floor((x - G.OX) / G.W));
      };
      const place = (n2) => {
        const l = locate(p0, id), items = [...l.node.kids, ...l.list.slice(l.index + 1)], last2 = items[n2 - 1], sp = last2 ? last.scene.span.get(last2.id) : void 0;
        guide.style.left = colX((sp?.e ?? 0) + 1) + "px";
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
    const off = store.subscribe(render);
    render();
    return { store, ui, render, destroy: () => {
      off();
      host.innerHTML = "";
    } };
  }
  function boot() {
    const s = sampleProject(), app = mount(document.getElementById("app"), new Store(s.project), s.main);
    window.flowApp = app;
    return app;
  }
  if (typeof document !== "undefined" && document.getElementById("app")) boot();
})();
