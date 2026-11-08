PostgreSQL Production Checklist: UUIDs, RLS, Indexes, Pooling

TMI Iurii Rogulia VAT ID: FI29845875 DUNS: 368664211 Lappeenranta, Finland 🇫🇮

[email protected]

# Iurii Educates: PostgreSQL Production Checklist: UUIDs, RLS, Indexes, Pooling

The patterns I reach for without thinking – and why skipping them causes real incidents

May 21, 2026· 15 min read

PostgreSQL production patterns: UUID v7, soft deletes, RLS for multi-tenant SaaS, partial and covering indexes, PgBouncer pooling and migration discipline.

PostgreSQL is the only database I trust for production SaaS. Not because the alternatives are bad – but because Postgres rewards the time you invest in learning it. After using it across vatnode.dev, pikkuna.fi, pi-pi.ee, and htpbe.tech, I have a set of patterns I reach for every time without thinking. This is that collection.

This is not a tutorial. It’s opinionated, and I’ll explain the ‘why’ behind each decision. If you know basic SQL and want to know what experienced practitioners actually do – this is the article I wish existed when I started.

## UUIDs vs Serial IDs

I use two ID strategies, depending on the table’s purpose.

For user-facing entities – users, orders, invoices, API keys – I use UUID v7 via the `uuidv7` package. Two reasons: enumeration prevention and index performance. If your order ID is `12345`, a determined attacker can iterate through orders. With a UUID, that’s not feasible. And unlike UUID v4 (fully random), UUID v7 is time-sorted – new rows always land at the end of the B-tree, not at a random position. This matters at scale: on a 5M-row table, UUID v4 produces a 285MB index; UUID v7 produces a 118MB index with 3x lower INSERT latency. I covered the full breakdown in UUID v7, ULID, and NanoID compared.

Important: PostgreSQL’s built-in `gen_random_uuid()` generates UUID v4, not v7. Generate v7 in application code and pass it explicitly.

```
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- No DEFAULT on id — the application generates UUID v7 before INSERT
```

For internal join tables – `user_roles`, `order_items`, `tag_assignments` – I use `BIGSERIAL`. These IDs never surface in URLs or APIs, so enumeration isn’t a concern. `BIGSERIAL` is faster to index, smaller on disk, and slightly better for sequential inserts.

In Drizzle ORM:

```
import { pgTable, uuid, bigserial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";
 
export const orders = pgTable("orders", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
 
export const orderItems = pgTable("order_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  productId: uuid("product_id").notNull(),
  quantity: integer("quantity").notNull(),
});
```

## Timestamps: Always UTC, Always Two Columns

Every table I create gets `created_at` and `updated_at`. No exceptions. I’ve debugged too many issues caused by ‘we didn’t think we’d need that timestamp’ to ever skip it.

```
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Always `TIMESTAMPTZ` (timestamp with time zone), never `TIMESTAMP`. Postgres stores `TIMESTAMPTZ` as UTC internally and converts on read based on the session timezone. If you store `TIMESTAMP` and later need to handle users across time zones, you’re retrofitting a problem that didn’t have to exist.

For `updated_at`, I use a trigger rather than relying on the ORM to set it. ORMs miss updates done via raw SQL, admin tools, or migration scripts.

```
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## Soft Deletes: Useful, With One Critical Index

Soft deletes – marking a row as deleted with a `deleted_at` timestamp instead of removing it – are useful when you need an audit trail, or when ‘deleted’ means something recoverable (cancelled subscription, archived document).

```
ALTER TABLE documents ADD COLUMN deleted_at TIMESTAMPTZ;
```

The query pattern for fetching live records:

```
SELECT * FROM documents WHERE deleted_at IS NULL;
```

The gotcha: if you add a standard index on `deleted_at`, most queries will still do a full table scan – `NULL` values are spread throughout the table. What you actually want is a partial index – an index that only covers the rows you’ll actually query:

```
-- Standard index — doesn't help much for WHERE deleted_at IS NULL queries
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);
 
-- Partial index — only indexes live rows. Much smaller, much faster.
CREATE INDEX idx_documents_active ON documents(user_id, created_at)
  WHERE deleted_at IS NULL;
```

