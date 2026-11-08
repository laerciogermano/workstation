# Referências de mercado (espelhos para IA)

Espelhos oficiais/canônicos baixados em 2026-11-08 para agentes lerem **on-demand** ao implementar o Beta. O **contrato do produto** continua em `beta-docs/01`–`15` + [`ia/CLAUDE.md`](../ia/CLAUDE.md). Esta pasta **não substitui** esses docs.

- **Relatório da pesquisa:** [`../reports/Boas praticas stack moderna.md`](../reports/Boas%20praticas%20stack%20moderna.md)
- **Índice no pacote:** [`../16-referencias-mercado.md`](../16-referencias-mercado.md)
- **Regra:** always-on = CLAUDE + trechos da task; aqui só o espelho necessário. Cada `.md` tem `source_url` no topo.

## Pastas (103 arquivos)

| Pasta | Uso | Quando abrir |
|---|---|---|
| [`nodejs-typescript/`](nodejs-typescript/) | Node, TS `strict`, Express/Fastify, Nest modules, Red Hat RA, Docker | Backend, CI, containers, graceful shutdown |
| [`react/`](react/) | RSC, Client/Server, Next checklist, Testing Library | UI, a11y, testes de componente; RSC só se ADR migrar o shell |
| [`postgres/`](postgres/) | Índices, partições, MVCC, ALTER seguro, PgBouncer | Schema, migrations, queries, pool |
| [`arquitetura/`](arquitetura/) | 12-Factor, monólito modular, hexagonal, C4, ADR, outbox | Decisões estruturais, deploy, side-effects |
| [`filas/`](filas/) | BullMQ produção, idempotência, workers, retries | **Só após ADR** de worker/fila (gap atual do Beta) |
| [`ia-specs/`](ia-specs/) | AGENTS.md, SDD, spec-kit, Beyond Gherkin, code review | Formato de docs e fluxo agente |
| [`seguranca/`](seguranca/) | OWASP Node/JS-TS, ASVS 5 index | Checklist segurança; não colar ASVS inteiro no prompt |

## Ordem mínima por tipo de task

1. Feature/API → `08` + `06` + `nodejs-typescript/typescript-strict.md` + Express security/performance
2. Migration/SQL → `05` + `postgres/indexes-intro.md` + `sql-altertable.md` + `transaction-iso.md`
3. Job em background → portas em `03`/`08` → `filas/` + outbox em `arquitetura/` **depois** de ADR
4. UI → `12` + tokens → `react/react-you-might-not-need-an-effect.md` + Testing Library queries
5. Segurança/LGPD → `10` + `seguranca/owasp-nodejs-security-cheat-sheet.md`

## Caminho inverso

Remover esta pasta não altera o contrato Beta. Para rebaixar um espelho: abrir `source_url` do arquivo e substituir o conteúdo mantendo o cabeçalho YAML. Relatório e notas em `research_notes/Boas praticas stack moderna/`.
