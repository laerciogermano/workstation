# Documento de Visão — App “Rolê” (nome provisório)

Plataforma de descoberta e experiência de eventos, festas e eventos privados.

---

## 1. Visão Geral

O Rolê é um aplicativo que centraliza a descoberta de festas, shows e eventos privados (ex.: sociais, churrascos) em um raio de proximidade definido pelo usuário, unindo três camadas em um só produto:

1. Descoberta de eventos (estilo feed/geolocalização)
2. Conexão social entre participantes (estilo “Tinder de eventos”)
3. Monetização via ingressos, consumação, publicidade e assinatura premium

O objetivo é resolver um problema comum: hoje, para descobrir o que está rolando em uma cidade (principalmente para quem está viajando ou é novo no lugar), a pessoa precisa procurar em vários lugares diferentes — Instagram, Google, sites de casas de eventos, grupos de WhatsApp. O Rolê unifica essa jornada em um único app.

---

## 2. Problema que o produto resolve

- Descobrir eventos exige pesquisar em múltiplas plataformas (Instagram, Google, sites).
- Não existe uma forma fácil de saber quem vai a um evento antes de decidir ir.
- Pessoas sozinhas em uma cidade (viajando ou não) têm dificuldade de socializar em bares/festas.
- Donos de bares/casas de eventos não têm uma vitrine unificada com dados de público e engajamento.
- Falta um sistema de reputação/confiança entre anfitriões e convidados em eventos privados (ex.: sociais, churrascos).

---

## 3. Proposta de Valor

| Para quem | Valor entregue |
|-----------|----------------|
| Usuário final | Descobre eventos por perto, vê quem vai, se conecta antes de ir, compra ingresso e entra direto no chat do evento |
| Anfitriões (pessoa física) | Divulga festas privadas, controla lista, avalia convidados |
| Bares / casas de eventos | Vitrine, venda de ingresso, dados de público, publicidade paga, cardápio digital com fidelização |
| Influenciadores/organizadores | Ferramenta de divulgação e monetização de presença |

### 3.1 Tabela de Personas

| Persona | Quem é | Principais dores | O que faz no RoleGo | Épicos relacionados |
|---------|--------|-------------------|----------------------|----------------------|
| **Usuário Explorador** | Pessoa que quer sair (fim de semana, viagem, cidade nova) e decidir rápido com o grupo | Informação de eventos espalhada em vários apps; decisão em grupo é lenta e sem dados | Descobre eventos por feed/swipe/mapa, vê quem vai, dá like, entra no match do grupo, compra ingresso e vai ao chat | E01, E02, E03, E09 |
| **Usuário Solo** | Está sozinho na cidade (morador novo ou viajante) e quer socializar sem grupo formado | Dificuldade de conhecer gente em bares/festas sem estar acompanhado | Ativa o Modo Solo, conecta-se com quem deu like no mesmo evento, divide custos e experiência | E02 |
| **Anfitrião de evento privado** | Pessoa física que organiza social, churrasco ou festa em local próprio | Falta de controle de lista e de confiança sobre quem confirma presença | Cria o evento privado, controla acesso/local revelado após confirmação, avalia convidados | E02, E11 |
| **Convidado de evento privado** | Pessoa convidada para um evento privado (social, churrasco etc.) | Insegurança sobre o evento e o anfitrião antes de ir | Recebe convite/notificação, confirma presença, avalia o anfitrião após o evento | E09, E11 |
| **Bar / Casa de eventos** | Estabelecimento comercial que promove eventos e quer vender mais e conhecer o público | Falta de vitrine unificada, dados de público e canal de venda direto | Publica eventos, vende ingresso, oferece cardápio digital, acompanha engajamento e paga por destaque | E02, E03, E04, E07, E10 |
| **Influenciador / Organizador** | Criador de conteúdo ou produtor que divulga presença/eventos e busca monetização | Falta de canal direto para ser contratado e comprovar presença como atrativo | Cadastra disponibilidade, é contratado por casas/produtores, tem presença exibida na página do evento | E06 |

