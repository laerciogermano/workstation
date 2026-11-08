# Definir projeto moderno

Pacote unificado das pesquisas de **2026-11-08** (arquitetura, stack e design/motion) para IA iniciar e desenvolver sistema.

## Pastas

| Pasta | Origem | Conteúdo |
|---|---|---|
| [`01-arquitetura/`](01-arquitetura/README.md) | ADR, arc42, C4 lean, prompts, AGENTS.md, ADR agent-first | Definição de arquitetura |
| [`02-boas-praticas-stack/`](02-boas-praticas-stack/referencias/README.md) | Node/TS, React, Postgres, filas, 12-Factor, OWASP, IA specs | Espelhos + síntese de mercado |
| [`03-design-ui-motion/`](03-design-ui-motion/modern-2026/MODERN-UI-MOTION.md) | UI 2026, motion, skills, anti-slop | Design/front futurista de bom gosto |

## Começar

1. Arquitetura viva: [`01-arquitetura/03-c4-e-lean/architecture-lean-template.md`](01-arquitetura/03-c4-e-lean/architecture-lean-template.md)
2. Stack: [`02-boas-praticas-stack/indices/Boas praticas stack moderna.md`](02-boas-praticas-stack/indices/Boas%20praticas%20stack%20moderna.md)
3. UI/motion: [`03-design-ui-motion/modern-2026/MODERN-UI-MOTION.md`](03-design-ui-motion/modern-2026/MODERN-UI-MOTION.md)

## Cópias no workspace

- `02` também vive em `e-notas/beta-docs/referencias/` (uso do Beta)
- `03` também vive em `.cursor/design-refs/modern-2026/` + skill `.cursor/skills/modern-ui-motion/`

## Rollback

Remover `core/definir-projeto-moderno/`. Restaurar arquitetura com `git checkout` do commit anterior se a pasta `arquitetura-definicao-moderna/` na raiz tiver sido movida.
