import type { Applied } from "../commands";
import type { IdGen } from "../ids";
import { err, ok, type Result } from "../result";
import type { Snapshot } from "../types";

export interface OpContext { readonly newId: IdGen }
export type Op<C> = (s: Snapshot, cmd: C, ctx: OpContext) => Result<Applied>;

export const applied = (snapshot: Snapshot, extra: { created?: readonly string[]; removed?: readonly string[] } = {}): Result<Applied> =>
  ok({ snapshot, created: extra.created ?? [], removed: extra.removed ?? [] });

/** Trim + limite; devolve erro de validação como Result. */
export function text(label: string, v: string, max: number): Result<string> {
  const t = v.trim();
  if (!t) return err("invalid", `${label} não pode ser vazio`);
  if (t.length > max) return err("invalid", `${label} excede ${max} caracteres`);
  return ok(t);
}

export const DATA_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/;
export const DATA_LEAF = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
export const MODULE_FILE = /^[a-z0-9._-]+\.js$/i;
