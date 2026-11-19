import type { Applied, Command, CommandType, EffectCommand, ModelCommand } from "./commands";
import { applyModelCommand, MODEL_COMMAND_TYPES } from "./execute";
import { uuidGen, type IdGen } from "./ids";
import type { Exporter, ModelStore, Runner } from "./ports";
import { err, ok, type Result } from "./result";
import type { Snapshot } from "./types";

export const EFFECT_COMMAND_TYPES = ["runPlan", "cancelRun", "completeStep", "retryStep", "runMachine", "exportPlan"] as const satisfies readonly EffectCommand["type"][];

export type ModelOutcome = { readonly kind: "model" } & Applied;
export type EffectOutcome = { readonly kind: "effect"; /** Saída textual (ex.: código exportado). */ readonly output: string | null };
export type Outcome = ModelOutcome | EffectOutcome;

/** Payload de um comando, sem o discriminante `type`. */
export type CommandInput<K extends CommandType> = Omit<Extract<Command, { type: K }>, "type">;
export type OutcomeOf<K extends CommandType> = K extends ModelCommand["type"] ? ModelOutcome : EffectOutcome;
/** Uma função tipada por comando: `flow.createChild({ refId, title })`. Sem campos obrigatórios, o argumento é opcional. */
export type FlowApi = {
  readonly [K in CommandType]: {} extends CommandInput<K>
    ? (input?: CommandInput<K>) => Promise<Result<OutcomeOf<K>>>
    : (input: CommandInput<K>) => Promise<Result<OutcomeOf<K>>>;
};

export interface FlowComponentOptions {
  readonly store: ModelStore;
  readonly newId?: IdGen;
  readonly runner?: Runner;
  readonly exporter?: Exporter;
  /** Comandos que o host optou por não expor: o contrato permanece, a execução é recusada. */
  readonly disabled?: Iterable<CommandType>;
}

export interface FlowComponent extends FlowApi {
  readonly snapshot: Snapshot;
  /** Comando existe, não foi desabilitado e o adapter necessário foi injetado. */
  can(type: CommandType): boolean;
  execute(command: Command): Promise<Result<Outcome>>;
  /** Avisa após cada comando de modelo aplicado. Devolve a função de cancelar. */
  subscribe(listener: (snapshot: Snapshot) => void): () => void;
}

export function createFlowComponent(opts: FlowComponentOptions): FlowComponent {
  const newId = opts.newId ?? uuidGen;
  const disabled = new Set<CommandType>(opts.disabled);
  const listeners = new Set<(s: Snapshot) => void>();
  const isModel = (c: Command): c is ModelCommand => (MODEL_COMMAND_TYPES as readonly string[]).includes(c.type);
  const supported = (t: CommandType): boolean =>
    (MODEL_COMMAND_TYPES as readonly string[]).includes(t) || (t === "exportPlan" ? !!opts.exporter : !!opts.runner);

  const runEffect = (c: EffectCommand, snap: Snapshot): Promise<Result<Outcome>> => {
    const done = (r: Result<void>): Result<Outcome> => (r.ok ? ok({ kind: "effect", output: null }) : r);
    switch (c.type) {
      case "runPlan": return opts.runner!.runPlan(c.planId, snap).then(done);
      case "cancelRun": return opts.runner!.cancelRun(c.planId).then(done);
      case "completeStep": return opts.runner!.completeStep(c.id, snap).then(done);
      case "retryStep": return opts.runner!.retryStep(c.id, snap).then(done);
      case "runMachine": return opts.runner!.runMachine(c.id, snap).then(done);
      case "exportPlan": return opts.exporter!.export(c.planId, c.format, snap).then(r => (r.ok ? ok({ kind: "effect", output: r.value }) : r));
    }
  };

  const execute = async (command: Command): Promise<Result<Outcome>> => {
    if (disabled.has(command.type)) return err("disabled", `Comando "${command.type}" desabilitado pelo host`);
    if (!supported(command.type)) return err("unsupported", `Comando "${command.type}" exige adapter não injetado`);
    const snap = opts.store.get();
    try {
      if (!isModel(command)) return await runEffect(command, snap);
      const r = applyModelCommand(snap, command, { newId });
      if (!r.ok) return r;
      await opts.store.set(r.value.snapshot);
      listeners.forEach(l => l(r.value.snapshot));
      return ok({ kind: "model", ...r.value });
    } catch (e) {
      return err("failed", e instanceof Error ? e.message : String(e));
    }
  };

  // uma função por comando, geradas da mesma tabela do contrato
  const api = Object.fromEntries(
    [...MODEL_COMMAND_TYPES, ...EFFECT_COMMAND_TYPES].map(type => [type, (input?: object) => execute({ type, ...input } as Command)]),
  ) as unknown as FlowApi;

  return {
    ...api,
    get snapshot() { return opts.store.get(); },
    subscribe(l) { listeners.add(l); return () => { listeners.delete(l); }; },
    can: t => !disabled.has(t) && supported(t),
    execute: execute as FlowComponent["execute"],
  };
}
