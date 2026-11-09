import { defineConfig } from 'tsup';

// Ship de JS compilado (Red Hat Node RA): bundle único com os pacotes do workspace embutidos.
export default defineConfig({
  entry: ['src/main.ts', 'src/scripts/migrate.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  sourcemap: true,
  clean: true,
  noExternal: [/^@notinhas\//],
});
