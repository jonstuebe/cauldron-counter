// Generates the placeholder SVGs in godot/assets/gen/ straight from the web game's
// source of truth (src/data.js glyphs + customers, src/logic.js ingredient colours),
// so the Godot port draws exactly the same jars, portraits and cauldron.
//
//   node godot/tools/gen_assets.mjs
//
// Final art from the art worker lives in godot/art/ and overrides these via
// scripts/assets.gd; this script only refreshes the fallbacks.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { INGS } from '../../src/logic.js';
import { GLYPH, CUSTOMERS } from '../../src/data.js';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'assets', 'gen');
mkdirSync(out, { recursive: true });

// Dark theme palette from src/style.css, written as literal colours because
// Godot's SVG rasteriser does not know CSS custom properties.
const P = {
  glass: 'fill="#ffffff" fill-opacity=".12"',
  glassEdge: 'stroke="#efe7d6" stroke-opacity=".3"',
  iron: '#120e1a', ironHi: '#2c2538', ink: '#2a2236',
};
const svg = (vb, w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}">${body}</svg>\n`;
// Godot's rasteriser does not resolve currentColor reliably; bake it in.
const glyph = (name, col) => GLYPH[name].replaceAll('currentColor', col);

const JAR_BODY = 'M20 12h20v6c10 4 14 12 14 22 0 18-10 30-24 30S6 58 6 40c0-10 4-18 14-22z';
const files = {};

// Jars without their cork (the cork is its own sprite so it can pop off mid-pour).
for (const g of INGS) {
  const ink = '#1e1628';
  files[`jar_${g.id}.svg`] = svg('0 0 60 74', 180, 222, `
  <clipPath id="c"><path d="${JAR_BODY}"/></clipPath>
  <path d="${JAR_BODY}" ${P.glass}/>
  <rect x="0" y="30" width="60" height="46" fill="${g.color}" clip-path="url(#c)"/>
  <path d="${JAR_BODY}" fill="none" ${P.glassEdge} stroke-width="1.5"/>
  <path d="M13 31c-3 5-3 14 0 20" stroke="#ffffff" stroke-opacity=".55" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <g transform="translate(19,38) scale(.95)" fill="${ink}" fill-opacity=".6">${glyph(g.glyph, ink)}</g>`);
  files[`glyph_${g.glyph}.svg`] = svg('0 0 24 24', 96, 96, `<g fill="#ffffff">${glyph(g.glyph, '#ffffff')}</g>`);
}
files['cork.svg'] = svg('0 0 18 10', 54, 30, '<rect x="0" y="0" width="18" height="10" rx="2.5" fill="#8a6440"/>');

// Customer portraits: one per mood, same construction as portrait() in main.js.
const MOODS = ['neutral', 'happy', 'cross'];
CUSTOMERS.forEach((c, i) => {
  for (const mood of MOODS) {
    const mouth = mood === 'happy' ? 'M34 42 Q40 48 46 42' : mood === 'cross' ? 'M34 46 Q40 40 46 46' : 'M35 44 L45 44';
    const brow = mood === 'cross' ? `<path d="M31 30 L37 32 M49 30 L43 32" stroke="${P.ink}" stroke-width="2" stroke-linecap="round"/>` : '';
    let back = '', front = '';
    if (c.hat === 'hood') back = `<circle cx="40" cy="38" r="21" fill="${c.cloak}"/><circle cx="40" cy="38" r="21" fill="#000" fill-opacity=".15"/>`;
    if (c.hat === 'pointed') front = `<path d="M22 28 L46 0 L58 26 Z" fill="${c.hatc}"/><ellipse cx="40" cy="27" rx="25" ry="5" fill="${c.hatc}"/>`;
    if (c.hat === 'cap') front = `<path d="M25 30 Q40 12 55 30 Z" fill="${c.hatc}"/><rect x="22" y="28" width="36" height="4" rx="2" fill="${c.hatc}"/>`;
    if (c.hat === 'hair') front = `<path d="M25 36 Q24 19 40 19 Q56 19 55 36 Q51 26 40 26 Q29 26 25 36Z" fill="${c.hatc}"/>`;
    files[`portrait_${i}_${mood}.svg`] = svg('0 0 80 80', 240, 240, `
  <clipPath id="r"><rect width="80" height="80"/></clipPath><g clip-path="url(#r)">
  ${back}<path d="M10 82 C12 62 24 53 40 53 C56 53 68 62 70 82Z" fill="${c.cloak}"/>
  <circle cx="40" cy="37" r="14" fill="${c.skin}"/>
  <circle cx="35" cy="36" r="1.9" fill="${P.ink}"/><circle cx="45" cy="36" r="1.9" fill="${P.ink}"/>${brow}
  <path d="${mouth}" stroke="${P.ink}" stroke-width="2" fill="none" stroke-linecap="round"/>${front}</g>`);
  }
});

