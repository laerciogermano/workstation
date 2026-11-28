// Edição por cima do desenho, como no editor FOP: menus ao passar o mouse, clique no dado para alterar,
// renomear no lugar, condição dos blocos, responsável e a alça que muda o tamanho do bloco.
// As operações são as do Flow Editor; aqui fica só a interface.
import { check, DATA_TYPES, find, freeName, icon, isFn, names, walk } from '../dist/edit-core.js';

/** Quanto o menu espera para trocar de alvo e para sumir: rápido, com folga para o ponteiro chegar nele. */
const SWITCH_MS = 110, LEAVE_MS = 180;
const TYPE_NAMES = { abstract: 'abstract (no value)', text: 'text', number: 'number', boolean: 'boolean', null: 'null', function: 'function', object: 'object (keyed)', list: 'list (positional)' };
const SOURCE_NAMES = { inherit: 'inherited (file above)', file: 'file', person: 'person', ai: 'AI', machine: 'machine', object: 'object', abstract: 'abstract' };
const SIDE_NAMES = { in: 'Input', out: 'Output', data: 'Declared' };
const LOOPS = new Set(['for', 'while', 'do-while']);

const html = (value) => String(value).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const el = (tag, cls, content = '') => Object.assign(document.createElement(tag), { className: cls, innerHTML: content });
const fieldsOf = (type) => type === 'object' || type === 'list';

/** Percorre todos os dados de uma função, com os campos dos objetos. */
function eachDatum(node, visit) {
  const go = (list, side) => list.forEach((d) => {
    visit(d, side);
    if (d.fields) go(d.fields, side);
  });
  for (const side of ['in', 'out', 'data']) go(node[side], side);
}

/** Os blocos que nascem com nomes em português no Flow Editor ganham os nomes da página, em inglês. */
function englishNames(tree, before) {
  const defaults = { condicao: 'condition', opcao: 'option', pendente: 'pending', itens: 'items', outraCondicao: 'otherCondition' };
  const taken = new Set(names(tree).functions);
  walk(tree, (node) => {
    if (before.has(node.id)) return;
    if (isFn(node)) {
      if (/^funcao\d*$/.test(node.name)) {
        node.name = freeName('newFunction', taken);
        taken.add(node.name);
      }
    } else if (node.expr) node.expr = defaults[node.expr] ?? node.expr.replace(/^valor(\d*)$/, 'value$1');
  });
}

