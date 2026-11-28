// Pasta em memória com o mesmo comportamento que usamos da File System Access API.
import type { DirLike, FileLike } from '../src/folder/types.ts';

const notFound = () => Object.assign(new Error('não encontrado'), { name: 'NotFoundError' });

export class MemFile implements FileLike {
  readonly kind = 'file';
  text = '';
  /** conteúdo gravado como Blob (anexos); `text` vale quando é null */
  blob: Blob | null = null;
  async getFile() {
    return this.blob ?? new Blob([this.text]);
  }
  async createWritable() {
    let buf: string | Blob = '';
    return {
      write: async (d: string | Blob) => void (buf = typeof d === 'string' && typeof buf === 'string' ? buf + d : d),
      close: async () => {
        this.blob = typeof buf === 'string' ? null : buf;
        this.text = typeof buf === 'string' ? buf : await buf.text();
      },
      abort: async () => {},
    };
  }
}

export class MemDir implements DirLike {
  readonly kind = 'directory';
  readonly items = new Map<string, MemFile | MemDir>();
  removed: string[] = [];
  readonly name: string;
  constructor(name = 'projeto') {
    this.name = name;
  }
  async getDirectoryHandle(name: string, o?: { create?: boolean }): Promise<MemDir> {
    let e = this.items.get(name);
    if (!e && o?.create) this.items.set(name, (e = new MemDir(name)));
    if (!(e instanceof MemDir)) throw notFound();
    return e;
  }
  async getFileHandle(name: string, o?: { create?: boolean }): Promise<MemFile> {
    let e = this.items.get(name);
    if (!e && o?.create) this.items.set(name, (e = new MemFile()));
    if (!(e instanceof MemFile)) throw notFound();
    return e;
  }
  async removeEntry(name: string) {
    if (!this.items.delete(name)) throw notFound();
    this.removed.push(name);
  }
  async *entries(): AsyncIterable<[string, MemFile | MemDir]> {
    yield* this.items;
  }
}
