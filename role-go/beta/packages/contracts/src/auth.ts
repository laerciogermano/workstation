import { z } from 'zod';

const Email = z.string().trim().toLowerCase().email('E-mail inválido').max(254);
const Password = z.string().min(8, 'Mínimo de 8 caracteres').max(128);

export const RegisterBody = z
  .object({
    email: Email,
    password: Password,
    passwordConfirm: z.string(),
    acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Aceite os termos' }) }),
    adult: z.literal(true, { errorMap: () => ({ message: 'Confirme que tem 18 anos ou mais' }) }),
  })
  .refine((v) => v.password === v.passwordConfirm, { path: ['passwordConfirm'], message: 'As senhas não conferem' });
export type RegisterBody = z.infer<typeof RegisterBody>;

export const LoginBody = z.object({ email: Email, password: z.string().min(1).max(128) });
export type LoginBody = z.infer<typeof LoginBody>;

export const GoogleBody = z.object({ code: z.string().min(1).max(4096), redirectUri: z.string().url().optional() });
export const ConsentBody = z.object({ acceptTerms: z.literal(true), adult: z.literal(true) });
export const LogoutBody = z.object({ everywhere: z.boolean().optional() });
export const ForgotBody = z.object({ email: Email });
export const ResetBody = z
  .object({ token: z.string().min(10).max(200), password: Password, passwordConfirm: z.string() })
  .refine((v) => v.password === v.passwordConfirm, { path: ['passwordConfirm'], message: 'As senhas não conferem' });
export type ResetBody = z.infer<typeof ResetBody>;
export const VerifyEmailBody = z.object({ token: z.string().min(10).max(200) });

export const Providers = z.object({ google: z.boolean(), apple: z.boolean(), passkey: z.boolean() });
export type Providers = z.infer<typeof Providers>;

/** Claims do access token (docs/04 ADR-008). */
export const AccessClaims = z.object({
  sub: z.string().uuid(),
  sid: z.string().uuid(),
  role: z.enum(['user', 'admin']),
  amr: z.array(z.enum(['pwd', 'google', 'apple', 'passkey'])),
  iss: z.string(),
  aud: z.union([z.string(), z.array(z.string())]),
  exp: z.number(),
  iat: z.number(),
});
export type AccessClaims = z.infer<typeof AccessClaims>;
