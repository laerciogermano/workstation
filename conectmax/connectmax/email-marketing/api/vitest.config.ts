import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    // os testes de integração compartilham o mesmo banco
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
