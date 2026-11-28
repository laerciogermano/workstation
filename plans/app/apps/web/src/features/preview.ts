// Como mostrar cada tipo de anexo.
export type FileKind = 'image' | 'video' | 'audio' | 'pdf' | 'markdown' | 'table' | 'sheet' | 'document' | 'text' | 'unknown';

/** Tipos reconhecidos pela extensão. O MIME é o nosso: o que o arquivo declara não é confiável. */
const MEDIA: Record<string, [FileKind, string]> = {
  png: ['image', 'image/png'], jpg: ['image', 'image/jpeg'], jpeg: ['image', 'image/jpeg'], gif: ['image', 'image/gif'],
  webp: ['image', 'image/webp'], avif: ['image', 'image/avif'], bmp: ['image', 'image/bmp'], ico: ['image', 'image/x-icon'],
  svg: ['image', 'image/svg+xml'],
  mp4: ['video', 'video/mp4'], m4v: ['video', 'video/mp4'], webm: ['video', 'video/webm'], mov: ['video', 'video/quicktime'], ogv: ['video', 'video/ogg'],
  mp3: ['audio', 'audio/mpeg'], wav: ['audio', 'audio/wav'], m4a: ['audio', 'audio/mp4'], aac: ['audio', 'audio/aac'],
  ogg: ['audio', 'audio/ogg'], oga: ['audio', 'audio/ogg'], opus: ['audio', 'audio/ogg'], flac: ['audio', 'audio/flac'],
  pdf: ['pdf', 'application/pdf'],
  xlsx: ['sheet', 'application/octet-stream'], xlsm: ['sheet', 'application/octet-stream'], docx: ['document', 'application/octet-stream'],
};

export const extension = (name: string) => (name.lastIndexOf('.') > 0 ? name.slice(name.lastIndexOf('.') + 1).toLowerCase() : '');

/** `unknown`: decide-se pelo conteúdo (texto é mostrado; binário, só baixado). */
export function fileKind(name: string): { kind: FileKind; mime: string } {
  const ext = extension(name);
  const media = Object.hasOwn(MEDIA, ext) ? MEDIA[ext] : undefined;
  if (media) return { kind: media[0], mime: media[1] };
  if (ext === 'md' || ext === 'markdown') return { kind: 'markdown', mime: 'text/plain' };
  if (ext === 'csv' || ext === 'tsv') return { kind: 'table', mime: 'text/plain' };
  if (ext === 'txt' || ext === 'log' || ext === 'json') return { kind: 'text', mime: 'text/plain' };
  return { kind: 'unknown', mime: 'application/octet-stream' };
}

export const TEXT_LIMIT = 500_000;
export const ROW_LIMIT = 500;

export const looksBinary = (text: string) => text.includes('\u0000') || text.includes('�');

export function prettyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** No CSV, o separador é o que mais aparece na primeira linha (vírgula ou ponto e vírgula). */
export function separator(text: string, name: string): string {
  const first = text.slice(0, text.indexOf('\n') >>> 0);
  return extension(name) === 'tsv' ? '\t' : first.split(';').length > first.split(',').length ? ';' : ',';
}

/** CSV ou TSV com aspas. */
export function parseTable(text: string, name: string, limit = ROW_LIMIT): { rows: string[][]; truncated: boolean } {
  const sep = separator(text, name);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quoted) {
      if (c !== '"') cell += c;
      else if (text[i + 1] === '"') cell += text[++i];
      else quoted = false;
    } else if (c === '"' && cell === '') quoted = true;
    else if (c === sep) {
      row.push(cell);
      cell = '';
    } else if (c === '\n') {
      rows.push([...row, cell]);
      row = [];
      cell = '';
      if (rows.length === limit) return { rows, truncated: i < text.length - 1 };
    } else if (c !== '\r') cell += c;
  }
  if (cell !== '' || row.length) rows.push([...row, cell]);
  return { rows, truncated: false };
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const [value, unit] = bytes < 1024 ** 2 ? [bytes / 1024, 'KB'] : bytes < 1024 ** 3 ? [bytes / 1024 ** 2, 'MB'] : [bytes / 1024 ** 3, 'GB'];
  return `${value.toLocaleString('pt-BR', { maximumFractionDigits: value < 10 ? 1 : 0 })} ${unit}`;
}
