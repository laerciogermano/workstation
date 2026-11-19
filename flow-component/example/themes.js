// Seletor de temas do Flow IDE (mesma lista de flow-dev/app/apps/web/src/ui/themes.ts): bolinhas redondas de duas cores.
const TEMAS = [
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
];
const TEMA_KEY = "tema-flow-component-v1";
(function () {
  const q = new URLSearchParams(location.search).get("tema") || new URLSearchParams(location.search).get("theme");
  let saved = null; try { saved = localStorage.getItem(TEMA_KEY); } catch (e) {}
  const first = TEMAS.some(t => t.id === q) ? q : TEMAS.some(t => t.id === saved) ? saved : "cobalto";
  document.documentElement.dataset.tema = first;
})();
function setTema(id) {
  document.documentElement.dataset.tema = id;
  try { localStorage.setItem(TEMA_KEY, id); } catch (e) {}
  document.querySelectorAll(".tb-temas button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.id === id)));
}
function mountTemas(el) {
  const cur = document.documentElement.dataset.tema;
  el.className = "tb-temas"; el.setAttribute("aria-label", "Temas");
  el.innerHTML = TEMAS.map(t => `<button type="button" data-id="${t.id}" title="Tema ${t.name}" aria-label="Tema ${t.name}" aria-pressed="${t.id === cur}"><span><i style="background:${t.a}"></i><i style="background:${t.b}"></i></span></button>`).join("");
  el.onclick = e => { const b = e.target.closest("button"); if (b) setTema(b.dataset.id); };
}
