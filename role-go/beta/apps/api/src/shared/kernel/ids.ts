import { v7 } from 'uuid';
import { randomBytes } from 'node:crypto';

export const newId = (): string => v7();
export const NIL_UUID = '00000000-0000-0000-0000-000000000000';
export const isUuid = (v: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

export const slugify = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'role';

export const randomSuffix = (n = 5): string => randomBytes(8).toString('base64url').replace(/[-_]/g, 'x').slice(0, n).toLowerCase();
