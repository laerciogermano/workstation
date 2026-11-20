# Deploy Contabo — Connect Max API

| Item | Valor |
|------|--------|
| URL | https://connect-max-api.laerciogermano.com |
| Docs | https://connect-max-api.laerciogermano.com/docs |
| Código | `/opt/connect-max-api` |
| Env | `/srv/connect-max-api/.env` |
| Unit | `connect-max-api` |
| Porta | `127.0.0.1:4182` |
| DNS | wildcard `*.laerciogermano.com` → `185.250.37.82` |

## Subir / atualizar

```bash
HOST=185.250.37.82 SSHPASS='…' API_KEY='…' ./deploy/deploy-contabo.sh
```

Credenciais do portal: lidas de `~/.config/conectmax-franqueado/credentials.env` se não vierem em env.

Env útil em `/srv/connect-max-api/.env`: `FRANQUIA_ID=9`, `FRANQUIA_NOME=Campinas`, `EXTRACT_LIMIT=100`.

**Antes → depois:** lab local `portal-api` sem auth → Contabo HTTPS + API key; listagens sem teto / `?franquia_id=` livre → só Campinas + teto 100 (sem query).  
**Rollback:** `systemctl stop connect-max-api`; `rm` site nginx `api-conectmax`; `certbot delete --cert-name connect-max-api.laerciogermano.com`; apagar `/opt/connect-max-api` e `/srv/connect-max-api`.
