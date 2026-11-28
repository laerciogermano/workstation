// Exemplos do flow-oriented-programming.com escritos como árvore de entrada, e um gerador de fluxo grande.
const main = (children, extra = {}) => ({ name: 'main', children, ...extra });
const f = (name, extra = {}) => ({ name, ...extra });

export const SAMPLES = {
  estado: { title: 'Estado do fluxo', tree: main([f('receber', { out: ['pedido'] }), f('cobrar', { in: ['pedido'], out: ['pagamento'] }), f('enviar', { in: [{ name: 'envio', fields: ['pedido', 'pagamento'] }] })]) },
  sequencial: {
    title: 'Sequencial e paralelo',
    tree: main([
      f('ler', { out: [{ name: 'valor', value: 21 }] }),
      f('dobrar', { in: ['valor'], out: [{ name: 'dobro', value: 42 }] }),
      f('triplicar', { in: ['valor'], out: [{ name: 'triplo', value: 63 }], parallel: true }),
      f('somar', { in: [{ name: 'parcelas', fields: ['dobro', 'triplo'] }], out: [{ name: 'total', value: 105 }] }),
    ]),
  },
  objeto: {
    title: 'Objeto',
    tree: main([
      f('criarCliente', { out: [{ name: 'cliente', fields: [{ name: 'id', value: 1 }, { name: 'nome', value: '"Ana"' }, { name: 'endereco', fields: [{ name: 'cidade', value: '"Campinas"' }] }] }] }),
      f('pontuar', { in: ['cliente'], out: [{ name: 'pontos', value: 9 }] }),
    ]),
  },
  ifElse: { title: 'if e else', tree: main([{ type: 'if', label: 'aprovada', children: [f('enviar')] }, { type: 'else', children: [f('revisar')] }]) },
  switch: {
    title: 'switch',
    tree: main([{ type: 'switch', label: 'meio', children: [{ type: 'case', label: '"pix"', children: [f('pagarPix')] }, { type: 'case', label: '"cartao"', children: [f('pagarCartao')] }] }]),
  },
  blocos: {
    title: 'Blocos combinados',
    tree: main([{ type: 'for', label: 'item of itens', children: [{ type: 'try', children: [f('enviar', { in: [{ name: 'item', value: 1 }] })] }, { type: 'catch', children: [f('registrarFalha')] }] }]),
  },
  abstrata: {
    title: 'Função abstrata',
    tree: { name: 'vender', source: { kind: 'file', name: 'vendas' }, in: ['hello'], children: [f('hello', { source: null, in: [{ name: 'nome', value: '"Ana"' }] })] },
  },
  responsaveis: {
    title: 'Responsáveis',
    tree: main([
      f('cobrar', { source: { kind: 'machine', name: 'node' }, out: ['pagamento'] }),
      f('ler', { in: ['pagamento'], out: ['pedidos'] }),
      f('resumir', { source: { kind: 'ai', name: 'Claude' }, in: ['pedidos'], out: ['resumo'] }),
      f('aprovar', { source: { kind: 'person', name: 'Laércio' }, in: ['resumo'] }),
      f('adicionar', { source: { kind: 'object', name: 'carrinho' }, parallel: true }),
    ]),
  },
};

/** Fluxo com `total` funções: casos de uso, paralelos, if/else e laços. Sempre o mesmo para o mesmo tamanho. */
export function largeFlow(total) {
  let id = 0;
  const groups = [];
  while (id < total) {
    const g = groups.length;
    const leaf = (extra = {}) => f(`passo${id}`, { in: [`dado${Math.max(0, id - 1)}`], out: [`dado${id++}`], ...extra });
    groups.push(f(`caso${g}`, {
      children: [
        leaf(), leaf(), leaf({ parallel: true }),
        { type: 'if', label: `ok${g}`, children: [leaf()] }, { type: 'else', children: [leaf({ source: null })] },
        { type: 'for', label: 'item of itens', children: [leaf(), leaf()] },
        leaf(),
      ],
    }));
  }
  return main(groups);
}
