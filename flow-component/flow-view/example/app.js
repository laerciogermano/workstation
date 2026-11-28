// A página de demonstração: Explorer, barra de ferramentas e legenda em volta do desenho da biblioteca.
import { apply, createEditor, fromJson, toJson, toView } from '../dist/edit-core.js';
import { mountFlow } from '../dist/flow-view.js';
import { editable } from './convert.js';
import { createEditing } from './editing.js';
import { REAL } from './real.js';
import { largeFlow, SAMPLES } from './samples.js';

const $ = (selector) => document.querySelector(selector);
const query = new URLSearchParams(location.search);
const current = query.get('ex') ?? 'sequencial';
let theme = query.get('tema') === 'claro' ? 'light' : 'dark';
const large = Number(query.get('n') ?? 20000);

// ---------- ícones (estilo Lucide) ----------
const ICONS = {
  chevron: 'm6 9 6 6 6-6',
  file: 'M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4M14 2v4a2 2 0 0 0 2 2h4M5 12l-3 3 3 3M9 18l3-3-3-3',
  panel: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 3v18',
  minus: 'M5 12h14',
  plus: 'M5 12h14M12 5v14',
  fit: 'M15 3h6v6M21 3l-7 7M3 21l7-7M9 21H3v-6',
  text: 'M12 4v16M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2M9 20h6',
  cube: 'M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9zM3.5 7.5 12 12.5l8.5-5M12 12.5v9',
  expand: 'm7 15 5 5 5-5M7 9l5-5 5 5',
  collapse: 'm7 20 5-5 5 5M7 4l5 5 5-5',
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5 5.5 5.5 0 0 1-5.5 5.5H11',
  redo: 'm15 14 5-5-5-5M20 9H9.5A5.5 5.5 0 0 0 4 14.5 5.5 5.5 0 0 0 9.5 20H13',
  reset: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z',
};
const icon = (name) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
for (const [id, name] of Object.entries({ reset: 'reset', exCollapse: 'collapse', exToggle: 'panel', undo: 'undo', redo: 'redo', zout: 'minus', zin: 'plus', fit: 'fit', names: 'text', states: 'cube', expand: 'expand', collapse: 'collapse' })) $(`#${id}`).innerHTML = icon(name);

// ---------- preferências da vista ----------
const PREFS = 'flow-view:demo';
const DEFAULTS = { names: 'inside', states: 'all', explorer: true, width: 232 };
const read = () => {
  try {
    return JSON.parse(localStorage.getItem(PREFS)) ?? {};
  } catch {
    return {};
  }
};
let prefs = { ...DEFAULTS, ...read() };
const save = () => {
  try {
    localStorage.setItem(PREFS, JSON.stringify(prefs));
  } catch { /* sem armazenamento, vale só nesta página */ }
};

// ---------- os exemplos, como arquivos do Explorer ----------
const SECTIONS = [
  { title: 'Real cases', files: { checkout: 'Store checkout', campanha: 'Email campaign', orcamento: 'Automated quote', login: 'Login', pipeline: 'System release', atendimento: 'AI support', comando: 'Plans command', sistema: 'Whole system' } },
  { title: 'Concepts', files: { estado: 'Flow state', sequencial: 'Sequential and parallel', objeto: 'Object', ifElse: 'if and else', switch: 'switch', blocos: 'Combined blocks', abstrata: 'Abstract function', responsaveis: 'Sources' } },
  { title: 'Stress test', files: { grande: `Large (${large.toLocaleString('en')} functions)` } },
];
const key = current === 'grande' || SAMPLES[current] || REAL[current] ? current : 'sequencial';
const sample = key === 'grande' ? largeFlow(large) : (SAMPLES[key] ?? REAL[key]).tree;
const title = SECTIONS.map((s) => s.files[key]).find(Boolean);

