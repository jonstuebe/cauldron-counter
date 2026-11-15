// Quick review sheet: node godot/art/_tools/sheet.mjs <out.png> <cell> <cols> <bg> <glob-prefix...>
// Rasterises matching SVGs with sharp (librsvg) onto a flat background. Dev aid only.
import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ART } from './lib.mjs';

const [outFile, cellS, colsS, bg, ...prefixes] = process.argv.slice(2);
const cell = +cellS, cols = +colsS;
const list = [];
for (const p of prefixes) {
  const [dir, pre] = p.split('/');
  for (const f of readdirSync(join(ART, dir)).sort()) if (f.endsWith('.svg') && f.startsWith(pre)) list.push(join(ART, dir, f));
}
const rows = Math.ceil(list.length / cols), pad = 12;
const comps = [];
for (let i = 0; i < list.length; i++) {
  const buf = await sharp(list[i], { density: 300 }).resize(cell, cell, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  comps.push({ input: buf, left: pad + (i % cols) * (cell + pad), top: pad + Math.floor(i / cols) * (cell + pad) });
}
await sharp({ create: { width: pad + cols * (cell + pad), height: pad + rows * (cell + pad), channels: 4, background: bg } }).composite(comps).png().toFile(outFile);
console.log(list.length, 'tiles ->', outFile);
