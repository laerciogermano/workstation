/* Clozzy · protótipo v2 — dados de exemplo, fluxos, temas
   Pessoas e fotos ilustrativas (Pexels, uso interno — ver marca/fotos-criadoras/README.md). */
'use strict';

const IMG = (f) => `img/${f}.jpg`;

const CREATORS = {
  lara: { nome: 'Lara Mendes', nick: 'lara.mendes', foto: 'ringlight-sorriso', capa: 'ringlight-rosa', cat: 'Make', close: 3240, preco: 19.9, bio: 'make de 5 minutos, bastidor de gravação e o que não cabe no TikTok.', redes: '1,2 mi no TikTok', drops: 86, verif: true },
  duda: { nome: 'Duda Prado', nick: 'duda.prado', foto: 'neon-selfie', capa: 'ringlight-neon', cat: 'Lifestyle', close: 1870, preco: 14.9, bio: 'vlog sem corte, rotina de faculdade e look do dia.', redes: '640 mil no Instagram', drops: 54, verif: true },
  nina: { nome: 'Nina Sol', nick: 'ninasol', foto: 'selfie-sueter', capa: 'selfie-perto', cat: 'Humor', close: 1810, preco: 9.9, bio: 'os vídeos que eu não posto. sim, tem mais vergonha alheia.', redes: '410 mil no TikTok', drops: 120, verif: false },
  bia: { nome: 'Bia Rocha', nick: 'biarocha', foto: 'danca-janela', capa: 'danca-tripe', cat: 'Dança', close: 5120, preco: 24.9, bio: 'coreô antes de todo mundo e o passo a passo em câmera lenta.', redes: '2,3 mi no TikTok', drops: 140, verif: true },
  mel: { nome: 'Mel Costa', nick: 'melcosta', foto: 'make-paleta', capa: 'make-mesa', cat: 'Make', close: 960, preco: 12.9, bio: 'teste de produto barato vs caro, sem publi.', redes: '280 mil no Instagram', drops: 38, verif: false },
  ju: { nome: 'Ju Reis', nick: 'jureis', foto: 'espelho-ruiva', capa: 'espelho-casaco', cat: 'Moda', close: 2210, preco: 16.9, bio: 'provador, garimpo e o que eu devolvi.', redes: '520 mil no TikTok', drops: 71, verif: true },
  tati: { nome: 'Tati Lima', nick: 'tatilima', foto: 'selfie-chapeu', capa: 'amigas-cafe', cat: 'Viagem', close: 740, preco: 11.9, bio: 'roteiro barato e onde eu comi de verdade.', redes: '190 mil no Instagram', drops: 29, verif: false },
};
const CATS = ['Tudo', 'Make', 'Dança', 'Moda', 'Lifestyle', 'Humor', 'Viagem'];

/* ofertas da Lara (a vitrine principal) */
const OFFERS = [
  { id: 'close', tipo: 'assinatura', nome: 'Close da Lara', preco: 19.9, periodo: 'mês', inclui: ['todos os drops do mês', 'stories do close', 'bastidor das gravações'], ativa: true, vendas: 3240 },
  { id: 'pack-glow', tipo: 'pack', nome: 'Pack Glow de 5 minutos', preco: 29.9, inclui: ['12 vídeos', '8 fotos', 'lista de produtos'], itens: 20, ativa: true, vendas: 412, capa: 'make-ringlight' },
  { id: 'pack-bast', tipo: 'pack', nome: 'Bastidor do clipe', preco: 24.9, inclui: ['9 vídeos', 'erros de gravação'], itens: 9, ativa: true, vendas: 233, capa: 'vlog-tripe' },
  { id: 'item-tut', tipo: 'item', nome: 'Tutorial delineado gatinho', preco: 9.9, inclui: ['1 vídeo · 6 min'], itens: 1, ativa: true, vendas: 908, capa: 'make-sorriso' },
  { id: 'item-ro', tipo: 'item', nome: 'Rotina da noite', preco: 7.9, inclui: ['1 vídeo · 4 min'], itens: 1, ativa: false, vendas: 0, capa: 'selfie-perto' },
];
const offerOf = (id) => OFFERS.find((o) => o.id === id) || OFFERS[0];

