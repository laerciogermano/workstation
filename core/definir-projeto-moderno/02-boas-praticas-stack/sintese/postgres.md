# PostgreSQL production schema practices (Node.js apps)

## Index design and when NOT to index?

### Takeaway
Index only columns/expressions that real `WHERE`/`JOIN`/`ORDER BY` paths need; unused indexes cost write overhead and can block HOT updates. Prefer B-tree by default; use partial/expression/`INCLUDE`/`CONCURRENTLY` deliberately.

### Cited Findings
- Indexes help equality/range `WHERE` and joins; planner decides vs sequential scan using stats, so run `ANALYZE` regularly — [PostgreSQL 18 Indexes Intro](https://www.postgresql.org/docs/current/indexes-intro.html)
- Maintaining indexes adds DML overhead; indexes can prevent heap-only tuples (HOT); **seldom/never-used indexes should be removed** — [PostgreSQL 18 Indexes Intro](https://www.postgresql.org/docs/current/indexes-intro.html)
- Default index build blocks writes (`INSERT`/`UPDATE`/`DELETE`) while allowing reads; production should use `CREATE INDEX CONCURRENTLY` (extra work, longer wall time, cannot run inside a transaction block) — [PostgreSQL 18 Indexes Intro](https://www.postgresql.org/docs/current/indexes-intro.html); [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- Default method is B-tree (`=`, `<`, `>`, `BETWEEN`, `IN`, leading `LIKE 'foo%'`); Hash = equality only; GIN for arrays/multi-value; BRIN for columns correlated with physical order — [Index Types](https://www.postgresql.org/docs/current/indexes-types.html)
- Partial indexes (`WHERE` clause) index only useful subsets; expression indexes require immutable functions; `INCLUDE` adds non-key columns for index-only scans without participating in uniqueness — [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)
- Multicolumn indexes are usable left-to-right only; put the column that appears alone / most often as leading; fewer indexes improve write performance — [Use The Index, Luke! Concatenated Indexes](https://use-the-index-luke.com/sql/where-clause/the-equals-operator/concatenated-keys)
- New expression indexes need `ANALYZE` (or autovacuum analyze) before the planner can use them well — [CREATE INDEX](https://www.postgresql.org/docs/current/sql-createindex.html)

### Inferences
- For a Node.js app: start with PK/unique + FK lookup columns + proven hot filters; add covering/`INCLUDE` only after confirming table fetches dominate cost.
- Do **not** index: low-selectivity boolean-like columns without partial predicates; columns never filtered; every column “just in case”; functions wrapped around indexed columns in queries (`WHERE EXTRACT(year FROM d)=…`) unless you index that expression.

### Gaps
- Official docs do not publish a numeric “don’t index if selectivity < X%” threshold; Use The Index Luke partial-indexes chapter fetch failed (404/504), so partial-index examples rely mainly on CREATE INDEX docs.

## Partitioning best practices?

### Takeaway
Partition only large tables (roughly larger than server RAM); choose a key that matches common `WHERE` clauses and retention/drop units; avoid too many partitions—planner/memory cost rises fast, especially for OLTP.

### Cited Findings
- Benefits: prune to few partitions, sequential scan of one partition instead of random I/O across whole table, fast drop/detach instead of bulk `DELETE`/`VACUUM` — [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- Rule of thumb: worthwhile when table size exceeds physical memory of the DB server — [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- Methods: `RANGE`, `LIST`, `HASH`; unique/PK must include all partition key columns (no expressions in those keys for uniqueness) — [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- Best practices: partition by columns most common in `WHERE`; design so removable data lives in one partition; too few partitions → large indexes/poor locality; too many → longer planning, higher memory (each touched partition’s metadata loads per session); planner handles up to a few thousand if most are pruned; DW can use more partitions than OLTP; simulate workload; don’t assume more=better — [§5.12.6 Best Practices](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- Prefer `ATTACH PARTITION` with matching `CHECK` to avoid long validation scans under `ACCESS EXCLUSIVE`; create indexes on parent (virtual) or use `CREATE INDEX ON ONLY` + per-partition `CONCURRENTLY` + `ATTACH` for online index builds — [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- Keep `enable_partition_pruning` on (default); pruning uses partition bounds, not indexes — [Table Partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)

### Inferences
- Time-series Node apps: monthly/weekly `RANGE` on `created_at`/`event_at` matches retention detach patterns.
- Customer-id `LIST` with unbounded growth is risky; prefer fixed-modulus `HASH` if cardinality will explode.

### Gaps
- No official single “max partitions for OLTP” number beyond “few thousand with aggressive pruning” and legacy inheritance “~100 children” guidance for constraint exclusion.

## Transaction isolation, locking, connection pooling (PgBouncer patterns)?

### Takeaway
Default `READ COMMITTED` is fine for most Node handlers; use `REPEATABLE READ`/`SERIALIZABLE` only with retry on `40001`/serialization failures. Prefer short transactions + MVCC over heavy locks. Pool with PgBouncer: `transaction` mode for high concurrency if the app avoids session features; keep backend `max_connections` modest.

### Cited Findings
- MVCC: readers don’t block writers and writers don’t block readers; SSI provides serializable without read/write lock blocking — [MVCC Intro](https://www.postgresql.org/docs/current/mvcc-intro.html)
- Isolation: PostgreSQL implements three levels (Read Uncommitted behaves as Read Committed); default Read Committed sees a new snapshot per statement; Repeatable Read = snapshot isolation for whole transaction; Serializable = SSI, must retry on serialization failure SQLSTATE `40001` — [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- Serializable guidance: control active connections (use a pool); eliminate unnecessary `SELECT FOR UPDATE`/`SHARE` if SSI covers the case; don’t trust reads until commit (except deferrable read-only) — [Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html)
- Locks: `ACCESS EXCLUSIVE` blocks even plain `SELECT`; don’t hold transactions open waiting for user input; acquire multi-object locks in consistent order to avoid deadlocks — [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)
- `max_connections` sizes shared resources; raising it increases shared memory; reserved slots for superusers — [Connection Settings](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- PgBouncer modes: session (full features), transaction (reuse after COMMIT; breaks `SET`, `LISTEN`, holdable cursors, SQL `PREPARE`, session advisory locks, etc.), statement (no multi-statement tx) — [PgBouncer Features](https://www.pgbouncer.org/features.html)
- Config knobs: `pool_mode`, `default_pool_size` (default 20), `max_client_conn` (default 100), `min_pool_size`, `reserve_pool_*`, `max_db_connections` — [PgBouncer Config](https://www.pgbouncer.org/config.html)
- Protocol-level prepared statements in transaction mode need `max_prepared_statements` > 0 — [PgBouncer Features](https://www.pgbouncer.org/features.html)

### Inferences
- Node pattern: app pool (e.g. `pg` Pool size small) → PgBouncer transaction mode → PostgreSQL `max_connections` ≈ `(poolers × default_pool_size × DBs/users) + headroom`, not hundreds of direct app connections.
- Avoid session-scoped features (`SET LOCAL` is OK within a transaction; session `SET`, temp tables with PRESERVE, session advisory locks) when using transaction pooling.
- Use `SELECT FOR UPDATE` sparingly; prefer unique constraints + upsert/`ON CONFLICT` and short Read Committed transactions for typical CRUD.

### Gaps
- Official PostgreSQL docs do not ship a first-party PgBouncer chapter; pooling guidance is from pgbouncer.org (canonical for the pooler) plus PG connection settings.
- No single official formula tying Node worker count to `default_pool_size`.

## Bulk load / ANALYZE / vacuum practices?

### Takeaway
Bulk load with `COPY` in large transactions; defer indexes/FKs when safe; always `ANALYZE` after big loads. Rely on autovacuum; prefer frequent plain `VACUUM` over `VACUUM FULL`; manually `ANALYZE` partitioned parents.

### Cited Findings
- Bulk load checklist: disable autocommit for many `INSERT`s; prefer `COPY`; create indexes after load; drop/recreate FKs for huge loads (trigger queue can OOM); raise `maintenance_work_mem` and `max_wal_size`; optionally disable WAL archiving with care; **always `ANALYZE` afterwards** — [Populating a Database](https://www.postgresql.org/docs/current/populate.html)
- Autovacuum is sufficient for many installs; plain `VACUUM` reclaim-for-reuse without exclusive lock; `VACUUM FULL` needs `ACCESS EXCLUSIVE`, rewrites table—avoid as routine — [Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- Unwise to disable autovacuum completely unless workload is extremely predictable — [Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- Prefer `TRUNCATE` over `DELETE`+`VACUUM` when clearing entire tables (MVCC semantics caveat) — [Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- Planner needs accurate stats; autovacuum analyzes on churn; **autovacuum does not ANALYZE partitioned parents**—run manual `ANALYZE` on partitioned tables — [Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- Must vacuum every table within ~2B transactions to prevent XID wraparound; anti-wraparound autovacuum runs even if daemon “disabled” — [Routine Vacuuming](https://www.postgresql.org/docs/current/routine-vacuuming.html)

### Inferences
- ETL/migration scripts in Node should stream via `COPY FROM STDIN` (or `pg-copy-streams`), then rebuild indexes, then `ANALYZE`.
- Monitor `pg_stat_user_tables` for dead tuples / last autovacuum; tune scale_factor per hot tables rather than global `VACUUM FULL`.

### Gaps
- Exact autovacuum parameter defaults were not fully extracted into notes (see downloaded `routine-vacuuming.md` for full parameter discussion).

## Naming, constraints, migrations safety?

### Takeaway
Use unquoted lowercase identifiers (≤63 bytes); be consistent on singular/plural; put integrity in DB constraints. For online migrations: prefer `NOT VALID` + `VALIDATE CONSTRAINT`, `CREATE INDEX CONCURRENTLY`, and lock-aware `ALTER TABLE` forms over long `ACCESS EXCLUSIVE` rewrites.

### Cited Findings
- Unquoted identifiers fold to lowercase; max 63 bytes; quoted identifiers are case-sensitive; convention: keywords upper, names lower; `$` discouraged for portability — [Lexical Structure](https://www.postgresql.org/docs/current/sql-syntax-lexical.html)
- Choose a consistent naming pattern for interrelated tables/columns (singular vs plural) — [Table Basics](https://www.postgresql.org/docs/current/ddl-basics.html)
- Schema names starting with `pg_` are reserved; tables/indexes/views share one namespace per schema — [Schemas](https://www.postgresql.org/docs/current/ddl-schemas.html)
- `ALTER TABLE` defaults to `ACCESS EXCLUSIVE` unless a subform documents a weaker lock — [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- Add FK/`CHECK`/not-null with `NOT VALID` to skip lengthy scan under strong locking; then `VALIDATE CONSTRAINT` takes `SHARE UPDATE EXCLUSIVE` and does not block concurrent updates the same way — [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- Online unique/PK: `CREATE UNIQUE INDEX CONCURRENTLY` then `ALTER TABLE ... ADD CONSTRAINT ... USING INDEX` — [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- Adding a column with volatile `DEFAULT`, stored generated, identity, or constrained domain can rewrite the whole table; plain `ADD COLUMN` with constant/NULL default typically does not — [ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)
- `CREATE INDEX` without `CONCURRENTLY` takes `SHARE` (blocks writes); with `CONCURRENTLY` takes `SHARE UPDATE EXCLUSIVE` — [Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html)

### Inferences
- Migration tooling (Knex/Prisma/node-pg-migrate): split “add nullable column / add NOT VALID constraint / create index concurrently / validate” into separate deploy steps with short lock windows.
- Enforce FKs, `UNIQUE`, `CHECK`, `NOT NULL` in PostgreSQL even if the ORM validates—DB is source of truth under race conditions.

### Gaps
- PostgreSQL has no official naming styleguide beyond identifier rules and “be consistent”; community conventions (snake_case, `table_column_idx`) are not normative in the manuals.
- ORM-specific migration footguns (Prisma shadow DB, TypeORM synchronize) are outside official PG docs and not covered here.
