# Agent Shop — Documento de visão

**Por quê:** fixar o *quê* e o *porquê* do produto antes de qualquer história, tela ou código.  
**Importante:** é a fonte de verdade do produto — sem ela, derivados divergem.  
**No fluxo:** **este documento** → [`docs/`](docs/README.md) (discovery → esteira) → app.

Derivados: [`docs/`](docs/README.md).  
Timeline de prompts: [`prompts/`](prompts/README.md).  
Regras para a IA: [`config/config-ia.md`](config/config-ia.md).

**Não confundir com** [`connectmax/vendas`](../connectmax/vendas/README.md) (prospecção LinkedIn para franqueado) nem com [`low-chat`](../low-chat/README.md) (só camada de conversa). O Agent Shop é a **loja + vida do agente**: comprar, nomear, personalizar e mandar executar/agendar — inclusive ações em sites/apps via stack do lab.

---

## Visão

O **Agent Shop** é onde a pessoa **compra um agente autônomo**, **dá nome e vida** (identidade, jeito, limites) e passa a **pedir coisas** — agora ou **agendadas** — e o agente **executa** (conversa, agenda e ações em browser/apps), não só responde texto.

## Problema

Assistentes genéricos conversam; automações rígidas executam scripts. Falta um produto em que o usuário **adquira um agente como “alguém”**, configure quem ele é e mande **fazer** com continuidade no tempo.

| Dor | O que acontece hoje |
|-----|---------------------|
| **Chat sem mãos** | ChatGPT/similares respondem; não operam a agenda nem a tela do usuário de forma contínua e comprável como “seu agente”. |
| **Automação sem pessoa** | Zapier/RPA e bots de site não têm identidade comprável nem conversa natural de dono → agente. |
| **Setup técnico** | Montar persona + scheduler + CDP/AVD exige lab; o comprador quer **pronto**, com nome e vida. |
| **Pedido some no ar** | Sem agenda e fila de jobs, “me lembra amanhã” e “faz X às 9h” não viram execução confiável. |

As pessoas **já querem** um assistente que faça. O que falta é **comprar o agente**, **dar vida** e **mandar / agendar** com execução real.

## Para quem

| Persona | Para quem | Necessidade |
|---------|-----------|-------------|
| **Dono** | Quem compra e manda no agente | Adquirir, nomear, personalizar e pedir/agendar tarefas |
| **Operador (futuro)** | Quem gerencia frota / família / time | Ver status, pausar, limites por agente |
| **Operação Agent Shop** | Quem vende e opera a plataforma | Catálogo, provisioning, billing, saúde dos runtimes |

## Objetivo

Ser o lugar padrão para **comprar um agente configurável**, **dar nome e vida**, e **pedir / agendar** ações que o agente **executa** (texto + agenda + operação de tela web/app).

## Proposta de valor

O Agent Shop trata o agente como **produto com vida**, não como prompt avulso. Compra → identidade → pedidos e agenda → execução com mãos (CDP / screen-robot).

| Necessidade | O que o Agent Shop faz |
|-------------|------------------------|
| Adquirir o agente | Catálogo de agentes (SKUs) e checkout |
| Dar nome e vida | Nome, persona, tom, regras e preferências do dono |
| Conversar | Canal de chat com o agente (persona + histórico) |
| Agendar | Tarefas e lembretes no tempo; fila de execução |
| Executar | Ações em sites (Chrome/CDP) e apps (screen-robot/AVD) quando o pedido exigir |

### Exemplos

**Compra e batismo** — Ana compra o SKU “Assistente pessoal”, chama de *Lia*, define tom direto e fuso `America/Sao_Paulo`.

**Pedido agora** — “Abre o calendário e cria evento amanhã 15h com João.” O agente agenda o job e executa via browser/CDP.

**Pedido agendado** — “Toda segunda às 9h, resume meus e-mails não lidos.” O scheduler dispara; o agente opera o webmail (quando no escopo do runtime).

**Limite** — Ana define: Lia não pode comprar nem apagar contas. Pedidos fora do limite são recusados com explicação.

## Princípios