---

## 4. Jornada do Usuário (Fluxo Principal)

1. **Onboarding:** criação de conta → preferências (tipo de evento: festa, show, evento privado etc.) → cidade → permissão de localização → raio de busca.

2. **Descoberta de eventos** — múltiplos modos de visualização:
   - **Feed:** lista de eventos próximos, filtrável por tipo de evento; eventos patrocinados/pagos aparecem em destaque no topo.
   - **Modo “Tinder”:** navegação por deslize (swipe) entre eventos, focado em decisão rápida — principal frente de monetização por engajamento.
   - **Modo Mapa:** exploração geográfica dos eventos (ver seção 5.6) — restrito a eventos patrocinados e/ou usuários premium.
   - **Modo Lista:** visualização tradicional em lista, sem elementos de swipe ou mapa.

3. **Página do evento:** informações completas (local, valores de entrada/VIP/bebida), lista de confirmados, lista de interessados, presença confirmada de influenciadores contratados (nome exibido), fotos de quem já foi em edições anteriores.

4. **Decisão social:** o usuário vê o perfil de quem vai (e pode dar “like”) para decidir se o evento “tem a ver” com ele antes de comprar; também pode visualizar fotos de participantes de edições anteriores do mesmo evento.

5. **Confirmação/compra:** compra do ingresso (com taxa de serviço), geração de QR Code de entrada, acesso automático ao chat do evento com os demais confirmados.

6. **No evento:** possibilidade de postar fotos vinculadas ao evento (a foto marcada no evento vai direto para a página do evento e para o perfil do usuário); outros participantes podem curtir/comentar.

7. **Pós-evento:** o perfil do usuário acumula histórico de eventos, fotos, avaliações e amigos feitos (usuário pode convidar outro participante para ser “amigo” dentro do app).

---

## 5. Funcionalidades Centrais (MVP e além)

### 5.1 Descoberta

Eventos por geolocalização e raio configurável, com quatro modos de visualização:

- **Feed:** eventos patrocinados/pagos aparecem em destaque no topo
- **Tinder (swipe):** decisão rápida evento a evento — principal motor de engajamento e monetização
- **Mapa:** restrito a eventos patrocinados e usuários premium (ver 5.6)
- **Lista:** visualização simples, sem swipe
- Filtro por tipo de evento (festa, show, evento privado — ex.: social, churrasco)
- Eventos privados com local revelado só após confirmação/código de acesso

### 5.2 Social / “Tinder de eventos”

- Perfil do usuário: foto, eventos que já foi, número de “amigos” feitos, fotos por evento
- Sistema de curtidas/comentários nas fotos vinculadas a cada evento
- Notificação de “like” recebido de outro participante do mesmo evento (gancho social para abordagem presencial)
- Mensagem direta (direct) dentro do app entre usuários, inclusive a partir de uma curtida recebida no evento
- Sistema de amigos: usuário pode convidar outro participante do mesmo evento para ser “amigo”; contagem de amigos exibida no perfil
- Convite de contatos para eventos (compartilhamento via celular)
- Sistema de avaliação (estrelas) entre anfitrião e convidado em eventos privados, criando reputação

### 5.3 Vitrine de Influenciadores

- Espaço de cadastro para influenciadores digitais, que se disponibilizam para presença paga em eventos (ex: “sou de São Paulo, disponível para festas em São Paulo”)
- Casas de eventos/produtores podem contratar influenciadores diretamente pela plataforma
- Na página do evento, a presença confirmada do influenciador é exibida com nome, funcionando como chamariz para o público comprar ingresso
- Fonte adicional de receita (comissão sobre o cachê/contratação) e de tração para lançamento em novas cidades

### 5.4 Ingressos e Pagamento

- Compra de ingresso dentro do app com geração de QR Code
- Taxa de serviço como fonte de receita
- Reserva de mesa/consumação antecipada em bares parceiros

### 5.5 Cardápio digital e Score de consumo (“Rolê Gold”)

