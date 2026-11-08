---
source_url: https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/functional-components/webframework.md
fetched_at: 2026-11-08
title: "Web Framework · Node.js Reference Architecture"
---

# Web Framework

## Recommended Components

Express remains the team's primary recommendation (broad ecosystem). Other frameworks may fit; no clear single successor.

## Express guidance

- Latest 4.x line; tilde range for patches; planned minor upgrades
- Separate ports for business vs admin/metrics (`PORT`/`ADMIN_PORT`, defaults 8080/9080)
- Liveness + readiness endpoints even outside Kubernetes
- Define global middleware **before** routes
- Use Helmet
- Make apps testable: smaller components/routes; `npm test` script
- See Logging and Authentication sections
