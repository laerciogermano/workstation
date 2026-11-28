// A miniatura de um anexo na lista: a imagem, um quadro do vídeo, a primeira página do PDF ou o começo do texto.
import { readDocument, readSheets } from './office.ts';
import { fileKind, looksBinary, parseTable } from './preview.ts';

/** `url` pode ser um blob: que quem recebe precisa liberar. */
export type Thumbnail = { kind: 'image' | 'video' | 'pdf'; url: string } | { kind: 'text'; text: string };

const LINES = 8;
const COLUMNS = 24;
const TEXT_HEAD = 2000;
/** Acima disto o trabalho de desenhar a miniatura não compensa: fica o selo da extensão. */
const LIMIT = { image: 40_000_000, svg: 2_000_000, pdf: 30_000_000, office: 5_000_000 };

/** As primeiras linhas com conteúdo, cortadas no que cabe na miniatura. */
export const snippet = (lines: string[]) =>
  lines
    .map((l) => l.replaceAll('\t', ' ').trimEnd())
    .filter((l) => l.trim())
    .slice(0, LINES)
    .map((l) => l.slice(0, COLUMNS))
    .join('\n');

const asText = (lines: string[]): Thumbnail | null => {
  const text = snippet(lines);
  return text ? { kind: 'text', text } : null;
};

/** `null`: o arquivo não tem o que mostrar em miniatura (áudio, binário, vazio ou grande demais). */
export async function makeThumbnail(name: string, blob: Blob): Promise<Thumbnail | null> {
  const { kind, mime } = fileKind(name);
  if (!blob.size || kind === 'audio') return null;
  if (mime === 'image/svg+xml') {
    // data:, como na visualização: o SVG não ganha a origem do app
    return blob.size > LIMIT.svg ? null : { kind: 'image', url: `data:${mime};charset=utf-8,${encodeURIComponent(await blob.text())}` };
  }
  if (kind === 'image' || kind === 'video' || kind === 'pdf') {
    if (kind !== 'video' && blob.size > LIMIT[kind]) return null; // o vídeo é lido aos poucos
    return { kind, url: URL.createObjectURL(new Blob([blob], { type: mime })) };
  }
  if (kind === 'sheet' || kind === 'document') {
    if (blob.size > LIMIT.office) return null;
    if (kind === 'sheet') return asText((await readSheets(blob, LINES))[0]?.rows.map((r) => r.join(' ')) ?? []);
    return asText((await readDocument(blob)).blocks.flatMap((b) => (b.type === 'table' ? b.rows.map((r) => r.join(' ')) : b.text.split('\n'))));
  }
  let text = await blob.slice(0, TEXT_HEAD).text();
  if (blob.size > TEXT_HEAD) text = text.replace(/�+$/, ''); // o corte pode partir um caractere ao meio
  if (looksBinary(text)) return null;
  return asText(kind === 'table' ? parseTable(text, name, LINES).rows.map((r) => r.join(' ')) : text.split(/\r?\n/));
}