- Cardápio do bar disponível dentro do app
- Compras feitas pelo app geram pontuação (score) de cliente
- Selos de status por nível de consumo/engajamento (ex: Rolê Gold, Platina)
- Benefícios/descontos em bares parceiros para assinantes premium

### 5.6 Publicidade e Visibilidade Paga

- Eventos fora do raio de alcance do usuário podem aparecer mediante pagamento de impulsionamento (modelo “Meta/Instagram Ads”)
- Mapa de eventos: funcionalidade de explorar eventos por mapa, disponível apenas para eventos patrocinados (fonte de receita adicional) e/ou usuários premium
- Destaque de usuários “Rolê Gold” (alto engajamento) dentro dos eventos

### 5.7 Notificações e Alertas em Tempo Real

- Notificação push disparada automaticamente quando um novo evento é cadastrado dentro do raio de busca configurado pelo usuário (ex: raio de 10 km definido → evento criado a 8 km do usuário → notificação enviada)
- Formato da notificação traz tipo de evento, distância e horário, por exemplo:
  - “Rolê: surgiu uma festa social a 13 km de você”
  - “Social do Laércio a 3 km, começa às 20h”
- Objetivo: reengajar o usuário mesmo fora do app (notificação chega enquanto ele navega no celular em outros apps), funcionando como gatilho de reabertura do app e de decisão em cima da hora
- Aplica-se tanto a eventos públicos quanto privados (ex.: convite avulso de social ou churrasco de conhecido)
- Complementa a lógica de “curtida”/match: notificações também podem avisar sobre interações sociais recebidas (ex: alguém curtiu o usuário em um evento em comum), reforçando o loop de engajamento do produto

### 5.8 Assinatura Premium

- Acesso a descontos em bares parceiros
- Acesso ao mapa completo de eventos
- Visualização de fotos/participantes sem restrição

---

## 6. Modelo de Monetização

1. Taxa de serviço sobre venda de ingressos
2. Comissão sobre consumação feita dentro do app (bares/casas de eventos)
3. Publicidade paga — impulsionamento de eventos fora do raio padrão
4. Patrocínio de visibilidade no mapa — só aparece no mapa quem paga
5. Assinatura Premium (usuário final) — descontos e recursos extras
6. Parcerias com estabelecimentos — modelo similar a plataformas de mídia paga (tipo “Meta”), estabelecimentos pagam para aparecer/divulgar

**Observação:** o modelo de receita via consumação/comissão de venda ainda precisa ser detalhado (percentual exato, forma de repasse aos estabelecimentos) — ponto em aberto identificado na própria conversa original.

---

## 7. Diferencial Competitivo

- Une em um único app três camadas que hoje são fragmentadas: descoberta + social + compra
- Componente social (curtidas, fotos, “match” entre participantes) gera retenção e efeito de rede, diferente de plataformas puramente transacionais de ingresso
- Gamificação por status (selos, score) incentiva tanto o consumidor a comprar pelo app quanto o estabelecimento a aderir à plataforma
- Potencial de expansão futura para networking de negócios dentro de eventos corporativos (conceito de “match” citado como inspiração do modelo do Sebrae)

---

## 8. Estratégia de Lançamento (Go-to-Market)

### Fase 1 — Base de parceiros (pré-lançamento)

- Conquistar os 30 primeiros parceiros: 10 bares, 5 casas de eventos, 5 produtores de festa, 1 restaurante, organizadores independentes
- Cidade piloto: Curitiba
- Ativar influenciadores locais para divulgação ~1 mês antes do lançamento (inclusive via a própria vitrine de influenciadores do app, ver 5.3)
- Permitir pré-download do app para gerar base de usuários e parceiros já no dia do lançamento

### Fase 2 — Marketing de guerrilha presencial (ativação física em eventos)

