# Práticas — Connect Max API

Checklist a partir do PRD + benchmark + [`core/02-boas-praticas-stack`](../../../core/definir-projeto-moderno/02-boas-praticas-stack/README.md) + [`07-seguranca`](../../../core/definir-projeto-moderno/07-seguranca/SEGURANCA.md).

## Fazer

- [ ] API key só em env (`API_KEY`); comparação timing-safe
- [ ] Rotas de dados exigem auth; `/health` e acme livres
- [ ] OpenAPI com `securitySchemes` + UI Swagger
- [ ] Bind `127.0.0.1`; TLS no nginx; HSTS via certbot
- [ ] Credenciais do portal e DB só em `/srv/.../.env` (mode 600)
- [ ] Erros genéricos ao client; detalhe no log
- [ ] Graceful SIGTERM; systemd `Restart=on-failure`
- [ ] Docs com caminho inverso (rollback deploy)

## Não fazer

- [ ] Segredo no git / OpenAPI exemplo com chave real versionada
- [ ] `Access-Control-Allow-Origin: *` com credenciais
- [ ] Expor mutações do portal
- [ ] Confiar só em firewall sem auth de app