/* mídia do perfil (prévia permitida × trancado) */
const MEDIA = [
  { f: 'make-ringlight', v: true, dur: '0:42', free: true },
  { f: 'ringlight-rosa', v: false, free: false },
  { f: 'make-sorriso', v: true, dur: '1:15', free: false },
  { f: 'selfie-perto', v: false, free: true },
  { f: 'vlog-tripe', v: true, dur: '3:08', free: false },
  { f: 'tela-celular', v: false, free: false },
  { f: 'tripe-arara', v: true, dur: '0:58', free: false },
  { f: 'compras-selfie', v: false, free: false },
  { f: 'amigas-video', v: true, dur: '2:20', free: false },
];

/* biblioteca do fã */
const LIB0 = [
  { tipo: 'assinatura', who: 'lara', nome: 'Close da Lara', st: 'ativa', info: 'renova 12 dez · R$ 19,90' },
  { tipo: 'assinatura', who: 'bia', nome: 'Close da Bia', st: 'ativa', info: 'renova 3 dez · R$ 24,90' },
  { tipo: 'assinatura', who: 'nina', nome: 'Close da Nina', st: 'expirada', info: 'acabou 2 nov' },
  { tipo: 'pack', who: 'lara', nome: 'Pack Glow de 5 minutos', st: 'ativa', info: '20 itens · comprado 4 nov', capa: 'make-ringlight' },
  { tipo: 'pack', who: 'ju', nome: 'Provador de inverno', st: 'ativa', info: '14 itens · comprado 28 out', capa: 'espelho-casaco' },
  { tipo: 'item', who: 'mel', nome: 'Barato × caro: base', st: 'ativa', info: '1 vídeo · comprado 21 out', capa: 'make-mesa' },
  { tipo: 'item', who: 'duda', nome: 'Rotina de prova', st: 'cancelada', info: 'estornado 30 set', capa: 'tela-celular' },
];

const NOTIFS = [
  { who: 'lara', t: 'postou no close', d: 'bastidor de hoje · 12 fotos', q: 'agora', unread: true, go: 'C-25' },
  { who: 'bia', t: 'drop hoje às 20h', d: 'quem tá no close vê primeiro', q: '18 min', unread: true, go: 'C-20' },
  { sys: true, t: 'Pix confirmado', d: 'Pack Glow de 5 minutos · R$ 29,90', q: 'ontem', go: 'C-30' },
  { who: 'ju', t: 'abriu um pack novo', d: 'Provador de inverno', q: 'ontem', go: 'C-21' },
  { sys: true, t: 'Seu close da Nina acabou', d: 'renove para continuar vendo', q: '2 nov', go: 'C-31' },
];

const CHATS = [
  { who: 'lara', last: 'amei que você curtiu o glow 💗', q: '9:12', unread: 2 },
  { who: 'bia', last: 'a coreô sai sexta!', q: 'ontem', unread: 0 },
  { who: 'ju', last: 'você: qual era a loja do casaco?', q: 'seg', unread: 0 },
];

/* painel da criadora */
const SALES = [
  { n: 'Rafa C.', o: 'Close da Lara', v: 19.9, q: '9:41' },
  { n: 'Gabi M.', o: 'Pack Glow de 5 minutos', v: 29.9, q: '9:02' },
  { n: 'Léo P.', o: 'Tutorial delineado gatinho', v: 9.9, q: '8:47' },
  { n: 'Bruna S.', o: 'Close da Lara', v: 19.9, q: 'ontem' },
  { n: 'Caio R.', o: 'Bastidor do clipe', v: 24.9, q: 'ontem' },
];
const WEEK = [1840, 2210, 1960, 2630, 3120, 2880, 3460];
const PAYOUTS = [
  { v: 4200, q: '10 nov', st: 'pago' },
  { v: 3850, q: '3 nov', st: 'pago' },
  { v: 1200, q: 'hoje', st: 'processando' },
];
const FANS = [
  { n: 'Rafa C.', desde: 'mar 2026', gasto: 238.6, tipo: 'close + 3 packs', f: 'selfie-perto' },
  { n: 'Gabi M.', desde: 'jun 2026', gasto: 129.4, tipo: 'close + 1 pack', f: 'amigas-selfie' },
  { n: 'Léo P.', desde: 'set 2026', gasto: 59.7, tipo: 'close', f: 'compras-selfie' },
  { n: 'Bruna S.', desde: 'out 2026', gasto: 39.8, tipo: 'close', f: 'amigas-cafe' },
  { n: 'Caio R.', desde: 'nov 2026', gasto: 24.9, tipo: '1 pack', f: 'tripe-arara' },
];
const CONTENT = [
  { f: 'make-ringlight', t: 'Glow 01 · preparação', tipo: 'vídeo', vis: 'pago', of: 'Pack Glow', q: 'hoje' },
  { f: 'ringlight-rosa', t: 'Bastidor de hoje', tipo: 'fotos · 12', vis: 'close', of: 'Close', q: 'hoje' },
  { f: 'make-sorriso', t: 'Delineado gatinho', tipo: 'vídeo', vis: 'pago', of: 'Item avulso', q: '12 nov' },
  { f: 'selfie-perto', t: 'Oi, close', tipo: 'foto', vis: 'prévia', of: 'Perfil', q: '10 nov' },
  { f: 'vlog-tripe', t: 'Clipe · take 14', tipo: 'vídeo', vis: 'pago', of: 'Bastidor do clipe', q: '8 nov' },
  { f: 'tela-celular', t: 'Rotina da noite', tipo: 'vídeo', vis: 'rascunho', of: '—', q: '6 nov' },
];

