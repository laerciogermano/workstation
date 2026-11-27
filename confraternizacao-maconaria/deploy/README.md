# Deploy — confraternizacao.laerciogermano.com

| | |
|--|--|
| **App** | https://confraternizacao.laerciogermano.com/ |
| **Protótipo** | https://confraternizacao.laerciogermano.com/prototipo/ (`v1/` · `v2/` · `v3/`) |
| **Host** | Contabo `185.250.37.82` |
| **App** | `/opt/confraternizacao/app` · systemd `confraternizacao` · Node `:3333` |
| **Protótipo** | `/opt/confraternizacao/prototipo` |
| **DB** | Docker `postgres:18-alpine` (`confraternizacao-db-1`) em `127.0.0.1:5439` |
| **Env** | `/srv/confraternizacao/.env` (fora do git) |
| **nginx** | site `confraternizacao` · TLS Let’s Encrypt |
| **DNS** | Hostinger (zona `laerciogermano.com`) · A `confraternizacao` → `185.250.37.82` |

**Antes → depois:** só HTML estático em `/opt/confraternizacao` → SPA+API em `/` e protótipo em `/prototipo/`.

## Republicar

```bash
SSHPASS='…' bash deploy/publicar.sh
```

Demo Contabo: `DEV_TOOLS=true` + `ALLOW_SEED=true` + `SEED_PASSWORD=Confrat@125` (códigos MFA na tela). Contas: `paulo.ribeiro@exemplo.com`, `roberto.almeida@exemplo.com`, `ana.ribeiro@exemplo.com`.

## Rollback

1. Voltar ao estático: colocar o conteúdo de `prototipo/` de novo na raiz de `/opt/confraternizacao`, restaurar nginx só com `try_files` (sem proxy), `systemctl stop confraternizacao`, `docker compose -f /opt/confraternizacao/app/docker-compose.yml down`
2. Remover tudo: `systemctl disable --now confraternizacao`; `rm /etc/nginx/sites-enabled/confraternizacao /etc/nginx/sites-available/confraternizacao`; `rm -rf /opt/confraternizacao /srv/confraternizacao`; `nginx -t && systemctl reload nginx`
3. `certbot delete --cert-name confraternizacao.laerciogermano.com`
