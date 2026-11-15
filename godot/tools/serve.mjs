// Tiny static server for the Web export (single-threaded build, so no
// COOP/COEP headers are required; they are sent anyway so a threaded build works too).
//   node godot/tools/serve.mjs [port]      -> http://localhost:8060/
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'build', 'web');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.wasm': 'application/wasm', '.pck': 'application/octet-stream', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };

// `rate` (bytes/s, optional) throttles responses, for preloader tests in
// browsers without network emulation (WebKit).
export function serve(port = 8060, { rate = 0 } = {}) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    let p = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    if (p === '' || p.endsWith('/')) p += 'index.html';
    const file = join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    try {
      await stat(file);
      res.writeHead(200, {
        'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cache-Control': 'no-cache',
      });
      const body = await readFile(file);
      if (!rate) { res.end(body); return; }
      const chunk = 64 * 1024;
      for (let i = 0; i < body.length; i += chunk) {
        if (!res.write(body.subarray(i, i + chunk))) await new Promise((r) => res.once('drain', r));
        await new Promise((r) => setTimeout(r, (chunk / rate) * 1000));
      }
      res.end();
    } catch { res.writeHead(404).end('not found'); }
  });
  return new Promise(r => server.listen(port, () => r(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = +(process.argv[2] || 8060);
  await serve(port);
  console.log(`Serving ${root} at http://localhost:${port}/`);
}
