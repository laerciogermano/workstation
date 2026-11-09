# 0005 — Schema novo `notinhas`, posse separada do índice

**Data:** 2026-11-09 · **Status:** Aceita · evolui `beta-docs/04-adrs.md` ADR-002

## Contexto
O schema do lab (`enotas`) usa texto para dinheiro/datas, `UNIQUE (nota_id, codigo)` (perde itens repetidos na mesma nota) e `notas.usuario_id` (mistura pessoa com o índice). O pacote `06-banco-postgresql` define defaults: bigint identity, uuid público, centavos, `timestamptz`, FK indexada, integridade no banco.

## Decisão
Schema próprio (padrão `notinhas`, via `DB_SCHEMA`) no mesmo Postgres, com:
- `receipt_items` único por `(receipt_id, line_no)`; centavos `integer`; `issued_at timestamptz`;
- posse em `receipt_owners` (visitante **ou** conta), fora das tabelas fiscais; `v_price_observations` só com colunas fiscais;
- `barcode_links` com origem (scan/sugestão/manual/import) e quem vinculou; `moderation_flags` para divergências;
- pontos como livro-razão idempotente `point_events (kind, ref)`.
Migração de dados do lab por `npm run db:import-lab` (idempotente). Extensões (`citext`, `pg_trgm`) ficam em `public`.

## Consequências
+ Lab e Beta convivem no mesmo banco; corte para produção sem big-bang.
− Duas cópias dos dados até desligar o lab (o import pode rodar de novo).
