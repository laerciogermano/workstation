# Documento de implementação — Confraternização Maçônica

**Versão:** 1.0 · 2026-11-27  
**Visão:** [`documento-de-visao.md`](documento-de-visao.md) v4.0  
**Stack de referência:** [`core/definir-projeto-moderno/`](../../core/definir-projeto-moderno/README.md)

---

## 1. Arquitetura

Monólito modular: API + SPA PWA + PostgreSQL. Um app atende vários eventos do GOB; módulos plugáveis ligados por evento.

```text
[Attendee / Organizer / Auctioneer]
            │  HTTPS
            ▼
     [Nginx Contabo]
            │
     ┌──────┴──────┐
     ▼             ▼
 [SPA React]   [API NestJS]
  (Vite/PWA)    TypeScript
                   │
                   ▼
            [PostgreSQL]
```

### 1.1 Frontend

| Item | Escolha |
|------|---------|
| Linguagem | TypeScript |
| Framework | React 19 + Vite |
| Forma | SPA / PWA mobile-first (público 45–65 anos; uso no evento) |
| UI | Tokens GOP / protótipo atual; Lucide |

### 1.2 Backend

| Item | Escolha |
|------|---------|
| Linguagem | TypeScript (`strict`) |
| Framework | NestJS (módulos por domínio) |
| Banco | PostgreSQL |
| Auth | Sessão JWT + MFA (SMS / autenticador / e-mail / códigos reserva) |

### 1.3 Contêineres (C4 L2)

| Contêiner | Tecnologia | Responsabilidade |
|-----------|------------|------------------|
| Web app | React + Vite (PWA) | UI do participante, organizador e leiloeiro |
| API | NestJS + TypeScript | Auth, eventos, chat, leilão, módulos, backoffice |
| Banco | PostgreSQL | Fonte de verdade |
| Reverse proxy | Nginx | TLS, estáticos, proxy `/api` |

---

## 2. Modelagem de dados

Diagrama e entidades: [`modelagem-dados.md`](modelagem-dados.md).

---

## 3. Provider de servidor

| Item | Valor |
|------|-------|
| Provider | Contabo VPS |
| Host | `185.250.37.82` · [`deploy/README.md`](../deploy/README.md) |
| Domínio | `confraternizacao.laerciogermano.com` (Hostinger DNS) |
| Produção app | Nginx → proxy Node `:3333` (SPA+API); protótipo estático em `/prototipo/`; Postgres 18 em Docker `:5439` |

**Antes → depois:** só HTML estático em `/opt/confraternizacao` → app em `/` + protótipo em `/prototipo/`.

**Rollback:** ver [`deploy/README.md`](../deploy/README.md).

---

## 4. Implementação 1.0

Código em [`../app/`](../app/README.md). Ajustes em relação ao planejado:

| Planejado | Feito | Motivo |
|-----------|-------|--------|
| `GroupChat` e `DirectChat` | Tabela única `chats` com `type` | Mensagem e membro passam a ter chave estrangeira real |
| `Attendee.role` (um papel) | `attendees.roles` (lista) | A mesma pessoa é organizadora e leiloeira |
| Entidades da modelagem | Também `challenges`, `parking_areas`, `membership_payments`, `support_tickets`, `join_requests` | Casos de uso que não tinham onde guardar |
| `Session` | Campos `kind` e `capacity` | Vagas por item da programação |
| PWA | Manifesto web, sem funcionamento offline | Fica para depois |
| Esteira (functionalities → BDD → telas) | Código direto a partir da visão e do protótipo | Pedido de 27/11 |

## 5. Fora deste documento

- Functionalities / US / BDD / screens (esteira de produto ainda a produzir)
- Backoffice web detalhado (pendência da ata 18/11)
- Logomarca GOB (não recebida)

---

## Próximos passos

1. Validar stack e modelagem com o cliente / Paulo  
2. ADRs finos (fila Redis/BullMQ só se chat/leilão ao vivo exigir)  
3. Seguir esteira: `functionalities.md` → … → código
