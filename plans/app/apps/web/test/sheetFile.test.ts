import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import { deleteColumn, deleteRow, insertColumn, insertRow, openBook, parseValue, setCell, type Book, type Sheet } from '../src/features/sheetFile.ts';
import { packed, readZip, unpack, writeZip } from '../src/features/zip.ts';
import { ConflictError, initFolder, ProjectStore } from '../src/folder/project.ts';
import { MemDir } from './memory.ts';

const { DOMParser, XMLSerializer } = new JSDOM('').window;
Object.assign(globalThis, { DOMParser, XMLSerializer });

const text = (s: Sheet) => s.rows.map((r) => Array.from({ length: s.columns }, (_, c) => r.cells[c] ?? ''));
const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());
const edit = (book: Book, changes: [r: number, c: number, v: string][], tab = 0) =>
  book.sheets.with(tab, changes.reduce((s, [r, c, v]) => setCell(s, r, c, v), book.sheets[tab]!));

describe('CSV e TSV', () => {
  const csv = '﻿nome;obs;n\r\n"Silva; Ana";"diz ""oi""";007\r\nBia\r\n';

  it('sem mudança, grava os mesmos bytes (BOM, separador, fim de linha e linhas curtas)', async () => {
    const book = await openBook('a.csv', new Blob([csv]));
    expect(text(book.sheets[0]!)).toEqual([['nome', 'obs', 'n'], ['Silva; Ana', 'diz "oi"', '007'], ['Bia', '', '']]);
    expect(await bytes(await book.write(book.sheets))).toEqual(await bytes(new Blob([csv])));
  });

  it('edita, insere e exclui linhas e colunas', async () => {
    const book = await openBook('a.csv', new Blob(['a,b\n1,2\n3,4\n']));
    let s = setCell(book.sheets[0]!, 1, 1, 'x,y');
    s = insertColumn(insertRow(deleteRow(s, 2), 1), 1);
    s = setCell(setCell(s, 1, 0, 'novo'), 0, 1, 'meio');
    expect(await (await book.write([s])).text()).toBe('a,meio,b\nnovo,,\n1,,"x,y"\n');
    expect(await (await book.write([deleteColumn(book.sheets[0]!, 0)])).text()).toBe('b\n2\n4\n');
  });

  it('arquivo vazio continua vazio até alguém escrever', async () => {
    const book = await openBook('a.tsv', new Blob(['']));
    expect(await (await book.write(book.sheets)).text()).toBe('');
    expect(await (await book.write(edit(book, [[0, 1, 'oi']]))).text()).toBe('\toi\n');
    expect(setCell(book.sheets[0]!, 0, 0, '')).toBe(book.sheets[0]);
  });

  it('lê o CSV do Excel em Windows-1252 e avisa que salva em UTF-8', async () => {
    const book = await openBook('a.csv', new Blob([new Uint8Array([0x6e, 0xe3, 0x6f, 0x3b, 0x31, 0x0a])]));
    expect(book.sheets[0]!.rows[0]!.cells).toEqual(['não', '1']);
    expect(book.note).toMatch(/Windows-1252/);
    expect(await bytes(await book.write(book.sheets))).toEqual(await bytes(new Blob(['﻿não;1\n'])));
  });

  it('grande demais: só para ver', async () => {
    const book = await openBook('a.csv', new Blob(['1\n'.repeat(50_001)]));
    expect(book.sheets[0]!.rows).toHaveLength(50_000);
    expect(book.readOnly).toMatch(/grande/);
  });
});

describe('o que se digita', () => {
  it('vira número, texto, data, porcentagem ou fórmula', () => {
    const values = (inputs: string[], format?: string) => inputs.map((i) => Object.values(parseValue(i, format)));
    expect(values(['1.234,5', '-2.5', '10', '007', '1234567890123456', 'oi ', 'falso', ''])).toEqual([
      ['number', 1234.5], ['number', -2.5], ['number', 10], ['text', '007'], ['text', '1234567890123456'], ['text', 'oi '], ['boolean', false], ['empty'],
    ]);
    expect(values(['28/11/2026', '28/11/2026 12:00', '31/02/2026'], 'dd/mm/yyyy')).toEqual([['number', 46354], ['number', 46354.5], ['text', '31/02/2026']]);
    expect(values(['50%'], '0%')).toEqual([['number', 0.5]]);
    expect(values(['=SUM(A1,B2)', '=IF(A1="a;b",1,{1;2})', '='])).toEqual([['formula', 'SUM(A1,B2)'], ['formula', 'IF(A1="a;b",1,{1;2})'], ['text', '=']]);
    for (const bad of ['=SOMA(A1;A2)', '=SUM(A1', '=A1&"x']) expect(() => parseValue(bad, undefined)).toThrow(/fórmula/);
  });
});