// Cauldron, split into layers so the liquid (shader) and plate sit between them.
files['cauldron_back.svg'] = svg('0 0 260 230', 780, 690, `
  <path d="M64 176 L52 210 M196 176 L208 210" stroke="${P.iron}" stroke-width="9" stroke-linecap="round"/>
  <circle cx="26" cy="96" r="12" fill="none" stroke="${P.iron}" stroke-width="6"/>
  <circle cx="234" cy="96" r="12" fill="none" stroke="${P.iron}" stroke-width="6"/>
  <path d="M30 76 Q24 176 130 192 Q236 176 230 76 Z" fill="${P.iron}"/>
  <path d="M46 96 Q44 150 84 172" stroke="${P.ironHi}" stroke-width="5" fill="none" stroke-linecap="round" stroke-opacity=".8"/>
  <ellipse cx="130" cy="76" rx="106" ry="20" fill="${P.ironHi}"/>`);
const FLAMES = [
  ['M98 222 C88 206 96 196 104 186 C104 198 112 200 112 210 C112 218 106 222 98 222Z', '#f08a4b'],
  ['M130 224 C116 206 126 188 132 176 C134 192 146 198 144 212 C142 220 138 224 130 224Z', '#f6b24c'],
  ['M160 222 C152 210 158 200 164 192 C166 202 172 206 170 214 C168 220 164 222 160 222Z', '#e0614f'],
];
FLAMES.forEach(([d, col], i) => { files[`flame_${i}.svg`] = svg('0 0 260 230', 780, 690, `<path d="${d}" fill="${col}"/>`); });

// Serving flask: glass shell, and a white liquid mask the game tints per brew.
files['flask_glass.svg'] = svg('0 0 40 56', 120, 168, `
  <rect x="14" y="0" width="12" height="7" rx="2" fill="#8a6440"/>
  <g ${P.glass}><circle cx="20" cy="36" r="17"/><rect x="15" y="6" width="10" height="16"/></g>
  <circle cx="20" cy="36" r="17" fill="none" ${P.glassEdge} stroke-width="1.5"/>
  <path d="M15 7v13M25 7v13" fill="none" ${P.glassEdge} stroke-width="1.5"/>
  <path d="M10 31c-1 4 0 8 2 10" stroke="#ffffff" stroke-opacity=".6" stroke-width="2.5" fill="none" stroke-linecap="round"/>`);
files['flask_liquid.svg'] = svg('0 0 40 56', 120, 168, `
  <clipPath id="f"><circle cx="20" cy="36" r="17"/><rect x="15" y="6" width="10" height="16"/></clipPath>
  <rect x="0" y="25" width="40" height="32" fill="#ffffff" clip-path="url(#f)"/>`);

files['coin.svg'] = svg('0 0 16 16', 64, 64, `
  <defs><radialGradient id="g" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#f0cb73"/><stop offset="1" stop-color="#d4ad55"/></radialGradient></defs>
  <circle cx="8" cy="8" r="7.5" fill="url(#g)"/><circle cx="8" cy="8" r="6.8" fill="none" stroke="#000" stroke-opacity=".15" stroke-width="1.2"/>`);
files['spark.svg'] = svg('0 0 16 16', 32, 32, `
  <defs><radialGradient id="s"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
  <circle cx="8" cy="8" r="8" fill="url(#s)"/>`);
files['icon.svg'] = svg('0 0 64 64', 256, 256,
  '<path d="M8 22 Q6 52 32 56 Q58 52 56 22 Z" fill="#3a3440"/><ellipse cx="32" cy="22" rx="26" ry="7" fill="#5a5262"/><ellipse cx="32" cy="23" rx="22" ry="4.5" fill="#2f9e7e"/><circle cx="26" cy="12" r="3" fill="#2f9e7e" fill-opacity=".7"/><circle cx="36" cy="8" r="2.2" fill="#2f9e7e" fill-opacity=".5"/>');

for (const [name, body] of Object.entries(files)) writeFileSync(join(out, name), body);
console.log(`wrote ${Object.keys(files).length} files to ${out}`);
