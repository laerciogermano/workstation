import type { ModelCommand } from "../commands";
import { dataChildren } from "../graph";
import { err, type Result } from "../result";
import { DATA_TYPES, type DataDef, type DataType, type Snapshot } from "../types";
import { applied, DATA_LEAF, DATA_NAME, MODULE_FILE, type Op } from "./context";

type Cmd<T extends ModelCommand["type"]> = Extract<ModelCommand, { type: T }>;
const find = (s: Snapshot, name: string): DataDef | undefined => s.data.find(d => d.name === name);
const nextPos = (s: Snapshot): number => s.data.reduce((m, d) => Math.max(m, d.position + 1), 0);
const validName = (n: string): Result<never> | null => (DATA_NAME.test(n) && n.length <= 160 ? null : err("invalid", `Nome de dado inválido: "${n}"`));
const validType = (t: DataType | undefined): Result<never> | null => (t === undefined || (DATA_TYPES as readonly string[]).includes(t) ? null : err("invalid", `Tipo inválido: ${t}`));
const put = (s: Snapshot, d: DataDef): Snapshot => ({ ...s, data: s.data.some(x => x.name === d.name) ? s.data.map(x => (x.name === d.name ? d : x)) : [...s.data, d] });

export const createData: Op<Cmd<"createData">> = (s, c) => {
  const bad = validName(c.name) ?? validType(c.dataType); if (bad) return bad;
  if (find(s, c.name)) return err("conflict", `Dado "${c.name}" já existe`);
  return applied(put(s, { name: c.name, type: c.dataType ?? "texto", value: null, position: nextPos(s) }));
};

export const upsertData: Op<Cmd<"upsertData">> = (s, c) => {
  const bad = validName(c.name) ?? validType(c.dataType); if (bad) return bad;
  if (c.value != null && c.value.length > 10_000) return err("invalid", "Valor excede 10000 caracteres");
  if (c.moduleFile !== undefined && !MODULE_FILE.test(c.moduleFile)) return err("invalid", "Use um nome como estado.data.js");
  const cur = find(s, c.name);
  let next = put(s, { name: c.name, type: c.dataType ?? cur?.type ?? "texto", value: c.value === undefined ? (cur?.value ?? null) : c.value, position: cur?.position ?? nextPos(s) });
  if (c.moduleFile !== undefined) {
    const file = c.moduleFile;
    const mod = next.modules.find(m => m.file === file);
    if (!mod) return err("not_found", `Arquivo ${file} não existe`);
    const cleaned = next.modules.map(m => ({ ...m, items: m.items.filter(i => !(i.kind === "dado" && i.ref === c.name)) }));
    next = { ...next, modules: cleaned.map(m => (m.id === mod.id ? { ...m, items: [...m.items, { kind: "dado" as const, ref: c.name }] } : m)) };
  }
  return applied(next);
};

/** Valor vazio → dado abstrato. */
export const clearDataValue: Op<Cmd<"clearDataValue">> = (s, c) => {
  const d = find(s, c.name); if (!d) return err("not_found", `Dado "${c.name}" não existe`);
  return applied(put(s, { ...d, value: null }));
};

export const addDataChild: Op<Cmd<"addDataChild">> = (s, c) => {
  const parent = find(s, c.parent); if (!parent) return err("not_found", `Dado "${c.parent}" não existe`);
  if (!DATA_LEAF.test(c.name) || c.name.length > 60) return err("invalid", `Nome de campo inválido: "${c.name}"`);
  const full = `${c.parent}.${c.name}`;
  if (find(s, full)) return err("conflict", `Campo "${full}" já existe`);
  // folha vira cubo (objeto) ao ganhar o primeiro filho
  return applied(put(put(s, { ...parent, type: "objeto", value: null }), { name: full, type: "texto", value: null, position: nextPos(s) }));
};

/** Folha □ ↔ cubo: cubo = objeto com filhos; voltar a folha exige não ter filhos. */
export const toggleCube: Op<Cmd<"toggleCube">> = (s, c) => {
  const d = find(s, c.name); if (!d) return err("not_found", `Dado "${c.name}" não existe`);
  if (d.type !== "objeto") return applied(put(s, { ...d, type: "objeto", value: null }));
  if (dataChildren(s, c.name).length) return err("invalid", "Remova os campos filhos antes de voltar a folha");
  return applied(put(s, { ...d, type: "texto" }));
};
