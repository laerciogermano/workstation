# Fórmulas e templates — segurança

Anexar [`../SEGURANCA.md`](../SEGURANCA.md) + **um** espelho de [`../referencias/`](../referencias/README.md) quando a dúvida for específica.

## 1. Review de PR / diff

```text
Faça security review deste diff (só mudanças).
Stack: Node/TS + [Nest|Express] + React + Postgres + Docker.
Siga SEGURANCA.md e a skill owasp-audit (categorias Top 10:2025).
Para cada finding: Severity | arquivo:linha | problema | fix concreto.
Ignore ruído teórico sem caminho de exploração no código.
Não invente vulnerabilidade sem evidência no diff.
```

## 2. Auditoria de superfície (API)

```text
Inventarie rotas/jobs/webhooks/uploads admin.
Para cada superfície: authn? authz por recurso? validação? rate limit?
Liste gaps com CWE/OWASP e prioridade.
Refs: referencias/backend/rest-security.md + authorization.md + idor-prevention.md
```

## 3. Hardening ao implementar feature

```text
Implemente [feature] com defaults de SEGURANCA.md.
Antes de codar: ameaças nas trust boundaries tocadas.
Validação allowlist na borda; queries parametrizadas; sem segredo no client.
Inclua teste negativo mínimo (IDOR / unauth / inject) se tocar auth ou dados.
```

## 4. Frontend (XSS/CSRF/CSP)

```text
Revise a UI/React desta mudança contra XSS, CSRF e headers.
Refs: frontend/xss-prevention.md + csrf-prevention.md + content-security-policy.md
Flag: dangerouslySetInnerHTML, URLs abertas, cookies sem flags, CORS permissivo.
```

## 5. Infra / Docker / CI

```text
Revise Dockerfile, compose e workflows contra
referencias/infra/docker.md + cicd.md + github-actions.md + secrets-management.md
Checklist: non-root, pin digest/tag, secrets só via secret store, sem privileged.
```

## 6. Multi-tenant / RLS

```text
Confirme isolamento por tenant: filtro na app + RLS FORCE no Postgres.
Refs: backend/multi-tenant.md + espelho supabase-row-level-security.md + pacote 06.
Teste: usuário A não lê/escreve recurso de B (IDOR).
```

## 7. Agente / LLM / MCP

```text
Revise prompts, tools e MCP contra prompt injection e tool abuse.
Refs: geral/llm-prompt-injection.md + ai-agent-security.md + mcp-security.md
Separar dados não confiáveis de instruções; allowlist de tools; sem segredo no contexto.
```