The partial index only stores rows where `deleted_at IS NULL`. For a table with 10% deleted records, that’s 10% smaller. More importantly, every query for live records uses this index directly.

When NOT to use soft deletes: high-volume tables where deleted rows accumulate fast (event logs, audit trails), and tables where regulatory compliance requires actual deletion (GDPR right to erasure). For GDPR, you need hard deletes. Trying to justify soft deletes as a GDPR exemption is a conversation you do not want to have with a data protection authority.

## JSONB: Where It Helps and Where It Hurts

Postgres JSONB is genuinely useful in specific cases. I reach for it in three situations:

Flexible attributes where the shape isn’t fully known at design time – product metadata, user preferences, feature flags per tenant.

Audit logs where you want to store the full before/after state of a row without designing a separate schema for every table.

External API responses – store the raw Stripe event, the PostNord shipment response, whatever third-party payload you received. Useful for debugging and for replaying events without re-fetching from the source. In pikkuna.fi, I store every API response from PostNord and Zoho in a `raw_payload JSONB` column alongside the parsed fields.

Where it hurts: anything you filter or sort on regularly. If you’re querying `WHERE metadata->>'status' = 'active'`, you’re fighting the type system and paying in query planning complexity. Extract frequently-queried fields into proper typed columns.

```
// Good use of JSONB — audit log with flexible payload
export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  tableName: text("table_name").notNull(),
  recordId: uuid("record_id").notNull(),
  before: jsonb("before"),
  after: jsonb("after"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
 
// Bad use of JSONB — filtering on JSON fields you should have typed
// SELECT * FROM products WHERE attributes->>'category' = 'electronics'
// Just add a category column.
```

If you find yourself writing `->>'field'` in WHERE clauses more than once, that field belongs in a proper column.

## Row-Level Security for Multi-Tenant SaaS

### MVP Development

Row-level security (RLS) is a Postgres feature that enforces data access rules at the database layer. For multi-tenant SaaS – where every user should see only their own data – it’s the most reliable isolation layer you can add.

Without RLS, your application code is the only thing standing between a user and another user’s data. One missed `WHERE user_id = $1` clause and data leaks. RLS makes isolation structural.

Basic pattern:

```
-- Enable RLS on the table
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
 
-- Policy: users can only see their own documents
CREATE POLICY documents_user_isolation ON documents
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::UUID);
```

In your application, set the context before queries in the same transaction:

```
// lib/db-context.ts
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
 
export async function withUserContext<T>(
  userId: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
    return fn(tx);
  });
}
```

The `true` parameter in `set_config` makes the setting transaction-local – it resets after the transaction ends. This is important: if you use a connection pool, you don’t want one user’s context bleeding into the next query on the same connection.

I use Supabase-style RLS on some projects (`auth.uid()`) and the `set_config` pattern on others depending on whether I control the auth layer. Both work – the key is consistency.

## Indexes: What Actually Matters

Over-indexing is as harmful as under-indexing. Indexes slow down writes, consume storage, and confuse the query planner when you have too many of them. Here’s what I actually add.

Partial indexes – covered above for soft deletes. Also useful for status-filtered queries:

```
-- Only index rows that are in an actionable state
CREATE INDEX idx_jobs_pending ON jobs(created_at)
  WHERE status = 'pending';
```

Covering indexes – include columns in the index so Postgres can answer the query from the index alone, without hitting the table:

```
-- A query that fetches user_id and status for orders in a date range
-- can be answered entirely from this index
CREATE INDEX idx_orders_covering ON orders(created_at DESC)
  INCLUDE (user_id, status);
```

Composite index column order – start with columns used in equality filters, then range or sort columns. Selectivity matters, but query shape matters more: a column with high cardinality that only appears in a range predicate should not go first if a lower-cardinality equality column appears in every query.

```
-- Bad order: status has low cardinality (3 possible values)
CREATE INDEX idx_bad ON subscriptions(status, user_id);
 
-- Good order: user_id is highly selective
CREATE INDEX idx_good ON subscriptions(user_id, status);
```

