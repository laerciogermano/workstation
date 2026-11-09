# security-analysis-skill

A security audit skill for **11 AI coding agents**. Performs a comprehensive, evidence-based security audit of your codebase following the OWASP Top 10 (2021) with framework-specific checks for **Laravel**, **Next.js**, **ASP.NET Core C#**, **React**, and **GraphQL**.

## Supported Agents

| Agent | Scope | Instruction file |
|---|---|---|
| GitHub Copilot | User | `~/.agents/skills/security-analysis-skill/` |
| Claude Code | User | `~/.claude/CLAUDE.md` |
| Codex CLI | User | `~/.codex/instructions.md` |
| Cursor | User | `~/.cursor/rules/security-analysis-skill.mdc` |
| Gemini CLI | User | `~/.gemini/GEMINI.md` |
| Zed | Project (cwd) | `.rules` |
| Windsurf | Project (cwd) | `.windsurfrules` |
| Cline | Project (cwd) | `.clinerules` |
| Aider | Project (cwd) | `CONVENTIONS.md` |
| Continue.dev | Project (cwd) | `.continuerules` |
| Amazon Q Developer | Project (cwd) | `.amazonq/rules/security-analysis.md` |

**User-scoped** agents are configured once and active in every project.  
**Project-scoped** agents are configured per-project — run the install command inside the project you want to audit.

## Install

```bash
npx security-analysis-skill
```

```bash
pnpm dlx security-analysis-skill
```

Installs for **all 10 agents** by default. Target specific agents with `--agent=`:

```bash
# Single agent
npx security-analysis-skill --agent=copilot

# Multiple agents
npx security-analysis-skill --agent=claude,cursor,codex

# Only user-level agents (global, all projects)
npx security-analysis-skill --agent=user

# Only project-level agents (run inside your project directory)
npx security-analysis-skill --agent=project
```

## Uninstall

```bash
# All agents
npx security-analysis-skill --uninstall

# Specific agents
npx security-analysis-skill --uninstall --agent=cursor,claude
```

## Usage

After installing, restart your editor or agent, then ask:

> *"audit my code for security issues"*

GitHub Copilot users can also use the slash command: `/security-analysis-skill`

The skill produces a structured checklist report with  PASS,  FAIL,  PARTIAL, or ➖ N/A for each check.

## What It Checks

| Category | Checks |
|---|---|
| Secrets & Configuration | Hardcoded secrets, `.env` in git, secrets management |
| Authentication & Sessions | Password hashing, session handling, JWT security |
| Authorisation | IDOR, privilege escalation, role-based access |
| Input Validation & Injection | SQLi, SSTI, command injection, file uploads |
| XSS | Output escaping, CSP, `dangerouslySetInnerHTML` |
| CSRF | Token validation, SameSite cookies |
| Security Headers | HSTS, X-Frame-Options, CSP, COOP, CORP |
| Cryptography | TLS enforcement, weak ciphers, encryption at rest |
| Dependencies | Known CVEs, lockfiles, abandoned packages |
| Error Handling & Logging | Stack trace exposure, sensitive data in logs |
| Rate Limiting & DoS | API rate limits, upload limits, ReDoS |
| SSRF | URL allowlists, private IP blocking |
| Open Redirects | Redirect validation, return URL restrictions |
| CORS | Wildcard origins, credential leaks |
| Deserialization | Unsafe deserializers, type discrimination |
| XXE | External entity resolution, DTD processing |
| Exposed Files | `.git/` access, backup files, debug pages |
| Deployment | Container security, debug ports, CI/CD secrets |

## License

MIT
