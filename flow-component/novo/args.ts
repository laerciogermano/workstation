import { FlowError } from "./model";

/**
 * Valor de uma entrada de função de lib, em forma editável: o TIPO e o VALOR.
 *  texto · número · booleano · referência (dado de outra função) · expressão · objeto (com filhos: campo → valor).
 * O que vai para o projeto é só a TypeScript expression (`buildArg`); `inferArg` lê de volta a expressão para reabrir a caixa de edição.
 */
export type ArgType = "text" | "number" | "boolean" | "ref" | "expr" | "object" | "import";
/** Tipos editáveis no select (import só via optgroup “From file”). */
export const ARG_TYPES: readonly { type: Exclude<ArgType, "import">; label: string }[] = [
  { type: "text", label: "text" }, { type: "number", label: "number" }, { type: "boolean", label: "boolean" },
  { type: "ref", label: "data from another function" }, { type: "expr", label: "expression" }, { type: "object", label: "object" },
];
export interface ArgDraft { type: ArgType; value: string; fields: { name: string; draft: ArgDraft }[] }
export const emptyDraft = (type: ArgType = "text"): ArgDraft => ({ type, value: type === "boolean" ? "false" : "", fields: [] });

const IDENT = /^[A-Za-z_$][\w$]*$/, PATH = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/, NUM = /^-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i;
const FROM_FILE = /^([^#\s]+)#([A-Za-z_$][\w$]*)$/;
/** Literais JS que parecem identificador — NÃO são referência a dado do fluxo. */
const LITERAL_IDENTS = new Set(["true", "false", "null", "undefined", "NaN", "Infinity"]);
/**
 * Expressão é só um nome de dado (ou caminho `a.b` / `a[0]`)?
 * `true`/`false`/`null`/… e `from:file#name` NÃO são ref local.
 */
export const isDataRef = (e: string): boolean => {
  const v = e.trim(); if (!v || LITERAL_IDENTS.has(v) || v.startsWith("from:")) return false;
  return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*|\[\d+\])*$/.test(v);
};

/** Expressão TypeScript do valor; vazio = sem valor (a entrada volta a ficar abstrata). Import → `from:file#name`. */
export function buildArg(d: ArgDraft): string {
  switch (d.type) {
    case "text": return d.value === "" ? "" : JSON.stringify(d.value);
    case "number": { const v = d.value.trim(); if (!v) return ""; if (!NUM.test(v)) throw new FlowError("invalid", `“${v}” is not a number`); return String(Number(v)); }
    case "boolean": return d.value === "true" ? "true" : "false";
    case "ref": { const v = d.value.trim(); if (v && !PATH.test(v)) throw new FlowError("invalid", `“${v}” is not a data name (use letters, numbers and _; e.g. customer.name)`); return v; }
    case "import": {
      const v = d.value.trim(), m = FROM_FILE.exec(v);
      if (!m) throw new FlowError("invalid", `“${v}” is not a file data origin (use file.ts#name)`);
      return `from:${m[1]}#${m[2]}`;
    }
    case "expr": return d.value.trim();
    case "object": {
      const seen = new Set<string>();
      for (const f of d.fields) { if (!IDENT.test(f.name)) throw new FlowError("invalid", `Invalid field name: “${f.name}”`); if (seen.has(f.name)) throw new FlowError("invalid", `Duplicate field: ${f.name}`); seen.add(f.name); }
      return d.fields.length ? `{ ${d.fields.map(f => `${f.name}: ${buildArg(f.draft) || "undefined"}`).join(", ")} }` : "{}";
    }
  }
}

/** Lê uma expressão guardada de volta para o formato editável (o que não reconhece vira expressão). */
export function inferArg(expr: string): ArgDraft {
  const e = expr.trim(); if (!e) return emptyDraft();
  if (e.startsWith("from:")) {
    const m = FROM_FILE.exec(e.slice(5));
    if (m) return { type: "import", value: `${m[1]}#${m[2]}`, fields: [] };
  }
  if (/^"(?:[^"\\]|\\.)*"$/.test(e)) { try { return { type: "text", value: JSON.parse(e) as string, fields: [] }; } catch { /* cai em expressão */ } }
  if (NUM.test(e)) return { type: "number", value: e, fields: [] };
  if (e === "true" || e === "false") return { type: "boolean", value: e, fields: [] };
  if (PATH.test(e)) return { type: "ref", value: e, fields: [] };
  if (e.startsWith("{")) { const o = parseObject(e); if (o) return o; }
  return { type: "expr", value: e, fields: [] };
}

/** Lê só o formato que `buildArg` gera: `{ campo: valor, outro: { ... } }`. */
function parseObject(src: string): ArgDraft | null {
  let i = 0; const ws = (): void => { while (/\s/.test(src[i] ?? "")) i++; };
  const value = (): ArgDraft | null => {
    ws(); const c = src[i];
    if (c === "{") return object();
    if (c === '"') { const m = /^"(?:[^"\\]|\\.)*"/.exec(src.slice(i)); if (!m) return null; i += m[0].length; try { return { type: "text", value: JSON.parse(m[0]) as string, fields: [] }; } catch { return null; } }
    const m = /^[^,}\s][^,}]*/.exec(src.slice(i)); if (!m) return null; const raw = m[0].trim(); i += m[0].length;
    return raw === "undefined" ? emptyDraft() : inferArg(raw);
  };
  const object = (): ArgDraft | null => {
    if (src[i] !== "{") return null; i++; const fields: { name: string; draft: ArgDraft }[] = []; ws();
    if (src[i] === "}") { i++; return { type: "object", value: "", fields }; }
    for (;;) {
      ws(); const k = /^[A-Za-z_$][\w$]*/.exec(src.slice(i)); if (!k) return null; i += k[0].length; ws(); if (src[i] !== ":") return null; i++;
      const v = value(); if (!v) return null; fields.push({ name: k[0], draft: v }); ws();
      if (src[i] === ",") { i++; continue; } if (src[i] === "}") { i++; return { type: "object", value: "", fields }; } return null;
    }
  };
  const r = object(); ws(); return r && i === src.length ? r : null;
}

/** Palavras e globais que uma expressão pode usar sem serem dados do fluxo. */
export const EXPR_RESERVED = new Set(["true", "false", "null", "undefined", "typeof", "instanceof", "in", "of", "new", "void", "NaN", "Infinity", "Math", "JSON", "Object", "Array", "Number", "String", "Boolean", "Date", "Set", "Map", "state", "error"]);
/** Os nomes de dados citados numa expressão (ignora texto entre aspas, chaves de objeto, membros `.x` e palavras reservadas). */
export const exprIdents = (expr: string): string[] => [...expr.replace(/([{,]\s*)[A-Za-z_$][\w$]*(\s*:)/g, "$1$2").replace(/(["'`])(?:\\.|(?!\1).)*\1/g, "").matchAll(/(?<![.\w$])[A-Za-z_$][\w$]*/g)].map(m => m[0]).filter(w => !EXPR_RESERVED.has(w));
