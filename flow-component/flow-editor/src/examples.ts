// Os exemplos do flow-oriented-programming.com, na mesma ordem das seções, como pontos de partida editáveis.
import { block, fn, walk, newId } from './model.ts';
import type { BlockNode, Datum, DataType, FlowNode, FnNode, SourceKind } from './model.ts';

export interface Example {
  key: string;
  title: string;
  /** As regras do conceito. */
  rules: string[];
  tree: () => FnNode;
}

export interface ExampleGroup {
  title: string;
  rules?: string[];
  examples: Example[];
}

const d = (name: string, type: DataType = 'abstract', value?: string): Datum => ({ name, type, value });
const text = (name: string, value: string) => d(name, 'text', value);
const num = (name: string, value: number) => d(name, 'number', String(value));
const bool = (name: string, value: boolean) => d(name, 'boolean', String(value));
const obj = (name: string, ...fields: Datum[]): Datum => ({ name, type: 'object', fields });
const list = (name: string, ...values: number[]): Datum => ({ name, type: 'list', fields: values.map((v, i) => num(String(i), v)) });

type Props = Partial<Omit<FnNode, 'type' | 'name' | 'id'>>;
const f = (name: string, props: Props = {}) => fn(name, props);
const kids = (...children: FlowNode[]) => ({ children });
const main = (children: FlowNode[], props: Props = {}) => f('main', { ...props, children });
const by = (kind: SourceKind, name: string) => ({ kind, name });
const MACHINE = by('machine', 'maquina');

const b = (type: BlockNode['type'], expr: string | undefined, ...children: FlowNode[]) => block(type, { expr, children });
const IF = (expr: string, ...c: FlowNode[]) => b('if', expr, ...c);
const ELSE = (...c: FlowNode[]) => b('else', undefined, ...c);
const FOR = (item: string, expr: string, ...c: FlowNode[]) => block('for', { item, expr, children: c });
const TRY = (...c: FlowNode[]) => b('try', undefined, ...c);
const CATCH = (...c: FlowNode[]) => b('catch', undefined, ...c);

/** Cada carga tem identidades novas, para nada ficar compartilhado. */
const ex = (key: string, title: string, rules: string[], build: () => FnNode): Example => ({
  key, title, rules,
  tree: () => {
    const tree = build();
    walk(tree, (n) => (n.id = newId()));
    return tree;
  },
});

