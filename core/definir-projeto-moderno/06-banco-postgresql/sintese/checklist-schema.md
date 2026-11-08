# Checklist — schema PostgreSQL

Antes de mergear DDL / migration / schema ORM:

## Modelo

- [ ] Entidades e cardinalidade explícitas (1:1, 1:N, N:M)
- [ ] 3NF por default; denormalização só com query nomeada
- [ ] 5–10 queries críticas listadas (filtro + sort)

## Tipos e chaves

- [ ] PK: `bigint identity` interno e/ou `uuid` v7 público conforme POSTGRES.md
- [ ] `text` (não `varchar(255)` por hábito); comprimento via `CHECK`
- [ ] `timestamptz` em todo instante absoluto
- [ ] Dinheiro/`taxa` em `numeric`
- [ ] Sem `float` para valores exatos

## Constraints

- [ ] `NOT NULL` onde o domínio exige
- [ ] `UNIQUE` / unique parcial (soft delete, case-insensitive)
- [ ] `CHECK` para enums de status / ranges
- [ ] Toda FK com `ON DELETE` explícito
- [ ] Multi-tenant: unique/FK compostos com `tenant_id` quando necessário

## Índices

- [ ] Todo FK indexado
- [ ] Índices compostos na ordem das queries
- [ ] Parciais para soft-delete / status enviesado
- [ ] Sem índice “por precaução”

## Auditoria / delete

- [ ] `created_at` / `updated_at`; `updated_at` atualiza de verdade
- [ ] Soft delete só em roots; `deleted_at` + unique parcial
- [ ] Plano de hard-delete / retenção se PII

## Multi-tenant / RLS (se aplicável)

- [ ] `tenant_id` em tabelas de tenant
- [ ] RLS enable + force; USING + WITH CHECK
- [ ] App role ≠ owner/superuser
- [ ] Tenant via `SET LOCAL` / `set_config(..., true)`

## Migração

- [ ] Versionada; revisão em CI
- [ ] Breaking = expand / contract
- [ ] Índices em tabela viva = `CONCURRENTLY`
- [ ] Constraints = `NOT VALID` → `VALIDATE`
- [ ] `lock_timeout` em sessão de migração
- [ ] Rollback ou forward-fix documentado

## Verificação

- [ ] Teste: insert proibido rejeitado pelo banco
- [ ] EXPLAIN das queries quentes (ou walk manual)
- [ ] Comentário `COMMENT ON` em tabelas novas (opcional, estilo Supabase)