- Campanha de ~1 mês antes do lançamento distribuindo material físico (cartão/cardezinho) com QR Code de acesso direto ao app em vários bares e shows parceiros
- Parceria com estandes/quiosques de bebida (“negocinho de bar”) dentro de shows de grande fluxo (ex: shows de música eletrônica, pagode), fixando QR Codes do app circulando dentro do evento para captação orgânica de usuários no momento de maior engajamento do público
- Abordagem direta com produtores de eventos, levando o QR Code/material do app às festas para conversão presencial de parceiros e usuários
- Objetivo: gerar tração viral local antes mesmo do lançamento oficial, aproveitando o fluxo de pessoas já presente em eventos parceiros

### Fase 3 — Tração de usuários

- Meta inicial: 500 primeiros usuários ativos reais
- Expansão gradual de cidades após validação em Curitiba

### Fase 4 — Monetização

- Expectativa de que a monetização plena (taxas, publicidade, premium) amadureça em um horizonte de aproximadamente 1 ano após o lançamento, à medida que a base de usuários e parceiros cresce

### Roadmap de expansão geográfica (pós-Curitiba)

Com base em pesquisa preliminar de mercado, a ordem de expansão para novas cidades seria:

1. Curitiba — cidade piloto/base
2. Florianópolis
3. Porto Seguro
4. Maringá

O critério de priorização são cidades com forte cena de eventos e vida noturna, mas ainda pouco exploradas por uma plataforma unificada de descoberta — “lugares que têm muita coisa a oferecer, mas que nem todo mundo conhece”. A visão de longo prazo inclui expansão internacional, condicionada à validação e tração consistente no mercado nacional.

---

## 9. Riscos e Pontos em Aberto

- **Efeito rede (chicken-and-egg):** o app depende de ter eventos e usuários ao mesmo tempo — mitigado pela estratégia de pré-cadastro de parceiros antes do lançamento
- **Privacidade e segurança:** exibição de fotos e presença em eventos exige políticas claras de consentimento e moderação de conteúdo
- **Concorrência indireta:** Instagram, Sympla, Eventbrite e grupos de WhatsApp já cumprem parte dessas funções separadamente
- **Funcionalidade “Mapa”:** avaliada como possível diferencial mas também como risco de descaracterizar o produto (virar “tipo um Google”); decisão estratégica pendente sobre lançar já no MVP ou apenas como recurso pago posterior
- **Regulação de pagamentos:** venda de ingresso e comissão sobre consumação dentro do app exigem gateway de pagamento e possivelmente enquadramento como intermediador financeiro

---

## 10. Evidências de Demanda / Validação Inicial

- Durante pesquisas informais sobre a ideia, surgiram perguntas espontâneas de terceiros sobre “eventos próximos” na própria cidade — sinal informal de que a dor (dificuldade de descobrir o que está rolando por perto) já é sentida por pessoas fora do grupo fundador
- Percepção de que a geração atual de usuários é orientada a experiências presenciais, encontros e vida social ativa (“a geração da galera de festa, de encontro”), o que reforça o encaixe do produto com o comportamento do público-alvo
- Leitura da equipe: existe uma carência real e não atendida de forma unificada — hoje a solução está fragmentada entre redes sociais, sites de venda de ingresso e boca a boca, reforçando a tese central do produto (ver seção 2)
- Esse tipo de sinal deve ser tratado como indício qualitativo inicial, não como validação formal de mercado — recomenda-se estruturar pesquisa de validação com potenciais usuários e parceiros antes do desenvolvimento completo (ver seção 9)

---

## 11. Visão de Futuro (Longo Prazo)

- Expansão do conceito de “match” para networking profissional/negócios dentro de eventos corporativos
- Consolidação como rede social voltada a experiências presenciais, não apenas ferramenta transacional de ingresso
- Possível expansão nacional após validação do modelo em Curitiba

---

Este documento foi estruturado a partir de uma sessão de brainstorm em áudio e reflete o estágio inicial de ideação do produto. Recomenda-se validação com usuários reais e refinamento do modelo de monetização (percentuais de comissão, split com parceiros) antes da fase de desenvolvimento.

Fonte: [`input/documento-de-visao-role(1).pdf`](input/documento-de-visao-role(1).pdf)
