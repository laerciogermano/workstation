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
| Host atual (protótipo) | `185.250.37.82` · [`deploy/README.md`](../deploy/README.md) |
| Domínio | `confraternizacao.laerciogermano.com` (Hostinger DNS) |
| Produção app | Mesmo VPS: Nginx → estáticos SPA + proxy API; PostgreSQL no host ou container |

**Antes → depois:** só HTML estático em `/opt/confraternizacao` → SPA build + API Node + Postgres no mesmo Contabo.

**Rollback:** voltar ao deploy só do `prototipo/`; desligar API e Postgres; manter Nginx do site estático.

---

## 4. Fora deste documento

- Functionalities / US / BDD / screens (esteira de produto ainda a produzir)
- Backoffice web detalhado (pendência da ata 18/11)
- Logomarca GOB (não recebida)

---

## Próximos passos

1. Validar stack e modelagem com o cliente / Paulo  
2. ADRs finos (fila Redis/BullMQ só se chat/leilão ao vivo exigir)  
3. Seguir esteira: `functionalities.md` → … → código
