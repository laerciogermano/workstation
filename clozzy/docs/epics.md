# Clozzy — Épicos

**Por quê:** dividir a visão em blocos de entrega antes de escrever histórias.
**Importante:** onde as fontes divergem, vale o [documento de visão](../README.md). A divisão em releases é proposta e depende das [decisões a confirmar](#decisões-a-confirmar).
**No fluxo:** [visão](../README.md) → [funcionalidades](functionalities.md) → **épicos** → histórias → BDD → telas.

23 épicos · R1: 19 · R2: 3 (mais itens marcados nos épicos da R1) · R3: 1

## Fontes

| Sigla | Fonte |
|---|---|
| V | [Visão](../README.md) |
| F | [Funcionalidades](functionalities.md), P01–P15 |
| T | [Protótipo v2](prototipo-v2/README.md), telas C-01 a C-58 |
| M | [Identidade final](../marca/identidade-final/BRAND.md), aguardando aprovação |
| B | [Benchmarking](../marca/benchmarking-concorrentes/README.md): Privacy, Fansly, CloseFans, FatalFans |
| L | [Código do Clozzy anterior](../marca/benchmarking-concorrentes/clozzy/README.md) |
| D | [Drive](../drive/) de 2022–2024: roadmap, histórias de usuário, RF01–RF08, onboarding |
| E | [Lei 15.211/2025, ECA Digital](https://teletime.com.br/26/02/2026/lei-que-torna-anpd-agencia-e-fixa-vigencia-do-eca-digital-e-sancionada/), lida por fontes secundárias |

## Releases

| Release | Meta | Critério de saída |
|---|---|---|
| **R1 · Se cruzar e liberar** | Conhecer um desconhecido, conversar, entrar no close, pagar no Pix e abrir | Todos os critérios de sucesso da visão passam em produção |
| **R2 · Aproximar mais** | Publicações e stories, flerte, videochamada, cartão | Os três apps são reconhecíveis na mesma conta |
| **R3 · Crescer** | Indicação, assessoria, nível do criador | Aquisição sem depender de ação manual |

## Mapa

| ID | Épico | App | Release | Depende de |
|---|---|---|---|---|
| [EP01](#ep01--fundação-da-plataforma) | Fundação da plataforma | Base | R1 | — |
| [EP02](#ep02--conta-e-acesso) | Conta e acesso | Base | R1 | EP01 |
| [EP03](#ep03--idade-e-identidade) | Idade e identidade | Base | R1 | EP02 |
| [EP04](#ep04--confiança-segurança-e-moderação) | Confiança, segurança e moderação | Base | R1 | EP02 |
| [EP05](#ep05--legal-privacidade-e-ajuda) | Legal, privacidade e ajuda | Base | R1 | EP02 |
| [EP06](#ep06--notificações) | Notificações | Base | R1 | EP02 |
| [EP07](#ep07--perfil-e-presença) | Perfil e presença | Rede social | R1 | EP02, EP03 |
| [EP08](#ep08--descoberta-de-desconhecidos) | Descoberta de desconhecidos | Rede social | R1 | EP07 |
| [EP09](#ep09--publicações-stories-e-interações) | Publicações, stories e interações | Rede social | R2 | EP07, EP14 |
| [EP10](#ep10--conversas-privadas) | Conversas privadas | Relacionamento | R1 | EP04, EP07 |
| [EP11](#ep11--flerte-e-aproximação) | Flerte e aproximação | Relacionamento | R2 | EP08, EP10 |
| [EP12](#ep12--videochamada) | Videochamada | Relacionamento | R2 | EP10, EP16 |
| [EP13](#ep13--ativação-do-criador) | Ativação do criador | Close | R1 | EP03 |
| [EP14](#ep14--conteúdo-exclusivo) | Conteúdo exclusivo | Close | R1 | EP01, EP13 |
| [EP15](#ep15--close-e-ofertas) | Close e ofertas | Close | R1 | EP13, EP14 |
| [EP16](#ep16--pagamentos) | Pagamentos | Close | R1 | EP15, gateway |
| [EP17](#ep17--acesso-e-biblioteca) | Acesso e biblioteca | Close | R1 | EP14, EP16 |
| [EP18](#ep18--venda-no-privado) | Venda no privado | Close | R1 | EP10, EP15, EP16, EP17 |
| [EP19](#ep19--carteira-e-repasse) | Carteira e repasse | Close | R1 | EP13, EP16 |
| [EP20](#ep20--studio-do-criador) | Studio do criador | Close | R1 | EP15, EP19 |
| [EP21](#ep21--backoffice) | Backoffice | Operação | R1 | EP03, EP04, EP16 |
| [EP22](#ep22--lançamento-e-aquisição) | Lançamento e aquisição | Operação | R1 | EP02, EP07 |
| [EP23](#ep23--indicação-assessoria-e-nível-do-criador) | Indicação, assessoria e nível do criador | Operação | R3 | EP19, EP22 |

## Regras que valem em todos

| Regra | Origem |
|---|---|
| Capa, descoberta e feed sem preço, Pix, pack ou chamada de close | V, M |
| Perfil público mostra “Entrar no close”; o preço aparece um toque depois | M |
| Preço e Pix só no chat, na folha do close e na área do criador | M |
| Conteúdo pago nunca chega ao aparelho de quem não tem direito, nem como imagem borrada por CSS | V |
| Uma conta serve para conhecer, comprar e vender | V |
| Somente maiores de 18 anos | M, T, E |
| Web responsivo; sem app nativo | V, F |

---

## Base

### EP01 · Fundação da plataforma

**Objetivo:** ter onde construir, publicar e medir.

- Arquitetura, repositórios e ambientes de desenvolvimento, homologação e produção
- Armazenamento privado de mídia, processamento de foto e vídeo, entrega por link assinado
- Componentes e tokens da identidade final
- Publicação automatizada, backup, monitoramento, logs e indicadores de venda
- Testes automatizados do fluxo de compra
- Decidir o que se aproveita do código anterior (API NestJS, apps Ionic/Angular, MongoDB)

**Pronto quando:** uma alteração vai de commit a produção com teste, monitoramento e caminho de volta.
**Origem:** L, D (sustentação, fluxo de desenvolvimento).

### EP02 · Conta e acesso

**Objetivo:** cada pessoa entra com uma conta própria.

- Cadastro com e-mail, senha e data de nascimento; @ único; aceite de termos
- Código por e-mail, login, recuperação de senha sem revelar se o e-mail existe
- Retorno ao ponto de origem depois de entrar (ex.: compra)
- Configurações: nome, e-mail, foto, senha, preferências, sair
- Desativar e excluir conta
- R2: encerrar sessões em todos os aparelhos, segundo fator, login social

**Pronto quando:** criador e pessoa comum criam conta, entram e recuperam o acesso sem suporte.
**Origem:** V, F (P07, P08), T (C-03–C-06, C-35), D.

### EP03 · Idade e identidade

**Objetivo:** só adultos entram, e quem vende é quem diz ser.

- Aferição de idade de todos por mecanismo confiável; autodeclaração não basta
- Conferência de CPF de quem vende e de quem compra
- Documento e selfie do criador, com fila de análise e reenvio
- Consentimento e documento de quem aparece no conteúdo junto com o criador
- Remoção de conta de menor e registro das verificações
- Anonimato no público com identidade guardada por dentro

**Pronto quando:** nenhuma conta acessa conteúdo restrito ou vende sem passar pela verificação exigida.
**Origem:** E, F (P15), T (C-02, C-41, C-42), B (FatalFans), L (documentos).

### EP04 · Confiança, segurança e moderação

**Objetivo:** falar com desconhecidos sem ficar exposto.

- Bloquear, restringir, silenciar e remover fã
- Denúncia de perfil, conteúdo e mensagem, com protocolo
- Fila de moderação, remoção, suspensão e recurso
- Tolerância zero a menor; canal para imagem íntima sem consentimento e deepfake
- Regra para conteúdo e perfil feitos por IA
- Pedido de direitos autorais (DMCA)
- Limites contra spam, assédio e contas falsas

**Pronto quando:** toda denúncia vira um caso com responsável, prazo e resultado.
**Origem:** F (P14), T (C-37), B, D (remover e bloquear assinante).

### EP05 · Legal, privacidade e ajuda

**Objetivo:** regras claras para quem usa, compra e vende.

- Termos de uso, termos do criador, termos da assinatura e política de privacidade
- LGPD: consentimento, acesso, correção e exclusão de dados; cookies
- Aviso 18+, ajuda com perguntas frequentes e contato
- Aviso de privacidade específico para documento e biometria

**Pronto quando:** cada aceite fica registrado com versão e data.
**Origem:** F (P14), T (C-36), D.

### EP06 · Notificações

**Objetivo:** saber o que aconteceu sem expor ninguém.

- E-mail de conta, compra confirmada e acesso liberado
- Central no app com marca de não lida e aviso durante o uso
- Eventos: mensagem, pagamento, conteúdo novo no close, renovação, vencimento, saque
- Preferências por tipo
- Tela bloqueada sem preço e sem mídia
- R2: push web

**Pronto quando:** os eventos de compra e conversa chegam e podem ser desligados quando não forem obrigatórios.
**Origem:** F, T (C-32), M, D (RF07).

## Rede social

### EP07 · Perfil e presença

**Objetivo:** cada pessoa ser vista como pessoa, não como loja.

- Perfil com foto, capa, nome, @, bio, interesses e links
- Publicar, despublicar e ver como os outros veem
- Prévias públicas e itens trancados, com “Entrar no close” para quem tem close
- Opção de aparecer sem identidade civil
- Compartilhar o link do perfil
- Perfil não encontrado

**Pronto quando:** uma conta comum e uma de criador têm o mesmo tipo de perfil, e o público não vê preço.
**Origem:** V, F (P03, P10), T (C-20, C-51), M, D (CRF01).

### EP08 · Descoberta de desconhecidos

**Objetivo:** encontrar gente que ainda não se conhece.

- Explorar com perfis novos para quem vê
- Busca por nome e @, sem diferenciar acento ou maiúscula
- Interesses na entrada e filtros por categoria
- Seguir e deixar de seguir
- Ocultar o próprio perfil da descoberta
- Sem ranking de vendas e sem “preço a partir de” nos cartões
- R2: sugestões por afinidade

**Pronto quando:** uma conta nova encontra um desconhecido e abre o perfil dele sem ter ninguém na lista.
**Origem:** V, F (P02), T (C-07, C-10, C-12, C-13), B.

### EP09 · Publicações, stories e interações

**Objetivo:** dar motivo para voltar, sem virar feed de massa.

- Foto e vídeo com corte, capa, legenda e marcadores
- Stories com prazo, destaques e visualizações
- Início com novidades de quem se segue e de desconhecidos
- Curtir, comentar (com opção de desligar), reagir a story, salvar
- Legendas automáticas em vídeo

**Pronto quando:** uma publicação aparece para um desconhecido, recebe reação e leva ao perfil.
**Origem:** V, T (C-10, C-11), L (stories, destaques, curtidas), D (RF06, roadmap).

## Relacionamento

### EP10 · Conversas privadas

**Objetivo:** aproximar duas pessoas no mesmo lugar onde a venda pode acontecer.

- Conversa um a um com texto e foto
- Pedido de mensagem para quem ainda não é conhecido, com aceitar ou recusar
- Lista de conversas, não lidas e status de envio
- Bloquear e denunciar de dentro da conversa
- Regra do criador: quem pode escrever
- R2: áudio e vídeo

**Pronto quando:** dois desconhecidos conversam depois de um aceite, e qualquer um pode encerrar.
**Origem:** V, T (C-33, C-34), B, D (roadmap).

### EP11 · Flerte e aproximação

**Objetivo:** deixar claro quem quer flertar.

- Ativar o modo de relacionamento (desligado por padrão)
- Preferências de quem quer ver e ser visto
- Curtir, e interesse mútuo abre a conversa
- Sair do modo sem perder a conta

**Pronto quando:** só quem ativou aparece, e o interesse mútuo vira conversa.
**Origem:** V (persona Flertador), M (“Vocês se curtiram”).

### EP12 · Videochamada

**Objetivo:** passar da mensagem para a chamada.

- Chamada um a um com consentimento dos dois lados
- Convite, agendamento, duração e encerramento
- Chamada paga no close, com preço e reembolso por falha
- Denúncia e proteção contra gravação, no limite do que a web permite

**Pronto quando:** uma chamada marcada acontece no Clozzy, sem link externo.
**Origem:** V, B (CloseFans, FatalFans, Privacy), D.

## Close

### EP13 · Ativação do criador

**Objetivo:** transformar uma conta em vendedora.

- “Quero vender” a partir da conta, com taxa visível antes de começar
- Dados pessoais, endereço, chave Pix e aceite dos termos
- Verificação pelo EP03; estados rascunho, em análise, ativa, recusada e bloqueada
- Montar perfil e ofertas enquanto a análise corre
- Abrir o close

**Pronto quando:** um criador aprovado publica a primeira oferta sem ajuda manual.
**Origem:** F (P15), T (C-40–C-44), D (RF08, onboarding), L.

### EP14 · Conteúdo exclusivo

**Objetivo:** publicar e trancar.

- Envio de foto e vídeo com compressão, progresso e retomada
- Visibilidade: prévia, close, pack, avulso ou rascunho
- Prévia gerada no servidor
- Visualização sem download, com marca d’água de quem está vendo
- Ordenar, agendar, arquivar e remover (drop = conteúdo novo)
- Declaração de autoria e consentimento no envio

**Pronto quando:** o conteúdo trancado só abre para quem tem direito, inclusive por link direto.
**Origem:** V, F (P05, P12), T (C-25, C-54, C-55), L, D.

### EP15 · Close e ofertas

**Objetivo:** definir o que se vende, por quanto e por quanto tempo.

- Close como assinatura, com períodos e o que libera
- Pack e item avulso
- Preço mínimo, ativar e pausar, vincular conteúdo
- O que acontece com quem já comprou quando a oferta muda ou sai
- R2: desconto por período, cupom, promoção, teste grátis

**Pronto quando:** cada oferta diz preço, conteúdo e prazo de acesso antes da compra.
**Origem:** V, F (P11), T (C-21, C-52, C-53), L (planos), D.

### EP16 · Pagamentos

**Objetivo:** cobrar e confirmar sem erro.

- Contratar o gateway: Pix, repasse dividido e aceite do tipo de conteúdo
- Resumo, QR e copia e cola, contador, confirmado, expirado e falhou
- Confirmação automática por webhook autenticado, sem cobrança duplicada
- Estorno, arrependimento, contestação e conciliação
- Nome discreto na fatura e no extrato
- R2: cartão com recorrência, nova tentativa e compra em um toque

**Pronto quando:** um Pix real libera o acesso sozinho e um webhook repetido não duplica nada.
**Origem:** V, F (P04), T (C-22–C-24, C-26), L (Pagar.me, Wirecard, Asaas), D (RF03–RF05).

### EP17 · Acesso e biblioteca

**Objetivo:** a pessoa saber o que pode ver e até quando.

- Direito de acesso por compra ou close ativo
- Biblioteca: close, packs e itens; ativo, vencido e cancelado
- Passe do close: desde quando, próxima cobrança, renovar e cancelar
- Cancelar mantém o acesso até o fim do período
- Aviso de vencimento e renovação por Pix
- Liberação manual pelo suporte, com registro

**Pronto quando:** o status na biblioteca bate com o pagamento em todos os casos.
**Origem:** V, F (P05, P06), T (C-30, C-31), L (assinaturas, lista de liberação), D.

### EP18 · Venda no privado

**Objetivo:** levar do interesse à liberação sem sair da conversa.

- Criador envia close, pack ou item dentro da conversa
- Conteúdo trancado na conversa
- Pagamento e liberação no mesmo fio, com status
- Cancelar oferta não paga
- R2: oferta com preço sob medida

**Pronto quando:** a venda do exemplo “Marina” acontece inteira dentro da conversa.
**Origem:** V (venda discreta no privado), M, B.

### EP19 · Carteira e repasse

**Objetivo:** o criador receber e entender o que recebeu.

- Saldo disponível e a liberar, com a data de liberação
- Extrato com valor pago, taxa e líquido
- Saque para chave Pix do mesmo titular; processando, pago e recusado
- Retenção por contestação ou fraude, com motivo visível
- Troca de chave com nova verificação

**Pronto quando:** o saque é pedido e concluído sem o suporte transferir à mão.
**Origem:** F (P13), T (C-43, C-57, C-58), L, D (RF01, RF02).

### EP20 · Studio do criador

**Objetivo:** cuidar do close em um lugar.

- Resumo: saldo, vendas, membros ativos e atalhos
- Membros e compradores: desde quando, quanto gastou, remover ou bloquear
- Abrir conversa com um membro
- Entradas para perfil, ofertas, conteúdo e financeiro
- R2: relatórios por período e por oferta

**Pronto quando:** o criador responde quanto vendeu, para quem e quanto pode sacar.
**Origem:** V, F (P09), T (C-50, C-56), L, D.

## Operação

### EP21 · Backoffice

**Objetivo:** operar sem mexer no banco de dados.

- Contas: buscar, suspender e reativar
- Filas de verificação, moderação, estorno e saque
- Pagamentos, conciliação e liberação manual
- Perfis de acesso da equipe e trilha de auditoria
- Atendimento ao usuário e ao criador

**Pronto quando:** toda ação manual tem autor, data e motivo registrados.
**Origem:** L (administração, lista de liberação), D (suporte).

### EP22 · Lançamento e aquisição

**Objetivo:** trazer as primeiras pessoas e criadores.

- Landing com a frase de capa, sem preço, e caminhos para entrar e vender
- Página “chega em breve” e lista de espera
- Convite de criadores e acompanhamento da entrada
- Reativação da base anterior, somente com base legal
- Medição de origem, cadastro, ativação e primeira venda
- Fotos próprias com autorização de imagem
- R2: anúncios, pixel e campanhas

**Pronto quando:** dá para ver de onde veio cada cadastro e onde ele parou.
**Origem:** F (P01), T (C-01), M, D (leads, growth, onboarding).

### EP23 · Indicação, assessoria e nível do criador

**Objetivo:** crescer com quem já vende.

- Link de indicação e comissão
- Planos de assessoria
- Nível do criador por vendas, com benefícios
- Parceria de divulgação entre criadores

**Pronto quando:** uma indicação é rastreada até a venda e paga na carteira.
**Origem:** B (CloseFans, Privacy), D (roadmap, programa de assessoria).

---

## Ordem de construção da R1

| Onda | Épicos | Entrega verificável |
|---|---|---|
| 1 | EP01, EP02, EP03, EP05 | Conta verificada em produção |
| 2 | EP07, EP08, EP04 | Encontrar um desconhecido, bloquear e denunciar |
| 3 | EP13, EP14, EP15 | Criador publica conteúdo trancado e oferta |
| 4 | EP16, EP17, EP19 | Pix libera o acesso e o criador saca |
| 5 | EP10, EP18, EP06 | Venda inteira dentro da conversa |
| 6 | EP20, EP21, EP22 | Operar e abrir ao público |

EP04, EP06 e EP21 crescem junto com cada onda. A contratação do gateway (EP16) começa na onda 1.

## Fora dos épicos

| Item | Motivo |
|---|---|
| Live | V: não é núcleo |
| App nativo | V: v1 é site |
| Feed infinito como produto principal | V |
| Chat em grupo e lista de transmissão aberta | D; foge da proximidade um a um |
| Mimo avulso | F: fora da v1; comum nos concorrentes |
| Integração e bot de Telegram | B, D |
| Ferramentas de IA para o criador | B |
| Importar stories do Instagram | L |
| Produto físico | V |

## Cobertura

| Capacidade v1 da visão | Épicos |
|---|---|
| Conta | EP02, EP03 |
| Rede social | EP07, EP09 |
| Conhecer desconhecidos | EP08, EP10 |
| Perfis | EP07 |
| Close | EP15, EP17 |
| Conteúdo bloqueado | EP14 |
| Ofertas | EP15 |
| Venda discreta no privado | EP18 |
| Compra | EP16 |
| Acesso | EP17 |
| Biblioteca | EP17 |
| Gestão do criador | EP13, EP14, EP15, EP19, EP20 |

| Página | Épicos | Página | Épicos |
|---|---|---|---|
| P01 | EP22 | P09 | EP20 |
| P02 | EP08 | P10 | EP07 |
| P03 | EP07, EP15 | P11 | EP15 |
| P04 | EP16 | P12 | EP14 |
| P05 | EP14, EP17 | P13 | EP19 |
| P06 | EP17 | P14 | EP04, EP05 |
| P07 | EP02, EP06 | P15 | EP03, EP13 |
| P08 | EP02 | | |

| Telas | Épicos |
|---|---|
| C-01 | EP22 |
| C-02 | EP03 |
| C-03–C-06 | EP02 |
| C-07 | EP08 |
| C-10, C-11 | EP08, EP09 |
| C-12, C-13 | EP08 |
| C-20 | EP07 |
| C-21 | EP15 |
| C-22–C-24, C-26 | EP16 |
| C-25 | EP14 |
| C-30, C-31 | EP17 |
| C-32 | EP06 |
| C-33, C-34 | EP10 |
| C-35 | EP02 |
| C-36 | EP05 |
| C-37 | EP04 |
| C-40–C-44 | EP13, EP03 |
| C-50, C-56 | EP20 |
| C-51 | EP07 |
| C-52, C-53 | EP15 |
| C-54, C-55 | EP14 |
| C-57, C-58 | EP19 |

Sem tela no protótipo: EP11, EP12, EP18, EP21 e EP23.

## Decisões a confirmar

| # | Questão | Divergência | Proposta |
|---|---|---|---|
| 1 | Conversa entra na R1? | F e T: pós-v1. V: venda no privado | R1, porque EP18 depende dela |
| 2 | Quando entram flerte e videochamada? | V lista como um dos três apps; F exclui | R2 |
| 3 | Verificação de idade | V deixa compliance completo para depois; T usa pergunta 18+; E não aceita autodeclaração | EP03 na R1, com parecer jurídico sobre texto e alcance |
| 4 | Gateway | L usou vários; o aceite de conteúdo adulto não foi verificado | Confirmar por escrito antes de assinar |
| 5 | Taxa | D: 10%. T: 20%. B: 15–20% | Definir antes do EP13 |
| 6 | Prazo de liberação do saldo | D: Pix em 1 dia, cartão em 30. T: D+14 | Seguir o contrato do gateway |
| 7 | Preço no Explorar | F e T: “preço a partir de”. M: sem preço | Sem preço |
| 8 | Anonimato | V: influencers anônimos. Venda exige identidade | Anônimo no público, verificado por dentro |
| 9 | Videochamada paga ou livre | V: parte do flerte. B: produto pago | Livre no flerte, paga no close |
| 10 | Código anterior | Reaproveitar ou refazer | Avaliar no EP01 |
| 11 | Base anterior | D registra usuários e leads antigos | Reativar só com base legal confirmada |

## Antes → depois

| Antes | Depois |
|---|---|
| Esteira ia de funcionalidades direto para histórias | Épicos entre as duas |
| [`functionalities.md`](functionalities.md) exclui chat, videochamada, stories e feed | Entram nos épicos EP09–EP12; o arquivo **ainda não foi atualizado** |

## Rollback

```bash
rm clozzy/docs/epics.md clozzy/prompts/027-2026-11-27-definir-epicos.md
git checkout -- clozzy/docs/README.md clozzy/prompts/timeline.md
# em activities/1f83176d-05d9-4fd4-b912-2600fbfcf164.md, apagar a linha “Entrega”
```

## Próximo na esteira

`user-stories.md` (a produzir): histórias por épico, começando pela onda 1.
