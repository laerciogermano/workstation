import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:3000',
      '/users': 'http://localhost:3000',
      '/gestores': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
      '/agente': 'http://localhost:3000',
      '/profiles': {
        target: 'http://localhost:3000',
        // SPA só em /profiles/:uuid (refresh do detalhe). Lista ?page= → API.
        bypass(req) {
          const path = (req.url || '').split('?')[0];
          const isDetail = /^\/profiles\/[0-9a-fA-F-]{36}\/?$/.test(path);
          if (isDetail && req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        },
      },
      '/dashboard': {
        target: 'http://localhost:3000',
        // refresh em /dashboard → SPA; fetch JSON → API
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
      '/profile-details': 'http://localhost:3000',
      '/extract': 'http://localhost:3000',
      '/linkedin-base': 'http://localhost:3000',
      '/client-connections-linkedin': 'http://localhost:3000',
      '/client-linkedin-messages': 'http://localhost:3000',
      // envio LinkedIn demora 30–90s — timeout alto; robot precisa estar em :3099
      '/linkedin-robot': {
        target: 'http://127.0.0.1:3099',
        changeOrigin: true,
        timeout: 600_000,
        proxyTimeout: 600_000,
        rewrite: (p) => p.replace(/^\/linkedin-robot/, '') || '/',
      },
      '/mensagens': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
      '/funil': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
      '/empresas': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
      '/agentes': {
        target: 'http://localhost:3000',
        bypass(req) {
          if (req.headers.accept?.includes('text/html')) return '/index.html';
        },
      },
    },
  },
});
