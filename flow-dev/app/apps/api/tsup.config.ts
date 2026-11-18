import { defineConfig } from "tsup";
import { cpSync } from "node:fs";
export default defineConfig({
  entry: ["src/server.ts", "src/db/migrate.ts", "src/db/seed.ts"], format: ["esm"], target: "node22", clean: true,
  noExternal: ["@flow/shared"], banner: { js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);" },
  onSuccess: async () => { cpSync("src/db/migrations", "dist/migrations", { recursive: true }); },
});