export const EXAMPLES: ExampleGroup[] = [
  {
    title: 'Funções',
    examples: [
      ex('main', 'Unidade de processamento', ['Função é a unidade de processamento: transforma um estado inicial em um estado final.', 'Uma função tem, no máximo, uma entrada e uma saída.'],
        () => main([f('processar', { in: [obj('entrada', num('a', 2), num('b', 3))], out: [num('saida', 5)] })])),
      ex('filha', 'Função filha', ['Uma função pode ter funções filhas, por composição.'], () => main([f('hello')])),
      ex('irma', 'Função irmã', ['Irmã é a função que divide o mesmo pai com outra.', 'Irmãs são sequenciais ou paralelas.'], () => main([f('preparar'), f('enviar')])),
      ex('paralela', 'Função paralela', ['Paralelas ocupam o mesmo passo e executam juntas.', 'Terminam antes do passo seguinte começar.'],
        () => main([f('dobrar', { in: [num('valor', 21)], out: [num('dobro', 42)] }), f('triplicar', { in: [num('valor', 21)], out: [num('triplo', 63)], parallel: true })])),
      ex('sequencial', 'Função sequencial', ['Sequenciais são irmãs em passos consecutivos.', 'Paralelas e sequenciais podem ser combinadas.'],
        () => main([
          f('ler', { out: [num('valor', 21)] }),
          f('dobrar', { in: [d('valor')], out: [num('dobro', 42)] }),
          f('triplicar', { in: [d('valor')], out: [num('triplo', 63)], parallel: true }),
          f('somar', { in: [obj('parcelas', d('dobro'), d('triplo'))], out: [num('total', 105)] }),
        ])),
    ],
  },
  {
    title: 'Estados e tipos de dado',
    rules: ['Estado é o conjunto de funções e dados disponíveis num passo.', 'Todo dado tem um endereço, representado pelo nome.'],
    examples: [
      ex('estado', 'Estado do fluxo', ['O estado é listado abaixo do passo.'],
        () => main([f('receber', { out: [d('pedido')] }), f('cobrar', { in: [d('pedido')], out: [d('pagamento')] }), f('enviar', { in: [d('pedido'), d('pagamento')] })])),
      ex('estadoInicial', 'Estado inicial', ['Estado inicial é o que existe antes da primeira função.'], () => main([f('saudar', { in: [text('nome', 'Ana')], out: [d('saudacao')] })])),
      ex('estadoCaixa', 'Estado com objeto', ['Um objeto no estado é um cubo, com os campos e valores logo abaixo.'], () => main([f('pontuar', { in: [obj('cliente', num('id', 1), num('score', 9))], out: [d('pontos')] })])),
      ex('todosDados', 'Todos os tipos de dado', ['Texto, número, booleano e nulo são dados simples (quadrado).', 'Toda caixa é um cubo; a função usada como dado é um círculo.'],
        () => main([], { data: [text('texto', 'Ana'), num('numero', 42), bool('booleano', true), d('funcao', 'function', 'dobrar'), obj('pessoa', text('nome', 'Ana'), num('idade', 30)), list('lista', 1, 2, 3), d('vazio', 'null')] })),
      ex('texto', 'Texto', ['Texto é a sequência de caracteres tratada como dado.'], () => main([f('limpar', { source: MACHINE, in: [text('texto', '  Ana ')], out: [text('limpo', 'Ana')] })])),
      ex('numero', 'Número', ['Número é o dado que expressa quantidade.'], () => main([f('dobrar', { in: [num('valor', 21)], out: [num('dobro', 42)] })])),
      ex('booleano', 'Booleano', ['Booleano admite dois valores e é o que decide uma seleção.'], () => main([f('verificar', { source: MACHINE, in: [num('idade', 30)], out: [bool('maior', true)] })])),
      ex('funcaoDado', 'Função como dado', ['Uma função guardada numa variável é tratada como dado.'],
        () => main([f('aplicar', { in: [d('dobrar', 'function')], out: [num('resultado', 42)], children: [f('dobrar', { in: [num('x', 21)], out: [num('dobro', 42)] })] })])),
      ex('objeto', 'Objeto', ['Objeto pode possuir mais de um valor ao mesmo tempo.', 'Os campos são chaveados ou posicionais.'], () => main([f('extrairNome', { in: [obj('pessoa', text('nome', 'Ana'), num('idade', 30))], out: [text('nome', 'Ana')] })])),
      ex('chaveado', 'Objeto chaveado', ['Os campos são acessados pelo nome: pessoa.nome.'], () => main([f('extrairNome', { in: [obj('pessoa', text('nome', 'Ana'), num('idade', 30))], out: [text('nome', 'Ana')] })])),
      ex('posicional', 'Objeto posicional', ['Os campos são acessados pela posição.'], () => main([f('contar', { in: [list('lista', 1, 2, 3)], out: [num('total', 3)] })])),
      ex('tipoNulo', 'Nulo', ['Nulo representa a ausência de valor.'], () => main([f('buscar', { source: MACHINE, in: [num('codigo', 99)], out: [d('cliente', 'null')] })])),
    ],
  },
  {
    title: 'Seleção',
    rules: ['Seleção decide, pelo dado, para onde vai o fluxo.', 'A condição é atribuída a uma variável antes do if.'],
    examples: [
      ex('se', 'if', ['“enviar” só executa se a condição for verdadeira.'], () => main([IF('ok', f('enviar'))], { data: [bool('ok', true)] })),
      ex('seSenao', 'if e else', ['if e else ocupam o mesmo passo; só um ramo executa.'], () => main([IF('aprovada', f('enviar')), ELSE(f('revisar'))], { data: [bool('aprovada', true)] })),
      ex('switchEx', 'switch', ['Cada case equivale a um if.', 'Os cases ocupam o mesmo passo.'],
        () => main([b('switch', 'meio', b('case', 'pix', f('pagarPix')), b('case', 'cartao', f('pagarCartao')), b('case', 'boleto', f('pagarBoleto')))], { data: [text('meio', 'pix')] })),
      ex('seAninhado', 'if aninhados', ['Um if pode estar no else de outro.', 'Há três caminhos, e só um executa.'],
        () => main([IF('aprovado', f('publicar')), ELSE(IF('recuperacao', f('recuperar')), ELSE(f('reprovar')))], { data: [num('nota', 7), bool('aprovado', true), bool('recuperacao', true)] })),
    ],
  },
  {
    title: 'Repetição',
    rules: ['Repetição executa um bloco várias vezes: for, while e do-while.', 'A coleção é atribuída a uma variável antes do laço.'],
    examples: [
      ex('repFor', 'for', ['“notificar” executa uma vez por item.'], () => main([FOR('item', 'itens', f('notificar', { in: [d('item')] }))], { data: [list('itens', 1, 2)] })),
      ex('repFor2', 'for com vários passos', ['O corpo de um laço pode ter passos sequenciais e paralelos.'],
        () => main([FOR('item', 'itens', f('validar', { in: [d('item')] }), f('salvar', { in: [d('item')] }))], { data: [list('itens', 1, 2)] })),
      ex('repWhile', 'while', ['Repete enquanto a condição for verdadeira.'], () => main([b('while', 'pendente', f('tentar'))], { data: [bool('pendente', true)] })),
      ex('repDoWhile', 'do-while', ['Executa ao menos uma vez e repete enquanto a condição valer.'], () => main([b('do-while', 'pendente', f('tentar', { out: [bool('pendente', false)] }))], { data: [bool('pendente', true)] })),
    ],
  },
  {
    title: 'try / catch',
    examples: [ex('tryCatch', 'try / catch', ['try/catch trata a falha: se “cobrar” falha, o fluxo vai para o catch.'], () => main([TRY(f('cobrar')), CATCH(f('avisar'))]))],
  },
  {
    title: 'Blocos',
    rules: ['Bloco agrupa passos no plano: seleção, repetição ou try/catch.', 'Tem rótulo próprio e cobre o tempo das folhas de dentro.'],
    examples: [
      ex('blocos', 'Bloco', ['O estado continua listando o que está disponível em cada passo do bloco.'], () => main([IF('ok', f('enviar'))], { data: [bool('ok', true)] })),
      ex('tryFor', 'Blocos combinados', ['Os blocos podem ser aninhados: um try/catch dentro de um for.'],
        () => main([FOR('item', 'itens', TRY(f('enviar', { in: [d('item')] })), CATCH(f('registrarFalha')))], { data: [list('itens', 1, 2)] })),
    ],
  },
  {
    title: 'Sólidos e abstratos',
    rules: ['Sólidos têm endereço físico; abstratos são o espaço a ser preenchido.', 'Dados e funções podem ser sólidos ou abstratos.'],
    examples: [
      ex('dadoConcreto', 'Dado sólido', ['Tem endereço: o quadrado é preenchido e o valor aparece no estado.'], () => main([f('dobrar', { in: [num('idade', 30)] })])),
      ex('dadoAbstrato', 'Dado abstrato', ['Ainda sem valor: o quadrado é vazado.'], () => main([f('dobrar', { in: [d('idade')] })], { in: [d('idade')] })),
      ex('solida', 'Função sólida', ['Toda função de 1ª ordem é sólida.', 'A barra é preenchida, e há quem execute.'], () => main([f('cobrar', { source: MACHINE, in: [num('valor', 100)] })])),
      ex('abstrata', 'Função abstrata', ['Sem endereço físico: a barra é só contorno.', 'Ela vem da função pai.'],
        () => f('vender', { source: by('file', 'vendas'), in: [d('hello', 'function')], children: [f('hello', { source: null, in: [text('nome', 'Ana')] })] })),
      ex('estadoAbstrato', 'Estado abstrato', ['Dado que nenhuma função produz: quem chama o fluxo fornece.'], () => main([f('cobrar', { in: [d('pedido')] })], { in: [d('pedido')] })),
    ],
  },
  {
    title: 'Folhas e use cases',
    rules: ['Folhas são funções sem filhas.', 'Use cases são funções com filhas.'],
    examples: [
      ex('folha', 'Folha', ['Só a folha ocupa um passo no plano.'], () => main([f('hello')])),
      ex('useCase', 'Use case', ['Use case é uma função com filhas, e deve ser completamente abstrato.'],
        () => f('vender', { source: by('file', 'vendas'), ...kids(f('receber', { out: [d('pedido')] }), f('cobrar', { in: [d('pedido')] })) })),
    ],
  },
  {
    title: 'Responsáveis',
    rules: ['Responsável é quem executa o passo: arquivo, máquina, IA, pessoa ou objeto.', 'Trocar o responsável não muda o fluxo.'],
    examples: [
      ex('responsavel', 'Responsável', ['É a fonte, a origem da função.'], () => main([f('adicionar', { source: by('object', 'carrinho') })])),
      ex('responsavelSolido', 'Responsável sólido', ['Está definido no passo e possui endereço.'],
        () => main([f('cobrar', { source: MACHINE }), f('ler', { source: by('file', 'arquivo') }), f('aprovar', { source: by('person', 'pessoa') }), f('classificar', { source: by('ai', 'agente') })])),
      ex('responsavelAbstrato', 'Responsável abstrato', ['Ainda não há quem execute.'], () => main([f('cobrar', { source: null })], { in: [d('cobrar', 'function')] })),
    ],
  },
  {
    title: 'Arquivos e visibilidade',
    rules: ['Todo dado e toda função têm um endereço; o arquivo organiza os endereços sólidos.', 'Pública é acessada de fora; privada só dentro.'],
    examples: [
      ex('fileMesmo', 'Duas funções no mesmo arquivo', ['Várias funções podem dividir o mesmo arquivo.'], () => f('main', { source: by('file', 'app'), ...kids(f('util')) })),
      ex('fileOutro', 'Arquivos diferentes', ['Arquivos distintos são endereços distintos. Arquivo não é camada.'], () => main([f('pagar', { source: by('file', 'pagamento') })])),
      ex('fileObjeto', 'Arquivo como objeto', ['O arquivo é uma caixa com endereço físico.', 'Ele guarda dados e funções.'], () => {
        const file = { kind: 'file', name: 'pedidos', asObject: true } as const;
        return main([f('lerArquivo', { source: { ...file }, out: [d('pedidos')] }), f('salvarArquivo', { source: { ...file }, in: [d('pedidos')] })]);
      }),
      ex('publica', 'Pública', ['Função pública pode ser acessada fora do arquivo (export).'], () => main([], { visibility: 'public' })),
      ex('privada', 'Privada', ['Função privada existe só dentro do arquivo ou da caixa.'], () => main([f('interna', { visibility: 'private' })])),
    ],
  },
  {
    title: 'Práticas, padrões e OOP',
    examples: [
      ex('solidSrp', 'Responsabilidade única', ['Cada função cuida de uma só coisa; “pedido” apenas compõe.'], () => main([f('pedido', kids(f('validar'), f('cobrar'), f('enviar')))])),
      ex('solidDip', 'Depender do abstrato', ['O fluxo depende do abstrato, não de quem o implementa.'], () => main([f('cobrar', { source: null })])),
      ex('padFactory', 'Factory', ['Factory cria e devolve um objeto já montado.'], () => main([f('criarCliente', { pattern: 'factory', out: [num('id', 1), text('nome', 'Ana')] })])),
      ex('padSingleton', 'Singleton', ['Instância única e compartilhada: os dois leem o mesmo “config”.'],
        () => main([f('carregar', { pattern: 'singleton', out: [obj('config', text('tema', 'escuro'))] }), f('usarA', { in: [d('config')] }), f('usarB', { in: [d('config')], parallel: true })])),
      ex('oopFlow', 'Instanciar (OOP)', ['Instanciar uma classe corresponde a um objeto responsável; cada método é um passo.'], () => main([f('adicionar', { source: by('object', 'carrinho') })])),
    ],
  },
];
