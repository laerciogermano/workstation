import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Em dev o Vite repassa /api e /u para a API: mesmo origin, cookie SameSite=Strict funciona.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:4000',
      '/u': 'http://localhost:4000',
    },
  },
});
