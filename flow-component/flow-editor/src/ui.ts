// O editor na tela: o desenho do Flow View, o painel de edição, o código gerado e o JSON.
import { mountFlow, type FlowViewHandle } from '@flow/view';
import { diagnose, type Problem } from './check.ts';
import { generateCode, LANGUAGES, type Language } from './code.ts';
import { createEditor, type Editor } from './editor.ts';
import { EXAMPLES, type Example } from './examples.ts';
import { find, fn, freeName, hasFields, names } from './model.ts';
import type { DataSide, Datum, DataType, FnNode, Pattern, Source, SourceKind } from './model.ts';
import { morph } from './morph.ts';
import type { Command, InsertKind, Where, WrapKind } from './ops.ts';
import { escapeHtml, renderPanel, renderProblems, variableOf } from './panel.ts';
import { fromJson, toJson } from './serialize.ts';
import { styles } from './styles.ts';
import { toView } from './view-tree.ts';

export interface FlowEditorOptions {
  tree?: FnNode;
  theme?: 'dark' | 'light';
  /** Menu com os exemplos do FOP (padrão: sim). */
  examples?: boolean;
  /** Chamado a cada mudança no fluxo. */
  onChange?: (tree: FnNode) => void;
  onThemeChange?: (theme: 'dark' | 'light') => void;
  /** Linguagem do código gerado (padrão: JavaScript). */
  language?: Language;
  onLanguageChange?: (language: Language) => void;
}

export interface FlowEditorHandle {
  readonly editor: Editor;
  readonly view: FlowViewHandle;
  destroy(): void;
}

let sequence = 0;
const EXAMPLE_LIST: Example[] = EXAMPLES.flatMap((g) => g.examples);

