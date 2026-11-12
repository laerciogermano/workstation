# ADR-0001 · Monorepo com monólito modular

- Status: aceito · 2026-11-09

## Contexto
Um produto, um time pequeno, regras de cálculo que precisam ser idênticas no cliente (otimista/offline) e no servidor.

## Decisão
pnpm workspaces com `packages/domain` (puro), `packages/contracts` (Zod), `apps/api` (Fastify, monólito modular por feature) e `apps/web` (React). Domínio e contratos são consumidos como fonte TS; a API é empacotada com tsup e roda JS compilado.

## Consequências
+ Uma fonte para TMB, plano, kcal, streak e insights; tipos de ponta a ponta.
− Pacotes internos não são publicáveis isoladamente (não precisam ser).
