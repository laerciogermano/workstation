# Segurança

Pacote para a IA **desenhar e revisar** sistemas seguros: referências OWASP, skills, prompts e agentes (backend, frontend, infraestrutura, processo/IA).

## Começar

1. [`SEGURANCA.md`](SEGURANCA.md)
2. Checklist: [`sintese/checklist-seguranca.md`](sintese/checklist-seguranca.md)
3. Prompt: [`prompts/FORMULAS-E-TEMPLATES.md`](prompts/FORMULAS-E-TEMPLATES.md)
4. Skill preferida (auditoria): [`skills/owasp-audit/SKILL.md`](skills/owasp-audit/SKILL.md)
5. Skill preferida (código novo): [`skills/secure-coding/SKILL.md`](skills/secure-coding/SKILL.md)
6. Fontes: [`SOURCES.md`](SOURCES.md)

## Pastas

| Pasta | Conteúdo |
|---|---|
| [`SEGURANCA.md`](SEGURANCA.md) | Veredito: defaults, fluxo, anti-padrões |
| [`prompts/`](prompts/README.md) | Templates de review / hardening |
| [`skills/`](skills/README.md) | Skills de audit, secure coding, review |
| [`agents/`](agents/) | Agentes security-auditor / Claude Security |
| [`sintese/`](sintese/checklist-seguranca.md) | Checklist por superfície |
| [`referencias/`](referencias/README.md) | Espelhos OWASP + Top 10 + Nest/Express |

## Relação

- Stack: [`../02-boas-praticas-stack/`](../02-boas-praticas-stack/README.md) (espelhos Node/React/Postgres; pasta `seguranca/` aponta para cá)
- Banco / RLS: [`../06-banco-postgresql/`](../06-banco-postgresql/README.md)
- Skill Cursor: [`.cursor/skills/seguranca/`](../../../.cursor/skills/seguranca/SKILL.md)

## Rollback

Remover `core/definir-projeto-moderno/07-seguranca/` e `.cursor/skills/seguranca/`. Restaurar ponteiro em `02-boas-praticas-stack/referencias/seguranca/README.md` se necessário.
