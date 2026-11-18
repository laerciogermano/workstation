export const TEMAS = [
  { id: "eternos", name: "Eternos Mutáveis", a: "#0b0b0b", b: "#ffffff" },
  { id: "eternos-black", name: "Eternos Mutáveis Black", a: "#f2f2f2", b: "#0b0b0b" },
  { id: "tablet-black", name: "Tablet Black", a: "#5b8cff", b: "#a855f7" },
  { id: "papel", name: "Papel", a: "#d4432a", b: "#f8f6f2" },
  { id: "teal", name: "Teal", a: "#0f766e", b: "#f6f8f8" },
  { id: "indigo", name: "Índigo", a: "#3d4fb8", b: "#f6f7fb" },
  { id: "cobalto", name: "Cobalto", a: "#2563eb", b: "#f3f6fc" },
  { id: "musgo", name: "Musgo", a: "#3f8f3a", b: "#f3f7f2" },
  { id: "ardosia", name: "Ardósia", a: "#232a36", b: "#f08b4c" },
  { id: "gantt", name: "Gantt", a: "#121212", b: "#4981f6" },
  { id: "noite", name: "Noite", a: "#000000", b: "#5b8cff" },
  { id: "graphite", name: "Graphite", a: "#1a1a1a", b: "#61c24f" },
] as const;
const KEY = "tema-flow-dev-v2";
export const getTema = (): string => { try { return localStorage.getItem(KEY) || "cobalto"; } catch { return "cobalto"; } };
export function setTema(id: string): void {
  document.documentElement.dataset.tema = id;
  try { localStorage.setItem(KEY, id); } catch { /* ignore */ }
}
