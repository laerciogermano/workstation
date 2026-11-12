# ADR-0002 · Fastify 5 + Zod na borda

- Status: aceito · 2026-11-09

## Contexto
O pacote de referência aceita Express ou Fastify; pede validação runtime, Helmet, logs Pino e shutdown gracioso.

## Decisão
Fastify 5 (Pino nativo, `inject` para testes, plugins oficiais de helmet/cors/rate-limit). Toda entrada passa por `parse(Schema)` de `@fitness/contracts`; erros de negócio são `AppError` com `code` estável.

## Consequências
+ Testes de integração rápidos sem abrir porta; contrato verificado nas respostas.
− Sem geração automática de OpenAPI no v1 (os schemas Zod são o contrato).
