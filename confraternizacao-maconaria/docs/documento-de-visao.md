# Documento de visão — Confraternização Maçônica

| Campo | Valor |
|-------|--------|
| Produto | App oficial do evento mundial da potência (125 anos) — Curitiba |
| Código / pasta | `works/confraternizacao-maconaria` |
| Versão | **2.0** (2026-11-13) |
| Status | Visão de produto (pré-PRD / pré-orçamento fechado) |
| Substitui | Visão v1 em [`../README.md`](../README.md) (resumo + ponteiro) |
| Fontes | Pedido do cliente · prints LIDE · mercado de event apps 2025–26 · Roman Pichler / SVPG |

**O que este documento é:** a razão de existir do produto, para quem, que mudança cria, o que o produto é (em capacidades grossas), o que fica de fora e como saber que deu certo.  
**O que não é:** PRD, backlog, wireframe, stack fechada nem proposta comercial detalhada — esses vêm depois, derivados daqui.

---

## 1. Elevator pitch (Moore)

> Para a **organização da potência** e os **participantes** do evento mundial de confraternização em Curitiba (125 anos), que hoje dependem de PDF, planilha e WhatsApp para programação multi-local, o **app da potência** é o **companheiro oficial do evento** que concentra agenda, locais, presença e networking no contexto da confraternização — diferente de folder estático ou de app genérico de clube, porque é feito para **um evento mundial espalhado pela cidade**, com identidade e operação da potência.

## 2. Visão (slogan — Pichler)

**Orientar a confraternização na cidade inteira.**

Em 5–10 anos (horizonte ambicioso): a potência não “manda PDF da programação” — participantes e organização vivem o evento mundial (e edições futuras) com **um único norte digital**: saber onde estar, com quem se encontrar e como a potência opera a presença — com dignidade, privacidade e ordem.

Critérios da visão (Pichler): inspiradora · compartilhada · concisa · ambiciosa · durável (não amarra feature) · ética (benefício real, sem harm).

## 3. Product Vision Board

| Bloco | Conteúdo |
|-------|----------|
| **Visão** | Orientar a confraternização na cidade inteira. |
| **Público-alvo** | Organização da potência (comissão/secretaria); participantes (irmãos e convidados inscritos); coordenação de local/atividade. |
| **Necessidades** | Programação confiável multi-local; saber quem participa e quem está presente; identificação na entrada; contato entre inscritos no contexto do evento; operação sem planilha paralela. |
| **Produto** | App (mobile-first) **single-event** da potência: agenda pessoal + grade da cidade, locais, inscrição/confirmação, check-in, carteirinha, mensagens/diretório opt-in, painel da organização, push e modo offline da agenda. |
| **Objetivos de negócio** | Evento sob controle (adoção do app, presença mensurável); experiência à altura de um evento mundial; base para orçamento e entrega sem escopo infinito; dados do evento sob propriedade da potência (LGPD). |

---

## 4. Por que agora (mercado)

O mercado de **mobile event apps** em 2025–26 deixou de discutir *se* ter app e passou a discutir *quais jobs o app cumpre bem o suficiente para justificar o download* ([Event Tech Live — Four Jobs](../input/referencias-mercado/raw-html/eventtechlive-four-jobs-event-mobile-app.html)):

1. **Agenda e wayfinding** — agenda pessoal, mapa/locais, mudanças de horário, offline.  
2. **Engajamento na sessão** — polls/Q&A (secundário neste evento de confraternização).  
3. **Networking / matchmaking** — diretório + mensagem com privacidade.  
4. **Dados e analytics** — presença, check-in, sinais para a organização; dados exportáveis.

Tendências relevantes para este produto:

| Tendência | Implicação aqui |
|-----------|-----------------|
| Agenda personalizada é o feature nº 1 de uso | MVP sem “minha agenda” falha |
| Multi-venue / cidade exige mapa e locais de verdade | Curitiba inteira ≠ um único auditório |
| Check-in no app sobe adoção (app vira caminho oficial) | Check-in não é “nice to have” |
| Networking com **opt-in** de privacidade | Mensagem/diretório com consentimento |
| Fadiga de instalar app por evento | Preferir **PWA / web mobile excelente** no 1º evento; nativo só se push/offline exigirem |
| Features convergem (Whova, Guidebook, Cvent, Bizzabo, Brella…) | Diferencial = **domínio da potência + evento 125 anos**, não inventar 40 features |
| Referência do cliente (prints LIDE) | Idioma de UX (agenda, eventos, check-in, ingresso, carteirinha) — não clonar marca LIDE |

Insumos locais: [`../input/README.md`](../input/README.md) · [`../input/referencias-mercado/`](../input/referencias-mercado/).

---

## 5. Problema

Evento mundial de confraternização, **programação em vários pontos de Curitiba**, sem sistema oficial da potência.

