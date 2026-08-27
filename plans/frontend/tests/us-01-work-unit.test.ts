import { describe, expect, it } from "vitest";
import {
  InMemoryWorkUnitRepository,
  PlansError,
  WorkUnitService,
  labelForView,
} from "../src/index.js";

function createService() {
  return new WorkUnitService(new InMemoryWorkUnitRepository());
}

describe("US-01 Criar e gerir unidade de trabalho", () => {
  it("cria unidade com título e lifecycle active", async () => {
    const service = createService();
    const unit = await service.create({ title: "Entregar proposta" });

    expect(unit.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    expect(unit.title).toBe("Entregar proposta");
    expect(unit.lifecycle).toBe("active");
    expect(unit.parentId).toBeNull();
    expect(unit.deletedAt).toBeNull();
  });

  it("rejeita criação sem título", async () => {
    const service = createService();
    await expect(service.create({ title: "   " })).rejects.toMatchObject({
      code: "TITLE_REQUIRED",
    } satisfies Partial<PlansError>);
  });

  it("atualiza título", async () => {
    const service = createService();
    const unit = await service.create({ title: "Antes" });
    const updated = await service.updateTitle(unit.id, "Depois");
    expect(updated.title).toBe("Depois");
    expect((await service.get(unit.id))?.title).toBe("Depois");
  });

  it("arquiva e desarquiva", async () => {
    const service = createService();
    const unit = await service.create({ title: "Fluxo" });

    const archived = await service.archive(unit.id);
    expect(archived.lifecycle).toBe("archived");
    expect(await service.listActive()).toHaveLength(0);
    expect(await service.listForExplore()).toHaveLength(1);

    const active = await service.unarchive(unit.id);
    expect(active.lifecycle).toBe("active");
    expect(await service.listActive()).toHaveLength(1);
  });

  it("remove unidade e subárvore em cascata", async () => {
    const service = createService();
    const root = await service.create({ title: "Raiz" });
    const child = await service.create({ title: "Filho", parentId: root.id });
    const grand = await service.create({ title: "Neto", parentId: child.id });
    const sibling = await service.create({ title: "Irmão" });

    await service.delete(root.id);

    expect(await service.get(root.id)).toBeNull();
    expect(await service.get(child.id)).toBeNull();
    expect(await service.get(grand.id)).toBeNull();
    expect(await service.get(sibling.id)).not.toBeNull();
    expect(await service.listForExplore()).toHaveLength(1);
  });

  it("usa o mesmo id em todas as visões com rótulos distintos", async () => {
    const service = createService();
    const unit = await service.create({ title: "Única" });

    expect(labelForView("board")).toBe("card");
    expect(labelForView("gantt")).toBe("tarefa");
    expect(labelForView("tree")).toBe("atividade");
    expect(labelForView("explore")).toBe("arquivo");
    expect(service.labelInView("board")).toBe("card");

    // Mesmo WorkUnit independente da visão
    expect((await service.get(unit.id))?.id).toBe(unit.id);
  });

  it("não oferece merge em v1", () => {
    const service = createService();
    expect(() => service.merge("a", "b")).toThrowError(
      expect.objectContaining({ code: "MERGE_UNSUPPORTED" }),
    );
  });
});
