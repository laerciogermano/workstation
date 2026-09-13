# RoleGo — Épicos

Fonte de verdade dos épicos do produto, derivada do [documento de visão](README.md) e dos materiais de MVP/slides em [`input/`](input/).

Cada épico agrupa um conjunto coerente de valor; histórias e BDD vêm depois. Épicos com mais de uma persona usam uma **persona-pai** (seção abaixo); a tabela mostra só a persona responsável.

---

## Índice

| ID | Épico | Persona |
|----|-------|---------|
| E01 | Conta, onboarding e perfil | Usuário Explorador |
| E02 | Descoberta de eventos | Usuário Explorador |
| E03 | Página e ciclo de vida do evento | Comunidade do Evento |
| E04 | Eventos privados | Participantes do Evento Privado |
| E05 | Social e “Tinder de eventos” | Usuário Explorador |
| E06 | Match coletivo e chat do rolê | Usuário Explorador |
| E07 | Amigos e rede no app | Usuário Explorador |
| E08 | Ingressos e pagamento | Comprador e Estabelecimento |
| E09 | Cardápio digital e consumação | Comprador e Estabelecimento |
| E10 | Gamificação e RoleGo Wallet | Usuário Explorador |
| E11 | Modo Solo | Usuário Solo |
| E12 | Vitrine de influenciadores | Divulgação e Vitrine |
| E13 | Publicidade e visibilidade paga | Divulgação e Vitrine |
| E14 | Assinatura Premium | Usuário Explorador |
| E15 | Notificações e alertas | Explorador e Convidado |
| E16 | Modo de segurança | Usuário Final |
| E17 | Painel do parceiro (bares e casas) | Bar / Casa de eventos |
| E18 | Reputação anfitrião–convidado | Participantes do Evento Privado |
| E19 | IA generativa de eventos | Usuário Explorador |

```mermaid
graph TD
    P1["Usuário Final<br/>(E16)"]
    P2["Participantes do Evento Privado<br/>(E04, E18)"]
    P3["Comprador e Estabelecimento<br/>(E08, E09)"]
    P4["Divulgação e Vitrine<br/>(E12, E13)"]
    P5["Explorador e Convidado<br/>(E15)"]
    P6["Comunidade do Evento<br/>(E03)"]

    UE[Usuário Explorador]
    US[Usuário Solo]
    ANF[Anfitrião de evento privado]
    CONV[Convidado de evento privado]
    BAR["Bar / Casa de eventos"]
    INFL["Influenciador / Organizador"]

    P1 --> UE
    P1 --> US
    P2 --> ANF
    P2 --> CONV
    P3 --> UE
    P3 --> BAR
    P4 --> INFL
    P4 --> BAR
    P5 --> UE
    P5 --> CONV
    P6 --> UE
    P6 --> ANF
    P6 --> BAR
```

---

## Usuário Explorador

### E01 — Conta, onboarding e perfil

O usuário cria conta (email, Google ou Apple), configura preferências de tipo de evento, cidade, raio e localização, e mantém um perfil com foto, histórico de eventos, amigos, fotos por evento e selos. A entrada rápida e o perfil alimentam descoberta, social e gamificação.

### E02 — Descoberta de eventos

O usuário encontra o que está rolando perto dele por geolocalização e raio configurável (ex.: 5, 20 ou 50 km), com modos Feed, Tinder (swipe), Lista e Mapa (conforme premium/patrocínio), filtros por tipo e dia, destaque de eventos patrocinados e radar dinâmico com cards atualizados — unificando a descoberta hoje espalhada em Instagram, Google, sites e WhatsApp.

### E05 — Social e “Tinder de eventos”

O usuário decide com base em quem vai: vê confirmados e interessados, dá like em participantes, curte e comenta fotos do evento, troca DM (inclusive a partir de curtida) e posta fotos marcadas no evento. A conexão social diferencia o RoleGo de bilheterias puramente transacionais.

### E06 — Match coletivo e chat do rolê

Quando o grupo curte o mesmo evento, o match coletivo é confirmado, o chat do rolê é criado automaticamente e o fluxo segue para conversa e/ou compra de ingresso — “deslize, encontre e saia” com o grupo alinhado.

### E07 — Amigos e rede no app

O usuário monta a rede que alimenta o match: adiciona amigos por busca, telefone ou código, convida contatos para o app e para eventos, pede amizade a partir de participantes do mesmo evento e vê contagem e status dos amigos no perfil.

### E10 — Gamificação e RoleGo Wallet

Pontos, selos, rankings entre amigos, recompensas (descontos, ingressos com preço reduzido, furo de fila) e status (ex.: Rolê Gold, Platina) incentivam uso e compra pelo app. A RoleGo Wallet guarda histórico de experiências, fotos, avaliações e selos, reforçando retenção e adesão dos estabelecimentos.