/** .xlsx com o que a biblioteca perderia: estilo, mescla, largura, fórmula compartilhada, ordem de cálculo e um extra. */
async function fixture(): Promise<Blob> {
  const ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const rel = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const files: Record<string, string> = {
    '[Content_Types].xml': `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/calcChain.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.calcChain+xml"/></Types>`,
    '_rels/.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<workbook xmlns="${ns}" xmlns:r="${rel}"><sheets><sheet name="Funil" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${rel}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${rel}/styles" Target="styles.xml"/><Relationship Id="rId3" Type="${rel}/calcChain" Target="calcChain.xml"/></Relationships>`,
    'xl/styles.xml': `<styleSheet xmlns="${ns}"><fonts count="1"><font/></fonts><fills count="1"><fill/></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="14" applyNumberFormat="1"/></cellXfs></styleSheet>`,
    'xl/calcChain.xml': `<calcChain xmlns="${ns}"><c r="B1" i="1"/></calcChain>`,
    'xl/worksheets/sheet1.xml': `<worksheet xmlns="${ns}"><dimension ref="A1:C3"/><cols><col min="1" max="1" width="30" customWidth="1"/><col min="5" max="6" width="12" style="1"/></cols><sheetData><row r="1" spans="1:3"><c r="A1"><v>1</v></c><c r="B1"><f t="shared" ref="B1:B3" si="0">A1*2</f><v>2</v></c><c r="C1" s="1"><v>46354</v></c></row><row r="2"><c r="A2"><v>2</v></c><c r="B2"><f t="shared" si="0"/><v>4</v></c></row><row r="3"><c r="A3" t="str"><f>"x"</f><v>x</v></c><c r="B3"><f t="shared" si="0"/><v>6</v></c></row></sheetData><mergeCells count="1"><mergeCell ref="A5:C5"/></mergeCells></worksheet>`,
    'xl/media/logo.bin': 'não é XML: tem de sair igual',
  };
  const entries = Object.entries(files).map(([name, content]) =>
    packed({ name, method: 8, flags: 0x800, time: 0, crc: 0, usize: 0, attributes: 0, data: new Uint8Array() }, new TextEncoder().encode(content)),
  );
  return writeZip(await Promise.all(entries));
}
const parts = async (b: Blob) => new Map(await Promise.all(readZip(await bytes(b)).map(async (e) => [e.name, new TextDecoder().decode(await unpack(e))] as const)));

