// Serves the brotli-compressed engine (dist/index.wasm.br) as /index.wasm.
// It only runs for *.wasm (see run_worker_first in wrangler.jsonc); every other
// request is served straight from static assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.endsWith('.wasm')) return env.ASSETS.fetch(request);

    url.pathname += '.br';
    const asset = await env.ASSETS.fetch(new Request(url, request));
    if (!asset.ok) return asset;

    const headers = new Headers(asset.headers);
    headers.set('Content-Type', 'application/wasm');
    headers.set('Content-Encoding', 'br');
    headers.delete('Content-Length');
    return new Response(asset.body, { status: asset.status, headers, encodeBody: 'manual' });
  },
};
