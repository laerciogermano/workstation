import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // registro via `virtual:pwa-register` em main.tsx (com reload no update)
      injectRegister: false,
      includeAssets: ['favicon.svg', 'media/*'],
      manifest: {
        id: '/',
        name: 'notinhas.shop',
        short_name: 'notinhas',
        description: 'Menor preço a partir do QR da nota fiscal',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#00984B',
        background_color: '#00984B',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        categories: ['shopping', 'lifestyle'],
        prefer_related_applications: false,
        // Mesmo asset do favicon: fundo verde #00984B + tiras brancas (logo v2 · ícone Verde)
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
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