describe('XLSX', () => {
  it('mostra valores, datas e fórmulas', async () => {
    const book = await openBook('funil.xlsx', await fixture());
    expect(book).toMatchObject({ text: false, readOnly: null, copyName: null });
    expect(text(book.sheets[0]!)).toEqual([['1', '=A1*2', '28/11/2026'], ['2', '=A2*2', ''], ['="x"', '=A3*2', '']]);
    expect(book.sheets[0]!.rows[1]!.shown).toEqual({ 1: '4' });
  });

  it('regrava só as células editadas e preserva o resto', async () => {
    const original = await fixture();
    const book = await openBook('funil.xlsx', original);
    const saved = await book.write(edit(book, [
      [0, 1, 'texto <novo> & ""'], // a primeira da fórmula compartilhada
      [0, 2, '01/12/2026'],
      [1, 0, '2,5'],
      [1, 2, '=SUM(A1,A2)'],
      [2, 0, ''],
      [9, 4, 'fim'],
      [0, 5, '02/12/2026'], // célula nova numa coluna formatada
    ]));
    const [before, after] = [await parts(original), await parts(saved)];
    expect([...after.keys()]).toEqual([...before.keys()].filter((n) => n !== 'xl/calcChain.xml'));
    for (const name of ['_rels/.rels', 'xl/styles.xml', 'xl/media/logo.bin']) expect(after.get(name)).toBe(before.get(name));
    expect(after.get('[Content_Types].xml')).not.toContain('calcChain');
    expect(after.get('xl/_rels/workbook.xml.rels')).not.toContain('calcChain');
    expect(after.get('xl/workbook.xml')).toMatch(/<\/sheets><calcPr fullCalcOnLoad="1"\/>/);
    const sheet = after.get('xl/worksheets/sheet1.xml')!;
    expect(sheet).toContain('<c r="C1" s="1"><v>46357</v></c>');
    expect(sheet).toContain('<col min="1" max="1" width="30" customWidth="1"/>');
    expect(sheet).toContain('<mergeCell ref="A5:C5"/>');
    expect(sheet).toContain('<c r="F1" s="1" t="inlineStr">');
    expect(sheet).toContain('<c r="E10" s="1" t="inlineStr">');
    expect(sheet).toContain('<dimension ref="A1:F10"/>');
    expect(sheet).toContain('<c r="B2"><f>A2*2</f><v>4</v></c>');
    expect(sheet).toContain('<c r="A3"/>');
    expect(sheet).not.toContain('shared');

    const again = await openBook('funil.xlsx', saved);
    const rows = text(again.sheets[0]!);
    expect(rows[0]).toEqual(['1', 'texto <novo> & ""', '01/12/2026', '', '', expect.any(String)]);
    expect(rows[1]).toEqual(['2,5', '=A2*2', '=SUM(A1,A2)', '', '', '']);
    expect(rows[2]).toEqual(['', '=A3*2', '', '', '', '']);
    expect(rows[9]).toEqual(['', '', '', '', 'fim', '']);
  });

  it('recusa a fórmula que estragaria o arquivo, dizendo onde', async () => {
    const book = await openBook('funil.xlsx', await fixture());
    await expect(book.write(edit(book, [[3, 0, '=SOMA(A1;A2)']]))).rejects.toThrow(/Funil, A4: fórmula/);
  });

  it('edita várias abas de um arquivo feito pela biblioteca', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['a', 1]]), 'Um');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['b', true]]), 'Dois');
    const book = await openBook('x.xlsx', new Blob([XLSX.write(wb, { type: 'array', bookType: 'xlsx' })]));
    const next = edit({ ...book, sheets: edit(book, [[0, 0, 'A']]) }, [[1, 1, 'B2']], 1);
    const read = XLSX.read(await bytes(await book.write(next)), { type: 'array' });
    expect(read.SheetNames.map((n) => XLSX.utils.sheet_to_json(read.Sheets[n]!, { header: 1 }))).toEqual([[['A', 1]], [['b', true], [undefined, 'B2']].map((r) => Array.from(r))]);
  });

  it('XLS e ODS salvam como uma cópia .xlsx', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['a', 1]]), 'Um');
    for (const [name, bookType] of [['velha.xls', 'biff8'], ['livre.ods', 'ods']] as const) {
      const book = await openBook(name, new Blob([XLSX.write(wb, { type: 'array', bookType })]));
      expect(book.copyName).toBe(name.replace(/\w+$/, 'xlsx'));
      const copy = await openBook(book.copyName!, await book.write(edit(book, [[0, 1, '2'], [1, 0, '=B1*3']])));
      expect(text(copy.sheets[0]!)).toEqual([['a', '2'], ['=B1*3', '']]);
    }
  });

  it('arquivo inválido avisa', async () => {
    for (const name of ['a.xlsx', 'a.xls', 'a.ods']) await expect(openBook(name, new Blob(['isto não é uma planilha']))).rejects.toThrow(/corrompido/);
  });
});

describe('salvar por cima de um anexo', () => {
  it('guarda a versão anterior na lixeira e não sobrescreve o que mudou fora', async () => {
    const root = new MemDir();
    const store = new ProjectStore(root, await initFolder(root));
    const { id } = await store.create(null, 'a');
    await store.addAttachment(id, 'input', 't.csv', new Blob(['um']));
    await store.saveAttachment(id, 'input', 't.csv', new Blob(['um']), new Blob(['dois']));
    expect(await (await store.readAttachment(id, 'input', 't.csv')).text()).toBe('dois');
    const trash = await (await root.getDirectoryHandle('.plans')).getDirectoryHandle('trash');
    const bin = [...trash.items.values()][0] as MemDir;
    const old = await (await (await bin.getDirectoryHandle('attachments')).getDirectoryHandle(id)).getDirectoryHandle('input');
    expect(await (await (await old.getFileHandle('t.csv')).getFile()).text()).toBe('um');
    await expect(store.saveAttachment(id, 'input', 't.csv', new Blob(['um']), new Blob(['três']))).rejects.toBeInstanceOf(ConflictError);
    await store.removeAttachment(id, 'input', 't.csv');
    await expect(store.saveAttachment(id, 'input', 't.csv', new Blob(['dois']), new Blob(['três']))).rejects.toBeInstanceOf(ConflictError);
  });
});