When NOT to index: tables under 10,000 rows (sequential scan is often faster), columns that change frequently (every update rewrites the index entry), and columns you only filter on in bulk admin queries (use a separate read replica or just accept the scan).

## CTEs: Readability and the Optimization Fence

Common table expressions (`WITH` queries) are the most underused tool for readable SQL. I reach for them whenever a query would otherwise require nested subqueries.

```
-- Without CTE — hard to read
SELECT u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
  AND o.created_at > NOW() - INTERVAL '30 days'
  AND o.status = 'paid'
WHERE u.created_at > NOW() - INTERVAL '90 days'
GROUP BY u.email;
 
-- With CTE — each step is named and readable
WITH recent_users AS (
  SELECT id, email
  FROM users
  WHERE created_at > NOW() - INTERVAL '90 days'
),
recent_paid_orders AS (
  SELECT user_id, COUNT(*) as order_count
  FROM orders
  WHERE created_at > NOW() - INTERVAL '30 days'
    AND status = 'paid'
  GROUP BY user_id
)
SELECT u.email, COALESCE(o.order_count, 0) as order_count
FROM recent_users u
LEFT JOIN recent_paid_orders o ON o.user_id = u.id;
```

One thing to know: since Postgres 12, CTEs are not automatically optimization fences. Before Postgres 12, the planner always materialized each CTE (evaluated it once and stored the result). Since 12, the planner can inline CTEs into the main query and optimize across them. If you explicitly need materialization (e.g., to prevent re-evaluation of a volatile function), use `WITH cte AS MATERIALIZED (...)`.

This matters when optimizing slow queries – don’t assume a CTE is cached or is being optimized in isolation.

## Transactions and `FOR UPDATE`: Preventing Race Conditions

Whenever two concurrent operations read the same row and both decide to act on it, you have a race condition. Classic examples: inventory decrement, seat booking, credit balance deduction.

The naive pattern:

```
// Race condition — two concurrent requests both read stock = 1
const product = await db.select().from(products).where(eq(products.id, productId));
if (product.stock > 0) {
  await db
    .update(products)
    .set({ stock: product.stock - 1 })
    .where(eq(products.id, productId));
  // Both requests pass the check, both decrement. Stock goes to -1.
}
```

The fix is `SELECT ... FOR UPDATE` inside a transaction. This locks the row until the transaction commits, forcing concurrent requests to wait:

```
// lib/inventory.ts
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
 
export async function decrementStock(productId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    // Lock the row — concurrent requests will wait here
    const [product] = await tx
      .select({ stock: products.stock })
      .from(products)
      .where(eq(products.id, productId))
      .for("update");
 
    if (!product || product.stock <= 0) {
      return false; // Out of stock
    }
 
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} - 1` })
      .where(eq(products.id, productId));
 
    return true;
  });
}
```

The atomic `stock - 1` expression in the UPDATE is also intentional – it applies the decrement relative to the current value at write time, not relative to the value you read earlier. This is safe even without `FOR UPDATE`, but combining both gives you correctness under high concurrency.

## Connection Pooling: The Math You Need to Do

Postgres has a hard limit on simultaneous connections. The default is 100. Each connection consumes ~5–10MB of memory. On a $20/month VPS, you do not have room for 100 open connections.

The problem with serverless and edge deployments is that each function invocation can open its own connection. 50 concurrent requests to a Next.js API route = 50 connections. Under traffic, this exhausts the pool and requests start failing with `too many connections`.

The solution is PgBouncer or an equivalent pooler (Supabase uses PgBouncer under the hood; Neon has its own). The connection pool sits between your application and Postgres, maintaining a small number of real connections and multiplexing many application connections through them.

A rough sanity check for initial sizing:

```
Available connections ≈ (RAM in MB / 10) - 5 (reserved for superuser)
Pool size per service ≈ available connections / number of services

