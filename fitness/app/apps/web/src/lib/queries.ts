/**
 * Estado do servidor via TanStack Query. Marcações do dia são otimistas (RNF-06: instantâneo)
 * e recalculadas com o MESMO domínio da API (@fitness/domain).
 */
import type {
  BodyResponse,
  CharacterCard,
  CreateDeviceResponse,
  DietDayResponse,
  FeedPost,
  Gym,
  GymDetailResponse,
  MeResponse,
  MyCharacter,
  ProfileBody,
  ProgressResponse,
  PublicProfileResponse,
  TrainingDayResponse,
} from '@fitness/contracts';
import {
  type ExerciseId,
  type FoodId,
  type GoalId,
  type IsoDate,
  type MealId,
  type MealStatus,
  type Measurement,
  type PrefCategory,
  type ShareSettings,
  consumedOf,
  dayStatus,
  sessionFor,
  summarizeSession,
} from '@fitness/domain';
import { type QueryClient, keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import { getFingerprint, getToken, setToken } from './device';

export const qk = {
  me: ['me'] as const,
  diet: (d: IsoDate) => ['diet', d] as const,
  training: (d: IsoDate) => ['training', d] as const,
  progress: (d: IsoDate) => ['progress', d] as const,
  body: ['body'] as const,
  feed: (scope: string) => ['feed', scope] as const,
  search: (p: object) => ['search', p] as const,
  character: (nick: string) => ['character', nick] as const,
  gyms: (p: object) => ['gyms', p] as const,
  gym: (id: string) => ['gym', id] as const,
};

/* ---------- identidade ---------- */
export async function createDevice(): Promise<void> {
  const r = await api<CreateDeviceResponse>('POST', '/v1/devices', { fingerprint: getFingerprint() });
  setToken(r.token);
}

export function useMe() {
  return useQuery({
    queryKey: qk.me,
    queryFn: async () => {
      if (!getToken()) await createDevice();
      return api<MeResponse>('GET', '/v1/me');
    },
    retry: (n, e) => !(e instanceof Error && 'status' in e && e.status === 401) && n < 2,
    staleTime: 60_000,
  });
}

/** Ações reais mexem em streak, desafios, insights e vitrine. */
function invalidateActivity(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: ['progress'] });
  void qc.invalidateQueries({ queryKey: ['feed'] });
  void qc.invalidateQueries({ queryKey: ['character'] });
  void qc.invalidateQueries({ queryKey: qk.me });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: ProfileBody) => api<unknown>('PUT', '/v1/profile', b),
    onSuccess: () => {
      void qc.invalidateQueries();
    },
  });
}

export function useWipe() {
  return useMutation({ mutationFn: () => api<void>('DELETE', '/v1/me') });
}

/* ---------- dieta ---------- */
export const useDiet = (date: IsoDate, enabled = true) =>
  useQuery({ queryKey: qk.diet(date), queryFn: () => api<DietDayResponse>('GET', `/v1/diet/${date}`), enabled });

/** Recalcula consumido/status localmente para a marcação aparecer na hora. */
function withLogs(d: DietDayResponse, logs: DietDayResponse['logs']): DietDayResponse {
  const consumed = consumedOf(d.plan, logs, d.extras);
  const status = dayStatus(consumed.kcal, d.energy.target);
  return { ...d, logs, consumed, status };
}

export function useMarkMeal(date: IsoDate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { mealId: MealId; status: MealStatus | null }) =>
      api<DietDayResponse>('PUT', `/v1/diet/${date}/meals/${v.mealId}`, { status: v.status }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.diet(date) });
      const prev = qc.getQueryData<DietDayResponse>(qk.diet(date));
      if (prev) {
        const logs = { ...prev.logs };
        if (v.status) logs[v.mealId] = v.status;
        else delete logs[v.mealId];
        qc.setQueryData(qk.diet(date), withLogs(prev, logs));
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.diet(date), ctx.prev),
    onSuccess: (d) => qc.setQueryData(qk.diet(date), d),
  });
}

export function useSetPantry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (foodIds: FoodId[]) => api<DietDayResponse>('PUT', '/v1/diet/pantry', { foodIds }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['diet'] });
      void qc.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

