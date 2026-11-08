# Prompts e skills de IA para Postgres

Pesquisa 2026-11-08 — o que baixamos e por quê.

## Skills de schema (prioridade)

1. **OneWave database-schema-designer** — workflow completo: requisitos → tipos PG → constraints → índices por query → migração → EXPLAIN. Default PG 18 / Supabase.
2. **db-weapon + db-guardian** — auditoria layered (schema → indexes → migrations → ORM → platform); expand-backfill-contract obrigatório >1M rows.
3. **builder-skills db-schema** — convenções rápidas (snake_case, uuid, soft delete, ON DELETE).
4. **davila7 / alireza / omer / viggyv** — checklists, ERD, templates, sharp edges.

## Skills de migração

- affaan `database-migrations` + omer `database-migrations` — expand/contract, Prisma/Drizzle, zero-downtime playbook.
- OneWave `database-migrator` — troca de provider / descoberta de schema.

## Prompts prontos

| Origem | Papel |
|---|---|
| Supabase `examples/prompts` | SQL style, migration naming, RLS granular, schema declarativo |
| boilerprompt Cursor | Schema + up/down + prova de rollback |
| developertoolkit | Loop Plan → constraints tests → EXPLAIN → expand/contract |
| davila7 `design-database-schema` | Command de setup |

## Como usar neste lab

1. Anexar [`../POSTGRES.md`](../POSTGRES.md)  
2. Invocar skill onewave (ou db-guardian se brownfield)  
3. Rodar [`../sintese/checklist-schema.md`](../sintese/checklist-schema.md)  
4. Prompts curtos: [`../prompts/FORMULAS-E-TEMPLATES.md`](../prompts/FORMULAS-E-TEMPLATES.md)
