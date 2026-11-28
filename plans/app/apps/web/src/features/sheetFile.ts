// Abre uma planilha (CSV, TSV, XLSX, XLSM, XLS, ODS) como grade de texto e grava de volta.
// Só calcula o conteúdo do arquivo: quem lê e grava na pasta é o store.
import type { CellObject, WorkBook, WorkSheet } from 'xlsx';
import { columnIndex, excelDate, isDateFormat } from './office.ts';
import { extension, parseTable, separator } from './preview.ts';
import { checkZipSize, packed, readZip, TOO_BIG, unpack, writeZip, type Entry } from './zip.ts';

/** `shown`: o texto formatado das colunas que ainda não foram editadas. `cells`: o que se edita. */
export type Row = { id: number; cells: string[]; shown?: Record<number, string> };
export type Sheet = {
  name: string;
  rows: Row[];
  columns: number;
  /** células que não podem mudar (fórmula de matriz), como "linha,coluna" */
  locked?: Set<string>;
  formulas: boolean;
};
export type Book = {
  sheets: Sheet[];
  /** CSV: linhas e colunas podem entrar e sair do meio. Planilha: só no fim, para não quebrar fórmulas. */
  text: boolean;
  /** preenchido quando o arquivo só pode ser visto */
  readOnly: string | null;
  /** aviso sobre o que a gravação faz */
  note: string | null;
  /** preenchido quando salvar cria um anexo novo, com este nome, em vez de gravar por cima */
  copyName: string | null;
  write(sheets: Sheet[]): Promise<Blob>;
};

const FILE_LIMIT = 20_000_000;
const CSV_LIMIT = 5_000_000;
export const MAX_ROWS = 50_000;
export const MAX_COLUMNS = 500;
const SHEET_VIEW = 'Planilha grande demais para editar aqui: mostrando só o começo.';

let lastId = 0;
export const newRow = (cells: string[] = []): Row => ({ id: ++lastId, cells });

export const columnName = (c: number): string => (c >= 26 ? columnName(Math.floor(c / 26) - 1) : '') + String.fromCharCode(65 + (c % 26));

/** Devolve a aba com o texto numa célula (ela cresce se for preciso). */
export function setCell(sheet: Sheet, r: number, c: number, value: string): Sheet {
  if (r >= MAX_ROWS || c >= MAX_COLUMNS || sheet.locked?.has(`${sheet.rows[r]?.id},${c}`)) return sheet;
  const row = sheet.rows[r];
  if ((row?.cells[c] ?? '') === value) return sheet;
  const rows = sheet.rows.slice();
  while (rows.length <= r) rows.push(newRow());
  const cells = rows[r]!.cells.slice();
  while (cells.length < c) cells.push('');
  cells[c] = value;
  const shown = { ...rows[r]!.shown };
  delete shown[c];
  rows[r] = { ...rows[r]!, cells, shown };
  return { ...sheet, rows, columns: Math.max(sheet.columns, c + 1) };
}

export const insertRow = (sheet: Sheet, at: number): Sheet =>
  sheet.rows.length >= MAX_ROWS ? sheet : { ...sheet, rows: sheet.rows.toSpliced(at, 0, newRow(Array<string>(sheet.columns).fill(''))) };
export const deleteRow = (sheet: Sheet, at: number): Sheet => ({ ...sheet, rows: sheet.rows.toSpliced(at, 1) });
export const insertColumn = (sheet: Sheet, at: number): Sheet =>
  sheet.columns >= MAX_COLUMNS ? sheet : { ...sheet, columns: sheet.columns + 1, rows: sheet.rows.map((r) => (r.cells.length > at ? { ...r, cells: r.cells.toSpliced(at, 0, '') } : r)) };
/** Só para CSV e TSV: nas planilhas as colunas não saem do lugar. */
export const deleteColumn = (sheet: Sheet, at: number): Sheet => ({
  ...sheet,
  columns: Math.max(1, sheet.columns - 1),
  rows: sheet.rows.map((r) => (r.cells.length > at ? { ...r, cells: r.cells.toSpliced(at, 1) } : r)),
});

// ---------- CSV e TSV ----------

