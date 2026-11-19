import type { ModelCommand } from "../commands";
import { findAgent, usesOfAgent } from "../graph";
import { err } from "../result";
import { FILE_AGENT, MODEL_AGENT, type Agent, type Snapshot } from "../types";
import { applied, MODULE_FILE, text, type Op } from "./context";

type Cmd<T extends ModelCommand["type"]> = Extract<ModelCommand, { type: T }>;

/** Tasks padrão por lib Node (`maquina`); script usa o próprio nome. */
export const DEFAULT_LIB_TASKS: Readonly<Record<string, readonly string[]>> = {
  "node:http": ["get", "post", "request", "createServer", "put", "patch", "delete", "head"],
  "node:fs": ["readFile", "writeFile", "copyFile", "mkdir", "readdir", "unlink", "rename", "appendFile", "stat"],
  "node:path": ["join", "resolve", "basename", "dirname", "extname", "parse", "format"],
  "node:crypto": ["randomBytes", "createHash", "createHmac", "randomUUID"],
  "node:stream": ["pipeline", "finished", "Readable", "Writable", "Transform"],
  "node:console": ["log", "info", "warn", "error", "debug", "table", "clear"],
};
const defaultTasks = (kind: string, name: string): readonly string[] =>
  kind === "maquina" ? (DEFAULT_LIB_TASKS[name] ?? []) : kind === "script" ? [name.replace(/\(\)\s*$/, "")] : [];

// ---------- agentes ----------
export const createAgent: Op<Cmd<"createAgent">> = (s, c, ctx) => {
  const name = text("Nome", c.name, 120); if (!name.ok) return name;
  if (c.modelId && !s.models.some(m => m.id === c.modelId)) return err("not_found", "Modelo não existe neste projeto");
  const modelId = c.kind === "ia" ? (c.modelId ?? s.models[0]?.id ?? null) : (c.modelId ?? null);
  const agent: Agent = {
    id: ctx.newId(), kind: c.kind, name: name.value, sub: (c.sub ?? "").trim(), moduleFile: c.moduleFile ?? null, modelId,
    prompt: c.kind === "ia" ? (c.prompt ?? "") : null, photoUrl: null, tasks: c.tasks?.length ? c.tasks : defaultTasks(c.kind, name.value),
  };
  return applied({ ...s, agents: [...s.agents, agent] }, { created: [agent.id] });
};
export const createPerson: Op<Cmd<"createPerson">> = (s, c, ctx) => createAgent(s, { type: "createAgent", kind: "pessoa", name: c.name, sub: c.sub ?? "" }, ctx);

export const patchAgent: Op<Cmd<"patchAgent">> = (s, c) => {
  const a = findAgent(s, c.id); if (!a) return err("not_found", `Responsável ${c.id} não existe`);
  const p = c.patch; let next: Agent = a;
  if (p.name !== undefined) { const n = text("Nome", p.name, 120); if (!n.ok) return n; next = { ...next, name: n.value }; }
  if (p.sub !== undefined) next = { ...next, sub: p.sub.trim().slice(0, 200) };
  if (p.modelId !== undefined) { if (p.modelId !== null && !s.models.some(m => m.id === p.modelId)) return err("not_found", "Modelo não existe neste projeto"); next = { ...next, modelId: p.modelId }; }
  if (p.prompt !== undefined) { if (p.prompt !== null && p.prompt.length > 8000) return err("invalid", "Prompt excede 8000 caracteres"); next = { ...next, prompt: p.prompt }; }
  if (p.photoUrl !== undefined) { if (p.photoUrl !== null && !/^data:image\/(png|jpe?g|webp);base64,/.test(p.photoUrl)) return err("invalid", "Foto inválida"); next = { ...next, photoUrl: p.photoUrl }; }
  if (p.tasks !== undefined) next = { ...next, tasks: p.tasks };
  return applied({ ...s, agents: s.agents.map(x => (x.id === c.id ? next : x)) });
};

/** Agente em uso não sai do catálogo. */
export const removeAgent: Op<Cmd<"removeAgent">> = (s, c) => {
  if (!s.agents.some(a => a.id === c.id) || c.id.startsWith(FILE_AGENT) || c.id.startsWith(MODEL_AGENT)) return err("not_found", `Responsável ${c.id} não existe`);
  const uses = usesOfAgent(s, c.id);
  if (uses.length) return err("conflict", `Em uso por: ${uses.slice(0, 5).map(u => u.title).join(", ")}. Troque o responsável nelas para remover.`);
  return applied({ ...s, agents: s.agents.filter(a => a.id !== c.id) }, { removed: [c.id] });
};

