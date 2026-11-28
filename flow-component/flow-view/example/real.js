// Casos reais, escritos como árvore de entrada. Verbos nas funções, substantivos nos dados.
const f = (name, extra = {}) => ({ name, ...extra });
const flow = (name, file, children) => ({ name, source: { kind: 'file', name: file }, children });
const obj = (name, ...fields) => ({ name, fields });
const val = (name, value) => ({ name, value });
const by = (kind, name) => ({ source: { kind, name } });
const IF = (label, ...children) => ({ type: 'if', label, children });
const ELSE = (...children) => ({ type: 'else', children });
const FOR = (label, ...children) => ({ type: 'for', label, children });
const WHILE = (label, ...children) => ({ type: 'while', label, children });
const DO = (label, ...children) => ({ type: 'do-while', label, children });
const SWITCH = (label, ...children) => ({ type: 'switch', label, children });
const CASE = (label, ...children) => ({ type: 'case', label, children });
const TRY = (...children) => ({ type: 'try', children });
const CATCH = (...children) => ({ type: 'catch', children });

const checkout = flow('finalizarCompra', 'checkout', [
  f('receberCarrinho', { out: [obj('carrinho', 'itens', 'cliente', 'cupom')] }),
  f('reservarEstoque', { ...by('machine', 'estoque'), in: ['carrinho'], out: ['reserva'] }),
  f('calcularFrete', { ...by('machine', 'correios'), in: ['carrinho'], out: [val('frete', 24.9)] }),
  f('calcularImpostos', { in: ['carrinho'], out: [val('impostos', 18.3)], parallel: true }),
  f('aplicarCupom', { in: ['carrinho'], out: [val('desconto', 10)], parallel: true }),
  f('montarPedido', { in: [obj('valores', 'reserva', 'frete', 'impostos', 'desconto')], out: ['pedido'] }),
  TRY(f('cobrarCartao', { ...by('machine', 'gateway'), in: ['pedido'], out: ['pagamento'] })),
  CATCH(f('liberarEstoque', { ...by('machine', 'estoque'), in: ['reserva'] }), f('avisarFalha', { in: ['carrinho'] })),
  IF('pagamento.aprovado',
    f('emitirNota', { ...by('machine', 'sefaz'), in: ['pedido'], out: ['nota'] }),
    f('enviarConfirmacao', { ...by('machine', 'smtp'), in: [obj('confirmacao', 'pedido', 'nota')] }),
    f('separarPacote', { ...by('person', 'Estoquista'), in: ['pedido'], parallel: true }),
  ),
  ELSE(f('oferecerPix', { in: ['pedido'], out: ['qrcode'] })),
]);

const campanha = flow('enviarCampanha', 'worker', [
  f('carregarCampanha', { ...by('machine', 'postgres'), out: [obj('campanha', val('assunto', '"Novidades"'), 'corpo', 'lista')] }),
  f('buscarContatos', { ...by('machine', 'postgres'), in: ['campanha'], out: ['contatos'] }),
  f('removerDescadastrados', { in: ['contatos'], out: ['destinatarios'] }),
  FOR('destinatario of destinatarios',
    f('montarEmail', { in: [obj('envio', 'destinatario', 'campanha')], out: ['mensagem'] }),
    f('incluirPixel', { in: ['mensagem'], out: ['mensagemRastreada'] }),
    TRY(f('enviarSmtp', { ...by('machine', 'smtp'), in: ['mensagemRastreada'], out: ['entrega'] })),
    CATCH(f('reagendarEnvio', { in: ['mensagemRastreada'] })),
  ),
  WHILE('campanha recente', f('registrarAbertura', { ...by('machine', 'pixel'), out: ['abertura'] })),
  f('resumirResultado', { ...by('ai', 'Claude'), in: [obj('resultado', 'destinatarios', 'abertura')], out: ['relatorio'] }),
  f('analisarRelatorio', { ...by('person', 'Marketing'), in: ['relatorio'] }),
]);

const orcamento = flow('automatizarOrcamento', 'orcamentos', [
  f('lerSolicitacao', { ...by('ai', 'Claude'), out: ['solicitacao'] }),
  f('extrairItens', { ...by('ai', 'Claude'), in: ['solicitacao'], out: ['itens'] }),
  FOR('item of itens',
    f('consultarSaldo', { ...by('machine', 'estoque'), in: ['item'], out: ['saldo'] }),
    IF('saldo suficiente', f('precificarEstoque', { in: ['saldo'], out: ['preco'] })),
    ELSE(SWITCH('fornecedor',
      CASE('"nacional"', f('cotarNacional', { ...by('machine', 'portal'), in: ['item'], out: ['cotacao'] })),
      CASE('"importado"', f('cotarImportado', { ...by('person', 'Comprador'), in: ['item'], out: ['cotacao'] })),
    )),
  ),
  f('calcularMargem', { in: [obj('custos', 'preco', 'cotacao')], out: [obj('proposta', val('margem', '18%'), 'total', 'validade')] }),
  f('revisarProposta', { ...by('person', 'Vendedor'), in: ['proposta'], out: ['aprovacao'] }),
  IF('aprovacao',
    f('enviarProposta', { ...by('machine', 'smtp'), in: ['proposta'] }),
    DO('sem resposta', f('fazerFollowUp', { ...by('machine', 'whatsapp'), in: ['proposta'], out: ['resposta'] })),
  ),
]);

