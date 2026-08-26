import type { PlansView, WorkUnitLabel } from "./types.js";

const LABELS: Record<PlansView, WorkUnitLabel> = {
  board: "card",
  gantt: "tarefa",
  tree: "atividade",
  explore: "arquivo",
};

/** Rótulo da unidade conforme a visão (mesmo WorkUnit). */
export function labelForView(view: PlansView): WorkUnitLabel {
  return LABELS[view];
}
