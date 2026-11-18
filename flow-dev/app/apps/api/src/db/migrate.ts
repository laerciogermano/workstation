import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "./pool";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = existsSync(path.join(here, "migrations")) ? path.join(here, "migrations") : path.join(here, "db/migrations");
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** Migrations versionadas e imutáveis: o checksum de uma já aplicada nunca pode mudar. */
export async function migrate(): Promise<string[]> {
  const applied: string[] = [];
  await pool.query("create table if not exists public.flow_migrations (name text primary key, checksum text not null, applied_at timestamptz not null default now())");
  const files = readdirSync(dir).filter(f => /^\d+_.*\.sql$/.test(f) && !f.endsWith(".down.sql")).sort();
  for (const f of files) {
    const sql = readFileSync(path.join(dir, f), "utf8"), sum = sha(sql);
    const { rows } = await pool.query("select checksum from public.flow_migrations where name = $1", [f]);
    if (rows[0]) {
      if (rows[0].checksum !== sum) throw new Error(`Migration ${f} já aplicada foi alterada (checksum difere). Crie uma nova migration.`);
      continue;
    }
    const db = await pool.connect();
    try {
      await db.query("begin");
      await db.query(sql);
      await db.query("insert into public.flow_migrations (name, checksum) values ($1, $2)", [f, sum]);
      await db.query("commit");
      applied.push(f);
    } catch (e) { await db.query("rollback"); throw e; } finally { db.release(); }
  }
  return applied;
}

export async function rollbackAll(): Promise<void> {
  const files = readdirSync(dir).filter(f => f.endsWith(".down.sql")).sort().reverse();
  for (const f of files) await pool.query(readFileSync(path.join(dir, f), "utf8"));
  await pool.query("drop table if exists public.flow_migrations");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]) || process.argv[1]?.endsWith("migrate.js")) {
  const down = process.argv.includes("down");
  (down ? rollbackAll().then(() => console.log("rollback concluído")) : migrate().then(a => console.log(a.length ? `aplicadas: ${a.join(", ")}` : "nada a aplicar")))
    .catch(e => { console.error(e); process.exitCode = 1; }).finally(() => pool.end());
}