/* ---------- fluxos e telas ---------- */
const FLOWS = [
  { n: '01', title: 'Chegada e conta', desc: 'Landing, 18+, cadastro com uma conta só para fã e criadora, login, recuperação e código de e-mail.', steps: ['C-01', 'C-02', 'C-03', 'C-04', 'C-05', 'C-06', 'C-07'] },
  { n: '02', title: 'Descobrir', desc: 'Início com stories do close, explorar por categoria e busca por nome ou @. Sem ranking social.', steps: ['C-10', 'C-11', 'C-12', 'C-13'] },
  { n: '03', title: 'Vitrine e compra', desc: 'O fluxo canônico: perfil → oferta → Pix → liberado → conteúdo. Pix com contador, expirado e sem compra duplicada.', steps: ['C-20', 'C-21', 'C-22', 'C-23', 'C-24', 'C-25', 'C-26'] },
  { n: '04', title: 'Área do fã', desc: 'Biblioteca por tipo e status, passe da assinatura, avisos, conversas (pós-v1), conta, ajuda e denúncia.', steps: ['C-30', 'C-31', 'C-32', 'C-33', 'C-34', 'C-35', 'C-36', 'C-37'] },
  { n: '05', title: 'Virar criadora', desc: '“Quero vender” a partir da conta de fã: dados, selfie com documento, chave Pix e termos, análise.', steps: ['C-40', 'C-41', 'C-42', 'C-43', 'C-44'] },
  { n: '06', title: 'Clozzy Studio', desc: 'Lado da criadora em roxo: resumo, perfil, ofertas, conteúdos, publicar, fãs, financeiro e saque.', steps: ['C-50', 'C-51', 'C-52', 'C-53', 'C-54', 'C-55', 'C-56', 'C-57', 'C-58'] },
];

