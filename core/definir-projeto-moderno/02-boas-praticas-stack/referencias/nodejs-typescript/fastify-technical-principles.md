---
source_url: https://fastify.dev/docs/latest/Reference/Principles/
fetched_at: 2026-11-08
title: "Technical Principles — Fastify"
---

# Technical Principles

1. “Zero” overhead in production
2. “Good” developer experience
3. Works great for small & big projects alike
4. Easy to migrate to microservices (or even serverless) and back
5. Security & data validation
6. If something could be a plugin, it likely should be
7. Easily testable
8. Do not monkeypatch core
9. Semantic versioning & Long Term Support
10. Specification adherence

Key implications for modular systems:

- Framework is first line of defense for untrusted data (validation)
- Plugin architecture encourages modular composition
- No monkeypatching of Node core → cleaner modular apps
- Route deployment should not matter (monolith ↔ microservices)