// ---------- modelos ----------
const COLOR = /^#[0-9a-fA-F]{6}$/;
export const createModel: Op<Cmd<"createModel">> = (s, c, ctx) => {
  const name = text("Nome", c.name, 120), api = text("API", c.api, 120), vendor = text("Fornecedor", c.vendor, 120);
  if (!name.ok) return name; if (!api.ok) return api; if (!vendor.ok) return vendor;
  if (c.color !== undefined && !COLOR.test(c.color)) return err("invalid", "Cor deve ser #RRGGBB");
  const model = { id: ctx.newId(), name: name.value, api: api.value, vendor: vendor.value, color: c.color ?? "#8a8a8a" };
  return applied({ ...s, models: [...s.models, model] }, { created: [model.id] });
};
export const patchModel: Op<Cmd<"patchModel">> = (s, c) => {
  const m = s.models.find(x => x.id === c.id); if (!m) return err("not_found", `Modelo ${c.id} não existe`);
  const p = c.patch;
  for (const [k, v] of [["Nome", p.name], ["API", p.api], ["Fornecedor", p.vendor]] as const) if (v !== undefined) { const t = text(k, v, 120); if (!t.ok) return t; }
  if (p.color !== undefined && !COLOR.test(p.color)) return err("invalid", "Cor deve ser #RRGGBB");
  const next = { ...m, ...(p.name !== undefined && { name: p.name.trim() }), ...(p.api !== undefined && { api: p.api.trim() }), ...(p.vendor !== undefined && { vendor: p.vendor.trim() }), ...(p.color !== undefined && { color: p.color }) };
  return applied({ ...s, models: s.models.map(x => (x.id === c.id ? next : x)) });
};

/** Limpa as referências `ref` (virtual) das funções. */
const clearRefs = (s: Snapshot, ref: string): Snapshot => ({
  ...s, elements: s.elements.map(e => (e.agentId === ref || e.respId === ref ? { ...e, agentId: e.agentId === ref ? null : e.agentId, respId: e.respId === ref ? null : e.respId } : e)),
});
export const removeModel: Op<Cmd<"removeModel">> = (s, c) => {
  if (!s.models.some(m => m.id === c.id)) return err("not_found", `Modelo ${c.id} não existe`);
  const n = s.agents.filter(a => a.modelId === c.id && !a.id.startsWith(MODEL_AGENT)).length;
  if (n) return err("conflict", `${n} agente(s) usam este modelo. Troque o modelo deles antes de remover.`);
  const cleared = clearRefs(s, MODEL_AGENT + c.id);
  return applied({ ...cleared, models: s.models.filter(m => m.id !== c.id), agents: s.agents.filter(a => a.id !== MODEL_AGENT + c.id) }, { removed: [c.id] });
};

// ---------- módulos (arquivos) ----------
export const createModule: Op<Cmd<"createModule">> = (s, c, ctx) => {
  let file = c.file;
  if (file === undefined) { let n = s.modules.length + 1; file = `novo-arquivo-${n}.layer.js`; while (s.modules.some(m => m.file === file)) file = `novo-arquivo-${++n}.layer.js`; }
  if (!MODULE_FILE.test(file) || file.length > 120) return err("invalid", "Use um nome como proposta.layer.js");
  if (s.modules.some(m => m.file === file)) return err("conflict", "Já existe um arquivo com esse nome");
  const mod = { id: ctx.newId(), file, items: [] };
  return applied({ ...s, modules: [...s.modules, mod] }, { created: [mod.id] });
};
export const renameModule: Op<Cmd<"renameModule">> = (s, c) => {
  if (!s.modules.some(m => m.id === c.id)) return err("not_found", "Arquivo não existe");
  if (!MODULE_FILE.test(c.file) || c.file.length > 120) return err("invalid", "Use um nome como proposta.layer.js");
  if (s.modules.some(m => m.file === c.file && m.id !== c.id)) return err("conflict", "Já existe um arquivo com esse nome");
  return applied({ ...s, modules: s.modules.map(m => (m.id === c.id ? { ...m, file: c.file } : m)),
    agents: s.agents.map(a => (a.id === FILE_AGENT + c.id ? { ...a, name: c.file, moduleFile: c.file } : a)) });
};
export const deleteModule: Op<Cmd<"deleteModule">> = (s, c) => {
  if (!s.modules.some(m => m.id === c.id)) return err("not_found", "Arquivo não existe");
  const cleared: Snapshot = clearRefs(s, FILE_AGENT + c.id);
  return applied({ ...cleared, modules: s.modules.filter(m => m.id !== c.id), agents: s.agents.filter(a => a.id !== FILE_AGENT + c.id) }, { removed: [c.id] });
};
