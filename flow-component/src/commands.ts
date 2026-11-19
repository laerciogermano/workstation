import type { AgentKind, DataType, Snapshot } from "./types";

/** Campos editáveis de uma função (`patchFunction`). Ausente = não muda. */
export interface FunctionPatch {
  readonly title?: string;
  readonly context?: string | null;
  readonly code?: string | null;
  readonly agentId?: string | null;
  readonly respId?: string | null;
  readonly ins?: readonly string[];
  readonly outs?: readonly (readonly [string, string?])[];
  readonly loop?: readonly [string, string] | null;
  readonly cond?: { readonly test: string; readonly gotoId: string } | null;
  readonly onError?: string | null;
}

/** Um comando = nome estável + payload. Referências por IDR. */
export type ModelCommand =
  // §5.1 função e composição
  | { readonly type: "createFunction"; readonly planId: string; readonly title?: string; readonly context?: string }
  | { readonly type: "createChild"; readonly refId: string; readonly title?: string; readonly context?: string }
  | { readonly type: "createSibling"; readonly refId: string; readonly position: "after" | "before"; readonly title?: string; readonly context?: string; /** Entra só neste if (e nos que o contêm), não nos aninhados dentro dele. */ readonly structId?: string; /** Irmão à direita do bloco: fica fora dele (não herda o for/try, nem entra no if indicado por `structId`). */ readonly outside?: boolean; /** Com `before` numa função que tem o for: o novo item vira o primeiro do for (assume o laço; a função vira membro). */ readonly loopFirst?: boolean }
  | { readonly type: "renameFunction"; readonly id: string; readonly title: string }
  | { readonly type: "removeElements"; readonly ids: readonly string[] }
  | { readonly type: "duplicate"; readonly id: string }
  | { readonly type: "archive"; readonly id: string }
  | { readonly type: "unarchive"; readonly id: string }
  | { readonly type: "move"; readonly id: string; readonly refId: string; readonly mode: "child" | "after" | "before" }
  | { readonly type: "paste"; readonly ids: readonly string[]; readonly mode: "cut" | "copy"; readonly destId: string | null }
  | { readonly type: "patchFunction"; readonly id: string; readonly patch: FunctionPatch }
  | { readonly type: "setSelection"; readonly id: string; readonly on: boolean; /** Qual if (a função pode estar em vários): ligar cria um if aninhado; desligar remove este (padrão: o mais interno). */ readonly structId?: string }
  | { readonly type: "setRepetition"; readonly id: string; readonly on: boolean; /** Ligar: adiciona um for aninhado se já houver. Desligar: qual for (0 = externo; padrão: o mais interno). */ readonly index?: number }
  | { readonly type: "extendScope"; readonly id: string; readonly scope: "loop" | "if" | "try" | "catch"; readonly toId: string; /** Qual if (para scope "if"). */ readonly structId?: string }
  | { readonly type: "exitScope"; readonly id: string; readonly scope: "loop" | "if" | "try" | "catch"; /** Qual if (padrão: o mais interno que contém a função). */ readonly structId?: string }
  | { readonly type: "setParallel"; readonly a: string; readonly b: string; readonly on: boolean }
  | { readonly type: "setTryCatch"; readonly id: string; readonly on: boolean; /** Última função (irmã, depois de `id`) coberta pelo mesmo try. */ readonly through?: string }
  // §5.2 entrada / saída
  | { readonly type: "addInput"; readonly id: string; readonly name: string }
  | { readonly type: "removeInput"; readonly id: string; readonly name: string }
  | { readonly type: "addOutput"; readonly id: string; readonly name: string; readonly ref?: string }
  | { readonly type: "removeOutput"; readonly id: string; readonly name: string }
  | { readonly type: "setCond"; readonly id: string; readonly cond: { readonly test: string; readonly gotoId: string } | null; /** Qual if editar quando a função está em vários. */ readonly structId?: string }
  | { readonly type: "setCatch"; readonly id: string; readonly handlerId: string | null; /** Última função (irmã, depois de `id`) coberta pelo mesmo try. */ readonly through?: string }
  | { readonly type: "setLoopVars"; readonly id: string; readonly loop: readonly [string, string] | null; /** 0 = for externo (padrão); 1.. = for aninhado. */ readonly index?: number }
  // §5.3 dados
  | { readonly type: "createData"; readonly name: string; readonly dataType?: DataType }
  | { readonly type: "upsertData"; readonly name: string; readonly dataType?: DataType; readonly value?: string | null; readonly moduleFile?: string }
  | { readonly type: "clearDataValue"; readonly name: string }
  | { readonly type: "addDataChild"; readonly parent: string; readonly name: string }
  | { readonly type: "toggleCube"; readonly name: string }
  // §5.4 responsável · task · catálogo
  | { readonly type: "assignResponsible"; readonly id: string; readonly agentId: string | null }
  | { readonly type: "setTask"; readonly id: string; readonly task: string }
  | { readonly type: "createAgent"; readonly kind: Exclude<AgentKind, "arquivo" | "modelo">; readonly name: string; readonly sub?: string; readonly moduleFile?: string | null; readonly modelId?: string | null; readonly prompt?: string | null; readonly tasks?: readonly string[] }
  | { readonly type: "createPerson"; readonly name: string; readonly sub?: string }
  | { readonly type: "patchAgent"; readonly id: string; readonly patch: { readonly name?: string; readonly sub?: string; readonly modelId?: string | null; readonly prompt?: string | null; readonly photoUrl?: string | null; readonly tasks?: readonly string[] } }
  | { readonly type: "removeAgent"; readonly id: string }
  | { readonly type: "createModel"; readonly name: string; readonly api: string; readonly vendor: string; readonly color?: string }
  | { readonly type: "patchModel"; readonly id: string; readonly patch: { readonly name?: string; readonly api?: string; readonly vendor?: string; readonly color?: string } }
  | { readonly type: "removeModel"; readonly id: string }
  // §5.5 módulos
  | { readonly type: "createModule"; readonly file?: string }
  | { readonly type: "renameModule"; readonly id: string; readonly file: string }
  | { readonly type: "deleteModule"; readonly id: string };

/** Comandos que dependem de adapters do host (§5.6–5.7). */
export type EffectCommand =
  | { readonly type: "runPlan"; readonly planId: string }
  | { readonly type: "cancelRun"; readonly planId: string }
  | { readonly type: "completeStep"; readonly id: string }
  | { readonly type: "retryStep"; readonly id: string }
  | { readonly type: "runMachine"; readonly id: string }
  | { readonly type: "exportPlan"; readonly planId: string; readonly format: ExportFormat };

export type ExportFormat = "ir" | "js" | "ts" | "py";
export type Command = ModelCommand | EffectCommand;
export type CommandType = Command["type"];

/** Efeito de um comando de modelo aplicado. */
export interface Applied {
  readonly snapshot: Snapshot;
  /** IDRs criados (create*, duplicate, paste copy). */
  readonly created: readonly string[];
  /** IDRs removidos (removeElements e descendentes). */
  readonly removed: readonly string[];
}
