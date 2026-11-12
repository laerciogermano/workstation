import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // testes de integração usam Postgres real (docker compose up -d db)
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
