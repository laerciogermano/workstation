# AGENTS.md (official site)

Source: https://agents.md/
Downloaded: 2026-11-08

# AGENTS.md

A simple, open format for guiding coding agents, used by over 60k open-source projects.

Think of AGENTS.md as a README for agents: a dedicated, predictable place to provide the context and instructions to help AI coding agents work on your project.

## Example structure (from site)

## Setup commands
- Install deps: `pnpm install`
- Start dev server: `pnpm dev`
- Run tests: `pnpm test`

## Code style
- TypeScript strict mode
- Single quotes, no semicolons
- Use functional patterns where possible

## Why AGENTS.md?

README.md files are for humans: quick starts, project descriptions, and contribution guidelines.

AGENTS.md complements this by containing the extra, sometimes detailed context coding agents need: build steps, tests, and conventions that might clutter a README or aren’t relevant to human contributors.

We intentionally kept it separate to:
- Give agents a clear, predictable place for instructions.
- Keep READMEs concise and focused on human contributors.
- Provide precise, agent-focused guidance that complements existing README and docs.

Rather than introducing another proprietary file, we chose a name and format that could work for anyone.

## How to use AGENTS.md?

### 1. Add AGENTS.md
Create an AGENTS.md file at the root of the repository.

### 2. Cover what matters
Popular choices:
- Project overview
- Build and test commands
- Code style guidelines
- Testing instructions
- Security considerations

### 3. Add extra instructions
Commit messages or pull request guidelines, security gotchas, large datasets, deployment steps: anything you’d tell a new teammate belongs here too.

### 4. Large monorepo? Use nested AGENTS.md files for subprojects
Place another AGENTS.md inside each package. Agents automatically read the nearest file in the directory tree, so the closest one takes precedence. Example: OpenAI main repo has 88 AGENTS.md files (at time of writing).

## About
AGENTS.md emerged from collaborative efforts across the AI software development ecosystem, including OpenAI Codex, Amp, Jules from Google, Cursor, and Factory.
AGENTS.md is now stewarded by the Agentic AI Foundation under the Linux Foundation.

## FAQ
- Required fields? No — standard Markdown; any headings.
- Conflicts? Closest AGENTS.md to the edited file wins; explicit user chat prompts override everything.
- Will the agent run testing commands automatically? Yes—if you list them.
- Migration: `mv AGENT.md AGENTS.md && ln -s AGENTS.md AGENT.md`
