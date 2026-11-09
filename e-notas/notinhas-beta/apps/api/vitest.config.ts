import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { name: 'api', fileParallelism: false, testTimeout: 15000 } });