// ---------- o fluxo que se edita ----------
/** As mudanças de cada exemplo ficam salvas no navegador (menos as do fluxo grande). */
const SAVED = `flow-view:demo:tree:${key}`;
const original = () => fromJson(JSON.stringify(editable(sample)));
function load() {
  try {
    const saved = localStorage.getItem(SAVED);
    if (saved) return fromJson(saved);
  } catch { /* salvo ilegível: volta ao exemplo */ }
  return original();
}
const editor = createEditor(load());
const tree = () => toView(editor.state.tree);

// ---------- desenho ----------
let editing = null;
const options = () => ({ theme, card: true, editable: true, names: prefs.names, states: prefs.states });
const began = performance.now();
const view = mountFlow($('#host'), tree(), {
  ...options(),
  controls: false,
  autoFit: true,
  onDraw: ({ zoom, canCollapse, canExpand }) => {
    $('#zv').textContent = `${Math.round(zoom * 100)}%`;
    $('#zout').disabled = zoom <= 0.2;
    $('#zin').disabled = zoom >= 2.5;
    $('#collapse').disabled = !canCollapse;
    $('#expand').disabled = !canExpand;
  },
  onSelect: (row) => select(row?.index ?? null),
  onHover: (target) => editing?.hover(target),
  onActivate: (target) => editing?.activate(target),
  onResize: (row, end) => editing?.resize(row, end),
});
window.view = view;
window.editor = editor;
window.mountedIn = performance.now() - began;
editing = createEditing({ editor, apply, view, host: $('#host'), panel: $('.fx') });
$('#flowName').textContent = title;
document.title = `Flow · ${title}`;
function describe() {
  const { rows, steps } = view.layout;
  $('#flowName').title = `${rows.length.toLocaleString('en')} rows · ${steps.toLocaleString('en')} ${steps === 1 ? 'step' : 'steps'} · mounted in ${Math.round(window.mountedIn)} ms`;
  $('#undo').disabled = !editor.state.canUndo;
  $('#redo').disabled = !editor.state.canRedo;
}

/** A linha selecionada, pela identidade do nó: continua a mesma depois de uma mudança. */
let selected = null;
function select(index) {
  selected = index === null ? null : (view.layout.rows[index]?.node.id ?? null);
  if (selected !== null) editor.select(selected);
  mark();
}
function mark() {
  const index = selected === null ? null : (view.layout.rows.find((r) => r.node.id === selected)?.index ?? null);
  view.select(index);
  for (const row of document.querySelectorAll('[data-row].ex-fn')) row.classList.toggle('sel', Number(row.dataset.row) === index);
}

editor.subscribe((state, change) => {
  selected = state.selected;
  if (change !== 'tree') return mark();
  view.update(tree());
  mark();
  if (key !== 'grande') {
    try {
      if (state.canUndo || localStorage.getItem(SAVED)) localStorage.setItem(SAVED, toJson(state.tree));
    } catch { /* sem armazenamento, vale só nesta página */ }
  }
  explorer();
  describe();
});
$('#undo').onclick = () => editor.undo();
$('#redo').onclick = () => editor.redo();

