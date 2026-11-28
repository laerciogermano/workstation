// Lê .xlsx e .docx (um zip com XML dentro) só para mostrar o conteúdo, sem formatação.

const FILE_LIMIT = 50_000_000;
const ENTRY_LIMIT = 30_000_000;
const COLUMN_LIMIT = 100;
const BLOCK_LIMIT = 1000;

const TOO_BIG = 'Arquivo grande demais para mostrar aqui.';
const BROKEN = 'O arquivo está corrompido ou protegido por senha.';

/** Descompacta aos poucos: um zip que mente sobre o tamanho não esgota a memória. */
async function inflate(data: Uint8Array<ArrayBuffer>): Promise<string> {
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const parts: Uint8Array<ArrayBuffer>[] = [];
  for (let size = 0; ; ) {
    const { done, value } = await reader.read();
    if (done) return new Blob(parts).text();
    size += value.length;
    if (size > ENTRY_LIMIT) throw new Error(TOO_BIG);
    parts.push(value);
  }
}

export type ZipEntry = { method: number; size: number; offset: number; /** início do registro no índice central */ at: number };

/** Índice do zip: nome, onde estão os dados e como foram guardados. */
export function zipEntries(bytes: Uint8Array<ArrayBuffer>): Map<string, ZipEntry> {
  const view = new DataView(bytes.buffer);
  // o índice fica no fim, antes de um comentário de até 64 KB
  let end = bytes.length - 22;
  while (end >= 0 && end >= bytes.length - 65_557 && view.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0 || view.getUint32(end, true) !== 0x06054b50) throw new Error(BROKEN);
  const entries = new Map<string, ZipEntry>();
  let at = view.getUint32(end + 16, true);
  for (let i = view.getUint16(end + 10, true); i > 0; i--) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50) throw new Error(BROKEN);
    const nameLength = view.getUint16(at + 28, true);
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength));
    entries.set(name, { method: view.getUint16(at + 10, true), size: view.getUint32(at + 20, true), offset: view.getUint32(at + 42, true), at });
    at += 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
  }
  return entries;
}

/** Devolve o leitor das entradas do zip: texto, ou null se a entrada não existe. */
export async function openZip(blob: Blob): Promise<(path: string) => Promise<string | null>> {
  if (blob.size > FILE_LIMIT) throw new Error(TOO_BIG);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const entries = zipEntries(bytes);
  return async (path) => {
    const e = entries.get(path);
    if (!e) return null;
    const start = e.offset + 30 + view.getUint16(e.offset + 26, true) + view.getUint16(e.offset + 28, true);
    const data = bytes.subarray(start, start + e.size);
    if (e.method === 8) return inflate(data);
    if (e.method !== 0) throw new Error(BROKEN);
    if (data.length > ENTRY_LIMIT) throw new Error(TOO_BIG);
    return new TextDecoder().decode(data);
  };
}

const xml = (text: string) => new DOMParser().parseFromString(text, 'application/xml');
const all = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagNameNS('*', tag));
const attr = (node: Element, name: string) => Array.from(node.attributes).find((a) => a.localName === name)?.value ?? null;