/* metadados de cada tela: nome, páginas cobertas (functionalities.md), notas. render() fica em screens.js */
const META = {
  'C-01': { name: 'Landing', p: ['P01', 'P14'], notes: 'Primeira impressão no navegador do celular. Foto cheia de criadora, frase curta e dois caminhos: ver criadoras ou vender. “Como funciona” em três passos e Pix como detalhe, não como novidade.' },
  'C-02': { name: '18+', p: ['P01', 'P03', 'P14'], notes: 'Aviso de idade antes da superfície adulta. Uma pergunta, duas respostas; “não” leva para fora. A escolha vale para o aparelho.' },
  'C-03': { name: 'Criar conta', p: ['P08'], notes: 'E-mail, senha e data de nascimento na mesma tela. Aceite de Termos e Privacidade obrigatório. Uma conta serve para fã e criadora (criadora ativa depois, no fluxo 05).' },
  'C-04': { name: 'Entrar', p: ['P08'], notes: 'Login por e-mail e senha. Erro genérico (“e-mail ou senha não batem”), sem dizer qual. Quem chega aqui vindo do checkout volta para a compra depois.' },
  'C-05': { name: 'Recuperar senha', p: ['P08'], notes: 'A resposta é sempre a mesma, exista ou não o e-mail. Link vale 30 minutos.' },
  'C-06': { name: 'Código do e-mail', p: ['P08'], notes: 'Seis dígitos, colar preenche tudo, reenviar só depois de 60 s.' },
  'C-07': { name: 'Do que você curte', p: ['P02'], notes: 'Opcional, uma tela. Só ordena o Explorar; não vira feed algorítmico.' },
  'C-10': { name: 'Início', p: ['P02', 'pós-v1'], notes: 'Home do fã: stories de quem você tem close (anel verde = post novo no close), drops recentes de quem você assina e sugestões. Stories e feed estão marcados como pós-v1 em functionalities.md.' },
  'C-11': { name: 'Story do close', p: ['pós-v1', 'P03'], notes: 'Story aberto com barras de progresso. Toque nas laterais passa; segurar pausa. Quem não está no close vê a prévia borrada e o botão para entrar.' },
  'C-12': { name: 'Explorar', p: ['P02'], notes: 'Grade de perfis com foto, categoria e preço a partir de. Filtro por categoria. Sem “em alta” e sem ranking.' },
  'C-13': { name: 'Busca', p: ['P02'], notes: 'Busca por nome ou @, sem acento e sem diferença de maiúscula. Recentes ficam só no aparelho.' },
  'C-20': { name: 'Perfil da criadora', p: ['P03'], notes: 'A vitrine. Foto cheia, nome grande, bio curta, números reais. Ofertas na ordem assinatura → packs → avulsos, com o que inclui e o preço. Grade de mídia com prévias liberadas e o resto trancado (estrela do close). Sem chat, tip ou online na v1.' },
  'C-21': { name: 'Pack', p: ['P03', 'P11'], notes: 'Detalhe de um pack: capa, prévia permitida, lista do que vem e preço. Se já comprou, o botão vira “Abrir na biblioteca”.' },
  'C-22': { name: 'Resumo da compra', p: ['P04'], notes: 'Folha por cima do perfil: o que é, de quem, quanto e como renova. Sem conta → vai para Entrar e volta aqui. Se já existe compra ativa da mesma oferta, avisa e não cobra de novo.' },
  'C-23': { name: 'Pix', p: ['P04'], notes: 'QR e copia e cola, contador de 15 min, status ao vivo (aguardando → confirmado). “Já paguei” só verifica, não confirma por conta própria. Cenário “Pix expira” mostra C-26.' },
  'C-24': { name: 'Liberado', p: ['P04', 'P05'], notes: 'Momento de cor: a única tela de compra com o fundo da marca. Diz o que foi liberado e onde fica (biblioteca). E-mail de confirmação sai junto.' },
  'C-25': { name: 'Conteúdo', p: ['P05'], notes: 'Viewer em tela cheia: só streaming, marca d’água com @ do fã, sem download. Lista dos itens do pack embaixo.' },
  'C-26': { name: 'Pix expirou', p: ['P04'], notes: 'Expirado ou recusado: nada foi cobrado, gerar outro código em um toque. Mesma oferta, sem duplicar.' },
  'C-30': { name: 'Biblioteca', p: ['P06'], notes: 'Tudo o que o fã tem: Assinaturas · Packs · Itens, com status ativa / expirada / cancelada. Abrir volta ao conteúdo; expirada mostra renovar.' },
  'C-31': { name: 'Passe do close', p: ['P06', 'P04'], notes: 'A assinatura como passe de carteira: desde quando, próxima cobrança, renovar ou cancelar. Cancelar mantém o acesso até o fim do período.' },
  'C-32': { name: 'Avisos', p: ['P06', 'P07'], notes: 'Novidades de quem você assina e confirmações de pagamento. Ponto rosa = não lida.' },
  'C-33': { name: 'Conversas', p: ['pós-v1'], notes: 'Pós-v1 (functionalities.md: “sem chat na v1”). Só com criadoras de quem você tem close.' },
  'C-34': { name: 'Conversa', p: ['pós-v1'], notes: 'Pós-v1. Mensagens simples, sem mensagem paga nesta versão do protótipo.' },
  'C-35': { name: 'Conta', p: ['P07', 'P15'], notes: 'Nome, e-mail, foto, senha, avisos por e-mail, pagamentos, ajuda e sair. “Quero vender no Clozzy” abre o fluxo 05; se já é criadora, troca para o Studio.' },
  'C-36': { name: 'Ajuda e regras', p: ['P14'], notes: 'FAQ curto, Termos, Privacidade, aviso 18+, contato e direitos autorais (DMCA).' },
  'C-37': { name: 'Denunciar', p: ['P14'], notes: 'Denúncia de perfil ou conteúdo em três toques: motivo, detalhe opcional, enviar. Protocolo na resposta.' },
  'C-40': { name: 'Quero vender', p: ['P15'], notes: 'Entrada do lado da criadora, já em roxo. O que ela ganha, quanto fica com ela e o que vai pedir. Começa de dentro da conta de fã.' },
  'C-41': { name: 'Seus dados', p: ['P15'], notes: 'Nome completo, CPF, data de nascimento e país. Só o necessário para pagar e verificar idade.' },
  'C-42': { name: 'Verificação', p: ['P15'], notes: 'Selfie segurando o documento, com guia na câmera. Nível de verificação definido na implementação.' },
  'C-43': { name: 'Recebimento', p: ['P15', 'P13'], notes: 'Chave Pix para saque e aceite dos termos de criadora e repasse (taxa da plataforma visível).' },
  'C-44': { name: 'Em análise', p: ['P15', 'P09'], notes: 'Status da conta: em análise → ativa. Enquanto analisa, dá para montar perfil e ofertas em rascunho.' },
  'C-50': { name: 'Studio · resumo', p: ['P09'], notes: 'Resumo da criadora: saldo, vendas da semana, assinantes ativos e últimas vendas. Atalhos para publicar, ofertas, fãs e saque.' },
  'C-51': { name: 'Editar perfil', p: ['P10'], notes: 'Foto, capa, nome, @, bio e links. “Ver como fã” abre a vitrine. Publicar / despublicar o perfil inteiro.' },
  'C-52': { name: 'Ofertas', p: ['P11'], notes: 'Assinatura, packs e avulsos com vendas e estado. Ativar ou pausar direto na lista.' },
  'C-53': { name: 'Editar oferta', p: ['P11', 'P12'], notes: 'Nome, preço, período (assinatura), o que inclui e os conteúdos ligados. Preço mínimo R$ 4,90.' },
  'C-54': { name: 'Conteúdos', p: ['P12'], notes: 'Tudo o que já subiu, com visibilidade (prévia · close · pago · rascunho) e oferta ligada. Arquivar ou remover.' },
  'C-55': { name: 'Publicar', p: ['P12'], notes: 'Subir mídia, título, quem vê (prévia grátis, close, pack ou avulso) e marca d’água ligada por padrão.' },
  'C-56': { name: 'Fãs', p: ['P09'], notes: 'Quem assina e quem comprou, desde quando e quanto gastou. Sem contato direto na v1.' },
  'C-57': { name: 'Financeiro', p: ['P13'], notes: 'Saldo disponível e a liberar (D+14), extrato de vendas, taxa e repasse, saques anteriores.' },
  'C-58': { name: 'Sacar', p: ['P13'], notes: 'Valor, chave Pix cadastrada e confirmação. Saque cai em até 1 dia útil; status em processando → pago.' },
};