export function useSetPref() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { mealId: MealId; category: PrefCategory; foodId: FoodId | null }) =>
      api<unknown>('PUT', '/v1/diet/prefs', v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet'] }),
  });
}

export function useResetPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('DELETE', '/v1/diet/prefs'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['diet'] }),
  });
}

export function useAddExtra(date: IsoDate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (x: { name: string; kcal: number; p: number; c: number; g: number }) =>
      api<DietDayResponse>('POST', `/v1/diet/${date}/extras`, x),
    onSuccess: (d) => qc.setQueryData(qk.diet(date), d),
  });
}

export function useRemoveExtra(date: IsoDate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<DietDayResponse>('DELETE', `/v1/diet/${date}/extras/${id}`),
    onSuccess: (d) => qc.setQueryData(qk.diet(date), d),
  });
}

export function useCloseDay(date: IsoDate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<{ status: string; published: boolean }>('POST', `/v1/diet/${date}/close`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.diet(date) });
      invalidateActivity(qc);
    },
  });
}

/* ---------- treino ---------- */
export const useTraining = (date: IsoDate, enabled = true) =>
  useQuery({
    queryKey: qk.training(date),
    queryFn: () => api<TrainingDayResponse>('GET', `/v1/training/${date}`),
    enabled,
  });

export function useLogExercise(date: IsoDate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { exerciseId: ExerciseId; setsDone: number; loadKg?: number }) =>
      api<TrainingDayResponse>('PUT', `/v1/training/${date}/exercises/${v.exerciseId}`, {
        setsDone: v.setsDone,
        ...(v.loadKg !== undefined ? { loadKg: v.loadKg } : {}),
      }),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: qk.training(date) });
      const prev = qc.getQueryData<TrainingDayResponse>(qk.training(date));
      if (prev) {
        const logs = prev.logs.map((l) =>
          l.exerciseId === v.exerciseId ? { ...l, setsDone: v.setsDone, loadKg: v.loadKg ?? l.loadKg } : l,
        );
        qc.setQueryData(qk.training(date), {
          ...prev,
          logs,
          summary: summarizeSession(sessionFor(date), logs, prev.bodyWeightKg),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(qk.training(date), ctx.prev),
    onSuccess: (d) => qc.setQueryData(qk.training(date), d),
  });
}

export function useCompleteSession(date: IsoDate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (publish: boolean) =>
      api<{ published: boolean; streak: number }>('POST', `/v1/training/${date}/complete`, { publish }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.training(date) });
      invalidateActivity(qc);
    },
  });
}

/* ---------- corpo e progresso ---------- */
export const useBody = (enabled = true) =>
  useQuery({ queryKey: qk.body, queryFn: () => api<BodyResponse>('GET', '/v1/body'), enabled });

export function useSaveMeasurement(date: IsoDate) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (m: Omit<Measurement, 'date'>) =>
      api<{ targetBefore: number; targetAfter: number }>('PUT', `/v1/body/measurements/${date}`, m),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.body });
      void qc.invalidateQueries({ queryKey: ['diet'] });
      void qc.invalidateQueries({ queryKey: ['training'] });
      invalidateActivity(qc);
    },
  });
}

export const useProgress = (date: IsoDate, enabled = true) =>
  useQuery({
    queryKey: qk.progress(date),
    queryFn: () => api<ProgressResponse>('GET', `/v1/progress/${date}`),
    enabled,
  });

/* ---------- vitrine ---------- */
export const useFeed = (scope: 'all' | 'gym') =>
  useQuery({
    queryKey: qk.feed(scope),
    queryFn: () => api<{ posts: FeedPost[] }>('GET', `/v1/social/feed?scope=${scope}`),
    networkMode: 'online',
  });

