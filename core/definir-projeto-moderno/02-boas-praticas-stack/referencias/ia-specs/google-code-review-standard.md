# The Standard of Code Review (Google)

Source: https://google.github.io/eng-practices/review/reviewer/standard.html
License: CC-By 3.0
Downloaded: 2026-11-08

Primary purpose: overall code health improves over time.

Senior principle: reviewers should favor approving a CL once it definitely improves overall code health, even if the CL isn’t perfect.

There is no perfect code — only better code. Prefer continuous improvement over delaying for polish. Use “Nit:” for non-blocking polish.

Principles:
- Technical facts and data overrule opinions and personal preferences
- Style guide is absolute authority on style; otherwise prefer consistency with codebase
- Design is almost never pure preference — weigh on engineering principles
- Escalate conflicts; don’t let CLs sit unresolved

Relevance for agents: treat agent PRs with the same “improves code health” bar; insist on tests/clarity; nits vs blockers.
