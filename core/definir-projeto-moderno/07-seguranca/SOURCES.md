# Fontes — segurança

**Data:** 2026-11-09  
**Entrada:** [SEGURANCA.md](SEGURANCA.md)

## Skills (baixadas)

| Pasta | Origem |
|--------|--------|
| `skills/owasp-audit/` | https://github.com/briiirussell/cybersecurity-skills (skills/owasp-audit) |
| `skills/security-review-oktsec/` | https://github.com/oktsec/security-review |
| `skills/auditing-security/` | https://github.com/spencerpauly/awesome-cursor-skills (resources/auditing-security) |
| `skills/vulnerability-scanner/` | https://github.com/DangTinh040203/cursor-kit |
| `skills/secure-coding/` | https://github.com/aethrox/doctrine (skills/secure-coding) |
| `skills/security-audit/` | https://github.com/Nordic-AI/production-readiness-skills |
| `skills/secure/` | https://github.com/angad-kandhari/deliberate (skills/secure) |
| `skills/appsec-expert/` | https://github.com/martinholovsky/claude-skills-generator |
| `skills/engineering-security-engineer/` | https://github.com/peterhdd/agent-skills |
| `skills/security-analysis/` | https://github.com/Geek1498/security-analysis-skill |
| `skills/review-security-cursor/` | Cursor local `~/.cursor/skills-cursor/review-security` |
| `skills/claude-security/` | Plugin Claude `claude-security` (SKILL + jobs + specs) |

## Agents

| Arquivo | Origem |
|---------|--------|
| `agents/security-auditor.md` | Claude plugin `code-modernization` |
| `agents/claude-security.md` + scan/patch agents | Claude plugin `claude-security` |

## Referências OWASP (espelhos em `referencias/`)

| Pasta | Conteúdo | Canônico |
|-------|----------|----------|
| `referencias/backend/` | Auth, authz, REST, JWT, inject, Node/TS, Nest HTML, Express, RLS… | https://cheatsheetseries.owasp.org |
| `referencias/frontend/` | XSS, CSRF, CSP, headers, HSTS, cookies… | idem |
| `referencias/infra/` | Docker, K8s, CI/CD, IaC, TLS, supply chain… | idem |
| `referencias/geral/` | Threat model, secure review, AI/LLM/MCP, Top 10 2021… | OWASP Top10 + CheatSheetSeries |
| `referencias/asvs/` | Indexes ASVS / Top Ten / Proactive Controls / MASVS | CheatSheetSeries Index* |

Raw usado: `https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/<Nome>_Cheat_Sheet.md`

## Nest / Express / Supabase

| Arquivo | URL |
|---------|-----|
| `backend/nestjs-docs/*.html` | https://docs.nestjs.com/security/* |
| `backend/express-production-security.md` | espelho de `02-boas-praticas-stack` |
| `backend/supabase-row-level-security.md` | espelho de `06-banco-postgresql` |

## Notas

- Preferir **owasp-audit** (auditoria) + **secure-coding** (implementação); oktsec/security-audit como segunda opinião.
- Não colar ASVS inteiro no prompt — usar index + um cheat sheet pontual.
- Licenças: OWASP CC BY-SA; skills conforme LICENSE de cada repo.
