import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** Destino do proxy em dev. Remoto: API_PROXY=http://144.126.154.90 npm run dev */
const API = process.env.API_PROXY || 'http://localhost:3000';

function apiProxy(extra = {}) {
  return { target: API, changeOrigin: true, ...extra };
}

/**
 * Refresh da rota SPA → index.html; fetch/XHR → API.
 * Não use só `Accept` ⊃ text/html: alguns clients (preview/IDE) mandam isso
 * em fetch e o proxy devolvia o HTML do SPA (`<!doctype` → JSON parse error).
 */
function spaHtmlBypass(req) {
  const accept = req.headers.accept || '';
  if (accept.includes('application/json')) return;
  const mode = req.headers['sec-fetch-mode'];
  const dest = req.headers['sec-fetch-dest'];
  if (mode === 'cors' || mode === 'same-origin' || mode === 'no-cors') return;
  if (dest === 'empty') return;
  if (dest === 'document' || mode === 'navigate') return '/index.html';
  if (accept.includes('text/html')) return '/index.html';
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
      // JSON em /dashboard/insights (SPA fica em /dashboard via history fallback)
      '/dashboard/insights': apiProxy(),
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
