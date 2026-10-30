import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Destino do proxy em dev. Remoto: API_PROXY=http://144.126.154.90 npm run dev */
const API = process.env.API_PROXY || 'http://localhost:3000';

function apiProxy(extra = {}) {
  return { target: API, changeOrigin: true, ...extra };
}

function spaHtmlBypass(req) {
  if (req.headers.accept?.includes('text/html')) return '/index.html';
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': apiProxy(),
      '/users': apiProxy(),
      '/gestores': apiProxy({ bypass: spaHtmlBypass }),
      // `/agentes` (SPA+API) ANTES de `/agente` — senão o prefixo `/agente`
      // engole `/agentes` e o refresh devolve 401 JSON da API.
      '/agentes': apiProxy({ bypass: spaHtmlBypass }),
      // só `/agente` e `/agente/...` (claim/peek/slots) — não `/agentes`
      '^/agente(?:/|$)': apiProxy(),
      '/profiles': apiProxy({
        // SPA só em /profiles/:uuid (refresh do detalhe). Lista ?page= → API.
        bypass(req) {
          const path = (req.url || '').split('?')[0];
          const isDetail = /^\/profiles\/[0-9a-fA-F-]{36}\/?$/.test(path);
          if (isDetail && req.headers.accept?.includes('text/html')) {
            return '/index.html';
          }
        },
      }),
      '/dashboard': apiProxy({
        // refresh em /dashboard → SPA; fetch JSON → API
        bypass: spaHtmlBypass,
      }),
      '/profile-details': apiProxy(),
      '/extract': apiProxy(),
      '/linkedin-base': apiProxy(),
      '/client-connections-linkedin': apiProxy(),
      '/client-linkedin-messages': apiProxy(),
      // envio LinkedIn demora 30–90s — timeout alto; robot precisa estar em :3099
      '/linkedin-robot': {
        target: 'http://127.0.0.1:3099',
        changeOrigin: true,
        timeout: 600_000,
        proxyTimeout: 600_000,
        rewrite: (p) => p.replace(/^\/linkedin-robot/, '') || '/',
      },
      '/mensagens': apiProxy({ bypass: spaHtmlBypass }),
      '/funil': apiProxy({ bypass: spaHtmlBypass }),
      '/empresas': apiProxy({ bypass: spaHtmlBypass }),
      '/atividades': apiProxy({ bypass: spaHtmlBypass }),
      '/usuarios': apiProxy({ bypass: spaHtmlBypass }),
      '/executivo': apiProxy({ bypass: spaHtmlBypass }),
    },
  },
});
