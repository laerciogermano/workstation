import { defineConfig } from 'tsup';

/** Empacota a API e os pacotes do workspace (domain/contracts são fonte TS). */
export default defineConfig({
  entry: { main: 'src/main.ts', migrate: 'src/db/migrate.ts', seed: 'src/db/seed.ts' },
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  noExternal: [/^@fitness\//],
});
