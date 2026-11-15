// Builds web/shell.html (the Web export's custom HTML shell, see
// export_presets.cfg html/custom_html_shell) from tools/shell.template.html.
// The art the preloader draws (a few small SVGs), the four fonts and the quote
// lines from scripts/data.gd are inlined, so the themed preloader paints as soon
// as the page arrives, before the engine downloads.
//   node godot/tools/make_shell.mjs      (then export the Web preset)
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p));
let html = read('tools/shell.template.html').toString();

const svgUri = (svg) => `'data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim()).replace(/'/g, '%27')}'`;
// Multiply every hex colour in an SVG by `tint` (Godot's modulate on a texture).
const tintSvg = (svg, tint) => {
  const t = [1, 3, 5].map((i) => parseInt(tint.slice(i, i + 2), 16) / 255);
  return svg.replace(/#([0-9a-f]{6})\b/gi, (_, h) => '#' + [0, 2, 4].map((i, j) =>
    Math.round(parseInt(h.slice(i, i + 2), 16) * t[j]).toString(16).padStart(2, '0')).join(''));
};
html = html.replace(/\{\{SVG:([^}]+)\}\}/g, (_, p) => svgUri(read(p).toString()));
html = html.replace(/\{\{SVG_TINT:([^:}]+):(#[0-9a-f]{6})\}\}/gi, (_, p, c) => svgUri(tintSvg(read(p).toString(), c)));

const fonts = [
  ['cc-display', 'art/fonts/IMFellEnglish-Regular.ttf', 'normal', '400'],
  ['cc-display-italic', 'art/fonts/IMFellEnglish-Italic.ttf', 'italic', '400'],
  ['cc-extrabold', 'art/fonts/AlegreyaSans-ExtraBold.ttf', 'normal', '800'],
  ['cc-legible', 'art/fonts/AtkinsonHyperlegibleNext-Variable.ttf', 'normal', '200 800'],
];
html = html.replace('{{FONTS}}', fonts.map(([family, file, style, weight]) =>
  `@font-face { font-family: '${family}'; font-style: ${style}; font-weight: ${weight}; font-display: block; src: url(data:font/ttf;base64,${read(file).toString('base64')}) format('truetype'); }`).join('\n'));

const data = read('scripts/data.gd').toString();
const block = data.match(/const LINES: Array\[String\] = \[([\s\S]*?)\n\]/);
if (!block) throw new Error('LINES not found in scripts/data.gd');
const lines = [...block[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]);
html = html.replace('{{LINES}}', JSON.stringify(lines));

if (/\{\{/.test(html)) throw new Error('unreplaced placeholder: ' + html.match(/\{\{[^}]*\}\}/)[0]);
mkdirSync(join(root, 'web'), { recursive: true });
writeFileSync(join(root, 'web', 'shell.html'), html);
console.log(`web/shell.html: ${(html.length / 1024).toFixed(0)} KB, ${lines.length} quote lines`);
