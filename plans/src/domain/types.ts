export type WorkUnitLifecycle = "active" | "archived";

export type PlansView = "board" | "gantt" | "tree" | "explore";

export type WorkUnitLabel = "card" | "tarefa" | "atividade" | "arquivo";

export interface WorkUnit {
  readonly id: string;
  title: string;
  lifecycle: WorkUnitLifecycle;
  parentId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class PlansError extends Error {
  constructor(
    message: string,
    readonly code:
      | "TITLE_REQUIRED"
      | "NOT_FOUND"
      | "MERGE_UNSUPPORTED"
      | "ALREADY_ARCHIVED"
      | "NOT_ARCHIVED"
      | "ALREADY_DELETED",
  ) {
    super(message);
    this.name = "PlansError";
  }
}