// ---------- Explorer ----------
const LISTED = 300;
const shut = new Set();
const params = (ex) => `?${new URLSearchParams({ ex, ...(ex === 'grande' && query.has('n') ? { n: large } : {}), ...(theme === 'light' ? { tema: 'claro' } : {}) })}`;
function element(tag, cls, html = '') {
  const e = document.createElement(tag);
  e.className = cls;
  e.innerHTML = html;
  return e;
}
function row(tag, cls, level, lead, name, count) {
  const e = element(tag, `ex-row ${cls}`, `${lead}<span class="ex-n"></span>${count === undefined ? '' : `<span class="ex-c">${count.toLocaleString('en')}</span>`}`);
  e.style.setProperty('--lv', level);
  e.querySelector('.ex-n').textContent = name;
  e.title = name;
  return e;
}
const chevron = `<span class="ex-car">${icon('chevron')}</span>`;
function explorer() {
  const out = [];
  const functions = view.layout.rows.filter((r) => r.kind === 'fn');
  for (const section of SECTIONS) {
    const files = Object.entries(section.files);
    const closed = shut.has(section.title);
    const head = element('button', `ex-sec${closed ? ' shut' : ''}`, `${chevron}<span></span><span class="n">${files.length}</span>`);
    head.type = 'button';
    head.setAttribute('aria-expanded', !closed);
    head.children[1].textContent = section.title;
    head.onclick = () => toggleFolder(section.title);
    out.push(head);
    if (closed) continue;
    for (const [ex, name] of files) {
      const open = ex === key && !shut.has(ex);
      const file = row('a', `ex-file${ex === key ? ' cur' : ''}${open ? '' : ' shut'}`, 0, chevron + icon('file'), name, ex === key ? functions.length : undefined);
      file.href = params(ex);
      if (ex === key) {
        file.setAttribute('aria-current', 'page');
        // no arquivo aberto, o clique abre e fecha a lista de funções
        file.onclick = (event) => {
          event.preventDefault();
          toggleFolder(ex);
        };
      }
      out.push(file);
      if (!open) continue;
      for (const r of functions.slice(0, LISTED)) {
        const item = row('button', 'ex-fn', Math.min(r.depth - r.nest, 8), `<i class="ex-dot${r.abstract ? ' abs' : ''}"></i>`, r.name);
        item.type = 'button';
        item.dataset.row = r.index;
        item.classList.toggle('sel', r.node.id === selected);
        item.onclick = () => {
          view.reveal(r.index);
          select(r.index);
        };
        out.push(item);
      }
      if (functions.length > LISTED) out.push(Object.assign(element('div', 'ex-more'), { textContent: `+${(functions.length - LISTED).toLocaleString('en')} more` }));
    }
  }
  $('#exTree').replaceChildren(...out);
}
function toggleFolder(name) {
  if (!shut.delete(name)) shut.add(name);
  explorer();
}
$('#exCollapse').onclick = () => {
  for (const s of SECTIONS) if (!s.files[key]) shut.add(s.title);
  shut.add(key);
  explorer();
};

// ---------- barra de ferramentas ----------
function applyPrefs() {
  const app = $('#app');
  app.classList.toggle('ex-off', !prefs.explorer);
  app.style.setProperty('--exw', `${prefs.width}px`);
  $('#exToggle').setAttribute('aria-pressed', prefs.explorer);
  $('#exSplitter').setAttribute('aria-valuenow', prefs.width);
  $('#names').setAttribute('aria-pressed', prefs.names === 'inside');
  $('#states').setAttribute('aria-pressed', prefs.states === 'all');
  tooltip($('#states'), prefs.states === 'all' ? 'States: showing all available data (click for only the new ones)' : 'States: showing only the new data (click for all available)');
  save();
}
function redraw() {
  applyPrefs();
  view.update(tree(), options());
}
$('#zout').onclick = () => view.zoomTo(view.camera.zoom / 1.15);
$('#zin').onclick = () => view.zoomTo(view.camera.zoom * 1.15);
$('#fit').onclick = () => view.fit();
$('#expand').onclick = () => view.expandAll();
$('#collapse').onclick = () => view.collapseAll();
$('#names').onclick = () => {
  prefs.names = prefs.names === 'inside' ? 'outside' : 'inside';
  redraw();
};
$('#states').onclick = () => {
  prefs.states = prefs.states === 'all' ? 'new' : 'all';
  redraw();
};
const toggleExplorer = () => {
  prefs.explorer = !prefs.explorer;
  applyPrefs();
};
$('#exToggle').onclick = toggleExplorer;
function applyTheme() {
  document.documentElement.dataset.theme = theme;
  const label = theme === 'dark' ? 'Light theme' : 'Dark theme';
  $('#theme').innerHTML = icon(theme === 'dark' ? 'sun' : 'moon');
  $('#theme').setAttribute('aria-label', label);
  tooltip($('#theme'), label);
}
$('#theme').onclick = () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  const next = new URL(location.href);
  if (theme === 'light') next.searchParams.set('tema', 'claro');
  else next.searchParams.delete('tema');
  history.replaceState(null, '', next);
  applyTheme();
  view.update(tree(), options());
  explorer();
};
$('#reset').onclick = () => {
  editing.close();
  let changed = false;
  try {
    changed = !!localStorage.getItem(SAVED);
  } catch { /* sem armazenamento */ }
  if (changed || editor.state.canUndo) {
    // desfazer as mudanças é irreversível: pergunta antes
    if (!confirm('Discard your changes to this example?')) return;
    try {
      localStorage.removeItem(SAVED);
    } catch { /* sem armazenamento */ }
    editor.load(original());
    localStorage.removeItem(SAVED);
  }
  prefs = { ...DEFAULTS };
  shut.clear();
  redraw();
  view.expandAll();
  select(null);
  explorer();
  view.fit();
};

