// O pedaço da File System Access API que usamos. Os handles do navegador (pasta real ou OPFS) já cumprem.
export interface FileLike {
  readonly kind: 'file';
  getFile(): Promise<Blob & { readonly lastModified?: number }>;
  createWritable(): Promise<{ write(data: string | Blob): Promise<void>; close(): Promise<void>; abort(): Promise<void> }>;
}
export interface DirLike {
  readonly kind: 'directory';
  readonly name: string;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirLike>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileLike>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  entries(): AsyncIterable<[string, FileLike | DirLike]>;
}
