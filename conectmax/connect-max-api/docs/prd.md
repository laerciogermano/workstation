# PRD — Connect Max API

## Contexto

O Portal do Franqueado Conect (`franqueado.conectmax.com`) concentra orçamentos, pedidos, NFs, faturas, faturamento, fluxo, chamados e notificações — só via HTML/sessão PHP. Já existe um lab local (`portal-api`) que faz login e expõe GETs em JSON, sem autenticação de aplicação e sem publicação.

Consumidores (agentes, dashboards, integrações) precisam de uma API estável na Contabo, com documentação OpenAPI e chave de aplicação.

## Dor

Sem API autenticada e publicada, cada integração reimplementa scrape/login ou depende de processo local sem controle de acesso. Não há URL canônica, contrato OpenAPI operacional nem credencial de app para terceiros internos.

## Objetivo

Publicar **Connect Max API** na Contabo expondo **todos os GETs de leitura** do portal franqueado (e réplica `/db/*` quando disponível), com **autenticação por token de aplicação**, Swagger/OpenAPI e entrega de URL + chave.

## Definition of Done

- [x] PRD + docs de exploração mínimos (benchmark, práticas, escolha) no repo
- [x] Todos os GETs do mapa portal (faturas, orçamentos, pedidos, pedidos/:id, notas-fiscais, faturamento, fluxo-previsto, chamados, notificações, catalog/health/docs) respondem JSON
- [x] Auth de aplicação: header `Authorization: Bearer <API_KEY>` ou `X-API-Key` (deny-by-default; `/health` público)
- [x] OpenAPI 3 + UI `/docs` com security scheme e exemplos de entrada/saída
- [x] Publicado na Contabo (HTTPS), processo systemd + nginx
- [x] Entregue ao solicitante: URL base, URL da documentação, chave de API

## Fora de escopo

- Mutações (POST: quitar, status, duplicar, login de usuário final)
- Multi-tenant por franquia na chave (uma chave = conta portal configurada)
- UI de gestão de chaves / rotação self-service
- Substituição do portal HTML
