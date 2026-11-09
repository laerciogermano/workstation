/** Porta de relógio: domínio nunca chama new Date() direto (08 §2). */
export interface Clock {
  now(): Date;
}
export const systemClock: Clock = { now: () => new Date() };
export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });
