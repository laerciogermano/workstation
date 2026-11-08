# Schema SaaS que envelhece bem

**Fonte:** https://codeaustral.com/blog/postgres-schema-design-saas (2026-09-12)

## IDs

- Interno: `bigint generated always as identity`
- Público/API: `uuid` v7 (`uuidv7()` no PG 18+)
- Não expor bigint em URL; evitar UUIDv4 como PK em alta escrita

## Soft delete

- Preferir `deleted_at timestamptz` a boolean
- Unique parcial: `WHERE deleted_at IS NULL`
- Soft-delete roots; hard-delete folhas; job de purge ≠ soft delete

## Auditoria

- `created_at` / `updated_at` timestamptz; trigger em `updated_at`
- Histórico real → tabela append-only / temporal, não só `updated_at`

## JSONB

- Colunas tipadas se filtra/ordena/join/FK
- JSONB só para forma aberta (custom fields, webhook raw)
- Se consulta caminho: expression index ou GIN deliberado

## Índices

- Indexar todo FK
- Ordem composta = predicados reais
- Parciais para skew; `INCLUDE` em hot paths
- Produção: `CREATE INDEX CONCURRENTLY`

## Migração

- Expand → migrate (dual-write + backfill) → contract
- `NOT VALID` + `VALIDATE`; `lock_timeout`

## Multi-tenant

- Default: shared schema + `tenant_id` leading
- RLS = rede de segurança; app ainda filtra
- `FORCE ROW LEVEL SECURITY`; role app ≠ owner
