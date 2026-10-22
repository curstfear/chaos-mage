// Локальный сервер для разработки: отдаёт файлы проекта так же, как GitHub Pages.
// Запуск: npm run dev  (или node tools/serve.mjs [порт])
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { networkInterfaces } from 'node:os';

const ROOT = resolve(import.meta.dirname, '..');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

export function serve(port = 8080){
  const server = createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (path.endsWith('/')) path += 'index.html';
    const file = join(ROOT, path);
    try {
      if (!file.startsWith(ROOT) || !(await stat(file)).isFile()) throw 0;
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404); res.end('not found');
    }
  });
  return new Promise(ok => server.listen(port, '0.0.0.0', () => ok(server)));
}

if (import.meta.url === `file://${process.argv[1]}`){
  const port = +process.argv[2] || 8080;
  await serve(port);
  console.log(`Маг Хаоса: http://localhost:${port}`);
  // адрес в локальной сети — открыть с телефона, подключённого к тому же Wi-Fi
  for (const list of Object.values(networkInterfaces()))
    for (const a of list || []) if (a.family === 'IPv4' && !a.internal) console.log(`с телефона:  http://${a.address}:${port}`);
}