1. **Agente é produto com vida** — tem nome, identidade, dono e limites; não é só um modelo de chat.
2. **Pedir e agendar são iguais em intenção** — “faz agora” e “faz às 9h” entram na mesma fila de jobs.
3. **Conversa manda; runtime executa** — o chat interpreta; CDP/screen-robot (e adapters) fazem a ação.
4. **Limites explícitos** — o dono define o que o agente pode / não pode fazer.
5. **Não confundir com prospecção B2B ConnectMax** — aqui o comprador é o dono do agente, não o funil de franquia.

## Escopo da visão

### Capacidades (v1)

| Área | Em escopo |
|------|-----------|
| **Catálogo e compra** | SKUs de agente; compra (pagamento pode ser stub/manual no MVP) |
| **Nome e vida** | Nome, persona, bio curta, tom, fuso, idioma |
| **Chat com o agente** | Mensagens in/out com histórico por agente |
| **Agenda / jobs** | Criar, listar, cancelar tarefas agendadas e “agora” |
| **Execução web** | Ações em sites via Chrome + CDP (`human-cdp` / lab) |
| **Execução app (mínimo)** | Ao menos um caminho screen-robot/AVD para ação em app, ou stub documentado se o host não estiver up |
| **Status** | Ver o que o agente está fazendo / último job / erros |
| **Conta dono** | Cadastro/login mínimo do comprador |

### Fora de escopo (v1)

- Marketplace de agentes criados por terceiros (só catálogo da loja)
- Agente que fecha venda comercial sozinho no lugar do humano (ConnectMax)
- Frota multi-dono / white-label
- App nativo (v1 web)
- Autonomia total sem limites (sempre há policy do dono)
- Integração bancária completa / compliance de todos os países no dia um

## Modelo conceitual

### SKU / oferta de agente

Produto à venda no shop (ex.: assistente pessoal, pesquisador web). Define capacidades base e preço.

### Agente (instância)

Cópia viva do SKU após compra: nome, vida (persona), dono, limites, runtime vinculado.

### Vida

Conjunto de identidade: nome, persona, tom, preferências, regras do dono.

### Pedido

Intenção do dono em linguagem natural (“faz X”, “agenda Y”). Vira um ou mais **jobs**.

### Job

Unidade executável: imediata ou agendada; estado (pending / running / done / failed); alvo (chat-only, web, app).

### Runtime

Ambiente que executa ações: Chrome/CDP e/ou AVD/screen-robot associados ao agente.

### Dono

Usuário que comprou e manda no agente.

## Dependências do lab

```text
agent-shop (compra, vida, chat, agenda, orquestração)
        │
        ├── low-chat          → persona + reply
        ├── chrome-cdp / human-cdp → ações web
        └── screen-robot      → ações em app (AVD)
```

O Agent Shop **orquestra**; não reimplementa o robô de tela nem o CDP.

## Critérios de sucesso

- O dono **compra** (ou provisiona) um agente e **dá nome + vida**.
- Consegue **pedir** algo no chat e ver job criado.
- Consegue **agendar** e ver disparo no horário.
- Pelo menos um fluxo de **ação web** (CDP) completa ponta a ponta.
- Limites do dono **bloqueiam** pedido fora da policy.
- Produto permanece **distinto** do ConnectMax vendas.

## Glossário

| Termo | Significado |
|-------|-------------|
| **SKU** | Oferta de agente à venda |
| **Instância** | Agente comprado/configurado do dono |
| **Vida** | Identidade e regras do agente |
| **Pedido** | Intenção em linguagem natural |
| **Job** | Execução concreta (agora ou agendada) |
| **Runtime** | CDP / AVD que executa ações |
| **Dono** | Comprador e controlador do agente |

## Regras de negócio (v1)

- Toda instância tem **um dono**; só o dono manda (v1).
- Todo pedido vira job(s) rastreáveis; não há “sumiu no chat”.
- Agendado e imediato usam a **mesma** máquina de jobs.
- Ação web/app só roda se a capability do SKU + policy do dono permitirem.
- Falha de runtime fica **visível** no status do job (não silencia).

## Próximos passos

→ [`docs/README.md`](docs/README.md) — índice; discovery em [`docs/discovery/`](docs/discovery/README.md)
