# Multi-tenant + RLS

**Fonte:** https://aqeelijaz.com/blog/postgresql-multi-tenant-schema-design (2026-10-05)  
**Espelho RLS Supabase:** [`../referencias/supabase-row-level-security.md`](../referencias/supabase-row-level-security.md)

## Modelos

| Modelo | Quando |
|---|---|
| Shared + `tenant_id` | Default — milhares de tenants |
| Schema-per-tenant | Dezenas–centenas, export fácil |
| DB-per-tenant | Poucos clientes regulados |

## Regras shared schema

1. `tenant_id` em toda tabela de tenant (mesmo em filhos)
2. Unique por tenant: `(tenant_id, email)` / `lower(email)`
3. FK composto `(tenant_id, created_by) → users(tenant_id, id)` para bloquear cross-tenant
4. Índices com `tenant_id` à esquerda
5. `ENABLE` + `FORCE ROW LEVEL SECURITY`
6. Policy com `USING` + `WITH CHECK` via `current_setting('app.current_tenant', true)`
7. App role sem `BYPASSRLS`; migrações com owner
8. Tenant: `set_config(..., true)` / `SET LOCAL` **dentro** da transação (pooler-safe)

## Erros comuns

- Unique global de email entre tenants
- Índice sem `tenant_id` leading
- App como owner (bypassa RLS)
- `SET` de sessão atrás de PgBouncer transaction mode
- FK single-column permitindo user de outro tenant
