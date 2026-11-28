// Empacota a lib, o aplicativo e as fontes (as mesmas do Flow View).
import path from 'node:path';
import { build } from 'esbuild';

process.chdir(path.resolve(import.meta.dirname, '..'));
const common = { bundle: true, format: 'esm', minify: true };
await build({ ...common, entryPoints: ['src/index.ts'], outfile: 'dist/flow-editor.js' });
await build({ ...common, entryPoints: ['app/main.ts'], outfile: 'dist/app.js', sourcemap: true });
await build({ ...common, entryPoints: ['../flow-view/src/fonts.css'], outfile: 'dist/fonts.css', loader: { '.woff2': 'file', '.woff': 'file' }, assetNames: 'fonts/[name]' });
