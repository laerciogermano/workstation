# 006 — App completo (front + back) com o pacote de projeto moderno

| Campo | Valor |
|-------|--------|
| Número | 006 |
| Data | 2026-11-09 |
| Origem | Claude Code (workstation) |
| Título | Implementar novo projeto front e back completo a partir do protótipo v1 |

## Prompt original

```
com base no
|core/definir-projeto-moderno

e no contexto do fitness

implemente um novo projeto front e back completo

utilizando como referencia de coisas ja feitas no projeto

crie um novo projeto contendo as melhors praticas e todo o prototipo novo implementado
```

## Interpretação

Criar `fitness/app/` aplicando o pacote [`core/definir-projeto-moderno`](../../core/definir-projeto-moderno/README.md) (monólito modular, TS strict, contratos Zod, Postgres com migrations imutáveis, Twelve-Factor, ADR + C4 lean + AGENTS.md) e reaproveitando o que já existe: PRD v1.1, protótipo v1 (31 telas, cálculos, tokens `--ft-*`) e a organização do beta-docs do e-notas.

## O que foi feito

- [`app/`](../app/README.md): monorepo pnpm com `packages/domain` (regras puras compartilhadas), `packages/contracts` (Zod), `apps/api` (Fastify 5 + Postgres, 8 módulos) e `apps/web` (React 19 + Vite 7 + React Router 7 + TanStack Query offline-first).
- Todas as 31 telas do protótipo implementadas com estado real e API (tabela de rastreio no README do app).
- Banco: migration `001_init.sql` (schema `fitness`), seed de academias e personagens demo.
- Qualidade: 15 testes de domínio, 19 de integração da API com Postgres real e validação de contrato, 4 de componentes; Biome e typecheck limpos; build de produção ok.
- Docs: [`app/docs/architecture.md`](../app/docs/architecture.md), 7 ADRs, [`app/AGENTS.md`](../app/AGENTS.md).
