// Regenerates every SVG under godot/art/. Usage (from the repo root):
//   node godot/art/_tools/build.mjs
import { flush } from './lib.mjs';

const mods = ['ingredients', 'customers', 'cauldron', 'ui', 'background'];
for (const m of mods) {
  let mod;
  try { mod = await import(`./${m}.mjs`); } catch (e) { if (e.code === 'ERR_MODULE_NOT_FOUND') { console.log('skip', m); continue; } throw e; }
  for (const [k, fn] of Object.entries(mod)) if (k.startsWith('build')) fn();
}
console.log('wrote', flush(), 'files');
