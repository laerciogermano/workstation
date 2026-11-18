import { pool, withTx } from "./pool";
import { migrate } from "./migrate";
import { hash } from "@node-rs/argon2";
import { seedDemoProject } from "../modules/projects/demo-seed";

/** Cria o usuário de demonstração (demo@flow.dev / flowdev123) com o projeto do protótipo. */
await migrate();
const exists = await pool.query("select 1 from flow.users where email = 'demo@flow.dev'");
if (exists.rowCount) console.log("usuário demo já existe");
else {
  await withTx(async db => {
    const u = (await db.query("insert into flow.users (email, password_hash, name) values ('demo@flow.dev', $1, 'Demo') returning id", [await hash("flowdev123", { algorithm: 2, memoryCost: 19_456, timeCost: 2, parallelism: 1 })])).rows[0];
    await seedDemoProject(db, u.id, "Exemplo · Flow IDE");
  });
  console.log("seed ok: demo@flow.dev / flowdev123");
}
await pool.end();
