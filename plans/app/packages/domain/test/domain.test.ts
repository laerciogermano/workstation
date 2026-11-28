import { describe, expect, it } from 'vitest';
import { leaves, buildTree, parseActivity, planMove, serializeActivity, parseComment, safeFileName, serializeComment, sortByPriority, subtreeLeavesFirst, titleSchema,tokenize, type Activity, type TreeNode } from '../src/index.ts';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const act = (n: number, parent: number | null = null): Activity => ({
  id: id(n), title: `nó ${n}`, parent: parent === null ? null : id(parent), assignee: null,
  createdAt: `2026-11-27T12:00:${String(n).padStart(2, '0')}Z`, description: '', systemPromptText: '', extra: {},
});

describe('formato', () => {
  it('vai e volta, preservando chaves desconhecidas e texto difícil', () => {
    const a: Activity = { ...act(1), title: 'Comprar: "fone" #1 ---', description: 'linha 1\n\n---\nlinha 3', extra: { prioridade: 'alta' } };
    expect(parseActivity(serializeActivity(a))).toEqual(a);
  });
  it('aceita CRLF e descrição vazia', () => {
    const a = parseActivity(serializeActivity({ ...act(1), description: 'a\nb' }).replace(/\n/g, '\r\n'));
    expect(a.description).toBe('a\nb');
    expect(parseActivity(serializeActivity(act(2))).description).toBe('');
  });
  it('recusa arquivo sem cabeçalho ou com cabeçalho inválido', () => {
    expect(() => parseActivity('texto solto')).toThrow();
    expect(() => parseActivity('---\nid: x\n---\n')).toThrow(/id/);
  });
  it('cola o system prompt completo no arquivo; lê legado com referência e sem bloco', () => {
    const a = { ...act(1), systemPromptText: 'Seja breve.\nSem atalhos.', description: 'SYSTEM PROMPT\n/outro.md' };
    const text = serializeActivity(a);
    expect(text.startsWith('SYSTEM PROMPT\nSeja breve.\nSem atalhos.\n\n---\nid: ')).toBe(true);
    expect(text).not.toContain('/system-prompt.md');
    expect(parseActivity(text)).toEqual(a);
    expect(parseActivity(text.replace(/\n/g, '\r\n'))).toEqual(a);
    expect(parseActivity(text.slice(text.indexOf('---')))).toEqual({ ...a, systemPromptText: undefined });
    expect(serializeActivity(parseActivity(text))).toBe(text);
    const legacy = serializeActivity(act(2)).replace('SYSTEM PROMPT\n\n', 'SYSTEM PROMPT\n/system-prompt.md\n\n');
    expect(parseActivity(legacy).systemPromptText).toBeUndefined();
    expect(serializeActivity(parseActivity(legacy), 'agora')).toContain('SYSTEM PROMPT\nagora\n\n---\n');
    expect(() => serializeActivity({ ...act(3), systemPromptText: 'a\n---\nb' })).toThrow(/---/);
  });
  it('a prioridade vai e volta; fora da escala vira problema', () => {
    const a = { ...act(1), priority: 4 as const };
    expect(parseActivity(serializeActivity(a))).toEqual(a);
    expect(serializeActivity(act(1))).not.toContain('priority');
    expect(serializeActivity({ ...a, priority: undefined })).not.toContain('priority');
    for (const bad of ['0', '6', '2.5', 'alta']) {
      expect(() => parseActivity(serializeActivity(a).replace('priority: 4', `priority: ${bad}`))).toThrow(/priority/);
    }
  });
  it('valida o título', () => {
    expect(titleSchema.parse('  ok ')).toBe('ok');
    expect(titleSchema.safeParse('   ').success).toBe(false);
    expect(titleSchema.safeParse('a\nb').success).toBe(false);
  });
});

describe('árvore', () => {
  it('lista só as folhas, com o caminho dos pais', () => {
    const act = (id: string, parent: string | null, n: number) => ({ id, title: id, parent, assignee: null, createdAt: new Date(n * 1000).toISOString(), description: '', extra: {} });
    const found = leaves(buildTree([act('r', null, 1), act('a', 'r', 2), act('b', 'r', 3), act('a1', 'a', 4), act('s', null, 5)]));
    expect(found.map((l) => [l.activity.id, l.path])).toEqual([['a1', ['r', 'a']], ['b', ['r']], ['s', []]]);
  });
  it('ordena as folhas por prioridade, sem prioridade no fim e empates na ordem da árvore', () => {
    const list = [act(1), { ...act(2), priority: 2 as const }, act(3), { ...act(4), priority: 5 as const }, { ...act(5), priority: 2 as const }];
    const found = leaves(buildTree(list));
    expect(sortByPriority(found).map((l) => l.activity.id)).toEqual([4, 2, 5, 1, 3].map(id));
    expect(found.map((l) => l.activity.id)).toEqual([1, 2, 3, 4, 5].map(id));
  });
  it('ordena por criação e apaga das folhas para o nó', () => {
    const list = [act(3, 1), act(1), act(2, 1), act(4, 2), act(5)];
    const roots = buildTree(list);
    expect(roots.map((r) => r.activity.id)).toEqual([id(1), id(5)]);
    expect(roots[0]!.children.map((c) => c.activity.id)).toEqual([id(2), id(3)]);
    expect(subtreeLeavesFirst(list, id(1)).map((a) => a.id)).toEqual([id(4), id(2), id(3), id(1)]);
  });
  it('mostra órfãos e ciclos como raiz, com aviso, sem perder nós', () => {
    const roots = buildTree([act(1, 9), act(2, 3), act(3, 2), act(4, 4)]);
    const flat = (n: ReturnType<typeof buildTree>): string[] => n.flatMap((x) => [x.activity.id, ...flat(x.children)]);
    expect(flat(roots).sort()).toEqual([id(1), id(2), id(3), id(4)]);
    expect(roots.every((r) => r.warning)).toBe(true);
  });
});

