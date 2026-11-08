---
source_url: https://fastify.dev/docs/latest/Guides/Recommendations/
fetched_at: 2026-11-08
title: "Recommendations — Fastify"
---

# Recommendations

## Use A Reverse Proxy

Exposing Node.js apps directly to the Internet for TLS, multi-domain, static assets, and multi-instance load balancing is considered an **anti-pattern** by the Fastify team:

1. Adds unnecessary complexity
2. Prevents horizontal scalability

Prefer HAProxy or Nginx for TLS termination, HTTP→HTTPS redirects, static assets, and load balancing across Node instances.

## Common Causes Of Performance Degradation

- Prefer static/simple parametric routes on hot paths; RegExp routes are expensive
- Use route constraints carefully; async custom constraints last resort
- Prefer Fastify plugins/hooks over generic middleware
- Define response schemas to speed JSON serialization
- Keep Ajv `allErrors` disabled by default (DoS risk)

## Kubernetes

Fastify listens on `127.0.0.1` by default; readiness probes using pod IP fail. Listen on `0.0.0.0` or customize probe hostname.

## Capacity Planning

- Lowest latency: ~2 vCPU per instance (2nd for GC/libuv)
- Throughput: 1 vCPU per instance can be fine
- Measure with k6 / autocannon

## Running Multiple Instances

Multiple Fastify instances in one Node process (e.g. separate metrics port) is supported.
