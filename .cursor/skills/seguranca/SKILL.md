---
name: seguranca
description: >-
  Aplicar segurança de aplicação (backend, frontend, infra) com o pacote
  core/definir-projeto-moderno/07-seguranca: defaults, checklist, prompts e
  espelhos OWASP. Use ao implementar auth/API/UI/Docker/CI, ao pedir audit,
  hardening, OWASP, IDOR, XSS, CSRF, secrets, RLS ou review de segurança.
---

# Segurança (lab)

Pacote canônico: [`core/definir-projeto-moderno/07-seguranca/`](../../../core/definir-projeto-moderno/07-seguranca/README.md)

## Ordem

1. Ler [`SEGURANCA.md`](../../../core/definir-projeto-moderno/07-seguranca/SEGURANCA.md)
2. Checklist: [`sintese/checklist-seguranca.md`](../../../core/definir-projeto-moderno/07-seguranca/sintese/checklist-seguranca.md)
3. Prompt: [`prompts/FORMULAS-E-TEMPLATES.md`](../../../core/definir-projeto-moderno/07-seguranca/prompts/FORMULAS-E-TEMPLATES.md)
4. Abrir **um** espelho em `07-seguranca/referencias/{backend|frontend|infra|geral}/` conforme a dúvida
5. Skill de audit: `07-seguranca/skills/owasp-audit/` · código novo: `skills/secure-coding/` · PR Cursor: `skills/review-security-cursor/`

## Regras rápidas

- Deny-by-default + authz por recurso (anti-IDOR)
- Validação allowlist; SQL parametrizado; sem segredo no repo/client/logs
- HTTPS/HSTS/Helmet/CSP; CORS explícito
- Container non-root; SCA no CI
- Não colar ASVS inteiro no contexto — index + um cheat sheet

## Precedência

Contrato/ADR do produto vence mercado. Este pacote informa; ADR decide.