describe('mover', () => {
  const apply = (list: Activity[], target: number, parent: number | null, before: number | null) => {
    const patches = planMove(list, id(target), parent === null ? null : id(parent), before === null ? null : id(before));
    return { patches, list: list.map((a) => ({ ...a, ...patches.find((p) => p.id === a.id) })) };
  };
  const shape = (nodes: TreeNode[]): string => nodes.map((n) => n.activity.title.slice(3) + (n.children.length ? `(${shape(n.children)})` : '')).join(' ');
  const base = [act(1), act(2, 1), act(3, 1), act(4, 1), act(5)];

  it('reordena irmãos, muda de pai e volta a raiz, mudando só o arquivo movido', () => {
    let r = apply(base, 4, 1, 2);
    expect(shape(buildTree(r.list))).toBe('1(4 2 3) 5');
    expect(r.patches).toHaveLength(1);
    r = apply(r.list, 2, 3, null);
    expect(shape(buildTree(r.list))).toBe('1(4 3(2)) 5');
    r = apply(r.list, 3, null, 1);
    expect(shape(buildTree(r.list))).toBe('3(2) 1(4) 5');
    r = apply(r.list, 5, 1, null);
    expect(shape(buildTree(r.list))).toBe('3(2) 1(4 5)');
  });

  it('não grava nada quando já está no lugar e recusa ciclo', () => {
    expect(planMove(base, id(3), id(1), id(4))).toEqual([]);
    expect(planMove(base, id(4), id(1), null)).toEqual([]);
    expect(() => planMove(base, id(1), id(1), null)).toThrow(/dentro dela mesma/);
    expect(() => planMove(base, id(1), id(3), null)).toThrow(/dentro dela mesma/);
  });

  it('renumera os irmãos quando não cabe mais nada entre dois, e novos continuam no fim', () => {
    let list = base;
    for (let i = 0; i < 80; i++) list = apply(list, i % 2 ? 4 : 3, 1, i % 2 ? 3 : 4).list;
    expect(shape(buildTree(list))).toBe('1(2 4 3) 5');
    expect(shape(buildTree([...list, { ...act(6, 1), createdAt: new Date().toISOString() }]))).toBe('1(2 4 3 6) 5');
  });

  it('o status vai e volta; valor desconhecido vira problema', () => {
    const a = { ...act(1), status: 'doing' as const };
    expect(parseActivity(serializeActivity(a))).toEqual(a);
    expect(serializeActivity(act(1))).not.toContain('status');
    expect(() => parseActivity(serializeActivity(a).replace('doing', 'pronto'))).toThrow(/status/);
  });

  it('a posição vai e volta no arquivo', () => {
    const a = { ...act(1), order: 12.5 };
    expect(parseActivity(serializeActivity(a))).toEqual(a);
    expect(serializeActivity(act(1))).not.toContain('order');
  });
});

describe('linha de comando', () => {
  it('separa aspas e preserva caminhos do Windows', () => {
    expect(tokenize(`git commit -m "primeira versão" 'a b' c\\ d`)).toEqual(['git', 'commit', '-m', 'primeira versão', 'a b', 'c d']);
    expect(tokenize('type C:\\dados\\x.txt ""')).toEqual(['type', 'C:\\dados\\x.txt', '']);
    expect(() => tokenize('echo "x')).toThrow();
  });
});

describe('arquivos da atividade', () => {
  it('limpa o nome do anexo sem perder a extensão', () => {
    expect(safeFileName('a/b\\c:d?.png')).toBe('a-b-c-d-.png');
    expect(safeFileName('..')).toBe('arquivo');
    expect(safeFileName(' .env ')).toBe('env');
    const long = safeFileName('é'.repeat(300) + '.pdf');
    expect(long.endsWith('é.pdf') && new TextEncoder().encode(long).length <= 200).toBe(true);
  });
  it('grava e lê o comentário; sem cabeçalho válido o arquivo todo é o texto', () => {
    const c = { author: 'eu', createdAt: '2026-11-28T10:00:00.000Z', text: '## Retorno\n\n---\nfim' };
    expect(parseComment(serializeComment(c), '')).toEqual(c);
    expect(parseComment('só a resposta\r\n', 'd')).toEqual({ author: null, createdAt: 'd', text: 'só a resposta' });
    expect(parseComment('---\nx: [\n---\ny', 'd').text).toBe('---\nx: [\n---\ny');
  });
});