| Dor | Hoje | Impacto |
|-----|------|---------|
| Programação dispersa | PDF, murais, grupos de WhatsApp | Ninguém sabe o que acontece *agora / onde* |
| Locais sem cadastro único | Endereços soltos | Deslocamento errado, atraso, frustração |
| Participantes e presença opacos | Planilha / boca a boca | Organização voa às cegas; capacidade estoura ou sobra |
| Identificação improvisada | Crachá improvisado / indicação | Filas e risco de acesso indevido |
| Contato fora de contexto | WhatsApp pessoal | Networking frágil; privacidade e spam |
| Orçamento sem escopo | “Quanto custa um app?” | Número sem visão = conflito depois |

O evento **já existirá**. Falta o **companheiro oficial** que faz os quatro jobs do mercado na linguagem da potência.

## 6. Para quem

### Personas

| Persona | Quem | Job-to-be-done |
|---------|------|----------------|
| **Organização** | Comissão / secretaria / ops do evento | “Manter a grade e a presença sob controle sem planilha” |
| **Participante** | Irmão / convidado inscrito | “Saber onde estar hoje e conectar com quem importa no evento” |
| **Coordenação de local** | Responsável por ponto/atividade | “Ver quem vem e quem fez check-in no meu local” |

### Não é para

- Público geral da cidade (turismo aberto)  
- Rede social maçônica permanente pós-evento (v1)  
- Marketplace de vários eventos de outras potências (v1)

---

## 7. Objetivos do produto

1. Ser a **fonte oficial** de programação e locais do evento dos 125 anos.  
2. Dar ao participante uma **agenda pessoal** utilizável na rua (horário + local + lembrete).  
3. Dar à organização **presença mensurável** (confirmação, check-in, capacidade X/Y).  
4. Permitir **confraternização digital no contexto** (diretório opt-in + mensagem).  
5. Fechar escopo suficiente para **orçamento e entrega** antes do ano do evento.

### Não-objetivos (visão)

- Substituir ERP financeiro da potência  
- App de loja / e-commerce permanente  
- Transmitir rituais ao vivo  
- Empilhar features de clube (rateio, voucher lanchonete) sem aceite explícito

---

## 8. Proposta de valor

**Para o participante:** um dia em Curitiba sem se perder — agenda, mapa mental de locais, ingresso/confirmação, carteirinha e contato com outros inscritos.  
**Para a organização:** um painel vivo da confraternização — grade, locais, quem confirmou, quem entrou — sem depender de dezenas de grupos.

### Benefícios-chave

- Clareza de **onde / quando**  
- **Presença** rastreável  
- **Identidade** do participante no evento  
- **Conexão** entre inscritos com privacidade  
- **Dados do evento** sob controle da potência

---

## 9. Os quatro jobs (deste evento)

Tradução do framework de mercado para a confraternização maçônica:

| Job | Neste produto | Prioridade v1 |
|-----|---------------|---------------|
| **1. Agenda e wayfinding** | Grade da cidade, agenda pessoal, locais/salas, detalhe da atividade, push de mudança, offline da agenda | Must |
| **2. Engajamento na sessão** | Polls/Q&A ao vivo | Won’t (v1) — evento é confraternização multi-local, não congresso de palestras |
| **3. Networking** | Diretório opt-in + mensagem 1:1 (+ matchmaking leve depois) | Must (mensagem); Should (diretório) |
| **4. Dados / operação** | Confirmados, check-ins, capacidade, export para a potência, painel ops | Must |

---

## 10. Capacidades do produto (visão)

Standout (grossas — ≤5, Pichler): **Agenda multi-local** · **Presença (confirmação + check-in)** · **Identificação (carteirinha / ingresso)** · **Networking no evento** · **Operação da organização**.

### 10.1 Mapa MoSCoW (visão → orçamento)

#### Must (v1)

| Capacidade | Descrição |
|------------|-----------|
| Conta e papéis | Participante vs organização (e coordenação de local se necessário) |
| Evento canônico | Um evento (125 anos) com período e metadados |
| Grade / programação | CRUD de atividades: título, data/hora, local, capacidade, status, “sobre”, capa |
| Locais / salas | Cadastro na cidade; vínculo com atividades |
| Agenda do dia | Faixa de dias + atividades do dia (padrão LIDE) |
| Lista de atividades | Data/hora, título, confirmados X/Y |
| Detalhe da atividade | Informações + ações |
| Agenda pessoal | Salvar / confirmar atividades (“minha programação”) |
| Inscrição / ingresso | Fluxo de direito de participar (pago ou cortesia — regra no PRD) |
| Check-in | Confirmar presença na atividade (QR ou fluxo in-app) |
| Carteirinha digital | Identificação do participante |
| Mensagens 1:1 | Entre inscritos no mesmo evento |
| Push / avisos | Mudança de horário/local e lembretes |
| Offline da agenda | Agenda e detalhes essenciais sem Wi‑Fi do local |
| Privacidade / LGPD | Consentimento, opt-in de visibilidade no diretório, cookies/analytics |
| Painel organização | Grade, locais, inscritos, confirmados, check-ins; alteração rápida da grade |
| Export de dados | Organização exporta participação/presença ao fim |

