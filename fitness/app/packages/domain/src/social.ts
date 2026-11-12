/**
 * Personagem público e vitrine (RF-37..46, RN-17..19). Default privado; sensível desligado.
 */
import type { GoalId } from './energy';

export const NICK_RE = /^[a-z0-9._]{3,20}$/;
export const normalizeNick = (s: string): string => s.toLowerCase().trim().replace(/\s+/g, '.');

export const SHARE_KEYS = [
  'objetivo',
  'streak',
  'treinos',
  'prs',
  'dieta',
  'evolucao',
  'peso',
  'medidas',
  'fotos',
] as const;
export type ShareKey = (typeof SHARE_KEYS)[number];
export type ShareSettings = Record<ShareKey, boolean>;

/** RN-18: dados sensíveis nunca saem por padrão. */
export const SENSITIVE_KEYS: readonly ShareKey[] = ['evolucao', 'peso', 'medidas', 'fotos'];

export const DEFAULT_SHARE: ShareSettings = {
  objetivo: true,
  streak: true,
  treinos: true,
  prs: true,
  dieta: true,
  evolucao: false,
  peso: false,
  medidas: false,
  fotos: false,
};

export const AVATAR_COLORS = ['#2B4BF2', '#E0457B', '#0EA5A4', '#F59E0B', '#7C3AED', '#16A34A'] as const;

export const POST_KINDS = ['treino', 'dieta', 'medida', 'conquista'] as const;
export type PostKind = (typeof POST_KINDS)[number];
export const POST_KIND_LABEL: Record<PostKind, string> = {
  treino: 'Treino',
  dieta: 'Dieta',
  medida: 'Avaliação',
  conquista: 'Conquista',
};

/** Snapshot público do personagem: só o que pode aparecer fora do aparelho. */
export interface PublicStats {
  goal: GoalId | null;
  streak: number | null;
  workouts: number | null;
  prs: string[];
  achievements: string[];
  evolution: string | null;
}

export interface PrivateStats {
  goal: GoalId;
  streak: number;
  workouts: number;
  prs: string[];
  achievements: string[];
  evolution: string | null;
}

/** Aplica os toggles: o que não está ligado vira null/vazio antes de sair do servidor. */
export function toPublicStats(s: PrivateStats, share: ShareSettings): PublicStats {
  return {
    goal: share.objetivo ? s.goal : null,
    streak: share.streak ? s.streak : null,
    workouts: share.treinos ? s.workouts : null,
    prs: share.prs ? s.prs : [],
    achievements: s.achievements,
    evolution: share.evolucao ? s.evolution : null,
  };
}

export const initialsOf = (nick: string): string =>
  nick
    .replace(/[^a-z]/gi, ' ')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
