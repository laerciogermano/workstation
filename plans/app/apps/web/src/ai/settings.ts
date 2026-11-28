// Configuração da IA: provedor, chave de API e modelo. Fica só neste navegador (IndexedDB):
// a chave é pessoal e nunca vai para a pasta do projeto (que pode ir para o git) nem para o hub.
import { useEffect, useSyncExternalStore } from 'react';
import { kv } from '../folder/handles.ts';

export const AI_PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'anthropic', name: 'Anthropic Claude', keyUrl: 'https://platform.claude.com/settings/keys' },
  { id: 'openai', name: 'OpenAI', keyUrl: 'https://platform.openai.com/api-keys' },
] as const;

export type AiProvider = (typeof AI_PROVIDERS)[number]['id'];
/** `model` vazio = o padrão do provedor, decidido por quem chama a IA. */
export type AiConfig = { provider: AiProvider; apiKey: string; model: string };

const KEY = 'ai';

/** Chaves são ASCII sem espaços: o resto é erro de colagem e quebraria o cabeçalho do pedido. */
export function parseAiConfig(value: unknown): AiConfig | null {
  if (typeof value !== 'object' || value === null) return null;
  const { provider, apiKey, model } = value as Record<string, unknown>;
  const known = AI_PROVIDERS.find((p) => p.id === provider);
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';
  if (!known || !/^[!-~]+$/.test(key)) return null;
  return { provider: known.id, apiKey: key, model: typeof model === 'string' ? model.trim() : '' };
}

type State = { /** undefined: ainda lendo */ config: AiConfig | null | undefined; open: boolean };
let state: State = { config: undefined, open: false };
const listeners = new Set<() => void>();
const set = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));

/** Lê a cada chamada, para enxergar o que outra aba salvou. null = sem chave configurada. */
export async function loadAiConfig(): Promise<AiConfig | null> {
  const config = parseAiConfig(await kv.get(KEY));
  set({ config });
  return config;
}

export async function saveAiConfig(next: AiConfig): Promise<void> {
  const config = parseAiConfig(next);
  if (!config) throw new Error('Chave de API inválida: cole a chave inteira, sem espaços.');
  await kv.set(KEY, config);
  set({ config });
}

export async function removeAiConfig(): Promise<void> {
  await kv.del(KEY);
  set({ config: null });
}

/** Abre o diálogo de configuração (por exemplo, quando alguém pede a IA sem ter chave). */
export const openAiSettings = () => set({ open: true });
export const closeAiSettings = () => set({ open: false });
export const useAiSettingsOpen = () => useSyncExternalStore(subscribe, () => state.open);

/** Configuração atual para a tela: undefined enquanto lê, null sem chave. */
export function useAiConfig() {
  useEffect(() => {
    void loadAiConfig().catch((e) => {
      console.error(e);
      set({ config: null });
    });
  }, []);
  return useSyncExternalStore(subscribe, () => state.config);
}
