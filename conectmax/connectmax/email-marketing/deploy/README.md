# Deploy Contabo — marketing.conectmax.email

| Item | Valor |
|------|--------|
| URL | https://marketing.conectmax.email |
| Código | `/opt/email-marketing` |
| Env | `/srv/email-marketing/.env` (não versionado) |
| Units | `email-marketing-api` · `email-marketing-worker` |
| Porta | `127.0.0.1:4000` |
| Postgres | DB `email_marketing` @ Docker `/opt/postgres` |
| SMTP | Mailcow `mail.conectmax.email:587` · `marketing@conectmax.email` |
| DNS | Hostinger A `marketing` → `185.250.37.82` |

## Subir / atualizar

```bash
# senha root em credenciais.md § root@185…
HOST=185.250.37.82 SSHPASS='…' OP_PASS='senha-operador-12+' \
  ./deploy/deploy-contabo.sh
```

`OP_PASS` só é usado no seed se informado; `.env` existente não é sobrescrito.

**Antes → depois:** app só local (Mailpit) → Contabo + Mailcow real + HTTPS.  
**Rollback:** `systemctl stop email-marketing-api email-marketing-worker`; `rm` site nginx `marketing-conectmax`; `certbot delete --cert-name marketing.conectmax.email`; apagar A `marketing` na Hostinger; opcional `dropdb email_marketing`.
