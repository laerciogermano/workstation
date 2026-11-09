import { z } from 'zod';
import { isValidGtin, normalizeGtin } from '@notinhas/domain';

/** Cabeçalho CSRF exigido em toda mutação (06 §1). */
export const CSRF_HEADER = 'x-requested-with';
export const CSRF_VALUE = 'notinhas';
/** REQ-050: identificador temporário do navegador. */
export const FINGERPRINT_HEADER = 'x-client-fingerprint';

export const GtinSchema = z
  .string()
  .transform(normalizeGtin)
  .refine(isValidGtin, { message: 'INVALID_EAN' });

const lat = z.coerce.number().min(-90).max(90);
const lng = z.coerce.number().min(-180).max(180);

export const GeoQuerySchema = z.object({
  lat: lat.optional(),
  lng: lng.optional(),
  raioKm: z.coerce.number().int().min(1).max(30).default(5),
});

export const IngestReceiptSchema = z.object({ url: z.string().trim().min(10).max(2000) });

export const RegisterSchema = z.object({
  email: z.email().max(254).transform((s) => s.toLowerCase()),
  password: z.string().min(8, 'mínimo de 8 caracteres').max(200),
  name: z.string().trim().max(80).optional(),
  acceptTerms: z.literal(true),
  storeOptIn: z.boolean().default(false),
});
export const LoginSchema = z.object({
  email: z.email().transform((s) => s.toLowerCase()),
  password: z.string().min(1).max(200),
});
export const ForgotPasswordSchema = z.object({ email: z.email() });
export const ResetPasswordSchema = z.object({ token: z.string().min(20).max(200), newPassword: z.string().min(8).max(200) });
export const DeleteAccountSchema = z.object({ confirmation: z.literal('EXCLUIR') });

export const BARCODE_ORIGINS = ['barcode_scan', 'suggestion', 'manual'] as const;
export type BarcodeOrigin = (typeof BARCODE_ORIGINS)[number];
export const LinkBarcodeSchema = z.object({
  storeId: z.number().int().positive(),
  storeCode: z.string().trim().min(1).max(60),
  gtin: GtinSchema,
  origin: z.enum(BARCODE_ORIGINS),
});

export const SearchQuerySchema = GeoQuerySchema.extend({
  q: z.string().trim().max(120).default(''),
  categoria: z.string().max(40).optional(),
  ordem: z.enum(['preco', 'distancia']).default('preco'),
});

export const FreshnessQuerySchema = z.object({ dias: z.coerce.number().int().min(0).max(3650).default(0) });

export const CreateListSchema = z.object({ name: z.string().trim().min(1).max(60) });
export const RenameListSchema = CreateListSchema;
export const SetListItemSchema = z.object({ quantity: z.number().int().min(0).max(99) });

export const VitrineQuerySchema = z.object({
  aba: z.enum(['com-ean', 'sem-ean']).default('com-ean'),
  q: z.string().trim().max(120).default(''),
});

export const HideItemSchema = z.object({ reason: z.string().trim().min(3).max(200) });
export const ResolveFlagSchema = z.object({ action: z.enum(['keep', 'replace', 'hide']) });
