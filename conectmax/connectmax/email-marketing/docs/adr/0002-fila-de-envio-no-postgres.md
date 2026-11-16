# 2. Fila de envio na tabela `deliveries` (Postgres SKIP LOCKED), sem Redis/BullMQ

Data: 2026-11-16 · Status: aceito

## Contexto

O disparo precisa gravar os destinatários e enfileirar o envio. O guia (`arquitetura-filas.md`) alerta: nunca gravar no banco e na fila separadamente sem estratégia de transação (outbox). O default dele é BullMQ + Redis + outbox.

## Decisão

A própria tabela `deliveries` é a fila. O disparo insere as entregas e muda o status da campanha na **mesma transação**. O worker reserva lotes com `FOR UPDATE SKIP LOCKED`, com retry/backoff e recuperação de travas órfãs.

## Consequências

- Sem dual-write: commit do disparo ⇒ entregas na fila, sempre. Dispensa outbox.
- Um serviço a menos (Redis com AOF/noeviction) para operar.
- O progresso (CU-05) é um `count ... filter` sobre a mesma tabela.
- Semântica at-least-once, como no BullMQ; consumidores precisam tolerar reenvio raro.
- Limite: dezenas de milhares de envios por hora cabem tranquilos. Se o volume crescer muito, reavaliar com BullMQ, mantendo `deliveries` como outbox.
