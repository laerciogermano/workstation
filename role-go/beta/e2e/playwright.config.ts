import { defineConfig, devices } from '@playwright/test';

/** E2E dos fluxos críticos. Pré-requisito: `pnpm dev` (db + mailpit + api + web) e `pnpm db:seed`. */
export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173', trace: 'retain-on-failure', ...devices['Pixel 7'] },
  projects: [{ name: 'mobile-chromium', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } }],
});