export function serializeTable(rows: string[][], sep: string, eol: string, trailing: boolean): string {
  const field = (v: string) => (v.includes(sep) || /["\r\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v);
  return rows.map((r) => r.map(field).join(sep)).join(eol) + (trailing && rows.length ? eol : '');
}

/** UTF-8 ou UTF-16 pela marca; sem ela e inválido em UTF-8, o padrão do Excel no Windows. */
function decode(bytes: Uint8Array): { text: string; bom: boolean; converted: string | null } {
  const bom = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return { text: new TextDecoder('utf-16le').decode(bytes), bom: true, converted: 'UTF-16' };
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), bom, converted: null };
  } catch {
    return { text: new TextDecoder('windows-1252').decode(bytes), bom: true, converted: 'Windows-1252' };
  }
}

async function openText(name: string, blob: Blob): Promise<Book> {
  const big = blob.size > CSV_LIMIT;
  const bytes = new Uint8Array(await blob.slice(0, CSV_LIMIT).arrayBuffer());
  // o corte pode partir um caractere: tira a última linha incompleta
  const { text, bom, converted } = decode(big ? bytes.subarray(0, bytes.lastIndexOf(10) + 1 || bytes.length) : bytes);
  if (text.includes('\u0000')) throw new Error('O arquivo não é um texto. Baixe para abrir no programa dele.');
  const parsed = parseTable(text, name, MAX_ROWS);
  const columns = parsed.rows.reduce((n, r) => Math.max(n, r.length), 1);
  const cut = big || parsed.truncated || columns > MAX_COLUMNS;
  const rows = parsed.rows.map((r) => newRow(columns > MAX_COLUMNS ? r.slice(0, MAX_COLUMNS) : r));
  const sep = separator(text, name);
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const trailing = text === '' || text.endsWith('\n');
  return {
    sheets: [{ name, rows: rows.length ? rows : [newRow([''])], columns: Math.min(columns, MAX_COLUMNS), formulas: false }],
    text: true,
    readOnly: cut ? SHEET_VIEW : null,
    note: converted && !cut ? `O arquivo está em ${converted}: ao salvar, passa para UTF-8.` : null,
    copyName: null,
    write: async ([sheet]) => {
      let out = sheet!.rows.map((r) => r.cells);
      if (out.length === 1 && out[0]!.every((c) => c === '') && out[0]!.length <= 1) out = [];
      return new Blob([(bom ? '﻿' : '') + serializeTable(out, sep, eol, trailing)], { type: 'text/csv' });
    },
  };
}

// ---------- planilhas ----------

const decimal = (n: number) => String(Number(n.toPrecision(15))).replace('.', ',');
const isDate = (z: unknown) => typeof z === 'string' && z !== 'General' && isDateFormat(0, z);
const isPercent = (z: unknown) => typeof z === 'string' && z.replace(/"[^"]*"|\\./g, '').includes('%');

/** O que se edita (`raw`) e, quando é diferente, o que se vê (`shown`). */
function cellText(cell: CellObject, shift: number): { raw: string; shown?: string } {
  let raw = '';
  let shown: string | undefined;
  if (cell.v !== undefined) {
    if (cell.t === 'n') {
      const n = cell.v as number;
      if (isDate(cell.z)) raw = excelDate(n + shift);
      else {
        raw = isPercent(cell.z) ? `${decimal(n * 100)}%` : decimal(n);
        // o formato vem com ponto decimal: troca pelos separadores daqui
        if (cell.w) shown = cell.w.trim().replace(/[.,]/g, (m) => (m === '.' ? ',' : cell.z === 'General' ? '' : '.'));
      }
    } else if (cell.t === 'b') raw = cell.v ? 'VERDADEIRO' : 'FALSO';
    else if (cell.t === 'e') raw = cell.w ?? '#ERRO';
    else if (cell.t !== 'z') raw = String(cell.v);
  }
  if (!cell.f) return { raw, shown: shown === raw ? undefined : shown };
  // fórmula: edita a fórmula e vê o último resultado salvo (se houver)
  return { raw: `=${cell.f}`, shown: raw === '' ? undefined : (shown ?? raw) };
}

export type Value = { type: 'empty' } | { type: 'number'; value: number } | { type: 'boolean'; value: boolean } | { type: 'text'; value: string } | { type: 'formula'; value: string };

