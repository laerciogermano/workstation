# AGENTS.md — notinhas.shop Beta

Instruções para agentes (Claude, Cursor, Copilot). Specs completas ficam em `../beta-docs/`; aqui só o que precisa estar sempre à mão.

## Comandos

- `npm run verify` — typecheck + lint + marca + testes. **Tem que passar antes de entregar.**
- `npm test -- --project domain|api|web` — uma suíte só.
- `npm run dev` — API :4174 + web :5188. `npm run db:migrate | db:seed | db:import-lab`.

## Onde está a verdade

| Pergunta | Arquivo |
|---|---|
| O quê / regras RN-xx | `../beta-docs/01-prd.md` |
| Comportamento esperado | `../beta-docs/02-historias/` (Gherkin, US-xx.yy) |
| Telas T-xx | `../beta-docs/prototipos/v2/` · mapa em `docs/TRACEABILITY.md` |
| Por que a arquitetura é assim | `docs/adr/` · `docs/ARCHITECTURE.md` |
| Requisitos novos | `../docs/requisitos.md` (REQ-nnn) — registrar no mesmo turno |
| Prompts recebidos | `../prompts/timeline.md` — registrar todos (`../config/config-ia.md`) |

## Regras de código

- **Contrato primeiro:** endpoint novo começa em `packages/contracts` (Zod + DTO); a web importa os mesmos tipos.
- **Domínio puro:** cálculo de preço, ranking, cotação, GTIN e textos ficam em `packages/domain` (ESLint barra `express`, `pg`, `node:*` lá). Sem `new Date()` no domínio — receba `now`.
- **Módulos da API:** `modules/<feature>/` com rotas finas → serviço → SQL parametrizado. Rede externa (SEFAZ, Open Food Facts, Nominatim) atrás de porta (`*.port.ts`) e **nunca dentro de transação**.
- **Erros:** `throw new AppError('CODIGO')` com código do catálogo (`contracts/errors.ts`); resposta é RFC 9457.
- **Dinheiro em centavos** (`Cents`), formatação só na UI (`lib/format.ts`). Datas `timestamptz`, exibição em `America/Sao_Paulo`.
- **TS:** sem `any`, sem `!`, sem `enum` (use union `as const`), `import type` para tipos.
- **Migrations:** nova migration numerada; nunca editar uma já aplicada em ambiente compartilhado. Toda FK com índice.
- **UI:** só tokens `--nt-*` (sem hex solto em componente); verde = só menor preço/sucesso; azul = única cor de ação; escuro = fundo preto (nunca azul). Preço sempre com loja e data (RN-05). Alvos ≥ 44 px, skeleton em vez de spinner, respeitar `prefers-reduced-motion`.
- **Marca:** a interface diz **notinhas.shop**; o termo do repositório nunca aparece na UI (`scripts/check-brand.mjs`).

## Segurança e privacidade (sempre)

- Índice público (`v_price_observations`, rotas de catálogo) **não** junta nada de pessoa: sem `visitor`, `user`, IP, fingerprint (RN-06). Há teste para isso.
- Dados pessoais (notas, listas, pontos, gastos) só pelo dono: use `ownerOf(req)` + `ownerSql()`.
- CPF/nome do consumidor da DANFE nunca são lidos pelo parser nem logados.
- Mutação exige `X-Requested-With: notinhas`; URL de nota passa pela allow-list da Fazenda PR (anti-SSRF).
- Segredos só em `.env` (não commitar). Logs Pino com redação de cookie/token/e-mail/fingerprint.
- Ação destrutiva em banco compartilhado ou deploy: pedir confirmação humana.

## Commits

Português, Conventional Commits com a task: `feat(listas): split entre lojas (US-04.03, BETA-401)`.
