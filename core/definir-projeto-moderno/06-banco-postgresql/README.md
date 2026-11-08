# Banco PostgreSQL

Pacote para a IA **definir** schema PostgreSQL: princípios, prompts, skills baixadas e referências espelhadas.

## Começar

1. [`POSTGRES.md`](POSTGRES.md)
2. [`prompts/FORMULAS-E-TEMPLATES.md`](prompts/FORMULAS-E-TEMPLATES.md)
3. Skill: [`skills/database-schema-designer-onewave/SKILL.md`](skills/database-schema-designer-onewave/SKILL.md)
4. Checklist: [`sintese/checklist-schema.md`](sintese/checklist-schema.md)
5. Fontes: [`SOURCES.md`](SOURCES.md)

## Pastas

| Pasta | Conteúdo |
|---|---|
| [`POSTGRES.md`](POSTGRES.md) | Veredito: defaults, fluxo, naming, anti-padrões |
| [`prompts/`](prompts/README.md) | Templates Cursor + prompts oficiais Supabase |
| [`skills/`](skills/README.md) | Skills de schema, migração, Postgres, Neon |
| [`agents/`](agents/db-guardian.md) | Agentes db-guardian / database-reviewer |
| [`sintese/`](sintese/checklist-schema.md) | Checklist de aprovação de schema |
| [`articles/`](articles/README.md) | Sínteses (SaaS, multi-tenant, tipos, migrações) |
| [`referencias/`](referencias/) | Espelhos baixados (convenções, docs, prompts) |

## Relação

- Stack / ops Postgres: [`../02-boas-praticas-stack/`](../02-boas-praticas-stack/README.md)
- Arquitetura: [`../01-arquitetura/`](../01-arquitetura/README.md)

## Rollback

Remover `core/definir-projeto-moderno/06-banco-postgresql/`.
