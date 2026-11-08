# PostgreSQL — veredito para IA

Pacote canônico para a IA **definir banco PostgreSQL**: modelo de dados, tipos, constraints, índices, multi-tenant/RLS, migrações e prompts/skills.

Operação (vacuum, pooling, MVCC): também em [`../02-boas-praticas-stack/sintese/postgres.md`](../02-boas-praticas-stack/sintese/postgres.md).

## 1. Defaults (congelar cedo)

| Decisão | Default |
|---|---|
| PK interna | `bigint generated always as identity` |
| ID público / API | `uuid` v7 (`uuidv7()` no PG 18+); não expor bigint sequencial |
| Strings | `text` + `CHECK` de comprimento; evitar `varchar(255)` por hábito |
| Dinheiro / quantidades exatas | `numeric` (nunca `float`/`double`) |
| Tempo absoluto | `timestamptz` (nunca `timestamp` sem TZ) |
| Booleanos | prefixo `is_` / `has_` |
| Soft delete | `deleted_at timestamptz` + unique parcial `WHERE deleted_at IS NULL` |
| Auditoria | `created_at` / `updated_at` (+ trigger em `updated_at`) |
| Integridade | `NOT NULL` / `UNIQUE` / `CHECK` / FK com `ON DELETE` explícito **no banco** |
| Índices | derivados das queries reais; **todo FK indexado** (PG não cria sozinho) |
| JSONB | só dado genuinamente aberto; domínio tipado = colunas |
| SaaS multi-tenant | schema compartilhado + `tenant_id` + RLS (`FORCE`) + app ainda filtra |
| Migração breaking | expand → backfill/dual-write → contract; `CONCURRENTLY` / `NOT VALID` |

## 2. Fluxo para a IA

```text
Requisitos (entidades, 5–10 queries, volume, tenancy, ORM)
  → modelo 3NF (denormalizar só com query nomeada)
  → tipos + chaves + constraints + ON DELETE
  → índices por query (+ FK)
  → DDL / ORM schema + migração versionada
  → verificar (EXPLAIN / testes de constraint / RLS)
```

Skill preferida: [`skills/database-schema-designer-onewave/SKILL.md`](skills/database-schema-designer-onewave/SKILL.md)  
Auditoria / migração zero-downtime: [`agents/db-guardian.md`](agents/db-guardian.md) + [`skills/db-weapon/`](skills/db-weapon/SKILL.md)

## 3. Naming (snake_case)

- Tabelas: plural (`users`, `order_items`); views `v_`; matviews `mv_`; temp `tmp_`
- Colunas: singular; FK `referenced_table_id`
- Sem palavras reservadas; ≤ 63 chars; sem prefixo `pg_` / `tbl_`
- Schemas: um domínio lógico; não despejar tudo em `public` sem política; qualificar em SQL de produção

Guias: [`referencias/bytebase-postgres-sql-review-guide.md`](referencias/bytebase-postgres-sql-review-guide.md), [`prompts/supabase/code-format-sql.md`](prompts/supabase/code-format-sql.md), [`referencias/vonng-postgresql-convention-2024.md`](referencias/vonng-postgresql-convention-2024.md)

## 4. Anti-padrões

- Regra de negócio só no app (sem constraint)
- `varchar(255)` / `timestamp` / `float` para dinheiro
- UUIDv4 como PK em tabela de alta escrita
- Soft delete boolean + unique global sem filtro
- FK sem índice; índice “por precaução”
- JSONB como schema do domínio
- `RENAME` / `DROP` / `NOT NULL` em um único deploy com app antigo vivo
- App como owner/superuser sem `FORCE ROW LEVEL SECURITY`
- `SET` de tenant em sessão atrás de pooler (usar `SET LOCAL` / `set_config(..., true)`)

## 5. Entregáveis esperados

1. Modelo (entidades + cardinalidade)  
2. DDL ou schema ORM  
3. Racional de índices vs queries  
4. Migração up (+ down ou forward-fix documentado)  
5. Policies RLS se multi-tenant / cliente toca o banco  
6. Checklist: [`sintese/checklist-schema.md`](sintese/checklist-schema.md)

## 6. Fontes

Índice completo: [`SOURCES.md`](SOURCES.md)