#### Should (v1 se couber no orçamento; senão v1.1)

| Capacidade | Descrição |
|------------|-----------|
| Diretório de participantes | Busca com campos opt-in (loja/oficina, cidade, etc.) |
| Mapa dos locais | Pontos do evento no mapa de Curitiba |
| Notificação in-app + sino | Além de push |
| Responsáveis / palestrantes | Perfil ligado à atividade (quando houver) |
| Favoritar local / atividade | Atalhos na agenda pessoal |

#### Could (pós-MVP / candidatos do print LIDE)

Estacionamento · produtos/pedidos · vouchers · rateios · rede de empresas · facial · badge adimplente · polls/Q&A · gamificação · matchmaking por IA · certificados · gravações.

#### Won’t (v1)

Clonar LIDE · rede social eterna · streaming ritualístico · multi-tenant de várias potências · dependência obrigatória de WhatsApp.

### 10.2 Superfícies (visão de produto, não UI final)

| Superfície | Quem | Função |
|------------|------|--------|
| App participante (mobile-first) | Participante | Agenda, eventos, detalhe, check-in, carteirinha, mensagens, perfil |
| Console organização (web) | Organização | CRUD grade/locais, inscritos, presença, avisos, export |
| (Opcional) vista coordenação | Coordenação de local | Lista do local + check-ins |

Recomendação de entrega (mercado): **PWA / web responsiva de alta qualidade** no primeiro evento mundial; avaliar app nativo só se push confiável + offline profundo forem inegociáveis após medição.

---

## 11. Princípios de produto

1. **Evento da potência primeiro** — single-event 125 anos; multi-edição só depois.  
2. **Agenda excelente ou nada** — se a agenda falhar, o resto não importa (mercado).  
3. **Presença explícita** — confirmação ≠ check-in; ambos visíveis à ops.  
4. **Privacidade por padrão** — diretório e mensagem com opt-in; LGPD.  
5. **Referência, não cópia** — prints LIDE = idioma de fluxo; marca = potência.  
6. **Quatro jobs com foco** — investir em 1, 3 e 4; engajamento de sessão fica de fora no v1.  
7. **Dados da potência** — exportável; sem lock-in opaco.  
8. **Escopo nomeado antes do preço** — orçamento amarra Must; Could não entra escondido.

---

## 12. Modelo conceitual

```text
Potência
  └── Evento (125 anos / Curitiba)
        ├── Locais / salas
        ├── Atividades ──► Local
        ├── Participantes
        │     ├── Inscrições / ingressos ──► Atividade
        │     ├── Confirmações / agenda pessoal
        │     ├── Check-ins ──► Atividade
        │     ├── Carteirinha
        │     └── Mensagens (opt-in)
        └── Organização (papéis ops)
```

| Conceito | Definição |
|----------|-----------|
| **Potência** | Jurisdição cliente; dona do app e dos dados do evento |
| **Evento** | Confraternização mundial (período, tema 125 anos) |
| **Local / sala** | Espaço na cidade (ou interno) |
| **Atividade** | Bloco da programação com tempo, lugar, capacidade |
| **Participante** | Pessoa inscrita no evento |
| **Confirmação** | Intenção de ir (conta em X de Y) |
| **Check-in** | Presença registrada |
| **Ingresso / inscrição** | Direito de participar |
| **Carteirinha** | Identidade digital no evento |
| **Mensagem** | Contato 1:1 entre inscritos |

---

## 13. Regras de negócio (visão)

- Atividade presencial referencia **local** (ou “a definir” explícito).  
- Atividade tem **início**; capacidade Y desejável; política de overbook no PRD.  
- Check-in exige inscrição/confirmação válida.  
- Mensagem só entre inscritos do mesmo evento; diretório só com opt-in.  
- Organização edita a grade; participante não.  
- Alteração de horário/local dispara aviso aos afetados.  
- v1 = **um** evento; candidatos LIDE fora do orçamento sem aceite.  
- Conteúdo ritualístico sensível: política editorial da potência (o app não publica o que a potência não autorizar).

---

## 14. Sucesso (como sabemos)

### Norte (hipótese)

**% de participantes inscritos que abrem a agenda no app ≥1× por dia de evento** + **% de atividades com check-in operacional**.

### Indicadores

