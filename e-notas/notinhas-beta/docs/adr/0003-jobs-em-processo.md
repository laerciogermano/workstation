# 0003 — Jobs em processo, sem Redis no Beta

**Data:** 2026-11-09 · **Status:** Aceita

## Contexto
O relatório de stack apontou o gap: geocodificação, nova tentativa da SEFAZ e e-mail “em segundo plano” sem ADR. BullMQ exige Redis com AOF/noeviction e outbox para não perder eventos.

## Decisão
Agendador simples dentro da API (`src/jobs/scheduler.ts`): `setInterval` + fila serial, jobs idempotentes que leem o estado do Postgres (lojas `geocode_status='pending'`, `ingest_failures` com `next_retry_at`, outliers por SQL). O próprio banco é a fila; parada limpa no SIGTERM.

## Consequências
+ Zero infraestrutura nova; tudo reprocessável.
− Com 2+ instâncias os jobs rodariam em duplicidade (são idempotentes, mas gastam rate limit do Nominatim). **Gatilho para revisitar:** segunda instância da API ou fila > 1 min → worker separado + BullMQ + outbox.
