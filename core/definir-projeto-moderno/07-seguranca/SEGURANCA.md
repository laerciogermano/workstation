# Segurança — veredito para IA

Pacote canônico para **ajustar o sistema** (e cada PR) contra falhas reais de AppSec: acesso, auth, injecção, secrets, headers, containers e supply chain.

Stack-alvo deste lab: **Node/TS + API (Nest/Express) + React + PostgreSQL + Docker/CI**.

## 1. Defaults (congelar cedo)

| Decisão | Default |
|---|---|
| Authn | Sessão httpOnly + Secure + SameSite, ou JWT curto (access) + refresh rotacionado |
| Password | Argon2id (ou bcrypt custo alto); nunca MD5/SHA* sozinho |
| Authz | Deny-by-default; checagem **por recurso** no servidor (anti-IDOR) |
| Input | Validação allowlist na borda (Zod/DTO); parameterized queries |
| Secrets | Só env / secret manager; nunca no repo, logs ou bundle client |
| HTTP | HTTPS + HSTS; Helmet/CSP; CORS explícito (sem `*` com credenciais) |
| Upload | Tipo/tamanho allowlist; storage fora do webroot; sem exec de conteúdo |
| Erros | Mensagem genérica ao client; detalhe só em log estruturado |
| Dependências | Lockfile + `npm audit` / SCA no CI; pin de imagens Docker |
| Container | Non-root, read-only FS quando possível, sem `--privileged` |
| Dados | PII mínima; criptografia em trânsito; RLS + filtro app em multi-tenant |
| Rate limit | Auth, reset de senha, upload e endpoints caros |

## 2. Fluxo para a IA

```text
Superfície (rotas, jobs, uploads, webhooks, admin)
  → ameaças (STRIDE / abuse cases) nas trust boundaries
  → controles (authn/authz, validação, crypto, headers)
  → implementação + testes negativos (IDOR, inject, auth bypass)
  → review (skill owasp-audit / security-review) antes de merge
```

- Código novo: [`skills/secure-coding/SKILL.md`](skills/secure-coding/SKILL.md) ou [`skills/secure/SKILL.md`](skills/secure/SKILL.md)
- Auditoria completa: [`skills/owasp-audit/SKILL.md`](skills/owasp-audit/SKILL.md)
- Diff/PR: [`skills/review-security-cursor/SKILL.md`](skills/review-security-cursor/SKILL.md) ou [`agents/security-auditor.md`](agents/security-auditor.md)
- Espelhos: abrir **um** arquivo em [`referencias/`](referencias/README.md) alinhado à dúvida

## 3. Ordem mínima por tipo de task

1. API/rota → `backend/rest-security.md` + `authentication.md` + `authorization.md` / `idor-prevention.md`
2. Login/sessão/JWT → `session-management.md` + `password-storage.md` + `jwt.md`
3. SQL/ORM → `sql-injection-prevention.md` + `query-parameterization.md` + `database.md`
4. UI/React → `frontend/xss-prevention.md` + `csrf-prevention.md` + `content-security-policy.md`
5. Docker/CI → `infra/docker.md` + `cicd.md` + `github-actions.md` + `secrets-management.md`
6. Multi-tenant → `multi-tenant.md` + RLS em `06-banco-postgresql`
7. IA/agente/MCP → `geral/llm-prompt-injection.md` + `ai-agent-security.md` + `mcp-security.md`

## 4. Anti-padrões

- Auth no gateway e **sem** authz por objeto no serviço
- `Access-Control-Allow-Origin: *` com cookies/credenciais
- String concatenada em SQL / `child_process.exec` com input
- Segredo em código, `.env` commitado, ou `NEXT_PUBLIC_*` com chave privada
- JWT sem exp / alg `none` / chave hardcoded
- Stack trace e PII em resposta de erro
- Imagem `latest`, root no container, porta de debug em produção
- Confiar só em validação do client

## 5. Entregáveis esperados

- Controles mapeados às superfícies (ou findings com severidade + arquivo:linha + fix)
- Testes negativos mínimos (IDOR, inject, unauth) quando a mudança toca auth/dados
- ADR só se mudar modelo de auth, tenancy ou trust boundary

## Caminho inverso

Remover este pacote não altera código de produto. Defaults antigos = o que o ADR/contrato do projeto já documentava antes de 2026-11-09.
