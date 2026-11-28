import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CardContext } from '../src/ai/context.ts';
import { aiReady, generateDescription } from '../src/ai/describe.ts';
import { DEFAULT_MODELS, generateText } from '../src/ai/providers.ts';
import type { AiConfig, AiProvider } from '../src/ai/settings.ts';

const saved = vi.hoisted(() => new Map<string, unknown>());
vi.mock('../src/folder/handles.ts', () => ({ kv: { get: async (k: string) => saved.get(k), set: async () => {}, del: async () => {} } }));

const context: CardContext = { title: 'Montar a proposta', description: '', ancestors: [], children: [], siblings: [], systemPrompt: '', comments: [], attachments: [] };
const config = (provider: AiProvider, model = ''): AiConfig => ({ provider, apiKey: 'chave-de-teste', model });
const ask = { system: 'regras', prompt: 'contexto' };

/** Respostas no formato documentado por cada provedor, com um trecho de raciocínio que não pode vazar. */
const ANSWERS: Record<AiProvider, (text: string) => object> = {
  gemini: (text) => ({ status: 'completed', steps: [{ type: 'thought', content: [{ type: 'text', text: 'pensando' }] }, { type: 'model_output', content: [{ type: 'text', text }] }] }),
  anthropic: (text) => ({ stop_reason: 'end_turn', content: [{ type: 'thinking', thinking: 'pensando' }, { type: 'text', text }] }),
  openai: (text) => ({ status: 'completed', output: [{ type: 'reasoning', content: [] }, { type: 'message', content: [{ type: 'output_text', text }] }] }),
};

const fetched = vi.fn<(url: string, init: RequestInit) => Promise<Response>>();
const reply = (body: unknown, status = 200) => fetched.mockResolvedValueOnce(new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }));
const sent = () => {
  const [url, init] = fetched.mock.calls.at(-1)!;
  return { url, headers: init.headers as Record<string, string>, body: JSON.parse(init.body as string) as Record<string, unknown> };
};

beforeEach(() => vi.stubGlobal('fetch', fetched));
afterEach(() => {
  vi.unstubAllGlobals();
  fetched.mockReset();
  saved.clear();
});

describe('provedores de IA', () => {
  it.each(['gemini', 'anthropic', 'openai'] as const)('%s: manda a chave no cabeçalho, usa o modelo padrão e devolve só o texto', async (provider) => {
    reply(ANSWERS[provider]('pronto'));
    expect(await generateText(config(provider), ask)).toBe('pronto');
    const { url, headers, body } = sent();
    expect(url).not.toContain('chave-de-teste');
    expect(Object.values(headers).some((v) => v.endsWith('chave-de-teste'))).toBe(true);
    expect(JSON.stringify(body)).not.toContain('chave-de-teste');
    expect(body.model).toBe(DEFAULT_MODELS[provider]);
    expect(JSON.stringify(body)).toContain('regras');
    expect(JSON.stringify(body)).toContain('contexto');
  });

  it('não pede para o Gemini nem a OpenAI guardarem a conversa', async () => {
    for (const provider of ['gemini', 'openai'] as const) {
      reply(ANSWERS[provider]('ok'));
      await generateText(config(provider), ask);
      expect(sent().body.store).toBe(false);
    }
  });

  it('Anthropic: libera o navegador e só pede repetição em outro modelo quando o modelo é o padrão', async () => {
    reply(ANSWERS.anthropic('ok'));
    await generateText(config('anthropic'), ask);
    expect(sent().headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    expect(sent().body.fallbacks).toBe('default');
    reply(ANSWERS.anthropic('ok'));
    await generateText(config('anthropic', 'claude-haiku-5-5'), ask);
    expect(sent().body.model).toBe('claude-haiku-5-5');
    expect(sent().body).not.toHaveProperty('fallbacks');
    expect(sent().headers).not.toHaveProperty('anthropic-beta');
  });

  it('explica chave recusada, limite, erro do provedor e falta de rede', async () => {
    reply({ error: { message: 'invalid x-api-key' } }, 401);
    await expect(generateText(config('anthropic'), ask)).rejects.toThrow(/recusou a chave.*invalid x-api-key/);
    reply([{ error: { message: 'quota' } }], 429); // o Gemini às vezes devolve uma lista
    await expect(generateText(config('gemini'), ask)).rejects.toThrow(/Limite de uso.*quota/);
    reply('<html>', 502);
    await expect(generateText(config('openai'), ask)).rejects.toThrow('OpenAI respondeu com erro 502.');
    fetched.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(generateText(config('openai'), ask)).rejects.toThrow(/Não foi possível falar com OpenAI/);
  });

  it('não grava resposta vazia, cortada ou recusada', async () => {
    reply(ANSWERS.openai('  '));
    await expect(generateText(config('openai'), ask)).rejects.toThrow(/sem texto/);
    reply({ status: 'incomplete', steps: [] });
    await expect(generateText(config('gemini'), ask)).rejects.toThrow(/cortada/);
    reply({ stop_reason: 'max_tokens', content: [{ type: 'text', text: 'meio' }] });
    await expect(generateText(config('anthropic'), ask)).rejects.toThrow(/cortada/);
    reply({ stop_reason: 'refusal', content: [] });
    await expect(generateText(config('anthropic'), ask)).rejects.toThrow(/recusou a responder/);
    reply({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'não' }] }] });
    await expect(generateText(config('openai'), ask)).rejects.toThrow(/recusou a responder/);
  });

  it('cancelar não vira mensagem de erro de rede', async () => {
    const abort = new AbortController();
    fetched.mockImplementationOnce(async (_url, init) => {
      abort.abort();
      throw init.signal!.reason;
    });
    await expect(generateText(config('gemini'), ask, abort.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('descrição gerada', () => {
  it('sem chave, não está pronta e não chama ninguém', async () => {
    expect(await aiReady()).toBe(false);
    await expect(generateDescription(context)).rejects.toThrow(/Configure a chave/);
    expect(fetched).not.toHaveBeenCalled();
  });

  it('manda o título como contexto e tira a cerca de código da resposta', async () => {
    saved.set('ai', config('gemini'));
    expect(await aiReady()).toBe(true);
    reply(ANSWERS.gemini('```markdown\nObjetivo.\n\n- entrega\n```'));
    expect(await generateDescription(context)).toBe('Objetivo.\n\n- entrega');
    expect(sent().body.input).toContain('Título: Montar a proposta');
  });
});
