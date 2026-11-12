/**
 * Fotos de progresso ficam só neste aparelho (RF-31, RN-18, ADR-0005): IndexedDB, nunca na API.
 */
import type { IsoDate, PhotoPose } from '@fitness/domain';
import { createStore, del, entries, set } from 'idb-keyval';

export interface Photo {
  id: string;
  date: IsoDate;
  pose: PhotoPose;
  blob: Blob;
}

const store = createStore('fitness-photos', 'photos');

export async function listPhotos(): Promise<Photo[]> {
  const all = await entries<string, Photo>(store);
  return all.map(([, p]) => p).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.id < b.id ? -1 : 1));
}
export async function savePhoto(p: Omit<Photo, 'id'>): Promise<Photo> {
  const photo = { ...p, id: `${p.date}-${p.pose}-${Date.now()}` };
  await set(photo.id, photo, store);
  return photo;
}
export const deletePhoto = (id: string): Promise<void> => del(id, store);
export async function clearPhotos(): Promise<void> {
  for (const p of await listPhotos()) await del(p.id, store);
}
