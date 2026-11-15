// Shared helpers for the Cauldron Counter art build.
// Run `node godot/art/_tools/build.mjs` from the repo root to regenerate every SVG.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ART = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---- palette (see STYLE.md) -------------------------------------------------
export const P = {
  void: '#0c0912', iron: '#120e1a', ironHi: '#2c2538', ironRim: '#3d3552',
  night: '#1e1830', dusk: '#2a2142', panel: '#2f2749', panelHi: '#3d3460', panelLine: '#4a3f6e',
  parchment: '#efe7d6', parchmentLo: '#d9cdb4', parchmentEdge: '#b9a98a', lilac: '#a99fbd',
  ink: '#1e1628', inkSoft: '#2a2236',
  brass: '#d4ad55', brassHi: '#f0cb73', brassLo: '#9a7426', brassDeep: '#6b4e17',
  mint: '#6fe0bd', mintLo: '#2f9e7e', mintDeep: '#1c6b57',
  ember: '#f08a4b', flame: '#f6b443', flameHi: '#ffe6a8', coal: '#e2504a', danger: '#ef7a64',
  wood: '#4f3624', woodHi: '#6d4c33', woodLo: '#33221a', cork: '#8a6440', corkHi: '#a67c52',
  moon: '#cfc8ff', moonHi: '#f1eeff',
};

const hex = (c) => { const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex(a), B = hex(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
// Shadows lean toward night plum, never black; highlights lean toward warm candle cream.
export const shade = (c, t = 0.3) => mix(c, P.night, t);
export const tint = (c, t = 0.4) => mix(c, '#fff6e2', t);

export const svg = (w, h, body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>\n`;

export const lin = (id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;
export const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</radialGradient>`;

// four-point sparkle centred on x,y
export const sparkle = (x, y, r, fill = '#fff', op = 1) => {
  const k = r * 0.22;
  return `<path d="M${x} ${y - r}C${x + k} ${y - k} ${x + k} ${y - k} ${x + r} ${y}C${x + k} ${y + k} ${x + k} ${y + k} ${x} ${y + r}C${x - k} ${y + k} ${x - k} ${y + k} ${x - r} ${y}C${x - k} ${y - k} ${x - k} ${y - k} ${x} ${y - r}Z" fill="${fill}" fill-opacity="${op}"/>`;
};

export const files = new Map();
export const out = (path, content) => files.set(path, content);
export const flush = () => {
  for (const [p, c] of files) { const f = join(ART, p); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, c); }
  return files.size;
};
