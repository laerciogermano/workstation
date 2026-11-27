/* Dados de exemplo. Pessoas, empresas, CNPJs e valores são fictícios. */
SP.seed = function () {
  const tenants = [
    { id: 't1', nome: 'ConectMax', razao: 'ConectMax Unidade Exemplo Ltda', slogan: 'Soluções em Tecnologia', cor: '#0070BC', destaque: '#FF731D', fonte: 'Plus Jakarta Sans', raio: 10, logo: 'assets/logo-header.png', logoEscuro: 'assets/logo-noite.png', icone: 'assets/icone-512.png', dominio: 'portal.conectmax.exemplo', saudacao: 'Compras de tecnologia em um só lugar.', cnpjs: ['11.222.333/0001-81', '22.333.444/0001-05'] },
    { id: 't2', nome: 'Vértice', razao: 'Vértice Suprimentos Ltda', slogan: 'Suprimentos corporativos', cor: '#17694F', destaque: '#C2540C', fonte: 'Figtree', raio: 14, logo: '', logoEscuro: '', icone: '', dominio: 'portal.vertice.exemplo', saudacao: 'Seu estoque sem correria.', cnpjs: ['33.444.555/0001-20'] },
    { id: 't3', nome: 'Porto Norte', razao: 'Porto Norte Distribuidora S.A.', slogan: 'Distribuição e logística', cor: '#8A2432', destaque: '#E0A100', fonte: 'IBM Plex Sans', raio: 4, logo: '', logoEscuro: '', icone: '', dominio: 'clientes.portonorte.exemplo', saudacao: 'Do pedido à doca, sem ruído.', cnpjs: ['44.555.666/0001-37'] },
  ];

  const vendedores = [
    { id: 'v1', nome: 'Marina Alves', email: 'marina@exemplo.com', whats: '(11) 90000-0101', usuario: 'marina', ativo: true, online: true, ultimo: '2026-11-27 09:14', meta: 60000, vendido: 48320 },
    { id: 'v2', nome: 'Rafael Costa', email: 'rafael@exemplo.com', whats: '(11) 90000-0102', usuario: 'rafael', ativo: true, online: false, ultimo: '2026-11-26 18:02', meta: 45000, vendido: 31870 },
    { id: 'v3', nome: 'Camila Nunes', email: 'camila@exemplo.com', whats: '(19) 90000-0103', usuario: 'camila', ativo: true, online: true, ultimo: '2026-11-27 08:47', meta: 40000, vendido: 22410 },
    { id: 'v4', nome: 'Diego Prado', email: 'diego@exemplo.com', whats: '(19) 90000-0104', usuario: 'diego', ativo: false, online: false, ultimo: '2026-10-30 17:20', meta: 30000, vendido: 0 },
  ];
  const funcionarios = [
    { id: 'f1', nome: 'Paulo Reis', email: 'paulo@exemplo.com', whats: '(11) 90000-0201', usuario: 'paulo', cargo: 'Logística', ativo: true, online: true, ultimo: '2026-11-27 07:55', perms: ['hoje', 'fila', 'checklist', 'parados', 'fluxo', 'pedLista', 'logistica', 'transp', 'nfLista', 'produtos', 'fornecedores', 'notificacoes', 'chamados', 'atividade'] },
    { id: 'f2', nome: 'Helena Duarte', email: 'helena@exemplo.com', whats: '(11) 90000-0202', usuario: 'helena', cargo: 'Gerência', ativo: true, online: false, ultimo: '2026-11-26 19:11', perms: ['*'] },
  ];

  const C = (id, nome, cnpj, contato, email, cidade, uf, extra = {}) => ({ id, nome, cnpj, comprador: contato, email, telefone: '(11) 4000-' + id.slice(1).padStart(4, '0'), whats: '(11) 9' + id.slice(1).padStart(4, '0') + '-1200', ie: 'Isento', isento: 'Não contribuinte', icms: 'Não', cep: '13010-' + id.slice(1).padStart(3, '0'), endereco: 'Avenida das Palmeiras', numero: String(100 + 37 * +id.slice(1)), complemento: '', bairro: 'Centro', cidade, uf, ...extra });
  const clientes = [
    C('c1', 'Alvorada Soluções S.A.', '10.100.200/0001-11', 'Juliana Moraes', 'compras@alvorada.exemplo', 'Campinas', 'SP', { ie: '244.118.903.110', isento: 'Não', icms: 'Sim' }),
    C('c2', 'Mineração Serra Azul Ltda', '10.200.300/0001-22', 'Otávio Lima', 'suprimentos@serraazul.exemplo', 'Belo Horizonte', 'MG', { ie: '062.307.904.00', isento: 'Não', icms: 'Sim' }),
    C('c3', 'Cidade Viva Experiências S/A', '10.300.400/0001-33', 'Bianca Torres', 'bianca@cidadeviva.exemplo', 'São Paulo', 'SP'),
    C('c4', 'Raiz Educação S.A.', '10.400.500/0001-44', 'Marcos Vidal', 'ti@raizeducacao.exemplo', 'Rio de Janeiro', 'RJ'),
    C('c5', 'Indústria Marfim Ltda', '10.500.600/0001-55', 'Sandra Pires', 'compras@marfim.exemplo', 'Curitiba', 'PR', { ie: '905.112.440', isento: 'Não', icms: 'Sim' }),
    C('c6', 'Transrota Veículos Ltda', '10.600.700/0001-66', 'Eduardo Sales', 'eduardo@transrota.exemplo', 'Sorocaba', 'SP'),
    C('c7', 'Posto Ipê Ltda', '10.700.800/0001-77', 'Carlos Mota', 'financeiro@postoipe.exemplo', 'Jundiaí', 'SP', { cep: '', endereco: '', numero: '', bairro: '' }),
    C('c8', 'Mercado Bom Preço Alimentos', '10.800.900/0001-88', 'Larissa Gomes', 'larissa@bompreco.exemplo', 'Limeira', 'SP', { ie: '417.220.118.119', isento: 'Não', icms: 'Sim' }),
    C('c9', 'Clínica Vida Plena', '10.900.100/0001-99', 'Renata Freitas', 'adm@vidaplena.exemplo', 'Campinas', 'SP'),
  ];

  const Pr = (id, nome, ncm, custo, preco, estoque, fornecedor) => ({ id, nome, ncm, cfop: '5102', cest: '', custo, preco, margem: Math.round((preco / custo - 1) * 100), estoque, fornecedor, ativo: true });
  const produtos = [
    Pr('p1', 'Memória notebook DDR4 16GB 3200MHz', '8473.30.42', 212, 289.9, 6, 'f01'),
    Pr('p2', 'SSD NVMe 1TB M.2 PCIe 4.0', '8523.51.10', 318, 429, 3, 'f01'),
    Pr('p3', 'Headset USB com microfone', '8518.30.00', 118, 169.9, 22, 'f02'),
    Pr('p4', 'Mouse sem fio compacto', '8471.60.53', 41, 69.9, 40, 'f02'),
    Pr('p5', 'Teclado USB ABNT2', '8471.60.52', 29, 49.9, 35, 'f02'),
    Pr('p6', 'Câmera IP PoE 1080p', '8525.89.29', 209, 319, 0, 'f03'),
    Pr('p7', 'Switch 24 portas Gigabit PoE', '8517.62.39', 2140, 2890, 1, 'f03'),
    Pr('p8', 'Switch 16 portas Gigabit PoE', '8517.62.39', 1290, 1740, 2, 'f03'),
    Pr('p9', 'Hub USB-C 6 em 1', '8471.80.00', 132, 199, 14, 'f02'),
    Pr('p10', 'Bateria selada 12V 9Ah', '8507.20.10', 62, 94, 0, 'f04'),
    Pr('p11', 'Monitor 24" IPS Full HD', '8528.52.00', 521, 719, 4, 'f01'),
    Pr('p12', 'Nobreak 1500VA bivolt', '8504.40.40', 690, 949, 2, 'f04'),
  ];
  const fornecedores = [
    { id: 'f01', nome: 'Distribuidora Atlas', cnpj: '50.100.100/0001-01', contato: 'Vendas Atlas', email: 'vendas@atlas.exemplo', telefone: '(11) 3000-0001', prazo: 3, cidade: 'Barueri', uf: 'SP', pagamento: '28 dias' },
    { id: 'f02', nome: 'Periféricos Sul', cnpj: '50.200.200/0001-02', contato: 'Ana Sul', email: 'pedidos@perifsul.exemplo', telefone: '(41) 3000-0002', prazo: 5, cidade: 'Curitiba', uf: 'PR', pagamento: 'Boleto 21 dias' },
    { id: 'f03', nome: 'RedeMais Telecom', cnpj: '50.300.300/0001-03', contato: 'Comercial', email: 'comercial@redemais.exemplo', telefone: '(11) 3000-0003', prazo: 7, cidade: 'São Paulo', uf: 'SP', pagamento: 'PIX antecipado' },
    { id: 'f04', nome: 'Energia & Cia', cnpj: '50.400.400/0001-04', contato: 'Roberto', email: 'roberto@energiacia.exemplo', telefone: '(19) 3000-0004', prazo: 4, cidade: 'Americana', uf: 'SP', pagamento: '30 dias' },
  ];
  const transportadoras = [
    { id: 't01', nome: 'AGÊNCIA DE CORREIOS', cnpj: '60.100.100/0001-01', ie: '', email: 'agencia@correios.exemplo', telefone: '(19) 3100-0001', endereco: 'Rua Central, 10', cidade: 'Campinas', uf: 'SP' },
    { id: 't02', nome: 'RÁPIDO BANDEIRANTE', cnpj: '60.200.200/0001-02', ie: '244.000.111.000', email: 'coleta@bandeirante.exemplo', telefone: '(11) 3100-0002', endereco: 'Rod. Anhanguera, km 98', cidade: 'Campinas', uf: 'SP' },
    { id: 't03', nome: 'MINAS CARGO', cnpj: '60.300.300/0001-03', ie: '', email: 'comercial@minascargo.exemplo', telefone: '(31) 3100-0003', endereco: 'Av. do Contorno, 800', cidade: 'Belo Horizonte', uf: 'MG' },
    { id: 't04', nome: 'ENTREGA LOCAL EXPRESSA', cnpj: '60.400.400/0001-04', ie: '', email: 'ola@expressa.exemplo', telefone: '(19) 3100-0004', endereco: 'Rua das Flores, 55', cidade: 'Campinas', uf: 'SP' },
  ];

  const it = (pid, qtd, o = {}) => { const p = produtos.find(x => x.id === pid); return { produto: pid, nome: p.nome, ncm: p.ncm, qtd, valor: p.custo, margem: p.margem, extra: 0, obs: '', comprado: false, chegou: false, previsao: '', ...o }; };
  const base = (cid, vend) => { const c = clientes.find(x => x.id === cid); return { cliente: cid, vendedor: vend, cnpjEmp: tenants[0].cnpjs[0], doc: c.cnpj, ie: c.ie, isento: c.isento, icms: c.icms, nome: c.nome, comprador: c.comprador, email: c.email, telefone: c.telefone, cep: c.cep, endereco: c.endereco, numeroEnd: c.numero, complemento: '', bairro: c.bairro, cidade: c.cidade, uf: c.uf, prazo: '7 dias úteis', forma: 'Boleto', pagamento: '28 dias', frete: 'CIF', validade: '7 dias', local: '', obs: '', obsInt: '', descTipo: 'pct', desc: 0 }; };
  const O = (numero, data, status, cid, vend, itens, extra = {}) => ({ id: 'o' + numero, numero, data, status, titulo: '', ...base(cid, vend), itens, hist: [{ txt: 'Orçamento criado por ' + vendedores.find(v => v.id === vend).nome, em: data + ' 10:12' }], ...extra });
  const orcamentos = [
    O(3652, '2026-11-27', 'Em aberto', 'c9', 'v3', [it('p11', 4), it('p12', 1)], { titulo: 'Recepção nova' }),
    O(3651, '2026-11-26', 'Contra proposta', 'c8', 'v1', [it('p7', 2), it('p6', 8)], { titulo: 'CFTV loja Limeira', contra: { valor: 8450, msg: 'Fechamos hoje se chegar a R$ 8.450 com frete incluso.' } }),
    O(3650, '2026-11-26', 'Aprovado', 'c1', 'v1', [it('p1', 10), it('p2', 5)], { titulo: 'Upgrade do time de dados' }),
    O(3649, '2026-11-24', 'Enviado', 'c4', 'v2', [it('p4', 30), it('p5', 30), it('p3', 12)], { titulo: 'Volta às aulas' }),
    O(3648, '2026-11-23', 'Enviado', 'c1', 'v2', [it('p9', 15)], { titulo: 'Hubs para híbridos' }),
    O(3647, '2026-11-20', 'Aprovado', 'c3', 'v2', [it('p9', 3), it('p1', 5)]),
    O(3646, '2026-11-19', 'Reprovado', 'c6', 'v3', [it('p3', 10)]),
    O(3645, '2026-11-17', 'Aprovado', 'c7', 'v1', [it('p6', 35)], { titulo: 'Monitoramento de pátio' }),
    O(3644, '2026-11-12', 'Cancelado', 'c5', 'v3', [it('p8', 1)]),
    O(3643, '2026-11-10', 'Aprovado', 'c2', 'v1', [it('p2', 2)]),
  ];

  const parc = { tabela: '28 dias', primeiro: '', vezes: 1 };
  const Pe = (numero, data, status, cid, vend, itens, flags = {}, extra = {}) => ({ id: 'd' + numero, numero, data, status, orc: null, ...base(cid, vend), ocNum: '', ocArq: '', ...parc, itens, nf: false, boleto: false, enviado: false, recebido: false, pago: false, rastreio: { codigo: '', link: '' }, frete_valor: 0, emails: [], anexos: [], etiqueta: null, logSt: '', obsPedido: '', cancelObs: '', atualizado: data, hist: [{ txt: 'Pedido criado', em: data + ' 11:00' }], ...flags, ...extra });
  const ok = { comprado: true, chegou: true };
  const pedidos = [
    Pe(17160, '2026-11-26', 'Aprovado', 'c1', 'v1', [it('p1', 10), it('p2', 5)], {}, { orc: 3650, ocNum: 'OC-8812', ocArq: 'OC-8812.pdf', obsPedido: 'Cliente pediu entrega até 04/12.' }),
    Pe(17155, '2026-11-24', 'Aprovado', 'c3', 'v2', [it('p9', 3, { comprado: true, previsao: '2026-11-25' }), it('p1', 5, { comprado: true, chegou: true })], {}, { orc: 3647, atualizado: '2026-11-24' }),
    Pe(17150, '2026-11-20', 'Aprovado', 'c7', 'v1', [it('p6', 35, ok)], {}, { orc: 3645, atualizado: '2026-11-26' }),
    Pe(17143, '2026-11-18', 'Faturado', 'c6', 'v3', [it('p3', 10, ok)], { nf: true, boleto: true }, { atualizado: '2026-11-21', logSt: 'Faturado' }),
    Pe(17135, '2026-11-16', 'Faturado', 'c1', 'v2', [it('p10', 20, ok)], { nf: true, boleto: true, enviado: true }, { atualizado: '2026-11-25', rastreio: { codigo: 'BR448812093SP', link: 'https://rastreio.exemplo/BR448812093SP' }, frete_valor: 84.5, emails: ['compras@alvorada.exemplo'] }),
    Pe(17134, '2026-11-12', 'Faturado', 'c6', 'v3', [it('p3', 10, ok)], { nf: true, boleto: true, enviado: true, recebido: true }, { atualizado: '2026-11-19' }),
    Pe(17050, '2026-11-05', 'Faturado', 'c5', 'v1', [it('p7', 1, ok), it('p8', 1, ok)], { nf: true, boleto: true, enviado: true, recebido: true, pago: true }, { atualizado: '2026-11-22', anexos: ['canhoto-17050.jpg'] }),
    Pe(16982, '2026-10-27', 'Faturado', 'c1', 'v1', [it('p6', 1, ok)], { nf: true, boleto: true, enviado: true, recebido: true, pago: true }, { atualizado: '2026-11-04' }),
    Pe(17161, '2026-11-27', 'Em análise', 'c9', 'v3', [it('p12', 2)], {}, { forma: 'PIX' }),
    Pe(17162, '2026-11-27', 'Rascunho', 'c4', 'v2', [it('p4', 8)], {}),
    Pe(17140, '2026-11-17', 'Cancelado', 'c8', 'v1', [it('p11', 2)], {}, { cancelObs: 'Cliente optou por modelo maior.' }),
    Pe(17120, '2026-11-09', 'Aprovado', 'c2', 'v1', [it('p2', 2, { comprado: true, previsao: '2026-11-16' })], {}, { orc: 3643, atualizado: '2026-11-18' }),
  ];

  const NF = (numero, data, status, cid, pedido, total, transp, extra = {}) => ({ id: 'n' + numero, numero, data, status, cliente: cid, pedido, total, transportadora: transp, tipo: '1 - Saída', cfop: '5102', ...extra });
  const notas = [
    NF(340, '2026-11-25 11:41', 'Enviado', 'c1', 17135, 1880, 't01'),
    NF(339, '2026-11-21 15:44', 'Enviado', 'c6', 17143, 1699, 't04'),
    NF(338, '2026-11-19 09:20', 'Enviado', 'c6', 17134, 1699, 't02'),
    NF(337, '2026-11-13 16:03', 'Rejeitado', 'c5', null, 1740, 't02', { motivo: 'Rejeição 539: duplicidade de NF-e com diferença na chave de acesso.' }),
    NF(336, '2026-11-10 10:30', 'Enviado', 'c5', 17050, 4630, 't02'),
    NF(335, '2026-11-04 14:12', 'Cancelado', 'c2', null, 858, 't03'),
    NF(334, '2026-10-30 08:55', 'Enviado', 'c1', 16982, 319, 't01'),
    NF(341, '2026-11-27 08:10', 'Aguardando envio', 'c8', null, 69.9, 't04'),
  ];

  const Co = (id, status, venc, titulo, cid, valor, extra = {}) => ({ id, status, vencimento: venc, pagamento: '', titulo, cliente: cid, valor, banco: 'b1', descricao: '', anexos: [], boleto: true, ...extra });
  const contas = [
    Co('cr1', 'Aberta', '2026-12-23', 'Fatura 1 da nota fiscal nº 340', 'c1', 1880, { pedido: 17135, nota: 340 }),
    Co('cr2', 'Aberta', '2026-12-19', 'Fatura 1 da nota fiscal nº 339', 'c6', 849.5, { pedido: 17143, nota: 339 }),
    Co('cr3', 'Aberta', '2027-01-02', 'Fatura 2 da nota fiscal nº 339', 'c6', 849.5, { pedido: 17143, nota: 339 }),
    Co('cr4', 'Aberta', '2026-11-30', 'Fatura 1 da nota fiscal nº 338', 'c6', 1699, { pedido: 17134, nota: 338 }),
    Co('cr5', 'Quitada', '2026-11-19', 'Fatura 1 da nota fiscal nº 336', 'c5', 2315, { pagamento: '2026-11-19', pedido: 17050, nota: 336 }),
    Co('cr6', 'Aberta', '2026-11-30', 'Fatura 2 da nota fiscal nº 336', 'c5', 2315, { pedido: 17050, nota: 336 }),
    Co('cr7', 'Aberta', '2026-11-18', 'Fatura 3 da nota fiscal nº 288', 'c8', 1890, { banco: 'b2' }),
    Co('cr8', 'Aberta', '2026-11-24', 'Contrato de suporte · novembro', 'c9', 450, { boleto: false }),
    Co('cr9', 'Quitada', '2026-11-02', 'Fatura 1 da nota fiscal nº 334', 'c1', 319, { pagamento: '2026-11-03', pedido: 16982, nota: 334 }),
    Co('cr10', 'Falta arquivo', '2026-12-05', 'Reembolso de frete', 'c2', 212.4, { boleto: false }),
    Co('cr11', 'Estornada', '2026-11-12', 'Fatura 1 da nota fiscal nº 335', 'c2', 858, { nota: 335 }),
  ];
  const bancos = [
    { id: 'b1', nome: 'Banco Inter · Matriz', banco: '077', agencia: '0001', conta: '123456-7', padrao: true, integrado: true, saldo: 48210.33 },
    { id: 'b2', nome: 'Banco Inter · Filial', banco: '077', agencia: '0001', conta: '765432-1', padrao: false, integrado: true, saldo: 9120.8 },
  ];

  const chamados = [
    { id: 'h1', numero: 214, status: 'Aberto', assunto: 'XML da NF 337 rejeitado', envolvidos: ['Suporte Portal', 'Paulo Reis'], criado: '2026-11-25 09:02', editado: 'Paulo Reis', ultima: '2026-11-26 16:40', msgs: [{ de: 'Paulo Reis', txt: 'A nota 337 voltou com rejeição 539. Podem verificar?', em: '2026-11-25 09:02', anexos: ['rejeicao-337.pdf'] }, { de: 'Suporte Portal', txt: 'Identificamos duplicidade de chave. Inutilize e emita novamente.', em: '2026-11-26 16:40', anexos: [] }] },
    { id: 'h2', numero: 213, status: 'Aguardando', assunto: 'Liberar usuário da logística', envolvidos: ['Helena Duarte'], criado: '2026-11-20 14:15', editado: 'Helena Duarte', ultima: '2026-11-20 15:00', msgs: [{ de: 'Marina Alves', txt: 'Precisamos de acesso à tela de Logística para o novo colega.', em: '2026-11-20 14:15', anexos: [] }] },
    { id: 'h3', numero: 209, status: 'Fechado', assunto: 'Boleto não registrado no banco', envolvidos: ['Suporte Portal'], criado: '2026-11-08 08:30', editado: 'Suporte Portal', ultima: '2026-11-09 11:25', msgs: [{ de: 'Helena Duarte', txt: 'Boleto da fatura 288 não aparece no banco.', em: '2026-11-08 08:30', anexos: [] }, { de: 'Suporte Portal', txt: 'Registrado novamente. Pode conferir.', em: '2026-11-09 11:25', anexos: [] }] },
  ];
  const notificacoes = [
    { id: 'a1', assunto: 'Pedido 17150 passou para “Emitir NF / boleto”', por: 'Paulo Reis', data: '2026-11-26 17:48', lida: false, ir: ['checklist'] },
    { id: 'a2', assunto: 'Contra proposta recebida no orçamento 3651', por: 'Portal do cliente', data: '2026-11-26 15:22', lida: false, ir: ['orcEditar', 'o3651'] },
    { id: 'a3', assunto: 'Chamado 214 recebeu resposta', por: 'Suporte Portal', data: '2026-11-26 16:40', lida: false, ir: ['chamado', 'h1'] },
    { id: 'a4', assunto: 'Pedido 17135 foi enviado ao cliente', por: 'Automação', data: '2026-11-25 12:05', lida: true, ir: ['logistica'] },
    { id: 'a5', assunto: 'Fatura 2 da NF 336 vence em 3 dias', por: 'Automação', data: '2026-11-27 07:00', lida: true, ir: ['conta', 'cr6'] },
  ];

  /* autonomia: executar = faz sozinho · preparar = deixa pronto para aprovar · sugerir = só avisa */
  const R = (id, grupo, nome, quando, entao, nivel, template, extra = {}) => ({ id, grupo, nome, quando, entao, nivel, template, ligada: true, limite: 0, execucoes: 0, ...extra });
  const regras = [
    R('r1', 'Comercial', 'Gerar pedido ao aprovar orçamento', 'Orçamento muda para Aprovado', 'Cria o pedido com os mesmos itens', 'executar', '', { execucoes: 38 }),
    R('r2', 'Comercial', 'Confirmar pedido ao cliente', 'Pedido criado', 'Envia e-mail de confirmação', 'executar', 'tp2', { execucoes: 41 }),
    R('r3', 'Comercial', 'Follow-up de proposta sem resposta', 'Orçamento Enviado há 3 dias', 'Prepara mensagem de acompanhamento', 'preparar', 'tp3', { execucoes: 12 }),
    R('r4', 'Compras', 'Alertar compra atrasada', 'Previsão de entrega vencida', 'Avisa a logística e o vendedor', 'executar', 'tp8', { execucoes: 7 }),
    R('r5', 'Fiscal', 'Preparar NF-e quando tudo chegar', 'Todos os itens marcados como Chegou', 'Preenche a NF-e e pede aprovação', 'preparar', '', { limite: 5000, execucoes: 29 }),
    R('r6', 'Financeiro', 'Gerar contas a receber e boleto', 'NF-e autorizada', 'Cria parcelas e registra boletos', 'executar', '', { execucoes: 29 }),
    R('r7', 'Expedição', 'Enviar NF e boleto ao cliente', 'NF-e autorizada', 'E-mail com PDF, XML e boleto', 'executar', 'tp4', { execucoes: 29 }),
    R('r8', 'Expedição', 'Avisar rastreio', 'Pedido marcado como Enviado', 'WhatsApp com código e link', 'executar', 'tp5', { execucoes: 25 }),
    R('r9', 'Financeiro', 'Lembrar antes do vencimento', 'Faltam 3 dias para vencer', 'E-mail com o boleto', 'executar', 'tp6', { execucoes: 64 }),
    R('r10', 'Financeiro', 'Cobrar título vencido', 'Título vencido há 1 dia ou mais', 'Prepara cobrança no tom certo', 'preparar', 'tp7', { limite: 1000, execucoes: 9 }),
    R('r11', 'Entrada', 'Ler ordem de compra recebida', 'E-mail com OC em anexo', 'Monta rascunho de pedido', 'preparar', '', { execucoes: 5 }),
    R('r12', 'Financeiro', 'Concluir pedido pago', 'Todas as parcelas quitadas', 'Marca pagamento confirmado', 'executar', '', { execucoes: 22 }),
  ];

  const T = (id, nome, canal, assunto, corpo) => ({ id, nome, canal, assunto, corpo, ativo: true, atualizado: '2026-11-15' });
  const templates = [
    T('tp1', 'Proposta comercial', 'E-mail', 'Proposta {{orcamento}} · {{empresa}}', 'Olá, {{comprador}}.\n\nSegue a proposta {{orcamento}} no valor de {{total}}, válida por {{validade}}.\nVocê pode aprovar pelo portal: {{link}}\n\n{{vendedor}} · {{empresa}}'),
    T('tp2', 'Confirmação de pedido', 'E-mail', 'Pedido {{pedido}} confirmado', 'Olá, {{comprador}}.\n\nRecebemos o pedido {{pedido}} ({{total}}). Prazo de entrega: {{prazo}}.\nAcompanhe em {{link}}\n\n{{empresa}}'),
    T('tp3', 'Follow-up de proposta', 'WhatsApp', '', 'Oi, {{comprador}}! Passando para saber se ficou alguma dúvida na proposta {{orcamento}} ({{total}}). Posso ajustar prazo ou itens. {{vendedor}}'),
    T('tp4', 'NF e boleto', 'E-mail', 'NF-e {{nota}} e boleto · pedido {{pedido}}', 'Olá, {{comprador}}.\n\nSeguem a NF-e {{nota}} (PDF e XML) e o boleto com vencimento em {{vencimento}}.\n\n{{empresa}}'),
    T('tp5', 'Rastreio do envio', 'WhatsApp', '', '{{comprador}}, seu pedido {{pedido}} saiu para entrega. Código: {{rastreio}}\n{{link}}'),
    T('tp6', 'Lembrete de vencimento', 'E-mail', 'Seu boleto vence em {{vencimento}}', 'Olá, {{comprador}}.\n\nLembrete: o título “{{titulo}}” de {{total}} vence em {{vencimento}}.\nBoleto e Pix: {{link}}'),
    T('tp7', 'Cobrança de título vencido', 'WhatsApp', '', 'Oi, {{comprador}}. Consta em aberto o título “{{titulo}}” ({{total}}), vencido em {{vencimento}}. Se já pagou, me envie o comprovante. Se preferir, gero uma 2ª via.'),
    T('tp8', 'Compra atrasada (interno)', 'Notificação', 'Compra atrasada no pedido {{pedido}}', 'Item previsto para {{vencimento}} ainda não chegou. Pedido {{pedido}} · {{cliente}}.'),
    T('tp9', 'PDF de orçamento', 'Documento', 'Orçamento {{orcamento}}', 'Cabeçalho com logo e cor do tenant · dados do cliente · itens · condições · observação para o cliente.'),
    T('tp10', 'PDF de pedido', 'Documento', 'Pedido {{pedido}}', 'Cabeçalho com logo e cor do tenant · dados fiscais · endereço · itens · pagamento e frete.'),
    T('tp11', 'Apresentação de prospecção', 'E-mail', '{{empresa}}: compras de tecnologia em um só lugar', 'Olá, {{comprador}}. Somos a {{empresa}}. Envio nossa apresentação e o catálogo. Quando tiver uma lista para cotar, é só responder este e-mail.'),
  ];

  const q = (id, tipo, prio, titulo, motivo, ref, valor, acao, extra = {}) => ({ id, tipo, prio, titulo, motivo, ref, valor, acao, status: 'pendente', criado: '2026-11-27 07:30', ...extra });
  const fila = [
    q('q1', 'dados', 'alta', 'Falta o endereço para faturar o pedido 17150', 'Todos os itens chegaram, mas o cliente está sem CEP e endereço. A NF-e não pode ser montada.', ['pedido', 'd17150'], 11165, 'Completar dados', { regra: 'r5', fatos: ['35 de 35 itens marcados como Chegou', 'Campos vazios: CEP, endereço, número, bairro'], premissas: ['Entrega no mesmo endereço do cadastro'] }),
    q('q2', 'contra', 'alta', 'Contra proposta no orçamento 3651', 'Preço pedido pelo cliente fica abaixo da margem mínima. Só uma pessoa pode aceitar.', ['orc', 'o3651'], 8450, 'Aceitar valor', { fatos: ['Cliente pediu R$ 8.450,00', 'Margem mínima configurada: 20%'], premissas: ['Frete incluso custa cerca de R$ 120,00'] }),
    q('q3', 'cobranca', 'media', 'Cobrar Mercado Bom Preço', 'Título vencido há 9 dias e acima do limite de envio automático (R$ 1.000,00).', ['conta', 'cr7'], 1890, 'Enviar cobrança', { regra: 'r10', template: 'tp7', fatos: ['Venceu em 18/11/2026', 'Lembrete enviado em 15/11, sem resposta'], premissas: [] }),
    q('q4', 'oc', 'media', 'OC recebida por e-mail · Indústria Marfim', 'Rascunho montado a partir do anexo. Um item tem baixa confiança na leitura.', ['entrada', 'oc1'], 6038, 'Criar pedido', { regra: 'r11', fatos: ['Anexo OC-5521.pdf', 'CNPJ confere com o cadastro'], premissas: ['“Switch 16p” corresponde ao produto de 16 portas PoE'] }),
    q('q5', 'followup', 'baixa', 'Follow-up da proposta 3649', 'Enviada há 3 dias, sem resposta.', ['orc', 'o3649'], 5236, 'Enviar mensagem', { regra: 'r3', template: 'tp3', fatos: ['Enviada em 24/11/2026', 'Validade termina em 01/12'], premissas: [] }),
    q('q6', 'followup', 'baixa', 'Follow-up da proposta 3648', 'Enviada há 4 dias, sem resposta.', ['orc', 'o3648'], 2985, 'Enviar mensagem', { regra: 'r3', template: 'tp3', fatos: ['Enviada em 23/11/2026'], premissas: [] }),
    q('q7', 'compra', 'media', 'Compra atrasada no pedido 17120', 'Previsão era 16/11. Confirme a nova data com o fornecedor.', ['pedido', 'd17120'], 858, 'Atualizar previsão', { regra: 'r4', fatos: ['SSD NVMe 1TB comprado e não recebido', '11 dias de atraso'], premissas: [] }),
  ];
  const entradas = [
    { id: 'oc1', origem: 'E-mail · compras@marfim.exemplo', arquivo: 'OC-5521.pdf', recebido: '2026-11-27 07:12', cliente: 'c5', ocNum: 'OC-5521', status: 'pendente',
      itens: [{ lido: 'SWITCH GIGABIT 24P POE', produto: 'p7', qtd: 1, conf: 98 }, { lido: 'Switch 16p', produto: 'p8', qtd: 1, conf: 71 }, { lido: 'NOBREAK 1500VA BIV', produto: 'p12', qtd: 1, conf: 95 }] },
  ];

  const A = (em, regra, txt, ref, tipo = 'auto', por = 'Automação') => ({ id: 'x' + Math.random().toString(36).slice(2, 8), em, regra, txt, ref, tipo, por });
  const atividade = [
    A('2026-11-27 08:10', 'r6', 'NF 341 criada, aguardando envio à SEFAZ', ['nf', 'n341']),
    A('2026-11-27 07:30', 'r5', 'NF-e do pedido 17150 não montada: faltam dados do cliente', ['pedido', 'd17150'], 'humano'),
    A('2026-11-27 07:12', 'r11', 'OC-5521 lida e transformada em rascunho', ['entrada', 'oc1'], 'humano'),
    A('2026-11-27 07:00', 'r9', '4 lembretes de vencimento enviados', ['conta', 'cr6']),
    A('2026-11-26 17:48', 'r4', 'Logística avisada sobre atraso no pedido 17155', ['pedido', 'd17155']),
    A('2026-11-26 14:05', 'r2', 'Confirmação do pedido 17160 enviada ao cliente', ['pedido', 'd17160']),
    A('2026-11-26 14:05', 'r1', 'Pedido 17160 criado a partir do orçamento 3650', ['pedido', 'd17160']),
    A('2026-11-25 12:05', 'r8', 'Rastreio do pedido 17135 enviado por WhatsApp', ['pedido', 'd17135']),
    A('2026-11-25 11:42', 'r7', 'NF 340 e boleto enviados ao cliente', ['nf', 'n340']),
    A('2026-11-25 11:41', '', 'NF 340 aprovada e emitida', ['nf', 'n340'], 'pessoa', 'Helena Duarte'),
  ];

  const faturamentoMes = [ // 12 meses (previsto × real)
    ['Dez/25', 96000, 91200], ['Jan/26', 70000, 74800], ['Fev/26', 78000, 69900], ['Mar/26', 90000, 98300], ['Abr/26', 95000, 93100], ['Mai/26', 100000, 112400],
    ['Jun/26', 105000, 99800], ['Jul/26', 98000, 104500], ['Ago/26', 110000, 121300], ['Set/26', 115000, 108700], ['Out/26', 125000, 131900], ['Nov/26', 135000, 102600],
  ];

  const params = { diasParado: 3, margemMin: 20, validade: '7 dias', prazo: '7 dias úteis', vencimento: 28, proxVenc: 5, followup: 3, parcelamentos: ['À vista', '15 dias', '28 dias', '20/40 dias', '21/28/35 dias', '30/60/90 dias'], formas: ['Boleto', 'Depósito bancário', 'PIX', 'Sem pagamento'], horario: '08:00 – 19:00' };
  const integracoes = [
    { id: 'i1', nome: 'SEFAZ (NF-e)', desc: 'Emissão, consulta, cancelamento e carta de correção', ok: true, detalhe: 'Certificado A1 válido até 03/2027' },
    { id: 'i2', nome: 'Banco (boletos e Pix)', desc: 'Registro de boletos e baixa automática', ok: true, detalhe: 'Última baixa hoje, 07:00' },
    { id: 'i3', nome: 'E-mail', desc: 'Envio de templates e leitura de ordens de compra', ok: true, detalhe: 'Caixa compras@ monitorada' },
    { id: 'i4', nome: 'WhatsApp', desc: 'Rastreio, follow-up e cobrança', ok: true, detalhe: '98% entregues nos últimos 30 dias' },
    { id: 'i5', nome: 'CEP', desc: 'Preenche endereço a partir do CEP', ok: true, detalhe: 'Consulta pública' },
    { id: 'i6', nome: 'Portal legado (importação)', desc: 'Traz orçamentos, pedidos, notas e títulos do portal anterior', ok: false, detalhe: 'Necessário informar a chave de API' },
  ];

  return { tenants, vendedores, funcionarios, clientes, produtos, fornecedores, transportadoras, orcamentos, pedidos, notas, contas, bancos, chamados, notificacoes, regras, templates, fila, entradas, atividade, faturamentoMes, params, integracoes };
};
