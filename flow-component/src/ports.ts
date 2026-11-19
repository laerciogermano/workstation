import type { ExportFormat } from "./commands";
import type { Result } from "./result";
import type { Snapshot } from "./types";

/** Adapter de persistência do snapshot (memória, HTTP, IndexedDB…). */
export interface ModelStore {
  get(): Snapshot;
  set(next: Snapshot): void | Promise<void>;
}
/** Execução: a lib define o contrato; o runtime é do host. */
export interface Runner {
  runPlan(planId: string, snapshot: Snapshot): Promise<Result<void>>;
  cancelRun(planId: string): Promise<Result<void>>;
  completeStep(id: string, snapshot: Snapshot): Promise<Result<void>>;
  retryStep(id: string, snapshot: Snapshot): Promise<Result<void>>;
  runMachine(id: string, snapshot: Snapshot): Promise<Result<void>>;
}
/** Geradores IR / JS / TS / Py podem viver noutro pacote. */
export interface Exporter {
  export(planId: string, format: ExportFormat, snapshot: Snapshot): Promise<Result<string>>;
}

export const memoryStore = (initial: Snapshot): ModelStore => {
  let cur = initial;
  return { get: () => cur, set: next => { cur = next; } };
};
