# Fontes baixadas

Data da coleta: 2026-11-08.

## ADR

| Artefato | Origem |
|---|---|
| MADR 4.0 templates | https://github.com/adr/madr/tree/4.0.0/template (tag `4.0.0`, set/2024) |
| Site MADR | https://adr.github.io/madr/ |
| Nygard blog (2011) | https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions |
| adr-tools template | https://github.com/npryce/adr-tools (`src/template.md`) |
| Y-statement / ADR templates | https://adr.github.io/adr-templates/ |

## Documentação de arquitetura

| Artefato | Origem |
|---|---|
| arc42 EN plain + with-help (GitHub Markdown) | https://github.com/arc42/arc42-template/releases/latest — release **2026.10.19**, EN 9.1 |
| Download hub | https://arc42.org/download/ |
| Lean architecture template (C4) | https://www.archyl.com/blog/software-architecture-documentation-template |
| SAD + C4 + Mermaid (EN + pt-BR) | https://github.com/liemqv/sad-adr-best-practices |
| C4 model | https://c4model.com/ |

## Prompts / agentes

| Artefato | Origem |
|---|---|
| System Architect (AgentsCamp) | https://agentscamp.com/agents/core-development/system-architect (atualizado 2025-08-22) |
| system-architect (dot-claude) | https://github.com/samhvw8/dot-claude/blob/main/agents/system-architect.md |
| arch-system-design | https://github.com/Menschlichkeit-Osterreich/menschlichkeit-oesterreich/blob/main/.claude/agents/architecture/arch-system-design.md |
| design command | https://github.com/wtthornton/TappsCodingAgents/blob/main/.claude/commands/design.md |
| Cursor Plan Mode + ADR loop | https://developertoolkit.ai/en/cursor-ide/plan/architecture/ |

## AGENTS.md e ADR agent-first

| Artefato | Origem |
|---|---|
| AGENTS.md | https://agents.md/ — repo https://github.com/agentsmd/agents.md |
| Vercel AI adr-skill | https://github.com/vercel/ai/tree/main/skills/adr-skill |

## Como atualizar

```bash
# MADR
curl -fsSL https://raw.githubusercontent.com/adr/madr/4.0.0/template/adr-template.md -o 01-adr/madr-4/adr-template.md

# arc42 latest EN
curl -fsSL https://github.com/arc42/arc42-template/releases/latest/download/arc42-template-EN-withhelp-gitHubMarkdown.zip -o /tmp/arc42.zip
```
