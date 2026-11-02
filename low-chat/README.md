# low-chat

Camada de conversa **agnóstica de canal**: persona + contexto + modelo barato. Os canais (LinkedIn, Tinder, WhatsApp, CRM, …) só entram/saem mensagem; o “quem fala” fica aqui.

**Board:** [low-chat](https://trello.com/b/tgOTRfNq/low-chat)

## Objetivo

Manter conversa com contexto de forma natural o suficiente para o interlocutor não tratar a resposta como robô genérico — com custo baixo por reply.

## Escopo

| Camada | O quê |
|--------|--------|
| **Núcleo** | Persona, memória por thread, provider LLM barato, CLI de teste |
| **Canais** | Adapters: LinkedIn · Tinder · WhatsApp · CRM (+ outros depois) |

Contrato mental: `mensagem_in + persona + histórico → reply` (texto). Canal cuida de UI/API; low-chat não abre browser sozinho.

## Board

Listas: `Backlog` → `A fazer` → `Em andamento` → `Concluído`.  
Labels: `núcleo` · `canal` · `LinkedIn` · `Tinder` · `WhatsApp` · `CRM`.

## Antes → depois

Sem projeto → pasta `low-chat/` + board Trello com backlog núcleo/canais.

**Rollback:** arquivar board; apagar `low-chat/`.