/** Fórmula que o arquivo aceita: aspas e parênteses fechados, argumentos separados por vírgula. */
function checkFormula(f: string): string {
  const code = f.replace(/"(?:[^"]|"")*"|'(?:[^']|'')*'/g, '').replace(/\{[^{}]*\}/g, '');
  let open = 0;
  for (const c of code) if ((open += c === '(' ? 1 : c === ')' ? -1 : 0) < 0) break;
  if (open !== 0 || /["';{}]/.test(code)) throw new Error('fórmula inválida. Use vírgula entre os argumentos e nomes em inglês, como =SUM(A1,B2).');
  return f;
}

/** O que a pessoa digitou, como o Excel entenderia. Texto com zero à esquerda (CEP, código) continua texto. */
export function parseValue(input: string, format: unknown, shift = 0): Value {
  if (input === '') return { type: 'empty' };
  if (input.startsWith('=') && input.length > 1) return { type: 'formula', value: checkFormula(input.slice(1)) };
  const t = input.trim();
  if (/^(verdadeiro|true)$/i.test(t)) return { type: 'boolean', value: true };
  if (/^(falso|false)$/i.test(t)) return { type: 'boolean', value: false };
  if (isDate(format)) {
    const m = /^(?:(\d{1,2})\/(\d{1,2})\/(\d{4}))?\s*(?:(\d{1,2}):(\d{2}))?$/.exec(t);
    if (m && (m[1] || m[4])) {
      const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
      const date = new Date(Date.UTC(year, month - 1, day));
      if (!m[1] || (date.getUTCDate() === day && date.getUTCMonth() === month - 1)) {
        const days = m[1] ? date.getTime() / 86_400_000 + 25569 - shift : 0;
        return { type: 'number', value: days + (Number(m[4] ?? 0) * 60 + Number(m[5] ?? 0)) / 1440 };
      }
    }
  }
  const percent = isPercent(format) && t.endsWith('%');
  let n = percent ? t.slice(0, -1).trim() : t;
  if (/^-?[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(n)) n = n.replaceAll('.', '');
  if (/^-?(0|[1-9]\d*)([.,]\d+)?$/.test(n) && n.replace(/\D/g, '').length <= 15) {
    const value = Number(n.replace(',', '.'));
    return { type: 'number', value: percent ? value / 100 : value };
  }
  return { type: 'text', value: input };
}

type Edit = { sheet: string; ref: string; r: number; c: number; value: Value };

/** Células que mudaram, já interpretadas. As linhas das planilhas não saem do lugar. */
function diff(before: Sheet[], after: Sheet[], wb: WorkBook, shift: number): Edit[] {
  const edits: Edit[] = [];
  after.forEach((sheet, i) => {
    const old = before[i]!.rows;
    sheet.rows.forEach((row, r) => {
      if (row === old[r]) return;
      for (let c = 0; c < Math.max(row.cells.length, old[r]?.cells.length ?? 0); c++) {
        const text = row.cells[c] ?? '';
        if (text === (old[r]?.cells[c] ?? '')) continue;
        const ref = `${columnName(c)}${r + 1}`;
        try {
          edits.push({ sheet: sheet.name, ref, r, c, value: parseValue(text, (wb.Sheets[sheet.name]?.[ref] as CellObject | undefined)?.z, shift) });
        } catch (e) {
          throw new Error(`${sheet.name}, ${ref}: ${(e as Error).message}`);
        }
      }
    });
  });
  return edits;
}

const xml = (text: string) => {
  const doc = new DOMParser().parseFromString(text, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('O arquivo está corrompido.');
  return doc;
};
const all = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagNameNS('*', tag));
const children = (node: Element, tag: string) => Array.from(node.children).filter((c) => c.localName === tag);

function make(parent: Element, tag: string): Element {
  const name = parent.prefix ? `${parent.prefix}:${tag}` : tag;
  return parent.ownerDocument.createElementNS(parent.namespaceURI, name);
}

/** Acha o filho (linha ou célula) pelo número, a partir de 0, e cria no lugar certo se não existir. */
function slots(parent: Element, tag: 'row' | 'c', created?: (node: Element, index: number) => void) {
  const ref = (at: number) => (tag === 'row' ? String(at + 1) : `${columnName(at)}${parent.getAttribute('r')}`);
  let at = -1;
  const list = children(parent, tag).map((node) => {
    const r = node.getAttribute('r');
    // sem referência, vale a posição
    at = !r ? at + 1 : tag === 'row' ? Number(r) - 1 : columnIndex(r);
    if (!r) node.setAttribute('r', ref(at));
    return { at, node };
  });
  return (index: number): Element => {
    let low = 0;
    for (let high = list.length; low < high; ) {
      const mid = (low + high) >> 1;
      if (list[mid]!.at < index) low = mid + 1;
      else high = mid;
    }
    if (list[low]?.at === index) return list[low]!.node;
    const node = make(parent, tag);
    node.setAttribute('r', ref(index));
    parent.insertBefore(node, list[low]?.node ?? null);
    list.splice(low, 0, { at: index, node });
    created?.(node, index);
    return node;
  };
}

/** Troca o conteúdo da célula e mantém o estilo dela. */
function writeCell(cell: Element, value: Value) {
  for (const a of ['t', 'cm', 'vm', 'ph']) cell.removeAttribute(a);
  cell.replaceChildren();
  const child = (parent: Element, tag: string, text: string) => {
    const node = parent.appendChild(make(parent, tag));
    node.textContent = text;
    return node;
  };
  // caracteres de controle não cabem em XML
  const clean = (s: string) => s.replace(/[^\t\n\r -퟿-�\u{10000}-\u{10ffff}]/gu, '');
  if (value.type === 'number') child(cell, 'v', String(value.value));
  else if (value.type === 'boolean') {
    cell.setAttribute('t', 'b');
    child(cell, 'v', value.value ? '1' : '0');
  } else if (value.type === 'formula') child(cell, 'f', clean(value.value));
  else if (value.type === 'text') {
    cell.setAttribute('t', 'inlineStr');
    const t = child(cell.appendChild(make(cell, 'is')), 't', clean(value.value));
    t.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:space', 'preserve');
  }
}

function patchSheet(text: string, edits: Edit[], ws: WorkSheet): string {
  const doc = xml(text);
  const data = all(doc, 'sheetData')[0];
  if (!data) throw new Error('O arquivo está corrompido.');
  const rowAt = slots(data, 'row');
  const columns = all(doc, 'col').map((col) => ({ from: Number(col.getAttribute('min')) - 1, to: Number(col.getAttribute('max')) - 1, style: col.getAttribute('style') }));
  const cellsOf = new Map<Element, (c: number) => Element>();
  for (const e of edits) {
    const row = rowAt(e.r);
    let cellAt = cellsOf.get(row);
    if (!cellAt) {
      // célula nova ganha o estilo da linha ou, sem ele, o da coluna, como no Excel
      const style = (c: number) => (['1', 'true'].includes(row.getAttribute('customFormat') ?? '') ? row.getAttribute('s') : columns.find((col) => c >= col.from && c <= col.to)?.style);
      cellsOf.set(row, (cellAt = slots(row, 'c', (cell, c) => {
        const s = style(c);
        if (s) cell.setAttribute('s', s);
      })));
    }
    row.removeAttribute('spans');
    const cell = cellAt(e.c);
    const formula = children(cell, 'f')[0];
    // a primeira célula de uma fórmula compartilhada vai sumir: as outras passam a ter a própria fórmula
    if (formula?.getAttribute('t') === 'shared' && formula.hasAttribute('ref')) {
      for (const other of all(data, 'f')) {
        if (other === formula || other.getAttribute('t') !== 'shared' || other.getAttribute('si') !== formula.getAttribute('si')) continue;
        const own = (ws[other.parentElement!.getAttribute('r') ?? ''] as CellObject | undefined)?.f;
        if (!own) continue;
        for (const a of ['t', 'si', 'ref']) other.removeAttribute(a);
        other.textContent = own;
      }
    }
    writeCell(cell, e.value);
  }
  const dimension = all(doc, 'dimension')[0];
  if (dimension) {
    const [from = 'A1', to = from] = (dimension.getAttribute('ref') ?? 'A1').split(':');
    const lastColumn = edits.reduce((n, e) => Math.max(n, e.c), columnIndex(to));
    const lastRow = edits.reduce((n, e) => Math.max(n, e.r + 1), Number(to.replace(/^[A-Z]+/, '')) || 1);
    dimension.setAttribute('ref', `${from}:${columnName(lastColumn)}${lastRow}`);
  }
  return serialize(doc);
}

function serialize(doc: Document): string {
  const out = new XMLSerializer().serializeToString(doc);
  return out.startsWith('<?xml') ? out : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n${out}`;
}

/** Pede ao Excel para recalcular as fórmulas ao abrir. */
function recalculate(text: string): string {
  const doc = xml(text);
  const root = doc.documentElement;
  let calc = children(root, 'calcPr')[0];
  if (!calc) {
    // a ordem dos elementos é fixa no formato
    const before = ['definedNames', 'externalReferences', 'functionGroups', 'sheets'].map((t) => children(root, t)[0]).find(Boolean);
    calc = make(root, 'calcPr');
    root.insertBefore(calc, before?.nextSibling ?? null);
  }
  calc.setAttribute('fullCalcOnLoad', '1');
  return serialize(doc);
}

/** Regrava o .xlsx mexendo só nas células editadas: estilos, larguras, mesclas, gráficos e macros ficam como estavam. */
async function patchWorkbook(bytes: Uint8Array<ArrayBuffer>, edits: Edit[], wb: WorkBook): Promise<Blob> {
  const entries = new Map<string, Entry>(readZip(bytes).map((e) => [e.name, e]));
  const read = async (path: string) => {
    const e = entries.get(path);
    if (!e) throw new Error('O arquivo está corrompido.');
    return new TextDecoder().decode(await unpack(e));
  };
  const write = async (path: string, text: string) => void entries.set(path, await packed(entries.get(path)!, new TextEncoder().encode(text)));

  const workbook = await read('xl/workbook.xml');
  const targets = new Map(all(xml(await read('xl/_rels/workbook.xml.rels')), 'Relationship').map((r) => [r.getAttribute('Id'), r.getAttribute('Target') ?? '']));
  const paths = new Map(all(xml(workbook), 'sheet').map((s) => {
    const target = targets.get(Array.from(s.attributes).find((a) => a.localName === 'id')?.value ?? '') ?? '';
    return [s.getAttribute('name'), target.startsWith('/') ? target.slice(1) : `xl/${target}`];
  }));
  for (const name of new Set(edits.map((e) => e.sheet))) {
    const path = paths.get(name);
    if (!path) throw new Error(`Não achei a aba ${name} dentro do arquivo.`);
    await write(path, patchSheet(await read(path), edits.filter((e) => e.sheet === name), wb.Sheets[name]!));
  }
  await write('xl/workbook.xml', recalculate(workbook));
  // a ordem de cálculo guardada pode citar fórmulas que saíram: o Excel a refaz
  if (entries.delete('xl/calcChain.xml')) {
    for (const [path, tag, attribute] of [['[Content_Types].xml', 'Override', 'PartName'], ['xl/_rels/workbook.xml.rels', 'Relationship', 'Target']] as const) {
      const doc = xml(await read(path));
      for (const node of all(doc, tag)) if (node.getAttribute(attribute)?.endsWith('calcChain.xml')) node.remove();
      await write(path, serialize(doc));
    }
  }
  return writeZip([...entries.values()]);
}

async function openSpreadsheet(name: string, blob: Blob): Promise<Book> {
  if (blob.size > FILE_LIMIT) throw new Error(TOO_BIG);
  const ext = extension(name);
  const patch = ext === 'xlsx' || ext === 'xlsm';
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const zipped = bytes[0] === 0x50 && bytes[1] === 0x4b;
  // sem estas conferências, a biblioteca leria um texto qualquer como se fosse planilha
  if (patch && !zipped) throw new Error('O arquivo está corrompido ou protegido por senha.');
  if (!patch && !zipped && !(bytes[0] === 0xd0 && bytes[1] === 0xcf)) throw new Error('O arquivo está corrompido ou não é uma planilha.');
  if (zipped) await checkZipSize(bytes);
  const XLSX = await import('xlsx');
  let wb: WorkBook;
  try {
    wb = XLSX.read(bytes, { type: 'array', cellFormula: true, cellNF: true, cellText: true, sheetStubs: true, xlfn: true });
  } catch {
    throw new Error('O arquivo está corrompido ou protegido por senha.');
  }
  const shift = wb.Workbook?.WBProps?.date1904 ? 1462 : 0;
  let cut = false;
  const sheets: Sheet[] = [];
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws || ws['!type'] === 'chart') continue;
    const cells: [number, number, CellObject][] = [];
    const arrays: string[] = [];
    let height = 0;
    let width = 0;
    for (const key of Object.keys(ws)) {
      if (key.startsWith('!')) continue;
      const { r, c } = XLSX.utils.decode_cell(key);
      const cell = ws[key] as CellObject;
      if (cell.F) arrays.push(cell.F);
      // célula só com estilo não aumenta a grade
      if (cell.t === 'z' && !cell.f) continue;
      if (r >= MAX_ROWS || c >= MAX_COLUMNS) {
        cut = true;
        continue;
      }
      cells.push([r, c, cell]);
      height = Math.max(height, r + 1);
      width = Math.max(width, c + 1);
    }
    const rows = Array.from({ length: Math.max(1, height) }, () => newRow());
    let formulas = false;
    for (const [r, c, cell] of cells) {
      const row = rows[r]!;
      const { raw, shown } = cellText(cell, shift);
      formulas ||= !!cell.f;
      while (row.cells.length < c) row.cells.push('');
      row.cells[c] = raw;
      if (shown !== undefined) (row.shown ??= {})[c] = shown;
    }
    const locked = new Set<string>();
    for (const range of new Set(arrays)) {
      const { s, e } = XLSX.utils.decode_range(range);
      for (let r = s.r; r <= Math.min(e.r, rows.length - 1); r++) for (let c = s.c; c <= Math.min(e.c, MAX_COLUMNS - 1); c++) locked.add(`${rows[r]!.id},${c}`);
    }
    sheets.push({ name: sheetName, rows, columns: Math.max(1, width), locked, formulas });
  }
  if (!sheets.length) throw new Error('A planilha não tem abas com células.');
  // a biblioteca pula em silêncio a aba que não entende: avisa, para ninguém achar que ela sumiu
  const unread = wb.SheetNames.filter((n) => !wb.Sheets[n]);
  const missing = unread.length ? `Não deu para ler: ${unread.join(', ')}.` : '';

  return {
    sheets,
    text: false,
    // no .xlsx só as células editadas são regravadas; a cópia regrava tudo e perderia o que ficou de fora
    // no .xlsx o que não foi lido continua no arquivo; numa cópia, ficaria de fora
    readOnly: patch ? null : cut ? SHEET_VIEW : missing || null,
    note: !patch
      ? `Arquivo .${ext}: salvar cria uma cópia .xlsx, com valores e fórmulas, sem a formatação. O original não muda.`
      : [missing, cut && 'Planilha grande: mostrando só o começo. Salvar não apaga o resto.'].filter(Boolean).join(' ') || null,
    copyName: patch ? null : `${name.slice(0, name.lastIndexOf('.'))}.xlsx`,
    write: async (next) => {
      const edits = diff(sheets, next, wb, shift);
      if (patch) return patchWorkbook(bytes, edits, wb);
      const copy: WorkBook = { ...wb, Sheets: { ...wb.Sheets } };
      for (const e of edits) {
        const ws: WorkSheet = (copy.Sheets[e.sheet] = { ...copy.Sheets[e.sheet] });
        const z = (ws[e.ref] as CellObject | undefined)?.z;
        const v = e.value;
        if (v.type === 'empty') delete ws[e.ref];
        else if (v.type === 'formula') ws[e.ref] = { t: 'n', f: v.value, z };
        else ws[e.ref] = { t: v.type === 'number' ? 'n' : v.type === 'boolean' ? 'b' : 's', v: v.value, z };
        const range = XLSX.utils.decode_range(ws['!ref'] ?? e.ref);
        range.e = { r: Math.max(range.e.r, e.r), c: Math.max(range.e.c, e.c) };
        ws['!ref'] = XLSX.utils.encode_range(range);
      }
      return new Blob([XLSX.write(copy, { type: 'array', bookType: 'xlsx', compression: true }) as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    },
  };
}

export const openBook = (name: string, blob: Blob): Promise<Book> => (['csv', 'tsv'].includes(extension(name)) ? openText(name, blob) : openSpreadsheet(name, blob));
