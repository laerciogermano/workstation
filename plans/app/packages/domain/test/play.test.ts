import { describe, expect, it } from 'vitest';
import { agentOf, DEFAULT_ASSIGNEES, isOldClientError, playCommand, supportsPlay, type Assignee } from '../src/index.ts';

const ai = (id: string, name = id): Assignee => ({ id, name, type: 'ai' });

describe('play', () => {
  it('reconhece Claude e Gemini pelo id ou pelo nome', () => {
    expect(agentOf(ai('claude'))).toBe('claude');
    expect(agentOf(ai('gemini'))).toBe('gemini');
    expect(agentOf(ai('ia-2', 'Gemini CLI'))).toBe('gemini');
    expect(agentOf(ai('claude-code', 'Revisor'))).toBe('claude');
  });

  it('não oferece play para quem não é uma IA suportada', () => {
    expect(agentOf(undefined)).toBeNull();
    expect(agentOf({ id: 'claude', name: 'Claude', type: 'person' })).toBeNull();
    expect(agentOf({ id: 'gemini', name: 'Gemini', type: 'machine' })).toBeNull();
    expect(agentOf(ai('gpt'))).toBeNull();
    expect(agentOf(ai('claudete'))).toBeNull();
    expect(agentOf(ai('claude', 'ou Gemini'))).toBeNull();
  });

  it('os responsáveis padrão incluem as duas IAs', () => {
    expect(DEFAULT_ASSIGNEES.map(agentOf).filter(Boolean)).toEqual(['claude', 'gemini']);
  });

  it('o pedido leva só a IA e o id', () => {
    expect(playCommand('gemini', 'abc')).toEqual({ program: 'plans-play', args: ['gemini', 'abc'] });
  });

  it('reconhece o client antigo pela versão', () => {
    for (const old of ['0.1.0', '0.1.9', 'v0.0.1']) expect(supportsPlay(old)).toBe(false);
    for (const ok of ['0.2.0', '0.10.0', '1.0.0', 'dev']) expect(supportsPlay(ok)).toBe(true);
  });

  it('reconhece o erro gravado por um client antigo', () => {
    const error = 'exec: "plans-play": executable file not found in $PATH';
    expect(isOldClientError({ program: 'plans-play', error })).toBe(true);
    expect(isOldClientError({ program: 'plans-play', error: 'exec: "plans-play": executable file not found in %PATH%' })).toBe(true);
    expect(isOldClientError({ program: 'git', error })).toBe(false);
    expect(isOldClientError({ program: 'plans-play', error: 'negado no terminal' })).toBe(false);
    expect(isOldClientError({ program: 'plans-play' })).toBe(false);
  });
});
