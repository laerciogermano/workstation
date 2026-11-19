import type { Command } from "../commands";
import type { FlowElement } from "../types";
import type { Scene } from "./scene";

/**
 * Regras ÚNICAS dos blocos (if · for · try · catch).
 * Tudo que a tag/linha de um bloco faz passa por aqui, então mudar uma regra muda em todos:
 *  - o filho entra no lugar exato do cabeçalho (primeira posição, logo abaixo da tag);
 *  - "condição" cobre os mesmos membros do bloco;
 *  - "irmão à direita" nasce fora do bloco, depois do último membro.
 */
export type BlockKind = "if" | "loop" | "try" | "catch";
export interface Block { readonly kind: BlockKind; readonly head: FlowElement; readonly ids: readonly string[]; readonly structId?: string }

/** Membros do bloco, sempre na ordem em que aparecem no fluxo. */
function membersOf(S: Scene, kind: BlockKind, head: FlowElement, structId?: string): string[] {
  const els = S.snap.elements.filter(e => !e.archived && e.kind !== "data");
  const ids = kind === "if" ? [...(S.structs.find(x => x.id === structId)?.body ?? [head.id])]
    : kind === "loop" ? els.filter(e => e.id === head.id || e.inLoop === head.id).map(e => e.id)
    : kind === "try" ? S.tryBlockOf(head).map(e => e.id)
    : [head.id, ...els.filter(e => e.inCatch === head.id).map(e => e.id)];
  return ids.sort((a, b) => (S.idx[a] ?? 0) - (S.idx[b] ?? 0) || (S.u(a)?.position ?? 0) - (S.u(b)?.position ?? 0));
}

export const blockOf = (S: Scene, kind: BlockKind, head: FlowElement, structId?: string): Block => ({ kind, head, ids: membersOf(S, kind, head, structId), ...(structId ? { structId } : {}) });

const firstId = (b: Block): string => b.ids[0] ?? b.head.id;
const lastId = (b: Block): string => b.ids.at(-1) ?? b.head.id;

/** Filho do bloco: nasce antes do primeiro membro, herdando o escopo (if / for / try / catch) dele. */
export const addChildCmd = (b: Block): Command => ({
  type: "createSibling", refId: firstId(b), position: "before",
  ...(b.kind === "if" && b.structId ? { structId: b.structId } : {}), ...(b.kind === "loop" ? { loopFirst: true } : {}),
});

/** Irmão à direita: depois do último membro e fora do bloco. */
export const addSiblingOutsideCmd = (b: Block): Command => ({
  type: "createSibling", refId: lastId(b), position: "after", outside: true, ...(b.kind === "if" && b.structId ? { structId: b.structId } : {}),
});

/** Condição (if) cobrindo exatamente os membros do bloco: if no primeiro, estendido até o último. */
export const addIfCmds = (b: Block): Command[] => [
  { type: "setSelection", id: firstId(b), on: true },
  ...(lastId(b) !== firstId(b) ? [{ type: "extendScope", id: firstId(b), scope: "if", toId: lastId(b) } as Command] : []),
];
