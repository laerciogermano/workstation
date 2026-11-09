# Checklist de segurança (aprovação)

Use antes de merge / go-live. Marque N/A só com motivo.

## Authn / sessão

- [ ] Credenciais com KDF moderno (Argon2id/bcrypt)
- [ ] Cookie sessão: HttpOnly + Secure + SameSite (ou JWT curto + refresh rotacionado)
- [ ] Reset/OTP com TTL curto; sem enumeração óbvia de usuário
- [ ] MFA em contas admin (se aplicável)

## Authz

- [ ] Deny-by-default em rotas novas
- [ ] Checagem de ownership/tenant **por objeto** (anti-IDOR)
- [ ] Admin/BFLA testado com token de usuário comum
- [ ] Jobs/consumers também autorizam (não só HTTP)

## Input / inject

- [ ] Validação allowlist na borda
- [ ] SQL/ORM parametrizado; sem concatenação
- [ ] Sem `exec`/`eval` com input; paths canonicalizados
- [ ] Upload: tipo/tamanho; storage seguro

## Frontend / HTTP

- [ ] Output escapado; sem HTML cru de usuário
- [ ] CSRF coberto (token ou SameSite estrito + método seguro)
- [ ] CSP / Helmet / HSTS em produção
- [ ] CORS sem `*` com credenciais

## Secrets / dados

- [ ] Nenhum segredo no git, logs ou bundle client
- [ ] `.env` no `.gitignore`; CI usa secret store
- [ ] Erros sem stack/PII ao client
- [ ] PII mínima; multi-tenant isolado (RLS se SaaS)

## Infra / supply chain

- [ ] Imagem non-root; tag/digest pinado
- [ ] Lockfile + audit SCA no CI
- [ ] Actions/workflows sem secret em plaintext
- [ ] Rate limit em auth/upload/endpoints caros

## Evidência

Findings ou “limpo” com superfícies cobertas (skill owasp-audit / security-review).
