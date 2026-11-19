import { createFlowComponent, memoryStore, sequentialGen, type Command, type Outcome, type Snapshot } from "../src";

export const empty = (): Snapshot => ({
  plans: [{ id: "p1", name: "Plano", position: 0 }],
  elements: [{
    id: "root", planId: "p1", parentId: null, kind: "folder", title: "Raiz", context: null, agentId: null, respId: null, status: null,
    error: null, progress: null, loop: null, cond: null, code: null, archived: false, position: 0, ins: [], outs: [],
  }],
  links: [], structs: [], agents: [], models: [], modules: [], data: [],
});

/** Componente de teste: ids determinísticos, store em memória; `run` falha alto se o comando der erro. */
export function harness(initial: Snapshot = empty()) {
  const store = memoryStore(initial);
  const c = createFlowComponent({ store, newId: sequentialGen("n") });
  return {
    c, store,
    async run(cmd: Command): Promise<Extract<Outcome, { kind: "model" }>> {
      const r = await c.execute(cmd);
      if (!r.ok) throw new Error(`${cmd.type}: ${r.error.code} ${r.error.message}`);
      if (r.value.kind !== "model") throw new Error("esperava model");
      return r.value;
    },
    get s() { return store.get(); },
    el: (id: string) => store.get().elements.find(e => e.id === id)!,
  };
}
