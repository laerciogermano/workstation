# Agent instruction files (AGENTS.md / CLAUDE.md) — notes from Agentic Developer Cookbook

Source: https://agenticdevelopercookbook.com/guidelines/planning/code-quality/agent-instruction-files
Downloaded: 2026-11-08 (summary capture)

## Which file
- AGENTS.md = vendor-neutral cross-tool convention (AAIF / Linux Foundation stewardship as of 2026)
- CLAUDE.md = Claude Code equivalent, auto-loaded
- Prefer one canonical file + symlink (e.g. CLAUDE.md → AGENTS.md) to avoid drift

## Must / should include
- Exact build/test/run commands
- Conventions, layout
- Out-of-scope / ask-first actions
- Optional: commit/PR conventions, security gotchas, deployment

## Keep lean
- High-signal only; bloated files get partially ignored (practitioner heuristic)
- Specific and verifiable (commands, paths, named rules)
- Nested per-package files in monorepos; closest wins
