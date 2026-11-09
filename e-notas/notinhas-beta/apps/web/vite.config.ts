import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const root = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version: string };
/** Carimbo do build (UTC) — muda a cada `vite build` para o banner Beta acusar chunk novo. */
const buildId = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(2, 12); // YYMMDDHHmm

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // registro via `virtual:pwa-register` em main.tsx (com reload no update)
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'media/*'],
      manifest: {
        id: '/',
        name: 'notinhas.shop',
        short_name: 'notinhas',
        description: 'Menor preço a partir do QR da nota fiscal',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#00984B',
        background_color: '#F5F7FA',
        // standalone primeiro: iOS A2HS ignora/falha com fullscreen e deixava faixa sob a tabbar
        display: 'standalone',
        display_override: ['standalone', 'fullscreen', 'minimal-ui'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'lifestyle'],
        prefer_related_applications: false,
        // Fundo verde #00984B + tiras brancas só (sem azul). PNG p/ iOS/Android; SVG cache-bust no HTML.
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackDenylist: [/^\/api\//],
        // T-71: últimos preços ficam em cache com a idade explícita na UI
        runtimeCaching: [
          {
            // JSON da API — não cachear proxy de imagem binária
            urlPattern: ({ url, request }) =>
              url.pathname.startsWith('/api/v1/') &&
              request.method === 'GET' &&
              !url.pathname.startsWith('/api/v1/admin') &&
              !url.pathname.startsWith('/api/v1/imagens/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'api', networkTimeoutSeconds: 6, expiration: { maxEntries: 200, maxAgeSeconds: 7 * 86400 } },
          },
          { urlPattern: /\/media\//, handler: 'CacheFirst', options: { cacheName: 'media' } },
        ],
      },
    }),
  ],
  server: {
    port: 5188,
    proxy: { '/api': 'http://127.0.0.1:4174' },
  },
  build: { target: 'es2022', sourcemap: true },
});
