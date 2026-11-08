# Experiments with spec-driven development

Source: https://blog.luketurner.org/posts/experiments-with-spec-driven-development/
Author: Luke Turner
Date: 2025-10-25
Downloaded: 2026-11-08

SDD: specs (natural language text files) are the basis for generating code. Increasingly granular docs derive from a high-level requirements/acceptance-criteria spec.

Typical stages:
1. High-level specification (requirements/goals)
2. Plan / design document
3. Concrete task sequence
4. Implement each task

## spec-kit concrete loop
1. `/speckit.specify` (+ optional clarify)
2. `/speckit.plan`
3. `/speckit.tasks` (+ optional analyze)
4. `/speckit.implement` (pauses for manual testing)

Author notes subagent orchestration to automate plan→tasks→implement after human-approved spec; state lives in markdown so `/speckit.implement` can resume.

Caveat: resulting code still needs human review/manual testing; SDD does not replace engineers.
