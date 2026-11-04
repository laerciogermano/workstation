import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const api = process.env.API_URL ?? 'http://localhost:3000';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'RoleGo — Viva o Rolê',
        short_name: 'RoleGo',
        description: 'Descubra o que está rolando perto de você.',
        lang: 'pt-BR',
        dir: 'ltr',
        theme_color: '#05070F',
        background_color: '#05070F',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        start_url: '/explorar',
        scope: '/',
        categories: ['social', 'lifestyle', 'entertainment'],
        prefer_related_applications: false,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/e\//, /^\/o\//, /^\/media\//],
        runtimeCaching: [
          { urlPattern: /^\/media\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'media', expiration: { maxEntries: 300 } } },
          { urlPattern: /\/api\/v1\/catalog\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'catalog' } },
        ],
      },
    }),
  ],
  resolve: { alias: { '@rolego/contracts': path.resolve(__dirname, '../../packages/contracts/src/index.ts') } },
  server: {
    port: 5173,
    proxy: {
      '/api': api,
      '/media': api,
      '^/e/[^/]+$': api,
      '^/o/[^/]+$': api,
    },
  },
  build: { target: 'es2022', sourcemap: true },
});
