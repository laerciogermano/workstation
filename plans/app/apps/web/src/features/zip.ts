// Regrava um zip (.xlsx) trocando só algumas entradas: as outras são copiadas byte a byte.
import { zipEntries } from './office.ts';

const TOTAL_LIMIT = 200_000_000;

export const TOO_BIG = 'Arquivo grande demais para abrir aqui.';

type Bytes = Uint8Array<ArrayBuffer>;
export type Entry = { name: string; method: number; flags: number; time: number; crc: number; usize: number; attributes: number; data: Bytes };

const CRC = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (const b of data) c = CRC[(c ^ b) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Descompacta contando os bytes: um zip que mente sobre o tamanho não esgota a memória. */
async function inflate(data: Bytes, limit: number): Promise<Bytes> {
  const reader = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
  const parts: Bytes[] = [];
  for (let size = 0; ; ) {
    const { done, value } = await reader.read();
    if (done) return new Uint8Array(await new Blob(parts).arrayBuffer());
    size += value.length;
    if (size > limit) {
      await reader.cancel();
      throw new Error(TOO_BIG);
    }
    parts.push(value);
  }
}

export function readZip(bytes: Bytes): Entry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Array.from(zipEntries(bytes), ([name, e]) => {
    const start = e.offset + 30 + view.getUint16(e.offset + 26, true) + view.getUint16(e.offset + 28, true);
    return {
      name, method: e.method,
      flags: view.getUint16(e.at + 8, true),
      time: view.getUint32(e.at + 12, true),
      crc: view.getUint32(e.at + 16, true),
      usize: view.getUint32(e.at + 24, true),
      attributes: view.getUint32(e.at + 38, true),
      data: bytes.subarray(start, start + e.size),
    };
  });
}

export const unpack = (e: Entry, limit = TOTAL_LIMIT): Promise<Bytes> => {
  if (e.method === 8) return inflate(e.data, limit);
  if (e.method !== 0 || e.data.length > limit) return Promise.reject(new Error(e.method ? 'O arquivo está corrompido ou protegido por senha.' : TOO_BIG));
  return Promise.resolve(e.data);
};

/** Antes de entregar o arquivo a um leitor que descompacta sem limite. */
export async function checkZipSize(bytes: Bytes): Promise<void> {
  let left = TOTAL_LIMIT;
  for (const e of readZip(bytes)) left -= (await unpack(e, left)).length;
}

/** A entrada com outro conteúdo, já compactado. */
export async function packed(e: Entry, content: Bytes): Promise<Entry> {
  const data = new Uint8Array(await new Response(new Blob([content]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer());
  return { ...e, method: 8, crc: crc32(content), usize: content.length, data };
}

export function writeZip(entries: Entry[]): Blob {
  const parts: Bytes[] = [];
  const index: Bytes[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = new TextEncoder().encode(e.name);
    const flags = e.flags & 0x0800; // só "nome em UTF-8": os tamanhos vão no cabeçalho
    const record = (size: number, signature: number, fields: [at: number, bytes: 2 | 4, value: number][]) => {
      const out = new Uint8Array(size + name.length);
      const view = new DataView(out.buffer);
      view.setUint32(0, signature, true);
      for (const [at, width, value] of fields) {
        if (width === 2) view.setUint16(at, value, true);
        else view.setUint32(at, value, true);
      }
      out.set(name, size);
      return out;
    };
    // versão, flags, método, data, crc e tamanhos: o mesmo trecho nos dois cabeçalhos
    const common = (at: number): [number, 2 | 4, number][] => [
      [at, 2, 20], [at + 2, 2, flags], [at + 4, 2, e.method], [at + 6, 4, e.time], [at + 10, 4, e.crc], [at + 14, 4, e.data.length], [at + 18, 4, e.usize], [at + 22, 2, name.length],
    ];
    const local = record(30, 0x04034b50, common(4));
    index.push(record(46, 0x02014b50, [[4, 2, 20], ...common(6), [38, 4, e.attributes], [42, 4, offset]]));
    parts.push(local, e.data);
    offset += local.length + e.data.length;
  }
  const end = new Uint8Array(22);
  const view = new DataView(end.buffer);
  view.setUint32(0, 0x06054b50, true);
  view.setUint16(8, entries.length, true);
  view.setUint16(10, entries.length, true);
  view.setUint32(12, index.reduce((n, p) => n + p.length, 0), true);
  view.setUint32(16, offset, true);
  return new Blob([...parts, ...index, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