### E14 — Assinatura Premium

O usuário paga por recursos extras: mapa completo de eventos, descontos em bares parceiros, visualização de fotos e participantes sem restrição e demais diferenciais do roadmap — gerando receita recorrente e engajamento diferenciado.

### E19 — IA generativa de eventos

O app resume automaticamente cada evento (vibe, playlist esperada, perfil do público, clima) em conteúdo compartilhável no chat do grupo, para decidir rápido sem abrir várias abas.

---

## Usuário Solo

### E11 — Modo Solo

Quem está sozinho ativa o Modo Solo, conecta-se com quem também deu like no mesmo evento e combina custos, transporte e presença na pista — resolvendo a dor de socializar sem grupo em cidade nova ou viagem.

---

## Comunidade do Evento

Persona-pai. Filhas: Usuário Explorador, Anfitrião de evento privado, Bar / Casa de eventos.

### E03 — Página e ciclo de vida do evento

Cada evento tem página completa (local, horários, valores de entrada/VIP/bebida, confirmados, interessados, influenciadores contratados e fotos de edições anteriores), ciclo do anúncio ao pós-evento (cadastro e edição por anfitriões e casas, avaliação, comentário e selos) — informação suficiente para decidir, comprar e lembrar o rolê.

---

## Participantes do Evento Privado

Persona-pai. Filhas: Anfitrião de evento privado, Convidado de evento privado.

### E04 — Eventos privados

Anfitriões divulgam sociais, churrascos e outros eventos privados com controle de acesso: criação do evento, local revelado só após confirmação ou código, lista de convidados, convites avulsos e compartilhamento — organizando rolês privados fora das casas comerciais.

### E18 — Reputação anfitrião–convidado

Anfitrião e convidado se avaliam por estrelas após o evento; a reputação fica no perfil e influencia listas e decisões de convite, mitigando risco social em eventos privados.

---

## Comprador e Estabelecimento

Persona-pai. Filhas: Usuário Explorador, Bar / Casa de eventos.

### E08 — Ingressos e pagamento

Compra de ingresso no app (pista, VIP etc.) com taxa de serviço, gateway de pagamento, QR Code, carteira de ingressos, compartilhamento com o grupo e reserva de mesa/consumação antecipada em parceiros — do descarte ao ingresso em poucos cliques.

### E09 — Cardápio digital e consumação

O usuário consome pelo app no bar parceiro via cardápio digital; a compra gera score de consumo e benefícios ligados a status/premium, com comissão para o estabelecimento (percentuais ainda em aberto na visão).

---

## Divulgação e Vitrine

Persona-pai. Filhas: Influenciador / Organizador, Bar / Casa de eventos.

### E12 — Vitrine de influenciadores

Influenciadores cadastram disponibilidade; casas e produtores contratam pela plataforma; o nome do influenciador confirmado aparece na página do evento como chamariz, com comissão sobre o cachê e tração em novas cidades.

### E13 — Publicidade e visibilidade paga

Eventos e casas pagam para aparecer além do alcance orgânico: impulsionamento fora do raio padrão, visibilidade no mapa, destaques no feed e parcerias de mídia paga — monetização B2B alinhada à visão.

---

## Explorador e Convidado

Persona-pai. Filhas: Usuário Explorador, Convidado de evento privado.

### E15 — Notificações e alertas

Push e central in-app avisam novo evento no raio, interações sociais (like, match, progresso do grupo), ingresso, segurança e pós-evento — reabrindo o app e acelerando a decisão no momento certo.

---

## Usuário Final

Persona-pai. Filhas: Usuário Explorador, Usuário Solo.

### E16 — Modo de segurança

Trilha opcional de segurança com contatos de confiança, compartilhamento de localização/trajeto, alertas de lotação, pico e fila, atalhos para transporte seguro e botão de emergência — confiança para sair.

---

## Bar / Casa de eventos

### E17 — Painel do parceiro (bares e casas)

Estabelecimentos e produtores operam vitrine, publicação e gestão de eventos, venda de ingresso, cardápio, campanhas pagas e métricas básicas de público e engajamento — o lado B2B da proposta de valor.

---

## Notas de priorização (orientação)

Ordem sugerida para um MVP alinhado aos wireframes e à jornada principal da visão:

1. **E01** Conta e onboarding  
2. **E02** Descoberta  
3. **E03** Página do evento  
4. **E07** Amigos  
5. **E05** / **E06** Social + match + chat  
6. **E08** Ingressos  
7. **E15** Notificações  
8. **E16** Segurança (MVP)  
9. **E10** Gamificação básica + pós-evento  

Demais épicos (privados, premium, ads, influenciadores, cardápio, solo, IA, painel completo) como **além do MVP**, conforme validação e go-to-market.
