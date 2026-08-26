import {
  PlansError,
  type PlansView,
  type WorkUnit,
  type WorkUnitLabel,
} from "../domain/types.js";
import { labelForView } from "../domain/view-label.js";
import type { WorkUnitRepository } from "../repository/work-unit-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) {
    throw new PlansError("Título é obrigatório", "TITLE_REQUIRED");
  }
  return trimmed;
}

export class WorkUnitService {
  constructor(private readonly repo: WorkUnitRepository) {}

  async create(input: { title: string; parentId?: string | null }): Promise<WorkUnit> {
    const title = requireTitle(input.title);
    if (input.parentId) {
      await this.requireActiveOrArchived(input.parentId);
    }
    const ts = nowIso();
    const unit: WorkUnit = {
      id: crypto.randomUUID(),
      title,
      lifecycle: "active",
      parentId: input.parentId ?? null,
      deletedAt: null,
      createdAt: ts,
      updatedAt: ts,
    };
    await this.repo.save(unit);
    return unit;
  }

  async updateTitle(id: string, title: string): Promise<WorkUnit> {
    const unit = await this.requireNotDeleted(id);
    unit.title = requireTitle(title);
    unit.updatedAt = nowIso();
    await this.repo.save(unit);
    return unit;
  }

  async archive(id: string): Promise<WorkUnit> {
    const unit = await this.requireNotDeleted(id);
    if (unit.lifecycle === "archived") {
      throw new PlansError("Unidade já arquivada", "ALREADY_ARCHIVED");
    }
    unit.lifecycle = "archived";
    unit.updatedAt = nowIso();
    await this.repo.save(unit);
    return unit;
  }

  async unarchive(id: string): Promise<WorkUnit> {
    const unit = await this.requireNotDeleted(id);
    if (unit.lifecycle !== "archived") {
      throw new PlansError("Unidade não está arquivada", "NOT_ARCHIVED");
    }
    unit.lifecycle = "active";
    unit.updatedAt = nowIso();
    await this.repo.save(unit);
    return unit;
  }

  /** Remove a unidade e toda a subárvore em todas as visões (mesmo id). */
  async delete(id: string): Promise<void> {
    const unit = await this.requireNotDeleted(id);
    const ids = await this.collectSubtreeIds(unit.id);
    const ts = nowIso();
    for (const childId of ids) {
      const child = await this.repo.findById(childId);
      if (!child || child.deletedAt) continue;
      child.deletedAt = ts;
      child.updatedAt = ts;
      await this.repo.save(child);
    }
  }

  async get(id: string): Promise<WorkUnit | null> {
    const unit = await this.repo.findById(id);
    if (!unit || unit.deletedAt) return null;
    return unit;
  }

  /** Fluxo ativo: só lifecycle active e não deletadas. */
  async listActive(): Promise<WorkUnit[]> {
    const all = await this.repo.list();
    return all.filter((u) => u.lifecycle === "active");
  }

  /** Explorar: active + archived; sem deletadas. */
  async listForExplore(): Promise<WorkUnit[]> {
    return this.repo.list();
  }

  labelInView(view: PlansView): WorkUnitLabel {
    return labelForView(view);
  }

  /** Merge fora de escopo v1. */
  merge(_a: string, _b: string): never {
    throw new PlansError("Merge de unidades não está disponível em v1", "MERGE_UNSUPPORTED");
  }

  private async requireNotDeleted(id: string): Promise<WorkUnit> {
    const unit = await this.repo.findById(id);
    if (!unit) {
      throw new PlansError(`Unidade ${id} não encontrada`, "NOT_FOUND");
    }
    if (unit.deletedAt) {
      throw new PlansError(`Unidade ${id} já foi removida`, "ALREADY_DELETED");
    }
    return unit;
  }

  private async requireActiveOrArchived(id: string): Promise<WorkUnit> {
    return this.requireNotDeleted(id);
  }

  private async collectSubtreeIds(rootId: string): Promise<string[]> {
    const all = await this.repo.list({ includeDeleted: true });
    const byParent = new Map<string | null, string[]>();
    for (const u of all) {
      if (u.deletedAt) continue;
      const key = u.parentId;
      const list = byParent.get(key) ?? [];
      list.push(u.id);
      byParent.set(key, list);
    }
    const result: string[] = [];
    const stack = [rootId];
    while (stack.length) {
      const current = stack.pop()!;
      result.push(current);
      for (const child of byParent.get(current) ?? []) {
        stack.push(child);
      }
    }
    return result;
  }
}
