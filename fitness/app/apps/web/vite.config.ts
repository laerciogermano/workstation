import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // em dev, /v1 vai para a API local (mesma origem → sem CORS no navegador)
    proxy: { '/v1': 'http://localhost:3333', '/health': 'http://localhost:3333' },
  },
  build: { target: 'es2022', sourcemap: true },
  test: { environment: 'jsdom', setupFiles: ['./src/test-setup.ts'] },
});
