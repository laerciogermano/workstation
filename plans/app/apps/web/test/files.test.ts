import { describe, expect, it } from 'vitest';
import { columnIndex, excelDate, isDateFormat, openZip } from '../src/features/office.ts';
import { fileKind, fileSize, parseTable } from '../src/features/preview.ts';
import { ConflictError, initFolder, ProjectStore } from '../src/folder/project.ts';
import { MemDir, MemFile } from './memory.ts';

async function setup() {
  const root = new MemDir();
  const store = new ProjectStore(root, await initFolder(root));
  const a = await store.create(null, 'Fechar identidade');
  return { root, store, a };
}
const dirAt = async (dir: MemDir, ...path: string[]) => {
  for (const p of path) dir = await dir.getDirectoryHandle(p);
  return dir;
};

describe('anexos', () => {
  it('guarda input e output separados, sem sobrescrever e sem tocar na atividade', async () => {
    const { root, store, a } = await setup();
    expect(await store.loadFiles(a.id)).toEqual({ input: [], output: [], comments: [] });
    expect(await store.addAttachment(a.id, 'input', 'brief.txt', new Blob(['um']))).toBe('brief.txt');
    expect(await store.addAttachment(a.id, 'input', 'brief.txt', new Blob(['dois']))).toBe('brief (2).txt');
    expect(await store.addAttachment(a.id, 'output', '../../.fora/logo.png', new Blob(['png']))).toBe('-..-.fora-logo.png');
    const files = await store.loadFiles(a.id);
    expect(files.input).toEqual([{ name: 'brief (2).txt', size: 4 }, { name: 'brief.txt', size: 2 }]);
    expect(files.output).toHaveLength(1);
    expect(await (await store.readAttachment(a.id, 'input', 'brief.txt')).text()).toBe('um');
    expect([...(await dirAt(root, 'attachments', a.id)).items.keys()]).toEqual(['input', 'output']);
    expect((await store.load()).activities[0]!.rev).toBe(a.rev);
    await expect(store.readAttachment(a.id, 'input', 'sumiu.txt')).rejects.toBeInstanceOf(ConflictError);
  });

  it('remover manda para a lixeira; ocultos e temporários não aparecem', async () => {
    const { root, store, a } = await setup();
    await store.addAttachment(a.id, 'output', 'relatorio.pdf', new Blob(['pdf']));
    const output = await dirAt(root, 'attachments', a.id, 'output');
    await output.getFileHandle('.DS_Store', { create: true });
    await output.getFileHandle('x.crswap', { create: true });
    expect((await store.loadFiles(a.id)).output.map((f) => f.name)).toEqual(['relatorio.pdf']);
    await store.removeAttachment(a.id, 'output', 'relatorio.pdf');
    await store.removeAttachment(a.id, 'output', 'relatorio.pdf'); // já removido: nada a fazer
    expect((await store.loadFiles(a.id)).output).toEqual([]);
    const [bin] = [...(await dirAt(root, '.plans', 'trash')).items.values()] as MemDir[];
    expect((await (await dirAt(bin!, 'attachments', a.id, 'output')).getFileHandle('relatorio.pdf')).text).toBe('pdf');
  });

  it('não anexa numa atividade que não existe', async () => {
    const { store } = await setup();
    await expect(store.addAttachment(crypto.randomUUID(), 'input', 'a.txt', new Blob(['a']))).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('comentários', () => {
  it('grava um arquivo por comentário, lê em ordem e aceita um .md solto sem cabeçalho', async () => {
    const { root, store, a } = await setup();
    await store.addComment(a.id, 'eu', '  Feito.\nSegue o arquivo.  ');
    await expect(store.addComment(a.id, 'eu', '   ')).rejects.toThrow(/Escreva/);
    const dir = await dirAt(root, 'comments', a.id);
    (await dir.getFileHandle('resposta-da-ia.md', { create: true })).text = '---\nauthor: claude\ncreatedAt: 2000-01-01T00:00:00Z\n---\nAntiga\n';
    (await dir.getFileHandle('solto.md', { create: true })).text = '---\n\nsó texto\n';
    const { comments } = await store.loadFiles(a.id);
    expect(comments.map((c) => [c.author, c.text])).toEqual([[null, '---\n\nsó texto'], ['claude', 'Antiga'], ['eu', 'Feito.\nSegue o arquivo.']]);
    await store.removeComment(a.id, 'solto.md');
    expect((await store.loadFiles(a.id)).comments).toHaveLength(2);
  });
});

describe('remover a atividade', () => {
  it('leva anexos e comentários de toda a subárvore para a lixeira', async () => {
    const { root, store, a } = await setup();
    const child = await store.create(a.id, 'filha');
    await store.addAttachment(child.id, 'input', 'foto.png', new Blob(['foto']));
    await store.addComment(a.id, null, 'resposta');
    await store.remove(a.id, a.rev, true);
    expect([...(await dirAt(root, 'attachments')).items.keys()]).toEqual([]);
    expect([...(await dirAt(root, 'comments')).items.keys()]).toEqual([]);
    const [bin] = [...(await dirAt(root, '.plans', 'trash')).items.values()] as MemDir[];
    expect(((await (await dirAt(bin!, 'attachments', child.id, 'input')).getFileHandle('foto.png')) as MemFile).text).toBe('foto');
    expect((await dirAt(bin!, 'comments', a.id)).items.size).toBe(1);
  });
});

describe('visualização', () => {
  it('escolhe pelo nome do arquivo', () => {
    expect(['a.PNG', 'b.mp4', 'c.m4a', 'd.pdf', 'e.md', 'f.csv', 'g.json', 'h.docx', 'i.xlsx', 'j.zip', 'semponto', 'x.constructor'].map((n) => fileKind(n).kind))
      .toEqual(['image', 'video', 'audio', 'pdf', 'markdown', 'table', 'text', 'document', 'sheet', 'unknown', 'unknown', 'unknown']);
    expect(fileKind('pagina.html').mime).toBe('application/octet-stream');
  });
  it('lê CSV com aspas, ponto e vírgula e corta no limite', () => {
    expect(parseTable('nome;nota\r\n"Silva; Ana";"diz ""oi"""\n', 'a.csv').rows).toEqual([['nome', 'nota'], ['Silva; Ana', 'diz "oi"']]);
    expect(parseTable('a,b\n1,', 'a.csv').rows).toEqual([['a', 'b'], ['1', '']]);
    expect(parseTable('a\tb', 'a.tsv').rows).toEqual([['a', 'b']]);
    expect(parseTable('1\n2\n3\n', 'a.csv', 2)).toEqual({ rows: [['1'], ['2']], truncated: true });
  });
  it('mostra o tamanho em unidade legível', () => {
    expect([fileSize(12), fileSize(1536), fileSize(25 * 1024 ** 2)]).toEqual(['12 B', '1,5 KB', '25 MB']);
  });
});

describe('planilhas e documentos', () => {
  it('converte colunas e datas do Excel', () => {
    expect(['A1', 'Z9', 'AA10'].map(columnIndex)).toEqual([0, 25, 26]);
    expect([excelDate(46354), excelDate(46354.5), excelDate(0.25)]).toEqual(['28/11/2026', '28/11/2026 12:00', '06:00']);
    expect([isDateFormat(14), isDateFormat(164, 'dd/mm/yyyy'), isDateFormat(4), isDateFormat(165, '#,##0 "dias"'), isDateFormat(166, '[Red]0.00')]).toEqual([true, true, false, false, false]);
  });
  it('recusa um arquivo que não é zip', async () => {
    await expect(openZip(new Blob(['não é um zip, só texto comum']))).rejects.toThrow(/corrompido/);
  });
});
