/** Tipos do domínio Flow (contrato único entre API e web). Nomes de código em inglês; rótulos de UI ficam no front. */
/** Responsável = arquivo | lib (maquina) | pessoa | agente (ia) | modelo. `script` só existe dentro de um arquivo. `arquivo`/`modelo` são virtuais: ids `file:<módulo>` e `md:<modelo>`. */
export type AgentKind = "ia" | "pessoa" | "maquina" | "script" | "arquivo" | "modelo";
export type ElementKind = "folder" | "file" | "data";
export type RunStatus = "pendente" | "exec" | "ok" | "fail" | "cancel" | "wait";
export type DataType = "texto" | "numero" | "inteiro" | "booleano" | "data" | "lista" | "objeto" | "arquivo";
export type LinkKind = "seq" | "par";
export type ModuleItemKind = "fn" | "dado" | "script";

export interface PlanDto { id: string; name: string; position: number }
export interface ElementDto {
  id: string; // IDR (uuidv7)
  planId: string;
  parentId: string | null;
  kind: ElementKind;
  title: string;
  context: string | null;
  agentId: string | null;
  respId: string | null;
  status: RunStatus | null;
  error: string | null;
  progress: number | null;
  loop: [string, string] | null;
  cond: [string, string] | null; // [dado testado, id da função para onde volta (senão)]
  code: string | null;
  archived: boolean;
  position: number;
  ins: string[];
  outs: [string, string][]; // [nome, referência de saída]
}
export interface LinkDto { from: string; to: string; kind: LinkKind }
export interface StructDto { id: string; test: string; body: string[] }
export interface AgentDto {
  id: string; kind: AgentKind; name: string; sub: string; moduleFile: string | null;
  modelId: string | null; prompt: string | null; photoUrl: string | null;
  /** Tasks obrigatórias do responsável. Lib Node = métodos (ex.: node:http → get/post/…). */
  tasks: string[];
}
export interface ModelDto { id: string; name: string; api: string; vendor: string; color: string }
export interface ModuleItemDto { kind: ModuleItemKind; ref: string }
export interface ModuleDto { id: string; file: string; items: ModuleItemDto[] }
export interface DataDto { name: string; type: DataType; value: string | null; position: number }
export interface ProjectMeta { id: string; name: string; updatedAt: string }
export interface Snapshot {
  project: ProjectMeta;
  plans: PlanDto[];
  elements: ElementDto[];
  links: LinkDto[];
  structs: StructDto[];
  agents: AgentDto[];
  models: ModelDto[];
  modules: ModuleDto[];
  data: DataDto[];
}
export interface UserDto { id: string; email: string | null; name: string; guest: boolean }

export const DATA_TYPES: DataType[] = ["texto", "numero", "inteiro", "booleano", "data", "lista", "objeto", "arquivo"];
export const DTYPE_N: Record<DataType, string> = {
  texto: "Texto", numero: "Número", inteiro: "Inteiro", booleano: "Booleano", data: "Data", lista: "Lista", objeto: "Objeto", arquivo: "Arquivo",
};
export const TYPE_INFO: Record<AgentKind, { n: string; one: string; ic: string }> = {
  arquivo: { n: "Arquivos", one: "Arquivo", ic: "file-code-2" },
  maquina: { n: "Libs Node.js", one: "Lib", ic: "package" },
  pessoa: { n: "Pessoas", one: "Pessoa", ic: "user-round" },
  ia: { n: "Agentes", one: "Agente", ic: "user-round-cog" },
  modelo: { n: "Modelos", one: "Modelo", ic: "bot" },
  script: { n: "Scripts", one: "Script", ic: "file-code-2" }, // interno ao arquivo — não entra no picker de responsável
};
/** Tipos que podem ser responsável de uma etapa (ordem do seletor). */
export const RESP_KINDS: AgentKind[] = ["arquivo", "maquina", "pessoa", "ia", "modelo"];
export const FILE_AGENT = "file:", MODEL_AGENT = "md:";
