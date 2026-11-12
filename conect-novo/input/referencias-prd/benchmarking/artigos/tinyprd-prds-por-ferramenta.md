# PRDs for Lovable vs Cursor vs Claude Code

Fonte: https://www.tinyprd.app/blog/prds-for-lovable-cursor-claude-code  
Autor: Chong-U Lim · 26 Jan 2026  
Uso: como o formato do PRD/prompt muda por ferramenta (dimensão do benchmarking).

## Matriz

| Tool | Melhor para | Estilo de PRD |
|------|-------------|---------------|
| Lovable | greenfield full-stack | Abrangente: stack, features, schema, UI, styling |
| Cursor | codebase existente | Contextual: padrões atuais, arquivos afetados, integration points |
| Claude Code | raciocínio complexo / refactor | Problem-oriented: current→desired, constraints, success, why |
| Bolt | protótipo rápido | Mínimo: one-line goal, core interaction, style, scope limit |
| Windsurf | codebase grande | Cascade edits |
| Replit Agent | exploração | Ambiente all-in-one |

## Esqueletos

### Lovable
Tech stack + feature list completa + DB schema + UI/UX + styling. Incluir dados de exemplo; auth explícito; landing vs auth separados.

### Cursor
Context (stack, patterns, styling) → Changes Required → Files Likely Affected → Integration Points. Mudanças em chunks focados.

### Claude Code
Current State → Desired State → Constraints → Success Criteria → Reasoning Context. Pedir plano + explicação + testes.

### Bolt
One-Line Goal → Core Interaction → Visual Style → Scope Limit. Client-side only; uma feature.

## Princípios universais (do artigo)

1. Specificar tech stack  
2. Definir done (AC)  
3. Escopo + non-goals  
4. Exemplos concretos  
5. Começar simples, iterar  
