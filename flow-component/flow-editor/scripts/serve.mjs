// Servidor estático do aplicativo (só na própria máquina).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json', '.woff2': 'font/woff2', '.woff': 'font/woff' };

export function serve(port = 5295) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/') return res.writeHead(302, { location: `/app/${url.search}` }).end();
    const file = path.join(root, decodeURIComponent(url.pathname), url.pathname.endsWith('/') ? 'index.html' : '');
    // só o aplicativo e o build, nada fora deles
    const allowed = ['app', 'dist'].some((d) => file.startsWith(path.join(root, d) + path.sep));
    try {
      if (!allowed) throw new Error('fora');
      const body = await readFile(file);
      const type = types[path.extname(file)] ?? 'application/octet-stream';
      res.writeHead(200, { 'content-type': type.startsWith('text/') ? `${type}; charset=utf-8` : type, 'cache-control': 'no-store' }).end(body);
    } catch {
      res.writeHead(404).end('não encontrado');
    }
  });
  return new Promise((resolve, reject) => server.once('error', reject).listen(port, '127.0.0.1', () => resolve(server)));
}

if (process.argv[1] === import.meta.filename) {
  const port = Number(process.env.PORT ?? 5295);
  await serve(port);
  console.log(`Flow Editor: http://localhost:${port}/app/`);
}