/* telas do lado da criadora (recebem o acento roxo quando o tema permite) */
const STUDIO = ['C-40', 'C-41', 'C-42', 'C-43', 'C-44', 'C-50', 'C-51', 'C-52', 'C-53', 'C-54', 'C-55', 'C-56', 'C-57', 'C-58'];

/* ---------- temas (paleta fechada da marca) ---------- */
const THEMES = [
  { id: 'noite', nome: 'Noite', tag: 'padrão', sw: ['#000', '#fff', '#E0005A', '#69C353'], desc: 'Preto #000 com o botão branco. O rosa entra só em detalhe: o arco da marca, o ponto de não lida, o progresso do story. Studio com o arco roxo.' },
  { id: 'dia', nome: 'Dia', sw: ['#fff', '#000', '#E0005A', '#69C353'], desc: 'Branco com texto preto e o Pink Deep no botão de compra. Studio troca o rosa pelo roxo. O mais próximo de uma loja.' },
  { id: 'neblina', nome: 'Neblina', sw: ['#F2F2F2', '#fff', '#000', '#E0005A'], desc: 'Cinza neutro com cartões brancos e botão preto. Editorial e calmo; o rosa fica no arco e nos pontos.' },
  { id: 'meia', nome: 'Meia-noite', sw: ['#000', '#fff', '#7C48C4', '#69C353'], desc: 'O preto da Noite com o arco roxo em tudo: a marca do lado da criadora levada para o app inteiro. Roxo só em forma, nunca em texto.' },
  { id: 'pink', nome: 'Pink', sw: ['#E0005A', '#fff'], desc: 'Pink Deep em tudo e tudo branco em cima: nada preto, nada verde no rosa (o selo do close vira branco). Sem roxo, nem no Studio.' },
  { id: 'roxo', nome: 'Roxo', sw: ['#7C48C4', '#fff'], desc: 'Roxo inteiro, tudo branco em cima, sem rosa e sem verde. Pensado para o Clozzy Studio, mas vale para o app todo.' },
];
const TSCREEN = ['C-20', 'C-23', 'C-50'];