export function createEditing({ editor, apply, host, panel, view }) {
  const tree = () => editor.state.tree;
  const nodeOf = (row) => find(tree(), row.node.id)?.node;

  // ---------- comandos ----------
  /** Troca a árvore (um passo do histórico) e deixa selecionado o que o comando indicar. */
  function commit(next, selected) {
    hideMenu(true);
    const created = selected && !find(tree(), selected);
    editor.load(next);
    if (!selected || selected === next.id) return;
    editor.select(selected);
    // o que o comando criou aparece na tela; quem já existia não faz a vista pular
    const row = created && view.layout.rows.find((r) => r.node.id === selected);
    if (row) view.reveal(row.index);
  }
  function run(...commands) {
    const before = new Set();
    walk(tree(), (n) => before.add(n.id));
    try {
      let result = { tree: tree(), selected: editor.state.selected };
      for (const command of commands) result = apply(result.tree, command);
      englishNames(result.tree, before);
      commit(result.tree, result.selected);
      return true;
    } catch (error) {
      toast(`This change is not possible here (${error.message})`);
      return false;
    }
  }
  const can = (command) => check(tree(), command) === null;

  /** Puxa a próxima irmã para dentro do bloco (`delta` 1) ou devolve a última para fora (-1). Muda a árvore recebida. */
  function scope(copy, id, delta) {
    const found = find(copy, id);
    if (!found?.parent) return false;
    const { node, parent } = found;
    const siblings = parent.children;
    /** um `if` anda junto do `else`; um `try`, do `catch` */
    const pairs = (head, next) => (head?.type === 'if' && next?.type === 'else') || (head?.type === 'try' && next?.type === 'catch');
    const end = siblings.indexOf(node) + (pairs(node, siblings[siblings.indexOf(node) + 1]) ? 2 : 1);
    if (delta > 0) {
      const first = siblings[end];
      if (!first) return false;
      const moved = siblings.splice(end, pairs(first, siblings[end + 1]) ? 2 : 1);
      if (!node.children.length) delete moved[0].parallel;
      node.children.push(...moved);
    } else {
      if (!node.children.length) return false;
      const last = node.children.length - 1;
      const from = pairs(node.children[last - 1], node.children[last]) ? last - 1 : last;
      const moved = node.children.splice(from);
      delete moved[0].parallel;
      siblings.splice(end, 0, ...moved);
    }
    return true;
  }
  const canScope = (id, delta) => scope(structuredClone(tree()), id, delta);
  function changeScope(id, delta) {
    const copy = structuredClone(tree());
    if (scope(copy, id, delta)) commit(copy, id);
  }
  /** Alça arrastada: entra ou sai quem for preciso para o bloco terminar no limite de passo `end`. */
  function resize(row, end) {
    const copy = structuredClone(tree());
    const rowOf = (id) => view.layout.rows.find((r) => r.node.id === id);
    const node = find(copy, row.node.id)?.node;
    if (!node) return;
    let changed = false;
    if (end > row.end) {
      for (;;) {
        const { parent } = find(copy, node.id);
        let next = parent.children[parent.children.indexOf(node) + 1];
        if (next?.type === 'else' || next?.type === 'catch') next = parent.children[parent.children.indexOf(node) + 2];
        if (!next || rowOf(next.id).start >= end || !scope(copy, node.id, 1)) break;
        changed = true;
      }
    } else {
      while (node.children.length > 1 && rowOf(node.children.at(-1).id).start >= end && scope(copy, node.id, -1)) changed = true;
    }
    if (changed) commit(copy, node.id);
  }

  // ---------- opções (menu) ----------
  const tool = (iconName, title, action, danger = false) => ({ icon: iconName, title, action, danger });
  /** Só entram os comandos que o fluxo aceita neste ponto. */
  const command = (iconName, title, value, danger) => (can(value) ? tool(iconName, title, () => run(value), danger) : null);

  function nodeTools(row) {
    const found = find(tree(), row.node.id);
    if (!found) return [];
    const { node, parent, index } = found;
    const target = node.id;
    const root = !parent;
    const toggle = row.composite ? tool('chevron', 'Open / close', () => view.toggle(row.index)) : null;
    const child = (title) => command('sibling', title, { type: 'insert', target, where: 'inside', kind: 'fn' });
    const sibling = (title) => command('child', title, { type: 'insert', target, where: 'after', kind: 'fn' });
    const wraps = [['triangle', 'Add selection (if)', 'if'], ['repeat', 'Add repetition (for)', 'for'], ['shield', 'Add try/catch', 'try']].map(([i, title, kind]) => command(i, title, { type: 'wrap', target, kind }));
    const remove = (title) => command('trash', title, { type: 'remove', target }, true);

    if (isFn(node)) {
      if (root) return [toggle, child('Add child (inside this function)'), tool('pencil', 'Declare data', () => dataDialog(node.id, 'data', true))];
      const before = parent.children[index - 1];
      return [
        toggle,
        child('Add child (inside this function)'),
        sibling('Add sibling (next to it, same block)'),
        ...wraps,
        before ? command('parallel', node.parallel ? 'Run in sequence' : 'Run together with the previous one', { type: 'update', target, patch: { parallel: !node.parallel } }) : null,
        !isFn(parent) ? command('log-out', 'Leave the block', { type: 'move', target, direction: 'out' }) : null,
        tool('pencil', 'Declare data', () => dataDialog(node.id, 'data', true)),
        remove('Remove'),
      ];
    }
    const where = node.type === 'else' || node.type === 'catch' ? node.type : 'block';
    const own = [toggle];
    if (node.type === 'switch') own.push(command('plus', 'Add case', { type: 'case', target }));
    else own.push(child(`Add child (inside the ${where})`));
    if (where === 'block') {
      if (node.type !== 'case') own.push(...wraps);
      if (node.type !== 'try') own.push(tool('pencil', 'Edit the condition', () => blockDialog(node.id)));
      if (node.type === 'if') own.push(command('branch', 'Add else', { type: 'else', target }), command('diamond', 'Add else if', { type: 'elseIf', target }));
      if (node.type === 'try') own.push(command('x', 'Add catch', { type: 'catch', target }));
      if (node.type === 'case') own.push(command('plus', 'Add case', { type: 'case', target }));
    }
    own.push(node.type === 'case' ? null : sibling('Add sibling to the right (outside the block)'));
    if (where === 'block' && node.type !== 'switch' && node.type !== 'case') {
      if (canScope(target, 1)) own.push(tool('grow', 'Include the next one in the block', () => changeScope(target, 1)));
      if (node.children.length > 1) own.push(tool('shrink', 'Take the last one out of the block', () => changeScope(target, -1)));
    }
    own.push(remove(where === 'block' ? 'Remove the block and everything inside' : `Remove ${where}`));
    return own;
  }

  /** De onde vem um dado listado no estado: quem o declara, senão quem o produz, senão quem o recebe. */
  function ownerOf(name) {
    const rows = view.layout.rows.filter((r) => r.kind === 'fn');
    const declares = (r, side) => nodeOf(r)?.[side].some((d) => d.name === name);
    for (const side of ['data', 'out', 'in']) {
      const row = rows.find((r) => declares(r, side) || (side !== 'data' && r[side]?.name === name));
      if (row) return { id: row.node.id, side };
    }
    return null;
  }
  function stateTools(name) {
    const owner = ownerOf(name);
    if (!owner) return [];
    const node = find(tree(), owner.id).node;
    const at = node[owner.side].findIndex((d) => d.name === name);
    return [
      tool('pencil', 'Edit the data', () => dataDialog(owner.id, owner.side)),
      at < 0 ? null : tool('trash', `Remove the ${SIDE_NAMES[owner.side].toLowerCase()} data`, () => run({ type: 'setData', target: owner.id, side: owner.side, list: node[owner.side].filter((_, i) => i !== at) }), true),
    ];
  }

  let menu = null, switching = 0, leaving = 0;
  function hideMenu(now = false) {
    clearTimeout(switching);
    clearTimeout(leaving);
    const gone = () => {
      menu?.remove();
      menu = null;
    };
    if (now) gone();
    else leaving = setTimeout(gone, LEAVE_MS);
  }
  function showMenu(target) {
    const state = target.type === 'state';
    const tools = (state ? stateTools(target.name) : nodeTools(target.row)).filter(Boolean);
    hideMenu(true);
    if (!tools.length) return;
    menu = el('div', 'bar-tools');
    menu.setAttribute('role', 'toolbar');
    menu.dataset.key = state ? target.name : target.row.name;
    for (const t of tools) {
      const button = el('button', `ib${t.danger ? ' danger' : ''}`, icon(t.icon));
      button.type = 'button';
      button.dataset.tip = t.title;
      button.setAttribute('aria-label', t.title);
      button.onclick = () => {
        hideMenu(true);
        t.action();
      };
      menu.append(button);
    }
    menu.addEventListener('mouseenter', () => {
      clearTimeout(switching);
      clearTimeout(leaving);
    });
    menu.addEventListener('mouseleave', () => hideMenu());
    document.body.append(menu);
    const { box } = target;
    const area = host.getBoundingClientRect();
    const { offsetWidth: width, offsetHeight: height } = menu;
    let left = box.left;
    if (target.type === 'row') {
      // na ponta da tabela, sem cobrir o nome (de longe o menu avança sobre o plano)
      const written = [...host.querySelectorAll(`[data-t="name"][data-row="${target.row.index}"]`)].map((e) => e.getBoundingClientRect()).filter((r) => r.left < box.right);
      left = Math.max(box.right - width - 4, ...written.map((r) => r.right + 6));
    }
    let top = target.type === 'row' ? box.top + (box.height - height) / 2 : box.top - height - 2;
    if (top < area.top) top = box.bottom + 2;
    menu.style.left = `${Math.max(area.left + 2, Math.min(left, area.right - width - 2))}px`;
    menu.style.top = `${top}px`;
  }
  function hover(target) {
    if (dialog || !target || target.type === 'add' || target.type === 'data') return hideMenu();
    clearTimeout(leaving);
    clearTimeout(switching);
    const key = target.type === 'state' ? target.name : target.row.name;
    // na tabela o menu aparece já; entre barras, uma pequena espera deixa o ponteiro chegar ao menu
    if (!menu || target.type === 'row') showMenu(target);
    else if (menu.dataset.key !== key) switching = setTimeout(() => showMenu(target), SWITCH_MS);
  }

  // ---------- clique ----------
  function activate(target) {
    const { type, row } = target;
    if (type === 'state') {
      const owner = ownerOf(target.name);
      return owner && dataDialog(owner.id, owner.side);
    }
    if (type === 'data' || type === 'add') return dataDialog(row.node.id, target.side, type === 'add');
    if (type === 'name') return row.kind === 'fn' ? rename(row, target.element) : blockDialog(row.node.id);
    if (type === 'bar' && row.kind !== 'fn') return blockDialog(row.node.id);
    if (type === 'source') return sourceDialog(row.node.id);
  }

  // ---------- renomear no lugar ----------
  function rename(row, element) {
    const text = element.querySelector('text') ?? element;
    // o clique redesenhou: o texto novo é o da mesma linha, no mesmo lugar
    const live = text.isConnected ? text : [...host.querySelectorAll(`[data-t="name"][data-row="${row.index}"] text`)].find((t) => t.textContent === text.textContent) ?? text;
    const box = live.getBoundingClientRect();
    if (!box.width) return;
    const style = getComputedStyle(live);
    const zoom = view.camera.zoom;
    const input = el('input', 'inline-edit');
    Object.assign(input, { value: row.name, spellcheck: false });
    input.setAttribute('aria-label', 'Function name');
    Object.assign(input.style, {
      left: `${box.left}px`, top: `${box.top + box.height / 2 - Math.max(box.height, 16) / 2}px`, width: `${Math.max(box.width + 40, 80)}px`, height: `${Math.max(box.height, 16)}px`,
      color: style.fill, fontFamily: style.fontFamily, fontSize: `${parseFloat(style.fontSize) * zoom}px`, fontWeight: style.fontWeight,
    });
    live.style.visibility = 'hidden';
    let done = false;
    const finish = (save) => {
      if (done) return;
      done = true;
      const name = input.value.trim();
      input.remove();
      live.style.visibility = '';
      if (save && name && name !== row.name) run({ type: 'update', target: row.node.id, patch: { name } });
    };
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') finish(true);
      else if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
    host.addEventListener('wheel', () => finish(true), { once: true, capture: true });
    document.body.append(input);
    input.focus();
    input.select();
  }

  // ---------- caixas de diálogo ----------
  let dialog = null;
  function close() {
    dialog?.remove();
    dialog = null;
  }
  /** Abre uma caixa. `draw(form)` desenha o conteúdo; `save()` devolve a mensagem de erro, ou nada. */
  function modal(title, draw, save) {
    close();
    hideMenu(true);
    dialog = el('div', 'dlg');
    const form = el('form', 'wide');
    form.setAttribute('aria-label', title);
    form.noValidate = true;
    dialog.append(form);
    const redraw = () => {
      form.innerHTML = `${draw()}<p class="error" role="alert"></p><div class="row"><button type="button" data-no>Cancel</button><button type="submit" class="pri">Save</button></div>`;
      form.querySelector('[data-no]').onclick = close;
    };
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const error = save(form);
      if (error) form.querySelector('.error').textContent = error;
      else close();
    });
    dialog.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Escape') close();
    });
    dialog.addEventListener('pointerdown', (e) => e.target === dialog && close());
    panel.append(dialog);
    redraw();
    form.querySelector('input, select')?.focus();
    return { form, redraw };
  }

  // ----- dados -----
  function dataDialog(id, side, add = false) {
    const node = find(tree(), id)?.node;
    if (!node || !isFn(node)) return;
    /** cópia que se edita; `was` guarda o nome de antes, para acompanhar a troca */
    const draft = (d) => ({ was: d.name, name: d.name, type: d.type, value: d.value ?? '', fields: (d.fields ?? []).map(draft) });
    const blank = (list, base) => ({ name: freeName(base, [...names(tree()).data.map((d) => d.name), ...list.map((d) => d.name)]), type: side === 'data' ? 'text' : 'abstract', value: '', fields: [] });
    const base = { in: 'input', out: 'output', data: 'data' }[side];
    const list = node[side].map(draft);
    if (add || !list.length) list.push(blank(list, base));
    const at = (path) => {
      const steps = path.split('.').map(Number);
      let items = list, item = null, parent = list;
      for (const i of steps) {
        parent = items;
        item = items[i];
        items = item.fields;
      }
      return { item, parent, index: steps.at(-1) };
    };
    const valueField = (d, path) => {
      if (fieldsOf(d.type) || d.type === 'abstract' || d.type === 'null') return '<span></span>';
      if (d.type === 'boolean') return `<select data-k="value" data-path="${path}" aria-label="Value">${['true', 'false'].map((v) => `<option${d.value === v ? ' selected' : ''}>${v}</option>`).join('')}</select>`;
      return `<input data-k="value" data-path="${path}" value="${html(d.value)}" placeholder="${d.type === 'number' ? 'number (e.g. 42)' : d.type === 'function' ? 'function name' : 'text (e.g. Hello)'}" spellcheck="false" aria-label="Value">`;
    };
    const line = (d, path, depth) => {
      const kids = fieldsOf(d.type) ? `<div class="argkids">${d.fields.map((f, i) => line(f, `${path}.${i}`, depth + 1)).join('')}<button type="button" class="addkid" data-add="${path}">${icon('plus')}Add child</button></div>` : '';
      return `<div class="argf"><input data-k="name" data-path="${path}" value="${html(d.name)}" list="datanames" placeholder="name" spellcheck="false" aria-label="${depth ? 'Field name' : 'Data name'}"><select data-k="type" data-path="${path}" aria-label="Type">${DATA_TYPES.map((t) => `<option value="${t}"${t === d.type ? ' selected' : ''}>${TYPE_NAMES[t]}</option>`).join('')}</select>${valueField(d, path)}<button type="button" class="ib danger" data-remove="${path}" aria-label="Remove ${html(d.name)}">${icon('trash')}</button>${kids}</div>`;
    };
    const title = `${SIDE_NAMES[side]} data of ${node.name}`;
    const { form, redraw } = modal(title, () => `<label>${html(title)}</label>
      <p class="hint">Same name = same data. Renaming it where it is produced renames every use; elsewhere, only this port changes.</p>
      ${list.map((d, i) => `<div class="param">${line(d, String(i), 0)}</div>`).join('') || '<p class="hint">No data. Saving removes it from the function.</p>'}
      <button type="button" class="addkid" data-add="">${icon('plus')}Add data</button>
      <datalist id="datanames">${names(tree()).data.map((d) => `<option value="${html(d.name)}">`).join('')}</datalist>`, () => {
      const clean = (items) => {
        const seen = new Set();
        return items.map((d) => {
          const name = d.name.trim();
          if (!name) throw new Error('Every data needs a name.');
          if (seen.has(name)) throw new Error(`There is already a data called “${name}” here.`);
          seen.add(name);
          if (fieldsOf(d.type)) return { name, type: d.type, fields: clean(d.fields) };
          if (d.type === 'abstract' || d.type === 'null') return { name, type: d.type };
          const value = d.type === 'boolean' ? d.value || 'true' : d.value;
          if (d.type === 'number' && value.trim() !== '' && !Number.isFinite(Number(value))) throw new Error(`“${value}” is not a number.`);
          return { name, type: d.type, ...(value === '' && d.type !== 'text' ? {} : { value }) };
        });
      };
      let next;
      try {
        next = clean(list);
      } catch (error) {
        return error.message;
      }
      // quem troca de nome onde o dado nasce leva junto todos os usos
      const renames = new Map();
      const produced = (name) => {
        let found = false;
        walk(tree(), (n) => (found ||= isFn(n) && n.id !== id && [...n.out, ...n.data].some((d) => d.name === name)));
        return found;
      };
      const learn = (items) => items.forEach((d) => {
        if (d.was && d.was !== d.name.trim() && (side !== 'in' || !produced(d.was))) renames.set(d.was, d.name.trim());
        learn(d.fields);
      });
      learn(list);
      const result = apply(tree(), { type: 'setData', target: id, side, list: next });
      if (renames.size) walk(result.tree, (n) => isFn(n) && n.id !== id && eachDatum(n, (d) => (d.name = renames.get(d.name) ?? d.name)));
      commit(result.tree, id);
    });
    form.addEventListener('input', (e) => {
      const { k, path } = e.target.dataset;
      if (k === 'name' || k === 'value') at(path).item[k] = e.target.value;
    });
    form.addEventListener('change', (e) => {
      const { k, path } = e.target.dataset;
      if (k !== 'type') return;
      const { item } = at(path);
      item.type = e.target.value;
      if (item.type === 'boolean' && item.value !== 'false') item.value = 'true';
      redraw();
      form.querySelector(`[data-k="type"][data-path="${path}"]`).focus();
    });
    form.addEventListener('click', (e) => {
      const button = e.target.closest('[data-add], [data-remove]');
      if (!button) return;
      if (button.dataset.remove !== undefined) {
        const { parent, index } = at(button.dataset.remove);
        parent.splice(index, 1);
      } else {
        const into = button.dataset.add === '' ? list : at(button.dataset.add).item.fields;
        into.push(blank(into, button.dataset.add === '' ? base : 'field'));
      }
      redraw();
    });
  }

  // ----- condição de um bloco -----
  function blockDialog(id) {
    const node = find(tree(), id)?.node;
    if (!node || isFn(node) || ['else', 'try', 'catch'].includes(node.type)) return;
    const loop = node.type === 'for';
    const label = loop ? 'Collection' : node.type === 'case' ? 'Value' : node.type === 'switch' ? 'Expression' : 'Condition';
    const title = LOOPS.has(node.type) ? `Repetition (${node.type})` : node.type === 'if' ? 'Condition of the if' : `Block ${node.type}`;
    const field = (name, caption, value) => `<div class="param"><span class="pn">${caption}</span><input name="${name}" value="${html(value ?? '')}" list="datanames" spellcheck="false" aria-label="${caption}"></div>`;
    modal(title, () => `<label>${title}</label>${loop ? field('item', 'Variable', node.item) : ''}${field('expr', label, node.expr)}
      <datalist id="datanames">${names(tree()).data.map((d) => `<option value="${html(d.name)}">`).join('')}</datalist>`, (form) => {
      const expr = form.elements.expr.value.trim();
      const item = loop ? form.elements.item.value.trim() : undefined;
      if (!expr || (loop && !item)) return 'Fill in every field.';
      run({ type: 'update', target: id, patch: { expr, ...(loop ? { item } : {}) } });
    });
  }

  // ----- responsável -----
  function sourceDialog(id) {
    const node = find(tree(), id)?.node;
    if (!node || !isFn(node)) return;
    const current = node.source === null ? 'abstract' : (node.source?.kind ?? 'inherit');
    const title = `Source of ${node.name}`;
    modal(title, () => `<label>${html(title)}</label>
      <div class="param"><span class="pn">Kind</span><select name="kind" aria-label="Kind">${Object.entries(SOURCE_NAMES).map(([k, v]) => `<option value="${k}"${k === current ? ' selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="param"><span class="pn">Name</span><input name="source" value="${html(node.source?.name ?? '')}" spellcheck="false" aria-label="Name" placeholder="not used by “inherited” and “abstract”"></div>`, (form) => {
      const kind = form.elements.kind.value;
      const name = form.elements.source.value.trim();
      const named = kind !== 'inherit' && kind !== 'abstract';
      if (named && !name) return 'The source needs a name.';
      run({ type: 'update', target: id, patch: { source: kind === 'inherit' ? 'inherit' : named ? { kind, name } : null } });
    });
  }

  // ---------- avisos ----------
  let fading = 0;
  function toast(message) {
    panel.querySelector('.toast')?.remove();
    const note = el('div', 'toast');
    note.textContent = message;
    note.setAttribute('role', 'status');
    panel.append(note);
    clearTimeout(fading);
    fading = setTimeout(() => note.remove(), 3200);
  }

  return {
    hover, activate, resize, toast,
    close() {
      close();
      hideMenu(true);
    },
  };
}
