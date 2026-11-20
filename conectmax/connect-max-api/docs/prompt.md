# Prompt gerador — Connect Max API

Papel: API Node (ESM) que autentica no portal franqueado Conect e expõe GETs JSON, com API key de aplicação, OpenAPI/Swagger e deploy Contabo.

Restrições: só leitura; reutilizar parsers de `portal-api`; secrets só em env; deny-by-default; HTTPS atrás de nginx.

Formato: app em `conectmax/connect-max-api/` com `src/`, `docs/`, `deploy/`, OpenAPI, README com URL/rollback.

Critérios: DoD do PRD; práticas do `praticas.md`.

Não fazer: mutações; auth de usuário final; multi-chave; inventar campos fora do HTML do portal.