/** "A" = 0, "Z" = 25, "AA" = 26 */
export const columnIndex = (ref: string) => [...(ref.match(/^[A-Z]+/)?.[0] ?? '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

export const isDateFormat = (id: number, code?: string) =>
  (id >= 14 && id <= 22) || (id >= 45 && id <= 47) || (!!code && /[dmyhs]/i.test(code.replace(/"[^"]*"|\[[^\]]*\]|\\./g, '')));

/** O Excel guarda datas como dias desde 1899-12-30. */
export function excelDate(serial: number): string {
  const date = new Date(Math.round((serial - 25569) * 86_400_000));
  if (Number.isNaN(date.getTime())) return String(serial);
  const day = date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const time = date.toLocaleTimeString('pt-BR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' });
  return serial < 1 ? time : Number.isInteger(serial) ? day : `${day} ${time}`;
}

export type Sheet = { name: string; rows: string[][]; truncated: boolean };

export async function readSheets(blob: Blob, rowLimit: number): Promise<Sheet[]> {
  const read = await openZip(blob);
  const workbook = await read('xl/workbook.xml');
  if (!workbook) throw new Error(BROKEN);
  const book = xml(workbook);
  const targets = new Map(all(xml((await read('xl/_rels/workbook.xml.rels')) ?? '<r/>'), 'Relationship').map((r) => [r.getAttribute('Id'), r.getAttribute('Target') ?? '']));
  // texto com formatação vem em pedaços; a leitura fonética (rPh) não faz parte dele
  const textOf = (node: Element) => all(node, 't').filter((t) => t.parentElement?.localName !== 'rPh').map((t) => t.textContent).join('');
  const shared = all(xml((await read('xl/sharedStrings.xml')) ?? '<r/>'), 'si').map(textOf);
  const styles = xml((await read('xl/styles.xml')) ?? '<r/>');
  const codes = new Map(all(styles, 'numFmt').map((f) => [Number(f.getAttribute('numFmtId')), f.getAttribute('formatCode') ?? '']));
  const dates = all(all(styles, 'cellXfs')[0] ?? styles.documentElement, 'xf').map((x) => {
    const id = Number(x.getAttribute('numFmtId'));
    return isDateFormat(id, codes.get(id));
  });
  const shift = ['1', 'true'].includes(all(book, 'workbookPr')[0]?.getAttribute('date1904') ?? '') ? 1462 : 0;

  const value = (cell: Element) => {
    const type = cell.getAttribute('t');
    if (type === 'inlineStr') return textOf(cell);
    const v = all(cell, 'v')[0]?.textContent ?? '';
    if (v === '') {
      // fórmula salva sem o resultado (arquivo gerado por script): mostra a própria fórmula
      const formula = all(cell, 'f')[0]?.textContent;
      return formula ? `=${formula}` : '';
    }
    if (type === 's') return shared[Number(v)] ?? '';
    if (type === 'b') return v === '1' ? 'VERDADEIRO' : 'FALSO';
    if (type === 'str' || type === 'e' || type === 'd') return v;
    if (dates[Number(cell.getAttribute('s') ?? 0)]) return excelDate(Number(v) + shift);
    return String(Number(Number(v).toPrecision(15))).replace('.', ',');
  };

  const sheets: Sheet[] = [];
  for (const s of all(book, 'sheet')) {
    const target = targets.get(attr(s, 'id')) ?? '';
    const text = await read(target.startsWith('/') ? target.slice(1) : `xl/${target}`);
    if (text === null) continue; // gráfico ou outra folha sem células
    const found = all(xml(text), 'row');
    const rows = found.slice(0, rowLimit).map((row) => {
      const cells: string[] = [];
      for (const cell of all(row, 'c')) {
        const ref = cell.getAttribute('r');
        const i = ref ? columnIndex(ref) : cells.length;
        if (i >= 0 && i < COLUMN_LIMIT) cells[i] = value(cell);
      }
      return Array.from(cells, (c) => c ?? '');
    });
    const width = Math.max(0, ...rows.map((r) => r.length));
    sheets.push({ name: s.getAttribute('name') ?? 'Planilha', rows: rows.map((r) => [...r, ...Array<string>(width - r.length).fill('')]), truncated: found.length > rowLimit });
  }
  return sheets;
}

export type Block = { type: 'text'; text: string; heading: boolean } | { type: 'table'; rows: string[][] };

export async function readDocument(blob: Blob): Promise<{ blocks: Block[]; truncated: boolean }> {
  const text = await (await openZip(blob))('word/document.xml');
  const body = text && all(xml(text), 'body')[0];
  if (!body) throw new Error(BROKEN);
  const paragraph = (p: Element) => all(p, '*').map((n) => (n.localName === 't' ? n.textContent : n.localName === 'tab' && n.parentElement?.localName === 'r' ? '\t' : n.localName === 'br' ? '\n' : '')).join('');
  const children = Array.from(body.children).filter((c) => c.localName === 'p' || c.localName === 'tbl');
  const blocks = children.slice(0, BLOCK_LIMIT).map((c): Block => {
    if (c.localName === 'tbl') return { type: 'table', rows: all(c, 'tr').map((r) => all(r, 'tc').map((cell) => all(cell, 'p').map(paragraph).join('\n'))) };
    const style = all(c, 'pStyle')[0];
    return { type: 'text', text: paragraph(c), heading: /^(heading|ttulo|titulo|title)/i.test(style ? (attr(style, 'val') ?? '') : '') };
  });
  return { blocks, truncated: children.length > BLOCK_LIMIT };
}
