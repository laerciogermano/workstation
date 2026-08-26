import type { WorkUnit } from "../domain/types.js";

export interface WorkUnitRepository {
  save(unit: WorkUnit): Promise<void>;
  findById(id: string): Promise<WorkUnit | null>;
  /** Inclui arquivadas; exclui soft-deleted por padrão. */
  list(options?: { includeDeleted?: boolean }): Promise<WorkUnit[]>;
  deletePermanently(ids: string[]): Promise<void>;
}

export class InMemoryWorkUnitRepository implements WorkUnitRepository {
  private readonly store = new Map<string, WorkUnit>();

  async save(unit: WorkUnit): Promise<void> {
    this.store.set(unit.id, structuredClone(unit));
  }

  async findById(id: string): Promise<WorkUnit | null> {
    const unit = this.store.get(id);
    return unit ? structuredClone(unit) : null;
  }

  async list(options?: { includeDeleted?: boolean }): Promise<WorkUnit[]> {
    const includeDeleted = options?.includeDeleted ?? false;
    return [...this.store.values()]
      .filter((u) => includeDeleted || u.deletedAt === null)
      .map((u) => structuredClone(u));
  }

  async deletePermanently(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.store.delete(id);
    }
  }
}
