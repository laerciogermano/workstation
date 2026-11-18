import { z } from "zod";
import { DATA_TYPES } from "./types";

/** Contratos de entrada da API (Zod = fonte de verdade da interface). */
const text = (max: number) => z.string().trim().min(1).max(max);
const dataName = z.string().trim().min(1).max(160).regex(/^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/, "Use letras, números e _ (com . para campos filhos)");
const uuid = z.string().uuid();

export const registerBody = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(8).max(200), name: text(120) });
export const loginBody = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) });

export const createProjectBody = z.object({ name: text(120), demo: z.boolean().default(false) });
export const renameProjectBody = z.object({ name: text(120) });

export const createElementBody = z.object({
  mode: z.enum(["child", "after", "before", "root"]),
  refId: uuid.optional(),
  planId: uuid.optional(),
  title: text(200).optional(),
  context: z.string().max(2000).optional(),
});
const pair = z.tuple([z.string().trim().min(1).max(160), z.string().trim().min(1).max(160)]);
export const patchElementBody = z.object({
  title: text(200),
  context: z.string().max(2000).nullable(),
  agentId: uuid.nullable(),
  respId: uuid.nullable(),
  code: z.string().max(100_000).nullable(),
  archived: z.boolean(),
  loop: pair.nullable(),
  cond: z.object({ test: dataName, gotoId: uuid }).nullable(),
  ins: z.array(dataName).max(50),
  outs: z.array(z.tuple([dataName, z.string().max(300)])).max(50),
}).partial().strict();
export const moveElementBody = z.object({ refId: uuid, mode: z.enum(["child", "after", "before"]) });
export const pasteBody = z.object({ ids: z.array(uuid).min(1).max(100), mode: z.enum(["cut", "copy"]), destId: uuid.nullable() });
export const edgeIfBody = z.object({ fromId: uuid, toId: uuid });
export const edgeLoopBody = z.object({ toId: uuid });
export const parallelBody = z.object({ a: uuid, b: uuid, on: z.boolean() });

export const upsertDataBody = z.object({
  name: dataName,
  type: z.enum(DATA_TYPES as [string, ...string[]]).optional(),
  value: z.string().max(10_000).nullable().optional(),
  moduleFile: z.string().trim().min(1).max(120).regex(/^[a-z0-9._-]+\.js$/i, "Use um nome como estado.data.js").optional(),
});
export const addDataKidBody = z.object({ parent: dataName, name: z.string().trim().min(1).max(60).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/) });
export const toggleCubeBody = z.object({ name: dataName });

export const createAgentBody = z.object({
  kind: z.enum(["ia", "pessoa", "maquina", "script"]), name: text(120), sub: z.string().trim().max(200).default(""),
  moduleFile: z.string().trim().max(120).nullable().optional(), modelId: uuid.nullable().optional(), prompt: z.string().max(8000).nullable().optional(),
});
export const patchAgentBody = z.object({
  name: text(120), sub: z.string().trim().max(200), modelId: uuid.nullable(), prompt: z.string().max(8000).nullable(),
  photoUrl: z.string().max(400_000).regex(/^data:image\/(png|jpe?g|webp);base64,/).nullable(),
}).partial().strict();
export const createModelBody = z.object({ name: text(120), api: text(120), vendor: text(120), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#8a8a8a") });
export const patchModelBody = createModelBody.partial().strict();

export const createModuleBody = z.object({ file: z.string().trim().min(1).max(120).regex(/^[a-z0-9._-]+\.js$/i, "Use um nome como proposta.layer.js") });
export const patchModuleBody = createModuleBody;

export const exportQuery = z.object({ format: z.enum(["ir", "js", "ts", "py"]).default("js") });
export const runPlanBody = z.object({ planId: uuid });

export type RegisterBody = z.infer<typeof registerBody>;
export type PatchElementBody = z.infer<typeof patchElementBody>;
export type UpsertDataBody = z.infer<typeof upsertDataBody>;
