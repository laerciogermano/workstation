import { buildArg, emptyDraft, inferArg, type ArgDraft } from "./args";

/**
 * Condição de um `if`, em forma editável: uma lista de cláusulas ligadas por AND / OR.
 * Cada cláusula: um dado (ou expressão) + um operador (+ um valor, quando o operador precisa).
 * `buildCond` gera a expressão TypeScript; `inferCond` lê de volta (o que não reconhece vira uma cláusula de expressão livre).
 */
export type CondOp = "truthy" | "falsy" | "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "notContains" | "startsWith" | "endsWith" | "empty" | "notEmpty";
export const COND_OPS: readonly { op: CondOp; label: string; needsRight: boolean }[] = [
  { op: "truthy", label: "is true / filled in", needsRight: false }, { op: "falsy", label: "is false / empty", needsRight: false },
  { op: "eq", label: "equals", needsRight: true }, { op: "neq", label: "does not equal", needsRight: true },
  { op: "gt", label: "is greater than", needsRight: true }, { op: "gte", label: "is greater than or equal to", needsRight: true },
  { op: "lt", label: "is less than", needsRight: true }, { op: "lte", label: "is less than or equal to", needsRight: true },
  { op: "contains", label: "contains", needsRight: true }, { op: "notContains", label: "does not contain", needsRight: true },
  { op: "startsWith", label: "starts with", needsRight: true }, { op: "endsWith", label: "ends with", needsRight: true },
  { op: "empty", label: "has no items / is blank", needsRight: false }, { op: "notEmpty", label: "has items / is not blank", needsRight: false },
];
export type Joiner = "&&" | "||";
export const JOINERS: readonly { join: Joiner; label: string }[] = [{ join: "&&", label: "AND" }, { join: "||", label: "OR" }];
export interface Clause { left: ArgDraft; op: CondOp; right: ArgDraft; /** Como esta cláusula se liga à ANTERIOR (ignorado na primeira). */ join: Joiner }
export interface CondDraft { clauses: Clause[] }

export const needsRight = (op: CondOp): boolean => COND_OPS.find(o => o.op === op)!.needsRight;
export const emptyClause = (join: Joiner = "&&"): Clause => ({ left: emptyDraft("ref"), op: "truthy", right: emptyDraft("text"), join });
export const emptyCond = (): CondDraft => ({ clauses: [emptyClause()] });

const lhs = (d: ArgDraft): string => (d.type === "ref" || d.type === "expr" ? d.value.trim() : buildArg(d));
function buildClause(c: Clause): string {
  const L = lhs(c.left); if (!L) return "";
  const R = needsRight(c.op) ? buildArg(c.right) : "";
  if (needsRight(c.op) && !R) return "";
  switch (c.op) {
    case "truthy": return L; case "falsy": return `!${/^[\w$.]+$/.test(L) ? L : `(${L})`}`;
    case "eq": return `${L} === ${R}`; case "neq": return `${L} !== ${R}`; case "gt": return `${L} > ${R}`; case "gte": return `${L} >= ${R}`; case "lt": return `${L} < ${R}`; case "lte": return `${L} <= ${R}`;
    case "contains": return `${L}.includes(${R})`; case "notContains": return `!${L}.includes(${R})`; case "startsWith": return `${L}.startsWith(${R})`; case "endsWith": return `${L}.endsWith(${R})`;
    case "empty": return `!${L}?.length`; case "notEmpty": return `!!${L}?.length`;
  }
}
/** A expressão da condição. AND pesa mais que OR (como no JavaScript): `a && b || c` = `(a && b) || c`. Vazio = sem condição. */
export function buildCond(d: CondDraft): string {
  let out = "";
  d.clauses.forEach((c, i) => { const s = buildClause(c); if (!s) return; out += out ? ` ${c.join} ${s}` : s; void i; });
  return out;
}

/** Parte `s` em pedaços separados por `sep` fora de aspas, parênteses, colchetes e chaves. */
export function splitTop(s: string, sep: "&&" | "||"): string[] {
  const out: string[] = []; let depth = 0, q = "", cur = "";
  for (let i = 0; i < s.length; i++) {
    const c = s[i]!;
    if (q) { cur += c; if (c === "\\") { cur += s[++i] ?? ""; continue; } if (c === q) q = ""; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; cur += c; continue; }
    if ("([{".includes(c)) depth++; else if (")]}".includes(c)) depth--;
    if (depth === 0 && s.startsWith(sep, i)) { out.push(cur); cur = ""; i += sep.length - 1; continue; }
    cur += c;
  }
  out.push(cur); return out.map(x => x.trim());
}

const PATH = "[A-Za-z_$][\\w$]*(?:\\.[A-Za-z_$][\\w$]*)*";
function parseClause(raw: string, join: Joiner): Clause {
  const s = raw.trim(), mk = (op: CondOp, l: string, r?: string): Clause => ({ join, op, left: { ...emptyDraft("ref"), value: l }, right: r === undefined ? emptyDraft("text") : inferArg(r) });
  let m: RegExpExecArray | null;
  if ((m = new RegExp(`^!!(${PATH})\\?\\.length$`).exec(s))) return mk("notEmpty", m[1]!);
  if ((m = new RegExp(`^!(${PATH})\\?\\.length$`).exec(s))) return mk("empty", m[1]!);
  if ((m = new RegExp(`^!(${PATH})\\.includes\\((.+)\\)$`).exec(s)) && !/\.(includes|startsWith|endsWith)$/.test(m[1]!)) return mk("notContains", m[1]!, m[2]!);
  if ((m = new RegExp(`^(${PATH})\\.(includes|startsWith|endsWith)\\((.+)\\)$`).exec(s))) { const f = m[2] as "includes" | "startsWith" | "endsWith"; return mk(f === "includes" ? "contains" : f, m[1]!, m[3]!); }
  if ((m = new RegExp(`^(${PATH})\\s*(===|!==|>=|<=|>|<)\\s*(.+)$`).exec(s))) return mk({ "===": "eq", "!==": "neq", ">=": "gte", "<=": "lte", ">": "gt", "<": "lt" }[m[2]!] as CondOp, m[1]!, m[3]!);
  if ((m = new RegExp(`^!(${PATH})$`).exec(s))) return mk("falsy", m[1]!);
  if (new RegExp(`^${PATH}$`).test(s)) return mk("truthy", s);
  return { join, op: "truthy", left: { type: "expr", value: s, fields: [] }, right: emptyDraft("text") };   // não reconhecido: fica como expressão livre
}
/** Lê a expressão de volta para cláusulas editáveis. */
export function inferCond(expr: string): CondDraft {
  const e = expr.trim(); if (!e) return emptyCond();
  const clauses: Clause[] = [];
  splitTop(e, "||").forEach((orPart, i) => splitTop(orPart, "&&").forEach((p, j) => clauses.push(parseClause(p, i > 0 && j === 0 ? "||" : "&&"))));
  return { clauses };
}
