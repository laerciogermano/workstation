import { describe, expect, it } from 'vitest';
import { makeThumbnail, snippet } from '../src/features/thumb.ts';

const make = (name: string, body: string | Uint8Array<ArrayBuffer>) => makeThumbnail(name, new Blob([body]));

describe('miniaturas', () => {
  it('usa o próprio arquivo para imagem, vídeo e PDF, com o tipo decidido pela extensão', async () => {
    for (const [name, kind] of [['foto.JPG', 'image'], ['aula.mp4', 'video'], ['proposta.pdf', 'pdf']] as const) {
      const thumb = await make(name, 'x');
      expect(thumb).toMatchObject({ kind, url: expect.stringMatching(/^blob:/) });
      URL.revokeObjectURL((thumb as { url: string }).url);
    }
    expect(await make('d.svg', '<svg/>')).toEqual({ kind: 'image', url: 'data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E' });
  });

  it('mostra o começo de textos e tabelas, inclusive de extensão desconhecida', async () => {
    expect(await make('notas.md', '# Título\n\ntexto')).toEqual({ kind: 'text', text: '# Título\ntexto' });
    expect(await make('t.csv', 'nome;nota\nAna;10\n')).toEqual({ kind: 'text', text: 'nome nota\nAna 10' });
    expect(await make('pagina.html', '<h1>oi</h1>')).toEqual({ kind: 'text', text: '<h1>oi</h1>' });
    // o corte no meio de um acento não faz o texto passar por binário
    expect((await make('longo.txt', `a${'é'.repeat(2000)}`))?.kind).toBe('text');
  });

  it('corta no que cabe', () => {
    const cut = snippet(['', 'x'.repeat(100), ...Array<string>(20).fill('y')]).split('\n');
    expect(cut).toHaveLength(8);
    expect(cut[0]).toHaveLength(24);
  });

  it('não faz miniatura de binário, áudio, arquivo vazio ou grande demais', async () => {
    expect(await make('pacote.zip', new Uint8Array([80, 75, 3, 4, 0, 0]))).toBeNull();
    expect(await make('som.mp3', 'x')).toBeNull();
    expect(await make('vazio.png', '')).toBeNull();
    expect(await make('enorme.xlsx', new Uint8Array(5_000_001))).toBeNull();
    await expect(make('vazado.docx', 'isto não é um zip')).rejects.toThrow(/corrompido/);
  });
});
