import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AdminMetricsDTO,
  BarcodeOrigin,
  HomeDTO,
  IngestFailureDTO,
  IngestResultDTO,
  LinkResultDTO,
  ListDetailDTO,
  ListSummaryDTO,
  MeDTO,
  ModerationFlagDTO,
  PointsDTO,
  ProductDetailDTO,
  ReceiptDTO,
  ReceiptSummaryDTO,
  SearchDTO,
  SessionDTO,
  SpendingDTO,
  StoreRankDTO,
  StoreVitrineDTO,
  SuggestionDTO,
} from '@notinhas/contracts';
import { api } from './api';
import { geoQuery, useAnchor } from './location';
import { session, useAccessToken } from './session';

/** Chaves de cache por domínio: invalidar um grupo inteiro depois de mutações. */
export const qk = {
  me: ['me'] as const,
  catalog: ['catalog'] as const,
  personal: ['personal'] as const,
};

export function useMe() {
  const token = useAccessToken();
  return useQuery({ queryKey: [...qk.me, token], queryFn: () => api<MeDTO>('/me'), staleTime: 30_000 });
}

export function useHome() {
  const a = useAnchor();
  const g = geoQuery(a);
  return useQuery({ queryKey: [...qk.catalog, 'home', g], queryFn: () => api<HomeDTO>('/produtos/home', { query: g }) });
}

export function useSearch(q: string, categoria: string | null, ordem: 'preco' | 'distancia') {
  const g = geoQuery(useAnchor());
  return useQuery({
    queryKey: [...qk.catalog, 'busca', q, categoria, ordem, g],
    queryFn: ({ signal }) => api<SearchDTO>('/produtos/busca', { query: { q, categoria, ordem, ...g }, signal }),
    enabled: q.trim().length > 0 || !!categoria,
    placeholderData: (prev) => prev,
  });
}

export function useProduct(gtin: string) {
  const g = geoQuery(useAnchor());
  return useQuery({ queryKey: [...qk.catalog, 'produto', gtin, g], queryFn: () => api<ProductDetailDTO>(`/produtos/${gtin}`, { query: g }) });
}

export function useRanking() {
  const g = geoQuery(useAnchor());
  return useQuery({ queryKey: [...qk.catalog, 'ranking', g], queryFn: () => api<StoreRankDTO[]>('/lojas/ranking', { query: g }) });
}

export function useStore(id: number, q: string) {
  const g = geoQuery(useAnchor());
  return useQuery({
    queryKey: [...qk.catalog, 'loja', id, q, g],
    queryFn: () => api<StoreVitrineDTO>(`/lojas/${id}`, { query: { ...g, q } }),
    placeholderData: (prev) => prev,
  });
}

export function useSuggestions(storeId: number, storeCode: string, enabled = true) {
  return useQuery({
    queryKey: [...qk.catalog, 'sugestoes', storeId, storeCode],
    queryFn: () => api<SuggestionDTO[]>('/codigos-barras/sugestoes', { query: { storeId, storeCode } }),
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function usePhotoCandidates(gtin: string | null) {
  return useQuery({
    queryKey: [...qk.catalog, 'fotos', gtin],
    queryFn: () => api<{ current: string | null; candidates: { url: string; source: string }[] }>(`/produtos/${gtin}/fotos`),
    enabled: !!gtin,
  });
}

export function useMyReceipts() {
  return useQuery({ queryKey: [...qk.personal, 'notas'], queryFn: () => api<ReceiptSummaryDTO[]>('/notas/minhas') });
}
export function useReceipt(id: string) {
  return useQuery({ queryKey: [...qk.personal, 'nota', id], queryFn: () => api<ReceiptDTO>(`/notas/${id}`) });
}
export function useLists() {
  return useQuery({ queryKey: [...qk.personal, 'listas'], queryFn: () => api<ListSummaryDTO[]>('/listas') });
}
export function useList(id: string) {
  const g = geoQuery(useAnchor());
  return useQuery({ queryKey: [...qk.personal, 'lista', id, g], queryFn: () => api<ListDetailDTO>(`/listas/${id}`, { query: g }), placeholderData: (p) => p });
}
export function useSpending() {
  return useQuery({ queryKey: [...qk.personal, 'gastos'], queryFn: () => api<SpendingDTO>('/gastos', { query: { meses: 6 } }) });
}
export function usePoints() {
  return useQuery({ queryKey: [...qk.personal, 'pontos'], queryFn: () => api<PointsDTO>('/pontos') });
}

export function useAdmin() {
  return {
    metrics: useQuery({ queryKey: ['admin', 'metricas'], queryFn: () => api<AdminMetricsDTO>('/admin/metricas') }),
    failures: useQuery({ queryKey: ['admin', 'falhas'], queryFn: () => api<IngestFailureDTO[]>('/admin/falhas') }),
    flags: useQuery({ queryKey: ['admin', 'moderacao'], queryFn: () => api<ModerationFlagDTO[]>('/admin/moderacao') }),
  };
}

/* ───────── mutações ───────── */

function useInvalidateAll() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: qk.catalog }), qc.invalidateQueries({ queryKey: qk.personal }), qc.invalidateQueries({ queryKey: qk.me })]);
}

export function useIngest() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (url: string) => api<IngestResultDTO>('/notas', { method: 'POST', body: { url } }),
    onSuccess: () => inv(),
  });
}

export function useLinkBarcode() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (b: { storeId: number; storeCode: string; gtin: string; origin: BarcodeOrigin }) =>
      api<LinkResultDTO>('/codigos-barras', { method: 'POST', body: b }),
    onSuccess: () => inv(),
  });
}

export function useSetListItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { listId: string; gtin: string; quantity: number }) =>
      api(`/listas/${v.listId}/itens/${v.gtin}`, { method: 'PUT', body: { quantity: v.quantity } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.personal }),
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api<ListSummaryDTO>('/listas', { method: 'POST', body: { name } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.personal }),
  });
}

export function useAuth() {
  const inv = useInvalidateAll();
  const done = async (s: SessionDTO) => {
    session.set(s.accessToken);
    await inv();
    return s;
  };
  return {
    register: useMutation({
      mutationFn: (b: { email: string; password: string; name?: string; acceptTerms: true; storeOptIn: boolean }) =>
        api<SessionDTO>('/auth/register', { method: 'POST', body: b }).then(done),
    }),
    login: useMutation({ mutationFn: (b: { email: string; password: string }) => api<SessionDTO>('/auth/login', { method: 'POST', body: b }).then(done) }),
    logout: useMutation({
      mutationFn: async () => {
        await api('/auth/logout', { method: 'POST', body: {} });
        session.set(null);
        await inv();
      },
    }),
  };
}
