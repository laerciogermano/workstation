import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAiConfig, parseAiConfig, removeAiConfig, saveAiConfig } from '../src/ai/settings.ts';

const stored = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../src/folder/handles.ts', () => ({
  kv: {
    get: async (key: string) => stored.get(key),
    set: async (key: string, value: unknown) => void stored.set(key, value),
    del: async (key: string) => void stored.delete(key),
  },
}));

describe('configuração da IA', () => {
  beforeEach(() => stored.clear());

  it('sem nada salvo, não há chave', async () => {
    expect(await loadAiConfig()).toBeNull();
  });

  it('salva sem os espaços das pontas, lê de volta e remove', async () => {
    await saveAiConfig({ provider: 'gemini', apiKey: '  abc-123\n', model: ' modelo ' });
    expect(await loadAiConfig()).toEqual({ provider: 'gemini', apiKey: 'abc-123', model: 'modelo' });
    await removeAiConfig();
    expect(await loadAiConfig()).toBeNull();
  });

  it('recusa chave vazia, quebrada ou fora do ASCII, sem apagar a anterior', async () => {
    await saveAiConfig({ provider: 'anthropic', apiKey: 'boa', model: '' });
    for (const apiKey of ['', '   ', 'duas partes', 'chave…', 'a\nb']) {
      await expect(saveAiConfig({ provider: 'anthropic', apiKey, model: '' })).rejects.toThrow('Chave de API inválida');
    }
    expect((await loadAiConfig())?.apiKey).toBe('boa');
  });

  it('ignora o que não reconhece', () => {
    expect(parseAiConfig(undefined)).toBeNull();
    expect(parseAiConfig('abc')).toBeNull();
    expect(parseAiConfig({ provider: 'outro', apiKey: 'abc' })).toBeNull();
    expect(parseAiConfig({ provider: 'openai', apiKey: 'abc', model: 7 })).toEqual({ provider: 'openai', apiKey: 'abc', model: '' });
  });
});
