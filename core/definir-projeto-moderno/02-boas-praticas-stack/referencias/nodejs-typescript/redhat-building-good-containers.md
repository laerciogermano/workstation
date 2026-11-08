---
source_url: https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/development/building-good-containers.md
fetched_at: 2026-11-08
title: "Building Good Containers · Node.js Reference Architecture"
---

# Building Good Containers

Recommendations:

- build non-root containers
- avoid reserved/privileged ports (1–1023)
- use multi-stage builds
- add key tools for problem determination
- use a process manager (e.g. Tini) — Node/npm were not designed as PID 1
- set memory limits (`--max-old-space-size` aligned with container memory)
- avoid using `npm` to start the application → `CMD ["node","index.js"]`
- scale outside the container (avoid cluster module inside container)
- use `.dockerignore` (`node_modules`, `.git`, `.cache`)
- consider dependency image layering for faster rebuilds