const login = flow('autenticar', 'auth', [
  f('receberCredenciais', { out: [obj('credenciais', 'email', 'senha')] }),
  f('limitarTentativas', { in: ['credenciais'], out: ['liberado'] }),
  IF('liberado',
    f('buscarUsuario', { ...by('machine', 'postgres'), in: ['credenciais'], out: ['usuario'] }),
    f('compararSenha', { in: [obj('tentativa', 'credenciais', 'usuario')], out: ['confere'] }),
    IF('confere',
      f('criarSessao', { in: ['usuario'], out: [obj('sessao', 'token', 'expiraEm')] }),
      f('gravarCookie', { in: ['sessao'] }),
    ),
    ELSE(f('registrarFalha', { in: ['credenciais'] })),
  ),
  ELSE(f('bloquear', { in: ['credenciais'] })),
]);

const pipeline = flow('publicar', 'pipeline', [
  f('baixarCodigo', { ...by('machine', 'git'), out: ['repositorio'] }),
  f('instalar', { ...by('machine', 'npm'), in: ['repositorio'], out: ['dependencias'] }),
  f('lint', { ...by('machine', 'oxlint'), in: ['dependencias'], out: ['estilo'] }),
  f('conferirTipos', { ...by('machine', 'tsc'), in: ['dependencias'], out: ['tipos'], parallel: true }),
  f('testar', { ...by('machine', 'vitest'), in: ['dependencias'], out: ['cobertura'], parallel: true }),
  IF('tudo passou',
    f('compilar', { ...by('machine', 'vite'), in: [obj('verificado', 'estilo', 'tipos', 'cobertura')], out: ['artefato'] }),
    SWITCH('ambiente',
      CASE('"homologação"', f('implantarHomologacao', { ...by('machine', 'servidor'), in: ['artefato'] })),
      CASE('"produção"',
        f('aprovarDeploy', { ...by('person', 'Responsável'), in: ['artefato'], out: ['aprovacao'] }),
        TRY(f('implantarProducao', { ...by('machine', 'servidor'), in: [obj('entrega', 'artefato', 'aprovacao')] })),
        CATCH(f('reverterVersao', { ...by('machine', 'servidor'), in: ['artefato'] })),
      ),
    ),
  ),
  ELSE(f('notificarFalha', { in: [obj('falhas', 'estilo', 'tipos', 'cobertura')] })),
]);

const atendimento = flow('atenderCliente', 'atendimento', [
  f('receberMensagem', { ...by('machine', 'whatsapp'), out: [obj('mensagem', 'telefone', 'texto')] }),
  f('buscarHistorico', { ...by('machine', 'crm'), in: ['mensagem'], out: ['historico'] }),
  f('classificarIntencao', { ...by('ai', 'Claude'), in: [obj('contexto', 'mensagem', 'historico')], out: ['intencao'] }),
  SWITCH('intencao',
    CASE('"preço"',
      f('consultarCatalogo', { ...by('machine', 'erp'), in: ['mensagem'], out: ['produto'] }),
      f('redigirOferta', { ...by('ai', 'Claude'), in: ['produto'], out: ['resposta'] }),
    ),
    CASE('"suporte"', f('abrirChamado', { ...by('machine', 'crm'), in: ['mensagem'], out: ['chamado'] })),
    CASE('"outro"', f('assumirConversa', { ...by('person', 'Atendente'), in: ['mensagem'], out: ['resposta'] })),
  ),
  f('registrarAtendimento', { ...by('machine', 'crm'), in: ['mensagem'] }),
]);

const comando = flow('executarComando', 'plans', [
  f('pedirComando', { ...by('person', 'Operador'), out: [obj('pedido', 'programa', 'argumentos')] }),
  f('cifrar', { ...by('object', 'front'), in: ['pedido'], out: ['envelope'] }),
  f('repassar', { ...by('machine', 'hub'), in: ['envelope'] }),
  f('decifrar', { ...by('object', 'client'), in: ['envelope'], out: ['comando'] }),
  f('conferirPolitica', { ...by('object', 'client'), in: ['comando'], out: ['liberado'] }),
  IF('liberado',
    f('iniciarProcesso', { ...by('object', 'client'), in: ['comando'], out: ['saida'] }),
    FOR('trecho of saida', f('enviarTrecho', { ...by('object', 'client'), in: ['trecho'] }), f('mostrarTrecho', { ...by('object', 'front'), in: ['trecho'] })),
    f('gravarExecucao', { ...by('object', 'front'), in: [obj('registro', 'comando', 'saida')] }),
  ),
  ELSE(f('sugerirLiberacao', { ...by('object', 'client'), in: ['comando'] })),
]);

export const REAL = {
  checkout: { title: 'Checkout de loja', tree: checkout },
  campanha: { title: 'Campanha de e-mail', tree: campanha },
  orcamento: { title: 'Orçamento automático', tree: orcamento },
  login: { title: 'Login', tree: login },
  pipeline: { title: 'Publicação de sistema', tree: pipeline },
  atendimento: { title: 'Atendimento com IA', tree: atendimento },
  comando: { title: 'Comando no Plans', tree: comando },
};
REAL.sistema = { title: 'Sistema completo', tree: { name: 'empresa', children: Object.values(REAL).map((r) => r.tree) } };
