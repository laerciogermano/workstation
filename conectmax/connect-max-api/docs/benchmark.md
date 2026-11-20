# Benchmark — Connect Max API

| Referência | O que funciona | Pegar | Evitar |
|---|---|---|---|
| [`portal-api`](../../portal-api/README.md) lab | GETs + parsers + OpenAPI local | Reusar parsers/rotas | Expor sem auth; bind só localhost sem proxy |
| [`email-marketing` Contabo](../../connectmax/email-marketing/deploy/README.md) | nginx + systemd + `.env` em `/srv` | Mesmo padrão de deploy | Copiar stack de DB/worker sem necessidade |
| Stripe / GitHub API keys | Bearer + docs com “Authorize” | `Authorization: Bearer` + `X-API-Key` | Chave no query string |
| OWASP API Top 10 | Broken auth / excess data | Deny-by-default; health sem dados | Stack trace ao client |
| Portal franqueado HTML | Fonte real dos dados | Mapa [`GETS.md`](../../portal-api/GETS.md) | Inventar REST no PHP remoto |
