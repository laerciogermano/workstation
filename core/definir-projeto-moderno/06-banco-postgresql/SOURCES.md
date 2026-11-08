# Fontes — banco PostgreSQL

**Data:** 2026-11-08  
**Entrada:** [POSTGRES.md](POSTGRES.md)

## Skills (baixadas)

| Pasta | Origem |
|--------|--------|
| `skills/database-schema-designer-onewave/` | https://github.com/OneWave-AI/claude-skills (database-schema-designer) |
| `skills/database-migrator-onewave/` | https://github.com/OneWave-AI/claude-skills (database-migrator) |
| `skills/db-schema-builder/` | https://github.com/kazdenc/builder-skills (.claude/skills/dev/setup/db-schema) |
| `skills/database-schema-viggyv/` | https://github.com/ViggyV/claude-skills |
| `skills/database-schema-designer-alireza/` | https://github.com/alirezarezvani/claude-skills |
| `skills/database-schema-designer-davila7/` | https://github.com/davila7/claude-code-templates |
| `skills/db-weapon/` | https://github.com/The-Notorious-Avengers/Claude-Code-Cursor-Skills |
| `skills/postgres-patterns/` | https://github.com/affaan-m/everything-claude-code |
| `skills/database-migrations-affaan/` | https://github.com/affaan-m/everything-claude-code |
| `skills/database-schema-design-omer/` | https://github.com/omer-metin/skills-for-antigravity |
| `skills/database-architect/` | https://github.com/omer-metin/skills-for-antigravity |
| `skills/database-migrations-omer/` | https://github.com/omer-metin/skills-for-antigravity |
| `skills/postgres-wizard/` | https://github.com/omer-metin/skills-for-antigravity |
| `skills/neon-postgres/` | https://github.com/omer-metin/skills-for-antigravity |

## Agents

| Arquivo | Origem |
|---------|--------|
| `agents/db-guardian.md` | https://github.com/The-Notorious-Avengers/Claude-Code-Cursor-Skills |
| `agents/database-reviewer.md` | https://github.com/affaan-m/everything-claude-code |

## Prompts oficiais

| Arquivo | URL |
|---------|-----|
| `prompts/supabase/*` | https://github.com/supabase/supabase/tree/master/examples/prompts |
| `prompts/design-database-schema-davila7.md` | davila7/claude-code-templates |
| Cursor schema setup | https://boilerprompt.dev/cursor/set-up-a-postgres-database-schema |
| Cursor staged design | https://developertoolkit.ai/en/cursor-ide/plan/database-design/ |

## Convenções / guias (espelhos em `referencias/`)

| Fonte | URL | Arquivo |
|-------|-----|---------|
| Bytebase SQL Review | https://www.bytebase.com/blog/postgres-sql-review-guide/ | `bytebase-postgres-sql-review-guide.md` |
| VONNG Convention 2024 | https://vonng.com/en/pg/pg-convention/ | `vonng-postgresql-convention-2024.md` |
| CodeAustral SaaS schema | https://codeaustral.com/blog/postgres-schema-design-saas | `articles/saas-schema-patterns.md` |
| Multi-tenant + RLS | https://aqeelijaz.com/blog/postgresql-multi-tenant-schema-design | `articles/multi-tenant-rls.md` |
| Tipos / PK / constraints | https://schoolofweb.net/en/posts/postgres-basics-2-table-design-data-types/ | `articles/tipos-e-design.md` |
| Schema change blueprint | https://postgresql.codeguides.io/migrations-schema-change/schema-change-blueprint/ | `articles/schema-change-blueprint.md` |
| Prisma migration strategies | https://www.prisma.io/dataguide/types/relational/migration-strategies | `articles/migracoes-expand-contract.md` |
| Production patterns | https://iurii.rogulia.fi/blog/postgresql-production-patterns | `postgresql-production-patterns-rogulia.md` |
| Supabase RLS | https://supabase.com/docs/guides/database/postgres/row-level-security | `supabase-row-level-security.md` |
| Supabase SQL style (AI) | https://supabase.com/docs/guides/ai-tools/ai-prompts/code-format-sql | `prompts/supabase/code-format-sql.md` |
| Baseplate conventions | https://1to100.com/baseplate/developer-guide/database-conventions/ | `baseplate-database-conventions.md` |
| Airbyte schema guide | https://airbyte.com/data-engineering-resources/create-database-schema-in-postgresql | `airbyte-create-database-schema-postgresql.md` |

## Docs oficiais PostgreSQL (espelhos)

Prefixo `referencias/pg-official-*` — DDL schemas/constraints, indexes, ALTER/CREATE INDEX, datatype, partitioning. Canônico online: https://www.postgresql.org/docs/current/

## Notas

- Preferir skill **onewave** + defaults de [`POSTGRES.md`](POSTGRES.md); divergências (ex.: PK `user_id` vs `id`) documentar no ADR do projeto.
- Ops (vacuum, PgBouncer, MVCC): [`../02-boas-praticas-stack/`](../02-boas-praticas-stack/README.md)
