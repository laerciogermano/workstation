import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

/** CSP só no build: o servidor de desenvolvimento injeta scripts em linha. */
const csp: Plugin = {
  name: 'plans-csp',
  apply: 'build',
  transformIndexHtml: () => [
    {
      tag: 'meta',
      injectTo: 'head-prepend',
      attrs: {
        'http-equiv': 'Content-Security-Policy',
        content: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src blob:; frame-src blob:; connect-src 'self' wss: https://generativelanguage.googleapis.com https://api.anthropic.com https://api.openai.com; object-src 'none'; base-uri 'none'; form-action 'none'",
      },
    },
  ],
};

export default defineConfig(({ command }) => ({
  plugins: [react(), csp],
  define: {
    // em desenvolvimento o comando mostrado na tela aponta para o binário compilado no repositório
    __CLIENT_COMMAND__: JSON.stringify(command === 'serve' ? fileURLToPath(new URL('../../bin/plans-client', import.meta.url)) : 'plans-client'),
  },
  server: { host: 'localhost', port: 5280, strictPort: true },
}));
