import { SetMetadata } from '@nestjs/common';

export const RESOURCE_KEY = 'resource';
/** Mapeia GET/HEAD → `{resource}:read`; demais métodos → `{resource}:write`. */
export const Resource = (resource: string) =>
  SetMetadata(RESOURCE_KEY, resource);
