---
source_url: https://www.postgresql.org/docs/current/explicit-locking.html
docs_version: PostgreSQL 18 (current)
---

# 13.3. Explicit Locking

PostgreSQL provides various lock modes to control concurrent access to data in tables. These modes can be used for application-controlled locking in situations where MVCC does not give the desired behavior. Also, most PostgreSQL commands automatically acquire locks of appropriate modes to ensure that referenced tables are not dropped or modified in incompatible ways while the command executes. (For example, `TRUNCATE` cannot safely be executed concurrently with other operations on the same table, so it obtains an `ACCESS EXCLUSIVE` lock on the table to enforce that.)

To examine a list of the currently outstanding locks in a database server, use the `pg_locks` system view.

## Table-Level Lock Modes (summary)

| Mode | Typical acquirers | Notes |
| --- | --- | --- |
| ACCESS SHARE | `SELECT` | Conflicts only with ACCESS EXCLUSIVE |
| ROW SHARE | `SELECT FOR UPDATE/SHARE` | |
| ROW EXCLUSIVE | `INSERT`/`UPDATE`/`DELETE`/`MERGE` | |
| SHARE UPDATE EXCLUSIVE | `VACUUM`, `ANALYZE`, `CREATE INDEX CONCURRENTLY`, some `ALTER TABLE` | Protects against concurrent schema changes and VACUUM |
| SHARE | `CREATE INDEX` (without CONCURRENTLY) | Blocks concurrent data changes |
| SHARE ROW EXCLUSIVE | `CREATE TRIGGER`, some `ALTER TABLE` | Self-exclusive |
| EXCLUSIVE | `REFRESH MATERIALIZED VIEW CONCURRENTLY` | Allows only concurrent ACCESS SHARE |
| ACCESS EXCLUSIVE | `DROP TABLE`, `TRUNCATE`, `VACUUM FULL`, many `ALTER TABLE` | Blocks all access including SELECT |

Tip: Only an `ACCESS EXCLUSIVE` lock blocks a `SELECT` (without `FOR UPDATE/SHARE`) statement.

Once acquired, a lock is normally held until the end of the transaction. It is a bad idea for applications to hold transactions open for long periods of time (e.g., while waiting for user input).

## Row-Level Locks

- `FOR UPDATE` — strongest; blocks other updates/deletes/lockers of the row
- `FOR NO KEY UPDATE` — weaker than FOR UPDATE; acquired by non-key UPDATEs
- `FOR SHARE` — shared; blocks UPDATE/DELETE/FOR UPDATE
- `FOR KEY SHARE` — weakest; blocks DELETE and key-changing UPDATE

Row-level locks do not affect data querying; they block only writers and lockers to the same row.

## Deadlocks

PostgreSQL automatically detects deadlocks and aborts one transaction. Best defense: acquire locks on multiple objects in a consistent order. Deadlocks can also occur from row-level locks alone. Retry aborted transactions.

## Advisory Locks

Application-defined locks not tied to table rows. Session-level locks survive rollback; transaction-level locks release at transaction end. Session-level advisory locks are incompatible with PgBouncer transaction pooling.
