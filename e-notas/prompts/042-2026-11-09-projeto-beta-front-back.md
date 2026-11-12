# 042 — Projeto novo front + back (Beta) com as boas práticas do core

| Campo | Valor |
|-------|--------|
| Número | 042 |
| Data | 2026-11-09 |
| Origem | Claude Code (workstation) |
| Título | Implementar projeto novo completo (front e back) a partir do core/definir-projeto-moderno e do protótipo v2 |

## Prompt original

```
com base no
|core/definir-projeto-moderno

e no contexto de

e notas

implemente um novo projeto front e back completo

utilizando como referencia de coisas ja feitas de como fazer algumas coisas com o projeto atual do enotas

crie um novo projeto contendo as melhors praticas e todo o prototipo novo implementado
```

## Interpretação

- “Novo projeto” = pasta própria `notinhas-beta/`, sem mexer no lab (`app/`).
- “Melhores práticas” = `core/definir-projeto-moderno` (lean C4 + ADR, TS strict, Postgres, UI/motion, AGENTS.md) e `beta-docs/08`.
- “Protótipo novo” = `beta-docs/prototipos/v2` (T-xx + desktop responsivo).
- “Referência do que já foi feito” = parser SEFAZ-PR, categorias, regras de vínculo EAN e dados reais do lab.

## Entrega

- `notinhas-beta/`: monorepo TS — `packages/domain` (RN-10/11/13, GTIN, chave NFC-e, centavos), `packages/contracts` (Zod/DTO/RFC 9457), `apps/api` (Express 5 modular, Postgres schema `notinhas`, migrations, jobs), `apps/web` (React 19, Vite, Router 7 + View Transitions, TanStack Query, Leaflet, zxing, PWA).
- Todas as telas do protótipo v2 mapeadas em `notinhas-beta/docs/TRACEABILITY.md`; ADRs 0001–0006; AGENTS.md; deploy (nginx, systemd, Dockerfile) e CI.
- Seed com os dados do protótipo e importador da base real do lab (`npm run db:import-lab`).
- Verificação: `npm run verify` (typecheck, lint, marca, 47 testes incl. integração com Postgres real) e E2E no Chrome (390×844): nota real do lab → “duplicada”, lista com split, criar conta com merge.
- REQ-059.
