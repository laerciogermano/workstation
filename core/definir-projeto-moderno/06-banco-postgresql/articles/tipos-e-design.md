# Tipos e design de tabela

**Fonte:** https://schoolofweb.net/en/posts/postgres-basics-2-table-design-data-types/ (2026-08-15)  
**Espelho/contexto:** veredito em [`../POSTGRES.md`](../POSTGRES.md)

## Takeaways

- Strings: default `text`; limite de negócio via `CHECK (char_length(...) <= N)`, não `varchar(n)` por performance.
- Inteiros: começar em `bigint`; `numeric` para dinheiro/taxas; `float` só onde aproximação ok.
- Tempo: default `timestamptz` (instante absoluto em UTC). `timestamp` sem TZ = bugs de fuso. Exceção: horário de parede (abertura de loja) → `time`/`date`.
- PK: default `bigint GENERATED ALWAYS AS IDENTITY`. UUID quando geração distribuída ou ID não enumerável; preferir **v7** (localidade B-tree). Compromisso comum: bigint interno + UUID público.
- Integridade no banco: `NOT NULL` default, `CHECK`, `REFERENCES`. Status: `text + CHECK` no início; `enum` só domínio realmente fechado.
- Arrays (`text[]`) para multi-valores leves; buscar com GIN.

## SQL canônico

```sql
CREATE TABLE orders (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    bigint NOT NULL REFERENCES users (id),
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  amount_usd numeric NOT NULL CHECK (amount_usd >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
```
