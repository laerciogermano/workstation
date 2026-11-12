import { type IsoDate, addDays, daysBetween } from '@fitness/domain';
import { AppError } from './errors';

/** Porta de relógio para testes determinísticos. */
export interface Clock {
  now(): Date;
}
export const systemClock: Clock = { now: () => new Date() };

export const todayUtc = (c: Clock): IsoDate => c.now().toISOString().slice(0, 10);

/**
 * O dia vem do cliente (fuso local), mas só aceitamos datas próximas de hoje para escrita:
 * evita reescrever histórico antigo ou "treinar no futuro".
 */
export function assertWritableDay(c: Clock, day: IsoDate): void {
  const t = todayUtc(c);
  const d = daysBetween(t, day);
  if (d > 1 || d < -2) throw new AppError(422, 'DAY_OUT_OF_RANGE', 'Só é possível registrar hoje (ou ontem)');
}

export { addDays };
