/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/** Injetados em `vite.config.ts` a partir de `package.json` + timestamp do build. */
declare const __APP_VERSION__: string;
declare const __BUILD_ID__: string;
