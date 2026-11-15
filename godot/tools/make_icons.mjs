// PWA icons from art/icon.svg -> assets/pwa/ (art/ stays untouched).
//   node godot/tools/make_icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const svg = readFileSync(new URL('../art/icon.svg', import.meta.url), 'utf8');
const uri = 'data:image/svg+xml,' + encodeURIComponent(svg);
const b = await chromium.launch();
const p = await b.newPage();
const out = new URL('../assets/pwa/', import.meta.url).pathname;
for (const [name, size, pad, bg] of [['icon_144', 144, 0, null], ['icon_180', 180, 0, '#1e1830'], ['icon_512', 512, 0, null], ['icon_512_maskable', 512, 0, '#241c3a']]) {
  await p.setViewportSize({ width: size, height: size });
  await p.setContent(`<html><body style="margin:0;background:${bg || 'transparent'}"><img src="${uri}" style="display:block;margin:${size * pad}px;width:${size * (1 - 2 * pad)}px;height:${size * (1 - 2 * pad)}px"></body></html>`);
  await p.screenshot({ path: out + name + '.png', omitBackground: !bg });
  console.log(name);
}
await b.close();
