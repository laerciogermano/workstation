/** Ícones (traço estilo Lucide, viewBox 24) como strings SVG. */
const P: Record<string, string[]> = {
  plus: ["M5 12h14", "M12 5v14"], minus: ["M5 12h14"], x: ["M18 6 6 18", "m6 6 12 12"],
  trash: ["M3 6h18", "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", "M10 11v6", "M14 11v6"],
  chevron: ["m6 9 6 6 6-6"],
  diamond: ["M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"],
  /** Triângulo (if / seleção). */
  triangle: ["M12 3 22 20H2Z"],
  repeat: ["m17 2 4 4-4 4", "M3 11v-1a4 4 0 0 1 4-4h14", "m7 22-4-4 4-4", "M21 13v1a4 4 0 0 1-4 4H3"],
  user: ["M20 21a8 8 0 0 0-16 0", "circle:12,8,5"],
  ia: ["M2 21a8 8 0 0 1 10.434-7.62", "circle:10,8,5", "circle:18,18,3", "M18 14v1", "M18 21v1", "M22 18h-1", "M15 18h-1"],
  package: ["m7.5 4.27 9 5.15", "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z", "m3.3 7 8.7 5 8.7-5", "M12 22V12"],
  file: ["M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4", "M14 2v4a2 2 0 0 0 2 2h4", "m5 12-3 3 3 3", "m9 18 3-3-3-3"],
  network: ["rect:16,16,6,6,1", "rect:2,16,6,6,1", "rect:9,2,6,6,1", "M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3", "M12 12V8"],
  shield: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M12 8v4", "M12 16h.01"],
  "log-out": ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  child: ["M2 12h8", "M6 8v8", "M14 12h8", "m18 8 4 4-4 4"], sibling: ["M2 12h8", "M6 8v8", "M17 4v15", "m13 15 4 4 4-4"],
  grow: ["M5 12h14", "m13 6 6 6-6 6"], shrink: ["M19 12H5", "m11 6-6 6 6 6"],
  parallel: ["M8 3v18", "M16 3v18"], branch: ["M6 3v12", "circle:18,6,3", "circle:6,18,3", "M18 9a9 9 0 0 1-9 9"],
  download: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m7 10 5 5 5-5", "M12 15V3"], upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
  users: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "circle:9,7,4", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
  code: ["m16 18 6-6-6-6", "m8 6-6 6 6 6"], "panel-right": ["rect:3,3,18,18,2", "M15 3v18"], cube: ["M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9z", "M3.5 7.5 12 12.5l8.5-5", "M12 12.5v9"], pencil: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"], eraser: ["m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21", "M22 21H7", "m5 11 9 9"], "panel-left": ["rect:3,3,18,18,2", "M9 3v18"],
  play: ["M6 4v16l14-8z"], square: ["rect:6,6,12,12,1"], terminal: ["m4 17 6-6-6-6", "M12 19h8"],
  reset: ["M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", "M3 3v5h5"],
  undo: ["M9 14 4 9l5-5", "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11"], redo: ["m15 14 5-5-5-5", "M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13"],
  text: ["M12 4v16", "M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2", "M9 20h6"], expand: ["m7 15 5 5 5-5", "m7 9 5-5 5 5"], collapse: ["m7 20 5-5 5 5", "m7 4 5 5 5-5"],
  fit: ["M15 3h6v6", "m21 3-7 7", "m3 21 7-7", "M9 21H3v-6"], copy: ["rect:8,8,14,14,2", "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"],
};
export function icon(name: string, cls = ""): string {
  const body = (P[name] ?? []).map(d => {
    if (d.startsWith("circle:")) { const [cx, cy, r] = d.slice(7).split(","); return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`; }
    if (d.startsWith("rect:")) { const [x, y, w, h, rx] = d.slice(5).split(","); return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>`; }
    return `<path d="${d}"/>`;
  }).join("");
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
export const KIND_ICON = { maquina: "package", pessoa: "user", ia: "ia", arquivo: "file" } as const;
