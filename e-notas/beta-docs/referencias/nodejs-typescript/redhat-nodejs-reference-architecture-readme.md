---
source_url: https://github.com/nodeshift/nodejs-reference-architecture
fetched_at: 2026-11-08
title: "Node.js Reference Architecture (Red Hat / IBM nodeshift)"
---

# Node.js Reference Architecture

Opinion from Red Hat + IBM Node.js engineers on components and production guidance. Not formal product support unless listed in offerings. Based on internal/customer deployments at scale.

## Key tenets

- Prefer components validated at scale by the team
- Consider licensing / due diligence
- Backend-first focus

## Coverage

Functional: web framework, databases, auth, REST, scaling, Node versions/images, …

Development: containers, dependencies, TypeScript, testing, CI/CD, secure development, …

Operations: logging, metrics, health checks, tracing, failure handling, …

## Module Diligence

Recommended modules must: not be deprecated; appropriate license (prefer MIT); run on LTS Node; have tests; be maintained (releases, bugs, security patches).