// largura do Explorer: arrastar, duas vezes para voltar, setas no teclado
const splitter = $('#exSplitter');
const resize = (width) => {
  prefs.width = Math.round(Math.min(Math.max(160, width), Math.max(160, window.innerWidth * 0.5)));
  applyPrefs();
};
splitter.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  splitter.setPointerCapture(e.pointerId);
  $('#app').classList.add('resizing');
  const from = e.clientX - prefs.width;
  const move = (ev) => resize(ev.clientX - from);
  const stop = () => {
    splitter.removeEventListener('pointermove', move);
    $('#app').classList.remove('resizing');
  };
  splitter.addEventListener('pointermove', move);
  splitter.addEventListener('lostpointercapture', stop, { once: true });
});
splitter.addEventListener('dblclick', () => resize(DEFAULTS.width));
splitter.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 80 : 24;
  if (e.key === 'ArrowLeft') resize(prefs.width - step);
  else if (e.key === 'ArrowRight') resize(prefs.width + step);
  else if (e.key === 'Enter') toggleExplorer();
  else return;
  e.preventDefault();
});
// desfazer e refazer
document.addEventListener('keydown', (e) => {
  if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'z' || e.target.closest?.('input, textarea, select')) return;
  e.preventDefault();
  if (e.shiftKey) editor.redo();
  else editor.undo();
});
// + − e 0 valem na página toda (com o foco no desenho, a biblioteca já tratou)
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea, select')) return;
  if (e.key === '+' || e.key === '=') view.zoomTo(view.camera.zoom * 1.15);
  else if (e.key === '-') view.zoomTo(view.camera.zoom / 1.15);
  else if (e.key === '0') view.fit();
});
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    toggleExplorer();
  }
});

// ---------- dicas rápidas (a nativa demora cerca de um segundo) ----------
function tooltip(button, text) {
  button.dataset.tip = text;
  button.removeAttribute('title');
}
const tip = document.body.appendChild(element('div', 'tip'));
let waiting = 0;
const hideTip = () => {
  clearTimeout(waiting);
  tip.classList.remove('on');
};
for (const button of document.querySelectorAll('.topbar button, .fx-bar button, .ex-head button')) if (button.title) tooltip(button, button.title);
// vale também para os botões dos menus, que nascem depois
document.addEventListener('mouseover', (e) => {
    const button = e.target.closest?.('button[data-tip]');
    if (!button) return;
    clearTimeout(waiting);
    waiting = setTimeout(() => {
      tip.textContent = button.dataset.tip;
      tip.classList.add('on');
      const r = button.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = `${Math.max(4, Math.min(window.innerWidth - w - 4, r.left + r.width / 2 - w / 2))}px`;
      tip.style.top = `${r.top - h - 6 < 4 ? r.bottom + 6 : r.top - h - 6}px`;
    }, 50);
});
for (const event of ['mouseout', 'mousedown', 'wheel', 'keydown']) document.addEventListener(event, hideTip, true);

applyTheme();
applyPrefs();
explorer();
describe();
