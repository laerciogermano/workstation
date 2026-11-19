import { sv } from "./dom";

/** Ícones (traço estilo Lucide, viewBox 24). */
const P: Record<string, string[]> = {
  plus: ["M5 12h14", "M12 5v14"], minus: ["M5 12h14"], x: ["M18 6 6 18", "m6 6 12 12"],
  "trash-2": ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", "M10 11v6", "M14 11v6"],
  pencil: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"],
  "chevron-down": ["m6 9 6 6 6-6"],
  diamond: ["M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"],
  repeat: ["m17 2 4 4-4 4", "M3 11v-1a4 4 0 0 1 4-4h14", "m7 22-4-4 4-4", "M21 13v1a4 4 0 0 1-4 4H3"],
  "maximize-2": ["M15 3h6v6", "m21 3-7 7", "m3 21 7-7", "M9 21H3v-6"],
  "user-round": ["M20 21a8 8 0 0 0-16 0", "circle:12,8,5"],
  "user-round-cog": ["M2 21a8 8 0 0 1 10.434-7.62", "circle:10,8,5", "circle:18,18,3", "M18 14v1", "M18 21v1", "M22 18h-1", "M15 18h-1"],
  package: ["m7.5 4.27 9 5.15", "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z", "m3.3 7 8.7 5 8.7-5", "M12 22V12"],
  bot: ["M12 8V4H8", "rect:4,8,16,12,2", "M2 14h2", "M20 14h2", "M15 13v2", "M9 13v2"],
  "file-code-2": ["M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4", "M14 2v4a2 2 0 0 0 2 2h4", "m5 12-3 3 3 3", "m9 18 3-3-3-3"],
  network: ["rect:16,16,6,6,1", "rect:2,16,6,6,1", "rect:9,2,6,6,1", "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", "M12 12V8"],
  "between-horizontal-end": ["rect:3,3,13,7,1", "m22 15-3-3 3-3", "rect:3,14,13,7,1"],
  "chevrons-down-up": ["m7 20 5-5 5 5", "m7 4 5 5 5-5"], "chevrons-up-down": ["m7 15 5 5 5-5", "m7 9 5-5 5 5"],
  "rows-3": ["rect:3,3,18,18,2", "M21 9H3", "M21 15H3"], "chart-gantt": ["M10 6h8", "M12 16h6", "M16 11h4", "M3 3v16a2 2 0 0 0 2 2h16"],
  type: ["M12 4v16", "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2", "M9 20h6"],
  layers: ["m12 2 10 5-10 5L2 7Z", "M2 17l10 5 10-5", "M2 12l10 5 10-5"], "list-plus": ["M11 12H3", "M16 6H3", "M16 18H3", "M18 9v6", "M21 12h-6"],
  "indent-increase": ["M21 12H11", "M21 6H11", "M21 18H11", "m3 8 4 4-4 4"], "indent-decrease": ["M21 12H11", "M21 6H11", "M21 18H11", "m7 8-4 4 4 4"],
  expand: ["M8 3H5a2 2 0 0 0-2 2v3", "M21 8V5a2 2 0 0 0-2-2h-3", "M3 16v3a2 2 0 0 0 2 2h3", "M16 21h3a2 2 0 0 0 2-2v-3"],
  shrink: ["M8 3v3a2 2 0 0 1-2 2H3", "M21 8h-3a2 2 0 0 1-2-2V3", "M3 16h3a2 2 0 0 1 2 2v3", "M16 21v-3a2 2 0 0 1 2-2h3"],
  "shield-alert": ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M12 8v4", "M12 16h.01"],
  "shield-plus": ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M9 12h6", "M12 9v6"],
  "arrow-down-to-line": ["M12 17V3", "m6 11 6 6 6-6", "M19 21H5"],
  "arrow-down-wide-narrow": ["m3 16 4 4 4-4", "M7 20V4", "M11 4h10", "M11 8h7", "M11 12h4"],
  workflow: ["rect:3,3,8,8,2", "M7 11v4a2 2 0 0 0 2 2h4", "rect:13,13,8,8,2"],
};

export function icon(name: string): SVGElement {
  const svg = sv("svg", { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" });
  for (const d of P[name] ?? []) {
    if (d.startsWith("circle:")) { const [cx, cy, r] = d.slice(7).split(","); svg.append(sv("circle", { cx, cy, r })); }
    else if (d.startsWith("rect:")) { const [x, y, w, hh, rx] = d.slice(5).split(","); svg.append(sv("rect", { x, y, width: w, height: hh, rx })); }
    else svg.append(sv("path", { d }));
  }
  return svg;
}
export const KIND_ICON: Record<string, string> = { arquivo: "file-code-2", maquina: "package", pessoa: "user-round", ia: "user-round-cog", modelo: "bot", script: "file-code-2" };
export const KIND_LABEL: Record<string, string> = { arquivo: "Arquivos", maquina: "Libs Node.js", pessoa: "Pessoas", ia: "Agentes", modelo: "Modelos", script: "Scripts" };
export const KIND_ONE: Record<string, string> = { arquivo: "Arquivo", maquina: "Lib", pessoa: "Pessoa", ia: "Agente", modelo: "Modelo", script: "Script" };
