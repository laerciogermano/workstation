# AGENTS.md — fitness/app

Entrada para agentes de código. Fonte de produto: `../docs/prd.md` (RF/RN). Fonte visual: `../prototipos/v1/`.

## Comandos
- `pnpm install` · `pnpm db:up && pnpm db:migrate && pnpm db:seed` · `pnpm dev`
- Antes de concluir qualquer tarefa: `pnpm verify` (lint, typecheck, testes, build) precisa passar.

## Regras (não negociáveis)
1. **Contrato primeiro**: endpoint novo ou alterado começa em `packages/contracts`. A API valida com `parse(Schema, …)`; o teste valida a resposta com o mesmo schema.
2. **Domínio puro** em `packages/domain`: sem I/O, sem `Date.now()`; datas são `AAAA-MM-DD`. API e web usam as MESMAS funções.
3. **TS strict**: sem `any`, sem `!` fora de teste, sem `enum` (use `as const`). Biome é a régua de estilo.
4. **SQL**: parametrizado sempre, colunas explícitas, toda FK indexada, transação curta (`withTx`) sem I/O externo. Migration aplicada é **imutável** (o runner confere checksum): crie `NNN+1_*.sql`.
5. **Privacidade** (RN-17/18): nada vai à vitrine sem personagem + opt-in + toggle do tipo. Peso, TMB e fotos não saem do aparelho. Nunca logar `authorization`.
6. **UI**: só tokens `--ft-*` (nada de hex solto em componente), alvos ≥ 44 px, `button`/`a` semânticos, testes por role/label.
7. Cada tela declara no comentário do topo o F-xx e RF/RN que atende; teste cita RF/RN no nome.

## Onde mexer
- Regra de cálculo → `packages/domain/src/*` + `domain.test.ts`
- Endpoint → `contracts` → `apps/api/src/modules/<feature>/` → `apps/api/test/api.test.ts`
- Tela → `apps/web/src/screens/<fluxo>/` usando `ui/kit` e `lib/queries`
- Decisão arquitetural → nova ADR em `docs/adr/` (MADR curto)

## Segurança
Sem segredos no repo (`.env` fora do git). Entrada sempre via Zod. Token do aparelho é guardado só como hash SHA-256.
