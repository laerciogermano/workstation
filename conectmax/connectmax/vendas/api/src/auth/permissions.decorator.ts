import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
/** Exige ao menos uma das permissions listadas (OR). */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
