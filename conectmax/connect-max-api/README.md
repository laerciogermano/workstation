# Connect Max API

API publicada que expõe os **GETs de leitura** do [Portal do Franqueado](https://franqueado.conectmax.com/) em JSON, com autenticação por token de aplicação.

- **PRD:** [`docs/prd.md`](docs/prd.md)
- **Mapa GETs:** [`GETS.md`](GETS.md)
- **OpenAPI:** [`openapi.yaml`](openapi.yaml) · UI `/docs`

## Produção (Contabo)

| Item | Valor |
|------|--------|
| URL | https://connect-max-api.laerciogermano.com |
| Docs | https://connect-max-api.laerciogermano.com/docs |
| Código | `/opt/connect-max-api` |
| Env | `/srv/connect-max-api/.env` |
| Unit | `connect-max-api` |
| Porta | `127.0.0.1:4182` |

Auth: `Authorization: Bearer <API_KEY>` ou `X-API-Key: <API_KEY>`.  
Públicos: `/health`, `/docs`, `/openapi.json`, `/openapi.yaml`. Demais rotas exigem chave (no Swagger: **Authorize**).

## Local

```bash
cp .env.example .env   # preencher API_KEY + USER/PASS portal
npm install
npm start              # http://127.0.0.1:4180
```

## Deploy

```bash
HOST=185.250.37.82 SSHPASS='…' API_KEY='…' ./deploy/deploy-contabo.sh
```

## Caminho inverso

- Parar: `systemctl stop connect-max-api`
- Remover site: `rm /etc/nginx/sites-enabled/api-conectmax`; `certbot delete --cert-name connect-max-api.laerciogermano.com`; reload nginx
- Apagar código/env: `rm -rf /opt/connect-max-api /srv/connect-max-api`
- Lab anterior sem auth: [`../portal-api/README.md`](../portal-api/README.md)
