---
source_url: https://www.pgbouncer.org/features.html
docs_version: PgBouncer official docs
---

# PgBouncer Features

Several levels of brutality when rotating connections:

## Session pooling

Most polite method. When a client connects, a server connection will be assigned to it for the whole duration it stays connected. When the client disconnects, the server connection will be put back into pool. This mode supports all PostgreSQL features.

## Transaction pooling

A server connection is assigned to a client only during a transaction. When PgBouncer notices that the transaction is over, the server will be put back into the pool.

This mode breaks a few session-based features of PostgreSQL. You can use it only when the application cooperates by not using features that break.

## Statement pooling

Most aggressive method. This is transaction pooling with a twist: Multi-statement transactions are disallowed. This is meant to enforce “autocommit” mode on the client, mostly targeted at PL/Proxy.

## SQL feature map for pooling modes

| Feature | Session pooling | Transaction pooling |
| --- | --- | --- |
| Startup parameters | Yes | Yes |
| SET/RESET | Yes | Never |
| LISTEN | Yes | Never |
| NOTIFY | Yes | Yes |
| WITHOUT HOLD CURSOR | Yes | Yes |
| WITH HOLD CURSOR | Yes | Never |
| Protocol-level prepared plans | Yes | Yes (needs `max_prepared_statements` > 0) |
| PREPARE / DEALLOCATE | Yes | Never |
| ON COMMIT DROP temp tables | Yes | Yes |
| PRESERVE/DELETE ROWS temp tables | Yes | Never |
| Cached plan reset | Yes | Yes |
| LOAD statement | Yes | Never |
| Session-level advisory locks | Yes | Never |

Startup parameters tracked by default: `client_encoding`, `DateStyle`, `IntervalStyle`, `Timezone`, `standard_conforming_strings`, and `application_name`.
