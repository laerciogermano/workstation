import type { Applied, ModelCommand } from "./commands";
import type { Result } from "./result";
import type { Snapshot } from "./types";
import * as catalog from "./ops/catalog";
import { type Op, type OpContext } from "./ops/context";
import * as data from "./ops/data";
import * as fn from "./ops/fn";
import * as tree from "./ops/tree";

type Handlers = { readonly [K in ModelCommand["type"]]: Op<Extract<ModelCommand, { type: K }>> };

/** Tabela exaustiva: o compilador exige um handler por comando do contrato. */
const handlers: Handlers = {
  createFunction: tree.createFunction, createChild: tree.createChild, createSibling: tree.createSibling,
  renameFunction: tree.renameFunction, removeElements: tree.removeElements, duplicate: tree.duplicate,
  archive: tree.archive, unarchive: tree.unarchive, move: tree.move, paste: tree.paste,
  patchFunction: fn.patchFunction, setSelection: fn.setSelection, setRepetition: fn.setRepetition, setParallel: tree.setParallel, exitScope: fn.exitScope, extendScope: fn.extendScope, setTryCatch: fn.setTryCatch, setCatch: fn.setCatch,
  addInput: fn.addInput, removeInput: fn.removeInput, addOutput: fn.addOutput, removeOutput: fn.removeOutput,
  setCond: fn.setCond, setLoopVars: fn.setLoopVars,
  createData: data.createData, upsertData: data.upsertData, clearDataValue: data.clearDataValue, addDataChild: data.addDataChild, toggleCube: data.toggleCube,
  assignResponsible: fn.assignResponsible, setTask: fn.setTask,
  createAgent: catalog.createAgent, createPerson: catalog.createPerson, patchAgent: catalog.patchAgent, removeAgent: catalog.removeAgent,
  createModel: catalog.createModel, patchModel: catalog.patchModel, removeModel: catalog.removeModel,
  createModule: catalog.createModule, renameModule: catalog.renameModule, deleteModule: catalog.deleteModule,
};

export const MODEL_COMMAND_TYPES = Object.keys(handlers) as readonly ModelCommand["type"][];

/** Núcleo puro: (snapshot, comando) → novo snapshot. Não muta a entrada, não faz I/O. */
export function applyModelCommand(snapshot: Snapshot, command: ModelCommand, ctx: OpContext): Result<Applied> {
  const handler = handlers[command.type] as Op<ModelCommand>;
  return handler(snapshot, command, ctx);
}
