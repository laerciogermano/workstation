/* Filtro por épico (fase): mostra o que existe até a fase escolhida. Fonte desta lista: docs/epics.md.
   Cada tela entra em exatamente um épico. */
(() => {
const S = () => SP.S;
const E = (n, nome, resumo, telas, cresce, fora) => ({ n, id: 'E' + String(n).padStart(2, '0'), nome, resumo, telas, cresce, fora });

SP.EPICOS = [
  E(1, 'Autenticação e acesso', 'Entrar, sair, recuperar a senha e definir quem acessa, para todos os perfis.',
    ['login', 'recuperar', 'semAcesso', 'saiu', 'minhaConta', 'menu', 'vendedores', 'membro'],
    ['Entrar, recuperar a senha, acesso negado e saída para os cinco perfis', 'Minha conta: dados, senha e preferências', 'Cadastro de vendedores'],
    'Qualquer módulo de negócio: propostas, cadastros, pedidos e financeiro.'),
  E(2, 'Orçamentos', 'Montar, enviar e acompanhar propostas com margem à vista.',
    ['orcLista', 'orcBusca', 'orcNovo', 'orcEditar', 'orcVer', 'orcHist'],
    ['Lista, busca completa, novo orçamento, edição, PDF e histórico', 'Cliente e produtos escolhidos na própria proposta'],
    'Telas de cadastro de clientes e produtos, e transformar a proposta em pedido.'),
  E(3, 'Pedidos', 'A proposta aprovada vira pedido, com dados fiscais, entrega e pagamento.',
    ['pedLista', 'pedEditar', 'pedVer', 'pedCancelar', 'pedPdf', 'estVazio'],
    ['Orçamento aprovado ganha o botão “Gerar pedido”', 'Cada item do orçamento mostra a última venda ao cliente'],
    'Telas de cadastro de clientes e produtos, compra, recebimento, expedição, nota e cobrança.'),
  E(4, 'Operação e logística', 'Comprar, receber, separar e entregar, sabendo o que está parado.',
    ['checklist', 'parados', 'fluxo', 'logistica', 'logEtiqueta', 'logRastreio', 'transp', 'transpForm', 'fornecedores', 'fornecedor', 'estOffline'],
    ['Pedido ganha o “Próximo passo” e o checklist', 'Cadastro de transportadoras e fornecedores', 'Uso sem conexão, com fila de envio'],
    'Telas de cadastro de clientes e produtos, painel, emissão fiscal e financeiro.'),
  E(5, 'Cadastros, painel e marca', 'Clientes e produtos, o painel inicial e a identidade do tenant.',
    ['clientes', 'cliente', 'produtos', 'produto', 'busca', 'atalhos', 'hoje', 'ajustes', 'marca', 'comecar', 'estCarregando', 'estErro'],
    ['Clientes e produtos, com CNPJ e CPF conferidos', 'Ficha do cliente com pedidos, total comprado e ticket médio', 'Painel inicial com funil de propostas, compra, recebimento e entrega, e calendário', 'Marca do tenant, Ajustes e primeiros passos', 'Ajustes reúne transportadoras e fornecedores', 'Busca ⌘K e atalhos de teclado'],
    'Emissão fiscal e financeiro.'),
  E(6, 'Notas fiscais e integrações', 'Emitir e tratar a NF-e, com SEFAZ e importação do portal anterior.',
    ['nfLista', 'nfNova', 'nfImpostos', 'nfEmitida', 'danfe', 'correcao', 'integracoes'],
    ['Pedido ganha “Nota fiscal” e os documentos', 'Funil ganha Faturar', 'Primeiros passos passa a levar às integrações'],
    'Títulos, boletos e cobrança.'),
  E(7, 'Financeiro', 'Receber, cobrar e enxergar o resultado.',
    ['contas', 'conta', 'quitar', 'boletos', 'boleto', 'bancos', 'bancoForm', 'faturamento', 'fluxoPrev', 'cobranca'],
    ['Painel ganha faturamento, a receber e ranking de vendedores', 'Risco do cliente aparece em orçamentos, pedidos, notas e clientes', 'Pedido ganha as parcelas', 'Funil ganha A receber'],
    'Regras automáticas: tudo ainda é acionado por uma pessoa.'),
  E(8, 'Automação e fila de decisão', 'O portal passa a trabalhar sozinho e só chama quando precisa de julgamento.',
    ['fila', 'filaItem', 'atividade', 'automacoes', 'regra', 'templates', 'template', 'parametros', 'entrada'],
    ['Regras rodam: aprovar cria o pedido, receber os itens prepara a nota', 'Painel ganha o resumo do dia, “Precisa de você” e os recibos', 'Busca em linguagem natural', 'Orçamentos ganha a entrada de ordem de compra por e-mail'],
    'O cliente final ainda não entra no portal.'),
  E(9, 'Portal do cliente', 'O comprador decide propostas, acompanha entregas e paga.',
    ['cliHome', 'cliPropostas', 'cliProposta', 'cliPedidos', 'cliPedido', 'cliCobrancas', 'cliPagar', 'cliAjuda'],
    ['Novo papel: Cliente', 'Ficha do cliente ganha “Ver como o cliente”', 'Contra proposta do comprador entra na fila de decisão'],
    'Chamados internos e central de avisos.'),
  E(10, 'Chamados e notificações', 'Suporte e avisos num lugar só.',
    ['chamados', 'chamadoNovo', 'chamado', 'notificacoes'],
    ['Sino no topo e avisos por menção', 'Menu ganha Chamados'],
    'Visão de resultado para quem investe.'),
  E(11, 'Visão do investidor', 'Resultado da unidade para quem não opera o fluxo.',
    ['investidor'],
    ['Novo papel: Investidor, somente leitura'],
    'Quadros, inteligência artificial, campanhas e dashboards.'),
  E(12, 'Kanban', 'Ver e mover vendas e tarefas em quadros.',
    ['quadroVendas', 'quadroTarefas', 'tarefa', 'colunas'],
    ['Propostas em quadro por status, com total por coluna', 'Tarefas da equipe com dono, prazo, prioridade e limite por coluna'],
    'Inteligência artificial, campanhas e dashboards.'),
  E(13, 'Inteligência artificial', 'Um copiloto em chat: a pessoa pede e ele lista, ensina a fazer ou escreve.',
    ['assistente', 'copListas', 'copEnsina', 'iaConfig'],
    ['Chat que lista pedidos, propostas, títulos, leads, tarefas, estoque, clientes e vendas', 'Ensina o passo a passo e leva até a tela', 'Escreve mensagens para revisão', 'Respeita o perfil e o que pode ler'],
    'Campanhas e dashboards.'),
  E(14, 'Campanhas de e-mail marketing', 'Segmentar clientes, enviar e medir campanhas.',
    ['campanhas', 'campanhaForm', 'publicos', 'campanhaVer'],
    ['Campanhas com prévia, teste, agendamento e confirmação', 'Públicos calculados a partir dos clientes, com descadastro', 'Abertura e cliques por campanha e por destinatário, para saber quem abriu', 'Analytics de e-mail: abertura por pixel 1×1 e clique por link rastreado, no próprio envio', 'Links com UTM, para o Google Analytics medir o que acontece no site depois do clique'],
    'Dashboards.'),
  E(15, 'Dashboards', 'Acompanhar vendas, operação e financeiro, cada pessoa com o seu painel.',
    ['dashComercial', 'dashOperacao', 'dashFin', 'dashMontar'],
    ['Painéis comercial, de operação e financeiro', 'Painel montado pela própria pessoa'],
    'Captação e funil de leads.'),
  E(16, 'Leads', 'Captar, qualificar e transformar contatos em clientes.',
    ['leads', 'funilLeads', 'lead', 'leadForm', 'captacao'],
    ['Lista e funil de leads por etapa', 'Pontuação explicada, responsável e histórico', 'Conversão em cliente, com orçamento em seguida', 'Formulário do site com consentimento, importação e rodízio'],
    'Pontuação e gamificação dos vendedores.'),
  E(17, 'Gamificação de vendedores', 'Pontuar o que o vendedor faz, mostrar a posição de cada um e premiar desafios.',
    ['ranking', 'meusPontos', 'conquistas', 'desafios', 'desafioForm', 'regrasPontos'],
    ['Pontos calculados do que acontece no portal, com extrato', 'Ranking, níveis e conquistas', 'Desafios com prazo e prêmio', 'Regras de pontuação configuráveis pelo administrador'],
    'Automação de orçamentos.'),
  E(18, 'Automação de orçamentos', 'Do pedido de cotação que chega à proposta enviada e acompanhada.',
    ['pedidosCot', 'cotRevisar', 'cotPrecos', 'cotFornecedores', 'cotFollow'],
    ['Pedidos de e-mail, WhatsApp, site ou texto colado viram itens do catálogo, com confiança', 'Preço calculado por regras, com a explicação', 'Comparação de fornecedores', 'Orçamento gerado em um toque e envio direto dentro do limite', 'Follow-up automático'],
    'Nada além do que já foi entregue.'),
];

const mapa = {}; SP.EPICOS.forEach(x => x.telas.forEach(k => mapa[k] = x.n));
SP.epicoDe = k => mapa[k];
SP.tem = n => !S().epico || n <= S().epico;
SP.entregue = k => !S().epico || (mapa[k] || 99) <= S().epico;
SP.rotEpico = n => SP.EPICOS[n - 1].id;

/* ---------- o que some enquanto o épico não chega ---------- */
const ACAO = { busca: 5, atalhos: 5, gerarPedido: 3, orcDoCliente: 2, irChecklist: 4, marcarPasso: 4, notaDoPed: 6, cobrar: 7, quitarUma: 7, pausar: 8, perguntar: 8, verComo: 9, abrirNotif: 10 };
SP.podar = raiz => {
  if (!S().epico) return;
  raiz.querySelectorAll('[data-go],[data-a],[data-peek]').forEach(el => {
    const go = el.dataset.go, a = el.closest('.porta') ? null : el.dataset.a;
    if ((go && SP.screens[go] && !SP.entregue(go)) || (ACAO[a] && !SP.tem(ACAO[a]))) { if (el.matches('button, a') && !el.matches('.lado-logo')) el.remove(); else { el.removeAttribute('data-go'); el.removeAttribute('data-peek'); } }
  });
};

/* regras só rodam depois da automação; risco depende dos títulos; busca natural é da automação */
const regra = SP.regra; SP.regra = (...a) => SP.tem(8) ? regra(...a) : undefined;
const risco = SP.riscoPill; SP.riscoPill = id => SP.tem(7) ? risco(id) : '';
const interpretar = SP.interpretar; SP.interpretar = q => SP.tem(8) ? interpretar(q) : null;
})();