export function mountFlowEditor(host: HTMLElement, options: FlowEditorOptions = {}): FlowEditorHandle {
  const doc = host.ownerDocument;
  const win = doc.defaultView!;
  const id = `flow-editor-${++sequence}`;
  const editor = createEditor(options.tree ?? fn('main'));
  let theme = options.theme ?? 'dark';
  let where: Where = 'after';
  type Tab = 'code' | 'json' | 'problems';
  let tab: Tab | null = 'code';
  let language: Language = options.language ?? 'js';
  let problems: Problem[] = diagnose(editor.state.tree);
  let example: Example | null = null;

  const root = doc.createElement('div');
  root.id = id;
  root.dataset.theme = theme;
  root.innerHTML = `<style>${styles(`#${id}`)}</style>
    <header>
      <strong>Flow Editor</strong>
      ${options.examples === false ? '' : `<select data-examples aria-label="Exemplos do FOP"><option value="">Exemplos do FOP…</option>${EXAMPLES.map((g) => `<optgroup label="${escapeHtml(g.title)}">${g.examples.map((x) => `<option value="${x.key}">${escapeHtml(x.title)}</option>`).join('')}</optgroup>`).join('')}</select>`}
      <button type="button" data-top="new">Novo fluxo</button>
      <button type="button" data-top="undo" title="Desfazer (⌘Z)">↶ Desfazer</button>
      <button type="button" data-top="redo" title="Refazer (⇧⌘Z)">↷ Refazer</button>
      <span class="space"></span>
      <button type="button" data-top="theme"></button>
    </header>
    <div class="stage"><div class="canvas"></div><div class="toast" role="alert"></div></div>
    <aside aria-label="Edição"><div class="rules"></div><div class="panel"></div></aside>
    <div class="drawer">
      <div class="tabs">
        <button type="button" data-tab="code">Código</button>
        <button type="button" data-tab="json">JSON</button>
        <button type="button" data-tab="problems"></button>
        <span class="space"></span>
        <select data-language aria-label="Linguagem do código">${LANGUAGES.map(([value, label]) => `<option value="${value}"${value === language ? ' selected' : ''}>${label}</option>`).join('')}</select>
        <button type="button" data-top="copy">Copiar</button>
        <button type="button" data-top="apply">Aplicar JSON</button>
      </div>
      <pre aria-label="Código gerado" tabindex="0"></pre>
      <textarea aria-label="Fluxo em JSON" spellcheck="false"></textarea>
      <div class="problems" aria-label="Problemas"></div>
    </div>`;
  host.append(root);
  const $ = <T extends Element = HTMLElement>(q: string) => root.querySelector<T & Element>(q) as T;
  const canvas = $('.canvas');
  const panel = $('.panel');
  const code = $('pre');
  const json = $<HTMLTextAreaElement>('textarea');
  const toast = $('.toast');

  // ---------- desenho ----------
  const rowOf = (nodeId: string) => view.layout.rows.find((r) => r.node.id === nodeId)?.index ?? null;
  const mount = () => mountFlow(canvas, toView(editor.state.tree), {
    theme,
    onSelect: (row) => row && editor.select(String(row.node.id)),
  });
  let view = mount();

  let timer = 0;
  function say(message: string) {
    win.clearTimeout(timer);
    toast.textContent = message;
    timer = win.setTimeout(() => (toast.textContent = ''), 4500);
  }

  function highlight() {
    const row = rowOf(editor.state.selected);
    if (row === null) return;
    view.reveal(row);
    view.select(row);
  }

  function renderSide() {
    morph(panel, renderPanel({ tree: editor.state.tree, selected: editor.state.selected, where, prefix: id, why: editor.why, problems }));
    $<HTMLButtonElement>('[data-top=undo]').disabled = !editor.state.canUndo;
    $<HTMLButtonElement>('[data-top=redo]').disabled = !editor.state.canRedo;
    $('[data-top=theme]').textContent = theme === 'dark' ? 'Tema claro' : 'Tema escuro';
    morph($('.rules'), example ? `<b>${escapeHtml(example.title)}</b><ul>${example.rules.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>` : '');
  }

  function renderDrawer() {
    code.hidden = tab !== 'code';
    json.hidden = tab !== 'json';
    $('.problems').hidden = tab !== 'problems';
    $('[data-language]').hidden = tab !== 'code';
    $('[data-top=copy]').hidden = tab === null || tab === 'problems';
    $('[data-top=apply]').hidden = tab !== 'json';
    for (const b of root.querySelectorAll<HTMLElement>('[data-tab]')) b.setAttribute('aria-pressed', String(b.dataset.tab === tab));
    const count = problems.filter((p) => p.level !== 'tip').length;
    $('[data-tab=problems]').textContent = count ? `Problemas (${count})` : 'Problemas';
    if (tab === 'problems') morph($('.problems'), renderProblems(editor.state.tree, problems));
    if (tab === 'code') code.textContent = generateCode(editor.state.tree, language);
    if (tab === 'json') json.value = toJson(editor.state.tree);
  }

  const unsubscribe = editor.subscribe((state, change) => {
    if (change === 'tree') {
      toast.textContent = '';
      problems = diagnose(state.tree);
      view.update(toView(state.tree));
      renderDrawer();
      options.onChange?.(state.tree);
    }
    highlight();
    renderSide();
  });

  function run(command: Command): boolean {
    const result = editor.run(command);
    if (result.ok) toast.textContent = '';
    else {
      say(result.error);
      renderSide(); // devolve o campo ao valor que vale
    }
    return result.ok;
  }

  // ---------- dados ----------
  /** Altera a lista de dados de um nó pelo caminho `i.j.k`. */
  function editData(target: string, side: DataSide, path: string, change: (list: Datum[], index: number) => void) {
    const node = find(editor.state.tree, target)?.node;
    if (node?.type !== 'fn') return;
    const listCopy = structuredClone(node[side]);
    const steps = path ? path.split('.').map(Number) : [];
    let list = listCopy;
    for (const i of steps.slice(0, -1)) list = list[i]!.fields!;
    change(list, steps.at(-1) ?? -1);
    run({ type: 'setData', target, side, list: renumber(listCopy) });
  }
  /** Os itens de um objeto posicional se chamam pela posição. */
  const renumber = (list: Datum[]): Datum[] => list.map((d) => ({
    ...d,
    fields: d.fields && renumber(d.type === 'list' ? d.fields.map((f, i) => ({ ...f, name: String(i) })) : d.fields),
  }));

  function addData(target: string, side: DataSide, path: string) {
    const node = find(editor.state.tree, target)?.node;
    if (node?.type !== 'fn') return;
    const base = side === 'in' ? 'entrada' : side === 'out' ? 'saida' : 'dado';
    editData(target, side, path ? `${path}.0` : '', (list) => {
      if (path) list.push({ name: freeName('campo', list.map((d) => d.name)), type: 'text', value: '' });
      else list.push({ name: freeName(base, names(editor.state.tree).data.map((d) => d.name)), type: side === 'data' ? 'text' : 'abstract' });
    });
    focusKey(`${side}:${path ? `${path}.` : ''}${path ? lastIndex(target, side, path) : node[side].length}:name`);
  }
  function lastIndex(target: string, side: DataSide, path: string) {
    let list = (find(editor.state.tree, target)!.node as FnNode)[side];
    for (const i of path.split('.').map(Number)) list = list[i]!.fields ?? [];
    return list.length - 1;
  }
  function focusKey(key: string) {
    const field = panel.querySelector<HTMLInputElement>(`[data-key="${key}"]`);
    field?.focus();
    field?.select?.();
  }

  /** Declara no estado a variável que um bloco usa, na função mais próxima acima. */
  function declare(target: string) {
    const found = find(editor.state.tree, target);
    if (!found || found.node.type === 'fn') return;
    const name = variableOf(found.node);
    const owner = found.path.findLast((n) => n.type === 'fn') as FnNode | undefined;
    if (!name || !owner) return;
    const type: DataType = found.node.type === 'for' ? 'list' : found.node.type === 'switch' ? 'text' : 'boolean';
    const datum: Datum = type === 'list' ? { name, type, fields: [{ name: '0', type: 'number', value: '1' }, { name: '1', type: 'number', value: '2' }] } : { name, type, value: type === 'boolean' ? 'true' : 'a' };
    // quem declarou continua selecionado
    if (run({ type: 'setData', target: owner.id, side: 'data', list: [...owner.data, datum] })) editor.select(target);
  }

  // ---------- campos ----------
  function onChange(event: Event) {
    const el = event.target as HTMLInputElement;
    if (el.hasAttribute('data-examples')) {
      example = EXAMPLE_LIST.find((x) => x.key === el.value) ?? null;
      if (example) editor.load(example.tree());
      renderSide();
      view.panTo(0, 0);
      return;
    }
    if (el.hasAttribute('data-language')) {
      language = el.value as Language;
      renderDrawer();
      options.onLanguageChange?.(language);
      return;
    }
    const target = el.dataset.target;
    if (!target) return;
    if (el.hasAttribute('data-wrap')) {
      if (el.value) run({ type: 'wrap', target, kind: el.value as WrapKind });
      el.value = '';
      return;
    }
    const { prop, side, path, field } = el.dataset;
    if (prop) {
      const node = find(editor.state.tree, target)?.node;
      if (!node) return;
      if (prop === 'parallel') return void run({ type: 'update', target, patch: { parallel: el.checked } });
      if (prop === 'visibility') return void run({ type: 'update', target, patch: { visibility: (el.value || null) as 'public' | 'private' | null } });
      if (prop === 'pattern') return void run({ type: 'update', target, patch: { pattern: (el.value || null) as Pattern | null } });
      if (prop === 'asObject') return void run({ type: 'update', target, patch: { asObject: el.checked } });
      if (prop === 'source' || prop === 'sourceName') {
        const current = node.type === 'fn' ? node.source : undefined;
        let source: Source | null | 'inherit';
        if (prop === 'sourceName') source = { kind: current!.kind, name: el.value, asObject: current!.asObject };
        else if (el.value === 'inherit') source = 'inherit';
        else if (el.value === 'abstract') source = null;
        else {
          const defaults: Record<SourceKind, string> = { file: 'arquivo', person: 'pessoa', ai: 'agente', machine: 'maquina', object: 'objeto' };
          source = { kind: el.value as SourceKind, name: current && current.kind === el.value ? current.name : defaults[el.value as SourceKind] };
        }
        return void run({ type: 'update', target, patch: { source } });
      }
      return void run({ type: 'update', target, patch: { [prop]: el.value } });
    }
    if (side && path !== undefined && field) {
      editData(target, side as DataSide, path, (list, index) => {
        const d = list[index];
        if (!d) return;
        if (field === 'name') d.name = el.value;
        else if (field === 'value') d.value = el.value;
        else {
          d.type = el.value as DataType;
          if (hasFields(d.type)) d.fields ??= [];
          else delete d.fields;
          delete d.value;
          if (d.type === 'boolean') d.value = 'true';
          if (d.type === 'number') d.value = '0';
          if (d.type === 'text') d.value = '';
        }
      });
    }
  }

  // ---------- botões ----------
  function onClick(event: Event) {
    const button = (event.target as Element).closest<HTMLButtonElement>('button');
    if (!button || button.disabled) return;
    const { top, act, target, kind, side, path } = button.dataset;
    if (button.dataset.tab) {
      tab = tab === button.dataset.tab ? null : (button.dataset.tab as Tab);
      return renderDrawer();
    }
    if (top === 'new') {
      example = null;
      const select = root.querySelector<HTMLSelectElement>('[data-examples]');
      if (select) select.value = '';
      editor.load(fn('main'));
    } else if (top === 'undo') editor.undo();
    else if (top === 'redo') editor.redo();
    else if (top === 'theme') {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = theme;
      view.destroy();
      view = mount();
      highlight();
      renderSide();
      options.onThemeChange?.(theme);
    } else if (top === 'copy') {
      const value = tab === 'json' ? json.value : (code.textContent ?? '');
      win.navigator.clipboard?.writeText(value).then(() => say('Copiado.'), () => say('Não foi possível copiar.'));
    } else if (top === 'apply') {
      try {
        editor.load(fromJson(json.value));
        say('JSON aplicado.');
      } catch (error) {
        say((error as Error).message);
      }
    }
    if (!act) return;
    if (act === 'where') {
      where = button.dataset.where as Where;
      return renderSide();
    }
    if (!target) return;
    switch (act) {
      case 'select': return editor.select(target);
      case 'insert':
        // o próximo item entra em seguida, a não ser que se escolha outro lugar
        if (run({ type: 'insert', target, where: button.dataset.where as Where, kind: kind as InsertKind }) && where !== 'after') {
          where = 'after';
          renderSide();
        }
        return;
      case 'else': case 'elseIf': case 'case': case 'catch': case 'remove': case 'unwrap': case 'duplicate': return void run({ type: act, target });
      case 'up': case 'down': case 'in': case 'out': return void run({ type: 'move', target, direction: act });
      case 'declare': return declare(target);
      case 'data-add': return addData(target, side as DataSide, path ?? '');
      case 'data-remove': return editData(target, side as DataSide, path!, (list, index) => void list.splice(index, 1));
    }
  }

  // ---------- teclado ----------
  function onKey(event: KeyboardEvent) {
    const el = event.target as HTMLElement;
    if (el.matches('input, textarea, select')) {
      // Enter confirma o campo
      if (event.key === 'Enter' && el.matches('input')) el.blur();
      return;
    }
    const key = event.key.toLowerCase();
    const command = event.metaKey || event.ctrlKey;
    const target = editor.state.selected;
    let action: (() => void) | null = null;
    if (command && key === 'z') action = () => (event.shiftKey ? editor.redo() : editor.undo());
    else if (command && key === 'y') action = () => editor.redo();
    else if (command) return;
    else if (key === 'delete' || key === 'backspace') action = () => void run({ type: 'remove', target });
    else if (key === 'f') action = () => void run({ type: 'insert', target, where: target === editor.state.tree.id ? 'inside' : 'after', kind: 'fn' });
    else if (event.altKey && key === 'arrowup') action = () => void run({ type: 'move', target, direction: 'up' });
    else if (event.altKey && key === 'arrowdown') action = () => void run({ type: 'move', target, direction: 'down' });
    else if (key === 'enter' && el.closest('.canvas') && !el.closest('button,[data-toggle]')) action = () => focusKey(editor.node.type === 'fn' ? 'prop:name' : 'prop:expr');
    if (!action) return;
    event.preventDefault();
    event.stopPropagation();
    action();
  }

  root.addEventListener('change', onChange);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onKey, true);
  // um duplo clique no desenho leva ao nome
  canvas.addEventListener('dblclick', (event) => {
    if (!(event.target as Element).closest('button,[data-toggle]')) focusKey(editor.node.type === 'fn' ? 'prop:name' : 'prop:expr');
  });

  renderSide();
  renderDrawer();
  highlight();

  return {
    editor,
    get view() {
      return view;
    },
    destroy() {
      win.clearTimeout(timer);
      unsubscribe();
      view.destroy();
      root.remove();
    },
  };
}
