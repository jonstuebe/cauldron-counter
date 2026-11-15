// Exports the Godot game for the Web and stages it in dist/ for Workers.
//
//   npm run build
//
// Workers static assets max out at 25 MiB per file and index.wasm is ~40 MB,
// so dist/ holds a brotli-compressed index.wasm.br instead; src/worker.js
// serves it as /index.wasm with Content-Encoding: br.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';
import { ensureGodot } from './godot.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = join(ROOT, 'godot');
const EXPORT = join(PROJECT, 'build', 'web');
const DIST = join(ROOT, 'dist');
const MAX_ASSET = 25 * 1024 * 1024;

const godot = await ensureGodot();
const run = (...args) => execFileSync(godot, ['--headless', '--path', PROJECT, ...args], { stdio: 'inherit' });

rmSync(EXPORT, { recursive: true, force: true });
mkdirSync(EXPORT, { recursive: true });
run('--import');
run('--export-release', 'Web', 'build/web/index.html');

rmSync(DIST, { recursive: true, force: true });
cpSync(EXPORT, DIST, { recursive: true });
cpSync(join(ROOT, 'public'), DIST, { recursive: true });

const wasm = join(DIST, 'index.wasm');
const br = brotliCompressSync(readFileSync(wasm), {
  params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: statSync(wasm).size },
});
writeFileSync(`${wasm}.br`, br);
rmSync(wasm);

for (const f of ['index.pck', 'index.html', 'index.wasm.br']) {
  const size = statSync(join(DIST, f)).size;
  if (size > MAX_ASSET) throw new Error(`${f} is ${(size / 1048576).toFixed(1)} MiB, over the 25 MiB Workers asset limit`);
}
console.log(`dist/ ready (index.wasm.br ${(br.length / 1048576).toFixed(1)} MiB)`);
