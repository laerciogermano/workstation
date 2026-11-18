import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { include: ["test/**/*.test.ts"], testTimeout: 30_000, hookTimeout: 30_000, fileParallelism: false,
    env: { NODE_ENV: "test", DATABASE_URL: "postgres://flow:flow_dev_local@localhost:55432/flowdev", SESSION_SECRET: "test-secret-test-secret-test-secret-123", WEB_ORIGIN: "http://localhost:5180" } },
});
