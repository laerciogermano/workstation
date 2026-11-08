# Spec-Kit: Scaffolding Projects with AI Coding Assistants

Source: https://sriaradhyula.github.io/posts/spec-kit-scaffolding-with-ai-coding-assistants/
Posted: Mar 16, 2026 (updated Mar 17, 2026)
Downloaded: 2026-11-08

## What Is Spec-Kit?

Spec-kit is a Spec-Driven Development (SDD) framework from GitHub. Specifications are the source of truth; code is the output.

Core pieces:
1. `.specify/` directory — institutional memory
2. constitution — governing principles agents/engineers must follow
3. Templates — specs, plans, tasks, checklists
4. Slash commands — work in both Claude Code and Cursor

## Workflow

```
/speckit.specify <description>   → spec.md    (what and why)
/speckit.plan <tech choices>     → plan.md    (how)
/speckit.tasks                   → tasks.md   (execution order)
/speckit.implement               → source code + tests
```

### Constitution
Lives at `.specify/memory/constitution.md`. Non-negotiable principles (spec as source of truth, test-first quality gates, simplicity/YAGNI).

Bug tiers:
- Tier 1 Spec Violation → fix code
- Tier 2 Spec Gap → update spec then code
- Tier 3 Design Flaw → restart with /speckit.specify

### Tooling
- Cursor: commands in `.cursor/commands/`
- Claude Code: commands in `.claude/commands/` + CLAUDE.md referencing constitution/gates
- Install: `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git` then `specify init --here --ai cursor-agent` (or `--ai claude`)

Repo: https://github.com/github/spec-kit