| Indicador | Alvo de referência (mercado) |
|-----------|------------------------------|
| Adoção (inscritos que usam o app) | 55–70% com promoção; 80%+ se app for caminho oficial de check-in |
| Agenda: abertura no dia | Maioria dos usuários ativos |
| Check-in em atividades-chave | Operável pela organização (sem planilha) |
| Mensagens iniciadas | Sinal de networking vivo (sem meta rígida no v1) |
| Tempo para republicar mudança de grade | Minutos, não horas |
| Export de dados pós-evento | Entregue à potência |

### Critérios qualitativos

- Participante responde “onde estou agora / o que vem a seguir” só com o app.  
- Organização encerra o dia sem planilha paralela de presença.  
- Orçamento comercial cita esta visão (Must) sem “e também tudo do LIDE”.

---

## 15. Alternativas consideradas

| Alternativa | Por que não basta sozinha |
|-------------|---------------------------|
| PDF + WhatsApp | Sem presença, sem agenda pessoal, sem ops |
| Só Instagram / grupos | Sem grade estruturada nem check-in |
| Comprar Whova/Cvent/Guidebook white-label | Pode ser opção comercial; visão do *produto da potência* permanece — avaliar no orçamento (custo/attendee vs app próprio) |
| Clone LIDE | Domínio errado (clube empresarial); só UX de referência |

A visão **não** decide ainda build vs buy; decide o *quê* precisa ser verdade. O orçamento compara build vs plataforma de mercado contra os Must.

---

## 16. Premissas, riscos e perguntas abertas

### Premissas

- O evento ocorre em Curitiba no ano seguinte, com programação multi-local.  
- Haverá equipe da potência para alimentar a grade.  
- Participantes têm smartphone.  
- Cliente aceita PWA no v1 se a experiência for sólida.

### Riscos

| Risco | Mitigação |
|-------|-----------|
| Escopo infla com features LIDE | MoSCoW + aceite explícito |
| Baixa adoção | Check-in oficial + promoção pré-evento + agenda offline |
| Wi‑Fi fraco nos locais | Offline da agenda |
| Privacidade / LGPD | Opt-in diretório; DPA; consentimento |
| Atraso no conteúdo da grade | Console simples + prazo editorial |

### Perguntas abertas (para o cliente / PRD)

1. Quantos participantes esperados? Quantos dias? Quantos locais?  
2. Ingresso é pago, cortesia ou misto?  
3. Check-in por QR na porta ou só in-app?  
4. Diretório de irmãos: quais campos públicos?  
5. Preferência: app próprio vs white-label (Whova/Cvent/etc.)?  
6. Quais itens “Could” do LIDE são obrigatórios na cabeça do cliente?  
7. Há exigência de app nas lojas (iOS/Android) no dia 1?

---

## 17. Restrições

- **Prazo:** evento no ano seguinte → discovery e orçamento agora; build com folga para conteúdo e ensaio.  
- **LGPD / ética:** dados de irmãos; mínimo necessário; export e exclusão.  
- **Marca:** identidade da potência (a definir); não LIDE.  
- **Acessibilidade:** fallback não-app para quem não puder usar o app (mercado 2026).  
- **Idioma:** português (v1); outros idiomas só se o cliente pedir.

---

## 18. Temas de roadmap (não é backlog)

Ordem de valor (visão → discovery):

1. **Fundação** — evento, contas, papéis, locais, grade  
2. **Agenda participante** — lista, detalhe, minha agenda, offline  
3. **Presença** — inscrição/ingresso, confirmação, check-in, carteirinha  
4. **Networking** — mensagem + diretório opt-in  
5. **Operação** — painel, push, export, privacidade  
6. **Endurecimento** — mapa, ensaios de carga, promoção pré-evento  

Stories/épicos: esteira em [`README.md`](README.md) → functionalities → …

---

## 19. Fontes

| Tipo | Onde |
|------|------|
| Pedido falado | [`../input/pedido-cliente.txt`](../input/pedido-cliente.txt) · áudio + transcrição |
| Referência UX | Prints LIDE em [`../input/README.md`](../input/README.md) |
| Visão (método) | Roman Pichler — Product Vision Board / FAQs; SVPG Product Vision FAQ |
| Mercado event apps | Event Tech Live (4 jobs); EventBookings feature priorities; Whova, Guidebook, Cvent, Bizzabo, Brella, Swapcard (HTML em `input/referencias-mercado/`) |
| Skills / templates | `input/referencias-mercado/skills/` · `templates-visao/` |

---

## 20. Próximos passos

1. Validar com o cliente: Must + perguntas abertas §16.  
2. Benchmarking build vs buy (custo/attendee vs app próprio) → [`benchmark.md`](benchmark.md) (a produzir).  
3. Orçamento v1 amarrado ao MoSCoW Must.  
4. Discovery: functionalities → user-stories → … ([`README.md`](README.md)).

---

*Documento de visão v2.0 — confraternizacao-maconaria — 2026-11-13*
