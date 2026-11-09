# 0001 — Monorepo TypeScript com domínio e contratos compartilhados

**Data:** 2026-11-09 · **Status:** Aceita

## Contexto
O lab (`app/`) é JS sem tipos; regras de preço viviam duplicadas no servidor e no protótipo. `core/definir-projeto-moderno/02` recomenda TS `strict`, contrato primeiro (Zod) e domínio puro.

## Decisão
npm workspaces com `packages/domain` (funções puras: RN-10/11/13, GTIN, chave NFC-e, centavos), `packages/contracts` (Zod + DTOs + erros) e `apps/api` / `apps/web` consumindo os dois. Pacotes exportam o fonte TS; a API é empacotada com `tsup`, a web com Vite. `tsc -b` faz o typecheck de tudo.

## Consequências
+ Uma regra, um lugar, testada sem banco; web e API não divergem em tipos.
+ `npm run verify` único.
− Pacotes internos não são publicáveis sem build (não é objetivo).
