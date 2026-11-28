// Chamadas aos provedores de IA, direto do navegador com a chave da pessoa: um pedido, um texto de volta.
import type { AiConfig, AiProvider } from './settings.ts';

export type Prompt = { system: string; prompt: string };

/** Usado quando a configuração não diz o modelo. Os motivos estão no estudo (README, "Descrição por IA"). */
export const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-3.5-flash-lite',
  anthropic: 'claude-opus-5-5',
  openai: 'gpt-6-luna',
};

const TIMEOUT_MS = 90_000;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (typeof v === 'object' && v !== null ? (v as Json) : {});
const list = (v: unknown): Json[] => (Array.isArray(v) ? v.map(obj) : []);
/** Junta os trechos de texto de um tipo; o resto (raciocínio, ferramentas) fica de fora. */
const texts = (blocks: unknown, type: string) => list(blocks).filter((b) => b.type === type && typeof b.text === 'string').map((b) => b.text as string).join('');

type Provider = {
  name: string;
  url: string;
  request: (key: string, model: string, p: Prompt) => { headers: Record<string, string>; body: Json };
  /** O texto da resposta; lança quando o modelo não terminou. */
  read: (body: Json) => string;
};

const refused = () => new Error('O modelo se recusou a responder a este conteúdo.');
const cutShort = () => new Error('A resposta veio cortada. Tente de novo ou troque o modelo.');

const PROVIDERS: Record<AiProvider, Provider> = {
  gemini: {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/interactions',
    request: (key, model, p) => ({
      headers: { 'x-goog-api-key': key },
      // store: false — o Google não guarda a conversa para consultas depois
      body: { model, system_instruction: p.system, input: p.prompt, store: false },
    }),
    read: (body) => {
      if (body.status === 'incomplete') throw cutShort();
      if (body.status !== undefined && body.status !== 'completed') throw new Error(`O Google Gemini não concluiu a resposta (${String(body.status)}).`);
      return list(body.steps).filter((s) => s.type === 'model_output').map((s) => texts(s.content, 'text')).join('');
    },
  },
  anthropic: {
    name: 'Anthropic Claude',
    url: 'https://api.anthropic.com/v1/messages',
    request: (key, model, p) => {
      // no modelo padrão, um pedido recusado pelo filtro é repetido pelo servidor em outro modelo
      const fallback = model === DEFAULT_MODELS.anthropic;
      return {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2026-10-21',
          'anthropic-dangerous-direct-browser-access': 'true',
          ...(fallback ? { 'anthropic-beta': 'server-side-fallback-2026-07-01' } : {}),
        },
        body: { model, max_tokens: 16_000, system: p.system, messages: [{ role: 'user', content: p.prompt }], ...(fallback ? { fallbacks: 'default' } : {}) },
      };
    },
    read: (body) => {
      if (body.stop_reason === 'refusal') throw refused();
      if (body.stop_reason === 'max_tokens') throw cutShort();
      return texts(body.content, 'text');
    },
  },
  openai: {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/responses',
    request: (key, model, p) => ({
      headers: { authorization: `Bearer ${key}` },
      body: { model, instructions: p.system, input: p.prompt, store: false },
    }),
    read: (body) => {
      if (body.status === 'incomplete') throw cutShort();
      const content = list(body.output).filter((o) => o.type === 'message').flatMap((o) => list(o.content));
      if (content.some((c) => c.type === 'refusal')) throw refused();
      return texts(content, 'output_text');
    },
  },
};

function failure(name: string, status: number, body: unknown): Error {
  // o Gemini às vezes devolve o erro dentro de uma lista
  const error = obj(obj(Array.isArray(body) ? body[0] : body).error);
  const detail = typeof error.message === 'string' ? ` (${error.message.slice(0, 200)})` : '';
  if (status === 401 || status === 403) return new Error(`${name} recusou a chave de API. Confira a chave no botão "IA" do topo.${detail}`);
  if (status === 404) return new Error(`${name} não encontrou o modelo. Confira o campo "Modelo" no botão "IA" do topo.${detail}`);
  if (status === 429) return new Error(`Limite de uso do ${name} atingido. Espere um pouco e tente de novo.${detail}`);
  return new Error(`${name} respondeu com erro ${status}.${detail}`);
}

export async function generateText(config: AiConfig, prompt: Prompt, signal?: AbortSignal): Promise<string> {
  const provider = PROVIDERS[config.provider];
  const { headers, body } = provider.request(config.apiKey, config.model || DEFAULT_MODELS[config.provider], prompt);
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  let response: Response;
  let answer: unknown;
  try {
    response = await fetch(provider.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    answer = await response.json().catch((e: unknown) => {
      if ((e as Error).name === 'SyntaxError') return null; // página de erro no lugar do JSON
      throw e;
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    if (timeout.aborted) throw new Error(`${provider.name} demorou demais para responder.`);
    throw new Error(`Não foi possível falar com ${provider.name}. Verifique a conexão.`);
  }
  if (!response.ok) throw failure(provider.name, response.status, answer);
  const text = provider.read(obj(answer)).trim();
  if (!text) throw new Error(`${provider.name} devolveu uma resposta sem texto.`);
  return text;
}
