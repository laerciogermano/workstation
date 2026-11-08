---
source_url: https://github.com/nodeshift/nodejs-reference-architecture/blob/main/docs/operations/logging.md
fetched_at: 2026-11-08
title: "Logging · Node.js Reference Architecture"
---

# Logging

## Recommended: Pino

Structured JSON, high performance, stdout-oriented for cloud-native aggregation.

## Guidance

- Logs → stdout; aggregate externally
- Plan log retention / cold storage after ~7 days
- Control `logger.level` via environment variable
- Use redaction for sensitive fields
- Limit warn/error/fatal to must-log; info for important low-overhead events
- Throw once; catch/log at highest level; log `error.stack` unless expected typed errors
- Prefer `logger.child({ file: module })` per source file
