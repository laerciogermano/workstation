# Blueprint de mudança de schema

**Fonte:** https://postgresql.codeguides.io/migrations-schema-change/schema-change-blueprint/  
**Espelho parcial:** conteúdo pesquisado 2026-11-08

## Insight

Risco ≠ SQL correto. Risco = **lock** + tempo na fila. `ALTER` rápido pode congelar produção se esperar lock forte atrás de transação longa.

## Fundamentos

- Maioria do DDL é transacional (rollback limpo)
- Exceções: `CREATE INDEX CONCURRENTLY`, `VACUUM` — fora de bloco de transação
- `lock_timeout` na sessão de migração → falha visível, não fila silenciosa

## Padrões

```sql
ALTER TABLE orders ADD COLUMN priority int; -- barato se sem default volátil

CREATE INDEX CONCURRENTLY idx_orders_priority ON orders (priority);

ALTER TABLE orders ADD CONSTRAINT priority_positive
  CHECK (priority > 0) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT priority_positive;
```

## Expand / contract

1. Expand — adicionar forma nova (compatível)
2. Migrate — backfill em batches + dual-write
3. Contract — dropar forma antiga depois do cutover

Ferramenta (Flyway/Liquibase/ORM) garante **ordem/idempotência**, não segurança de lock.

## Misconceptions

- “Todo DDL em BEGIN é sempre ok” — nem CONCURRENTLY
- “ALTER rápido não derruba prod” — fila de lock sim
- “Ferramenta de migração = safe” — não avalia lock