export function useKudo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: string; on: boolean }) =>
      api<{ kudos: number; kudoed: boolean }>(p.on ? 'POST' : 'DELETE', `/v1/social/posts/${p.id}/kudos`),
    onMutate: (p) => {
      const patch = (posts: FeedPost[]) =>
        posts.map((x) => (x.id === p.id ? { ...x, kudoed: p.on, kudos: x.kudos + (p.on ? 1 : -1) } : x));
      qc.setQueriesData<{ posts: FeedPost[] }>({ queryKey: ['feed'] }, (d) => (d ? { posts: patch(d.posts) } : d));
      qc.setQueriesData<PublicProfileResponse>({ queryKey: ['character'] }, (d) =>
        d ? { ...d, posts: patch(d.posts) } : d,
      );
      qc.setQueriesData<GymDetailResponse>({ queryKey: ['gym'] }, (d) => (d ? { ...d, posts: patch(d.posts) } : d));
    },
  });
}

export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: { nick: string; color: number; gymId: string | null; optIn: boolean }) =>
      api<MyCharacter>('POST', '/v1/social/character', b),
    onSuccess: () => {
      invalidateActivity(qc);
      void qc.invalidateQueries({ queryKey: ['search'] });
      void qc.invalidateQueries({ queryKey: ['gyms'] });
    },
  });
}

export function usePatchCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (b: {
      optIn?: boolean;
      share?: Partial<ShareSettings>;
      hideHistory?: boolean;
      gymId?: string | null;
    }) => api<MyCharacter>('PATCH', '/v1/social/character', b),
    onMutate: (b) => {
      const me = qc.getQueryData<MeResponse>(qk.me);
      if (me?.character) {
        qc.setQueryData<MeResponse>(qk.me, {
          ...me,
          character: {
            ...me.character,
            ...(b.optIn !== undefined ? { optIn: b.optIn } : {}),
            ...(b.hideHistory !== undefined ? { hideHistory: b.hideHistory } : {}),
            ...(b.gymId !== undefined ? { gymId: b.gymId } : {}),
            share: { ...me.character.share, ...(b.share ?? {}) },
          },
        });
      }
    },
    onSettled: () => {
      invalidateActivity(qc);
      void qc.invalidateQueries({ queryKey: ['search'] });
      void qc.invalidateQueries({ queryKey: ['gyms'] });
      void qc.invalidateQueries({ queryKey: ['gym'] });
    },
  });
}

export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api<void>('DELETE', '/v1/social/character'),
    onSuccess: () => {
      invalidateActivity(qc);
      void qc.invalidateQueries({ queryKey: ['search'] });
    },
  });
}

export const useNickAvailable = (nick: string) =>
  useQuery({
    queryKey: ['nick', nick],
    queryFn: () =>
      api<{ valid: boolean; available: boolean }>('GET', `/v1/social/nick-available?nick=${encodeURIComponent(nick)}`),
    enabled: nick.length >= 3,
    staleTime: 10_000,
  });

export function useSearch(p: { q: string; goal: GoalId | null; mineGym: boolean }) {
  const qs = new URLSearchParams();
  if (p.q.trim()) qs.set('q', p.q.trim());
  if (p.goal) qs.set('goal', p.goal);
  if (p.mineGym) qs.set('gym', 'mine');
  return useQuery({
    queryKey: qk.search(p),
    queryFn: () => api<{ characters: CharacterCard[] }>('GET', `/v1/social/characters?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export const usePublicProfile = (nick: string) =>
  useQuery({
    queryKey: qk.character(nick),
    queryFn: () => api<PublicProfileResponse>('GET', `/v1/social/characters/${encodeURIComponent(nick)}`),
  });

/* ---------- academias ---------- */
export function useGyms(p: { lat?: number; lng?: number; q: string }) {
  const qs = new URLSearchParams();
  if (p.lat !== undefined && p.lng !== undefined) {
    qs.set('lat', String(p.lat));
    qs.set('lng', String(p.lng));
  }
  if (p.q.trim()) qs.set('q', p.q.trim());
  return useQuery({
    queryKey: qk.gyms(p),
    queryFn: () => api<{ gyms: Gym[] }>('GET', `/v1/gyms?${qs}`),
    placeholderData: keepPreviousData,
  });
}

export const useGym = (id: string, pos?: { lat: number; lng: number }) =>
  useQuery({
    queryKey: [...qk.gym(id), pos ?? null],
    queryFn: () => api<GymDetailResponse>('GET', `/v1/gyms/${id}${pos ? `?lat=${pos.lat}&lng=${pos.lng}` : ''}`),
  });
