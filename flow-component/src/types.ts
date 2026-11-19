/**
 * Modelo de domínio do grafo Flow (espelha `@flow/shared` do Flow.dev).
 * Tudo `readonly`: a lib nunca muta o snapshot recebido.
 * Identidade por IDR (string opaca); o nome é só rótulo.
 */
export type AgentKind = "ia" | "pessoa" | "maquina" | "script" | "arquivo" | "modelo";
export type ElementKind = "folder" | "file" | "data";
export type RunStatus = "pendente" | "exec" | "ok" | "fail" | "cancel" | "wait";
export type DataType = "texto" | "numero" | "inteiro" | "booleano" | "data" | "lista" | "objeto" | "arquivo";
export type LinkKind = "seq" | "par";
export type ModuleItemKind = "fn" | "dado" | "script";

export const DATA_TYPES = ["texto", "numero", "inteiro", "booleano", "data", "lista", "objeto", "arquivo"] as const satisfies readonly DataType[];
export const FILE_AGENT = "file:";
export const MODEL_AGENT = "md:";

export interface Plan { readonly id: string; readonly name: string; readonly position: number }
export interface FlowElement {
  readonly id: string;
  readonly planId: string;
  readonly parentId: string | null;
  readonly kind: ElementKind;
  readonly title: string;
  readonly context: string | null;
  readonly agentId: string | null;
  readonly respId: string | null;
  readonly status: RunStatus | null;
  readonly error: string | null;
  readonly progress: number | null;
  /** [variável, coleção] do `for`. */
  readonly loop: readonly [string, string] | null;
  /** [dado testado, id da função para onde volta] do `if`. */
  readonly cond: readonly [string, string] | null;
  /** try/catch: id da função que trata a falha desta função (ou de toda a composição). Ausente = sem try. */
  readonly onError?: string | null;
  readonly code: string | null;
  readonly archived: boolean;
  readonly position: number;
  readonly ins: readonly string[];
  /** [nome, referência de saída]. */
  readonly outs: readonly (readonly [string, string])[];
}
export interface Link { readonly from: string; readonly to: string; readonly kind: LinkKind }
export interface Struct { readonly id: string; readonly test: string; readonly body: readonly string[] }
export interface Agent {
  readonly id: string;
  readonly kind: AgentKind;
  readonly name: string;
  readonly sub: string;
  readonly moduleFile: string | null;
  readonly modelId: string | null;
  readonly prompt: string | null;
  readonly photoUrl: string | null;
  readonly tasks: readonly string[];
}
export interface Model { readonly id: string; readonly name: string; readonly api: string; readonly vendor: string; readonly color: string }
export interface ModuleItem { readonly kind: ModuleItemKind; readonly ref: string }
export interface FlowModule { readonly id: string; readonly file: string; readonly items: readonly ModuleItem[] }
export interface DataDef { readonly name: string; readonly type: DataType; readonly value: string | null; readonly position: number }

export interface Snapshot {
  readonly plans: readonly Plan[];
  readonly elements: readonly FlowElement[];
  readonly links: readonly Link[];
  readonly structs: readonly Struct[];
  readonly agents: readonly Agent[];
  readonly models: readonly Model[];
  readonly modules: readonly FlowModule[];
  readonly data: readonly DataDef[];
}
