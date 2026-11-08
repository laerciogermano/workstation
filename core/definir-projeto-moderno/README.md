# Definir projeto moderno

Pacote unificado das pesquisas de **2026-11-08** (arquitetura, stack, design/motion, logo, identidade) para IA iniciar e desenvolver sistema.

## Pastas

| Pasta | Conteúdo |
|---|---|
| [`01-arquitetura/`](01-arquitetura/README.md) | ADR, arc42, C4 lean, prompts, AGENTS.md |
| [`02-boas-praticas-stack/`](02-boas-praticas-stack/referencias/README.md) | Node/TS, React, Postgres, filas, 12-Factor, OWASP |
| [`03-design-ui-motion/`](03-design-ui-motion/modern-2026/MODERN-UI-MOTION.md) | UI 2026, motion, anti-slop |
| [`04-logos/`](04-logos/LOGO.md) | Logos: princípios, prompts, skills SVG |
| [`05-identidade-visual/`](05-identidade-visual/IDENTIDADE-VISUAL.md) | Sistema de marca: cor, tipo, motion, BRAND/tokens |

## Começar

1. Arquitetura: [`01-arquitetura/03-c4-e-lean/architecture-lean-template.md`](01-arquitetura/03-c4-e-lean/architecture-lean-template.md)
2. Stack: [`02-boas-praticas-stack/indices/Boas praticas stack moderna.md`](02-boas-praticas-stack/indices/Boas%20praticas%20stack%20moderna.md)
3. UI/motion: [`03-design-ui-motion/modern-2026/MODERN-UI-MOTION.md`](03-design-ui-motion/modern-2026/MODERN-UI-MOTION.md)
4. Logo: [`04-logos/LOGO.md`](04-logos/LOGO.md)
5. Identidade: [`05-identidade-visual/IDENTIDADE-VISUAL.md`](05-identidade-visual/IDENTIDADE-VISUAL.md)

## Cópias no workspace

- `02` → `e-notas/beta-docs/referencias/`
- `03` → `.cursor/design-refs/modern-2026/` + skill `.cursor/skills/modern-ui-motion/`
- `04` → skill `.cursor/skills/logo-identidade/`
- `05` → skill `.cursor/skills/identidade-visual/`

## Rollback

Remover `core/definir-projeto-moderno/`. Restaurar arquitetura com `git checkout` do commit anterior se a pasta `arquitetura-definicao-moderna/` na raiz tiver sido movida.
