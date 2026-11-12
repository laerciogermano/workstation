/** Avaliação física com fita (RF-29..32, RN-13). */
import type { IsoDate } from './dates';

export const MEASURE_IDS = ['weightKg', 'waistCm', 'hipCm', 'chestCm', 'armCm', 'thighCm'] as const;
export type MeasureId = (typeof MEASURE_IDS)[number];

export interface MeasureDef {
  readonly id: MeasureId;
  readonly name: string;
  readonly unit: 'kg' | 'cm';
  /** direção "boa" padrão: −1 diminuir, 1 aumentar, 0 neutra */
  readonly dir: -1 | 0 | 1;
  readonly where?: string;
  readonly step: number;
  readonly range: readonly [number, number];
}

export const MEASURES: readonly MeasureDef[] = [
  { id: 'weightKg', name: 'Peso', unit: 'kg', dir: -1, step: 0.1, range: [35, 250] },
  {
    id: 'waistCm',
    name: 'Cintura',
    unit: 'cm',
    dir: -1,
    where: 'Na altura do umbigo, relaxado',
    step: 0.5,
    range: [40, 200],
  },
  {
    id: 'hipCm',
    name: 'Quadril',
    unit: 'cm',
    dir: -1,
    where: 'Na parte mais larga do glúteo',
    step: 0.5,
    range: [50, 200],
  },
  {
    id: 'chestCm',
    name: 'Peito',
    unit: 'cm',
    dir: 0,
    where: 'Linha dos mamilos, após expirar',
    step: 0.5,
    range: [50, 200],
  },
  { id: 'armCm', name: 'Braço', unit: 'cm', dir: 1, where: 'Meio do braço, contraído', step: 0.5, range: [15, 70] },
  { id: 'thighCm', name: 'Coxa', unit: 'cm', dir: 0, where: 'Meio da coxa, em pé', step: 0.5, range: [25, 110] },
];

export type Measurement = { date: IsoDate } & Record<MeasureId, number>;

/** Para objetivo de ganho, peso subir é a direção boa. */
export function goodDirection(m: MeasureDef, gaining: boolean): -1 | 0 | 1 {
  return m.id === 'weightKg' && gaining ? 1 : m.dir;
}

export const PHOTO_POSES = ['frente', 'lado', 'costas'] as const;
export type PhotoPose = (typeof PHOTO_POSES)[number];
