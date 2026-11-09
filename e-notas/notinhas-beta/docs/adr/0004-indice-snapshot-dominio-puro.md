# 0004 — Índice de preços em snapshot + regras puras

**Data:** 2026-11-09 · **Status:** Aceita

## Contexto
RN-10 (ranking por mediana relativa), RN-11 (destaque ≥ 5% e ≥ R$ 0,50 abaixo da mediana 14 d) e RN-13 (cotação sem interpolar) precisam ser idênticas em todas as telas e fáceis de testar. Em SQL, cada uma vira uma consulta longa e difícil de provar; o Beta tem poucas lojas.

## Decisão
`catalog/price-index.ts` carrega `v_price_observations` dos últimos 180 dias + lojas + fichas num snapshot com TTL de 15 s (uma carga por vez), invalidado após ingestão/vínculo/moderação. As rotas aplicam as funções de `packages/domain`.

## Consequências
+ Regras testadas por unidade com os números do protótipo (ex.: Monster −19% vs mediana R$ 10,99).
− Memória e tempo de carga crescem com o volume. **Gatilho:** > 500 mil observações na janela ou carga > 300 ms → materialized view por (gtin, loja) com a última observação + mediana, atualizada por job; as funções do domínio continuam como oráculo de teste.