```

For a 1GB VPS with Postgres and one application this gives you a starting point of ~80 application connections. Actual limits depend on `work_mem`, `shared_buffers`, autovacuum workers, and query complexity – treat this as a sanity check, not a formula to follow blindly.

PgBouncer configuration I use in transaction pooling mode (recommended for most SaaS apps):

```
[databases]
myapp = host=localhost port=5432 dbname=myapp
 
[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 25
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 600
```

Transaction pooling mode returns connections to the pool after each transaction, not after the session ends. This is the most efficient mode. The tradeoff: you cannot use session-level features like `SET` (session-scoped config), prepared statements across requests, or `LISTEN/NOTIFY` across a transaction boundary. For RLS with `set_config(..., true)`, this matters – use transaction-scoped settings, which transaction pooling handles correctly.

## Migrations: Never Touch the Schema Manually

This sounds obvious and people still do it. I’ve inherited production databases where no one knows exactly what schema is running, because ‘someone made a quick change in the admin panel six months ago.’

The rule is absolute: every schema change goes through a migration file, committed to version control, applied by a migration tool. No exceptions for ‘just a quick index’ or ‘just adding one column.’

I use Drizzle ORM’s migration workflow:

```
# Generate migration from schema changes
npx drizzle-kit generate
 
# Apply migrations (run in CI/CD, not manually)
npx drizzle-kit migrate
```

The migration file is a plain SQL file, committed alongside the code change that needs it. Every deployment applies pending migrations before the new code starts.

On rollback strategy: Postgres DDL is transactional. If you add a column, index, and constraint in one migration, and the constraint fails, the whole migration rolls back. This is a feature – design your migrations to be atomic. For large tables, be careful with operations that hold `ACCESS EXCLUSIVE` locks (adding NOT NULL constraints without a default, rebuilding indexes). Use `CREATE INDEX CONCURRENTLY` and `ALTER TABLE ... SET NOT NULL` with a check constraint added in an earlier migration.

One pattern I always follow: never delete a column in the same migration that removes its usage from the application code. Deploy the code change first (which stops writing to the column), then remove the column in a subsequent migration. This avoids downtime from deployment ordering.

## What This Looks Like Across Projects

In vatnode.dev – RLS for tenant isolation on validation logs, partial indexes on `deleted_at` and `status`, UUID v4 for all API-exposed IDs (vatnode predates my switch to v7; new projects use v7), PgBouncer in front of Postgres. The schema has 11 tables; migrations are applied automatically on each Coolify deployment.

In pikkuna.fi – JSONB for storing raw PostNord and Zoho API responses alongside structured order data, `FOR UPDATE` transactions for order status transitions, `updated_at` triggers on every table. A fully automated order pipeline means concurrent webhooks hit the same order rows – without locking, you get races.

In pi-pi.ee – soft deletes on products and categories (store operators want to recover things), covering indexes on the orders table for the admin dashboard queries, all timestamps UTC.

Good PostgreSQL architecture is mostly boring: stable IDs, explicit ownership, predictable migrations, and indexes that match the queries you actually run. The value isn’t in any individual pattern – it’s in never having to debug the class of problem each one prevents.

These patterns are not exotic. They’re the defaults I reach for because skipping them has caused me real problems in the past. UUID enumeration, missing audit trails, oversized connection pools, schema drift – each is a class of incident that becomes impossible once the pattern is in place.

September 28, 2026

Vertical SaaS that gives a salon, barbershop or solo beauty specialist their own booking website in minutes.

March 15, 2026

January 19, 2026

Developer-first SaaS API for EU VAT validation via VIES with Redis caching, change monitoring, and webhook notifications.

## What clients say

I had a validated idea and a deadline tied to an accelerator demo day, but no product.

Aino Virtanen 🇫🇮

Founder

Next.js TypeScript

I’d built most of our MVP with Cursor and it looked finished – it compiled, the tests were green, the demo worked. It just wouldn’t survive real users.

Sebastian Falk 🇸🇪

Founder

Before we closed on a seed-stage SaaS we asked Iurii to look under the hood. He gave us a written report in five days: what was solid, what was held together with tape, and roughly what it would cost

Florian Berg 🇨🇭

Investment Principal