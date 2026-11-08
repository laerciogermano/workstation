---
source_url: https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/operations/failurehandling.md
fetched_at: 2026-11-08
title: "Fault Tolerance · Node.js Reference Architecture"
---

# Fault Tolerance

Prefer service mesh (e.g. Istio) capabilities when available. Otherwise recommend **Opossum** circuit breaker (async, fallback, Prometheus metrics companion).

## Guidance

Default: propagate async failures up the call chain (Node does not block a thread per request).

Use circuit breakers when:

- repeated calls worsen a failing dependency
- cached/degraded responses are acceptable while open
- intermittent failures need limited retries
- fixed latency upper bound matters more than live data
